import pandas as pd
import uuid
import logging
from datetime import datetime, date
from typing import Dict, List, Tuple, Any
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Employee, EmployeeAttribute
from campaigns.models import Campaign

logger = logging.getLogger(__name__)

class ExcelProcessingService:
    """Service for processing Excel files and creating employees"""
    
    # Common column mappings for flexible Excel formats
    COLUMN_MAPPINGS = {
        'name': ['name', 'full_name', 'employee_name', 'nom', 'prénom', 'first_name', 'last_name'],
        'email': ['email', 'email_address', 'e-mail', 'mail', 'courriel'],
        'arrival_date': ['arrival_date', 'start_date', 'hire_date', 'date_arrivee', 'date_embauche', 'joining_date']
    }
    
    def __init__(self, campaign_id: int, replace_existing: bool = False):
        self.campaign = Campaign.objects.get(id=campaign_id)
        self.replace_existing = replace_existing
        self.errors = []
        self.processed_count = 0
        self.created_count = 0
    
    def process_excel_file(self, file) -> Dict[str, Any]:
        """
        Process Excel file and create employees

        Args:
            file: Uploaded Excel file

        Returns:
            Dict containing processing results
        """
        try:
            # If replace_existing is True, delete existing employees for this campaign
            if self.replace_existing:
                deleted_count = Employee.objects.filter(campaign=self.campaign).count()
                Employee.objects.filter(campaign=self.campaign).delete()
                logger.info(f"Deleted {deleted_count} existing employees for campaign {self.campaign.id}")

            # Read Excel file
            df = self._read_excel_file(file)

            if df.empty:
                return {
                    'success': False,
                    'error': 'Excel file is empty or could not be read',
                    'total_rows': 0,
                    'processed_rows': 0,
                    'created_employees': 0,
                    'errors': [],
                    'deleted_employees': 0 if not self.replace_existing else deleted_count
                }

            # Map columns
            df = self._map_columns(df)

            # Validate required columns
            validation_result = self._validate_required_columns(df)
            if not validation_result['valid']:
                return {
                    'success': False,
                    'error': validation_result['error'],
                    'total_rows': len(df),
                    'processed_rows': 0,
                    'created_employees': 0,
                    'errors': [],
                    'deleted_employees': 0 if not self.replace_existing else deleted_count
                }

            # Process rows
            employees = self._process_rows(df)

            return {
                'success': True,
                'total_rows': len(df),
                'processed_rows': self.processed_count,
                'created_employees': self.created_count,
                'errors': self.errors,
                'employees': employees,
                'deleted_employees': 0 if not self.replace_existing else deleted_count
            }
            
        except Exception as e:
            logger.error(f"Error processing Excel file: {str(e)}")
            return {
                'success': False,
                'error': f'Error processing file: {str(e)}',
                'total_rows': 0,
                'processed_rows': 0,
                'created_employees': 0,
                'errors': []
            }
    
    def _read_excel_file(self, file) -> pd.DataFrame:
        """Read Excel file into DataFrame with memory optimization"""
        try:
            # Reset file pointer to beginning
            file.seek(0)

            # Try reading as xlsx first with memory optimization
            if file.name.endswith('.xlsx'):
                # Use openpyxl engine with memory optimization
                df = pd.read_excel(
                    file,
                    engine='openpyxl',
                    dtype=str,  # Read all columns as strings to avoid type inference overhead
                    na_filter=False  # Don't convert empty strings to NaN
                )
            else:
                # Use xlrd engine for older Excel files
                df = pd.read_excel(
                    file,
                    engine='xlrd',
                    dtype=str,
                    na_filter=False
                )

            # Log file processing info
            logger.info(f"Successfully read Excel file with {len(df)} rows and {len(df.columns)} columns")

            # Clean column names
            df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

            # Remove completely empty rows
            df = df.dropna(how='all')

            return df

        except MemoryError as e:
            logger.error(f"Memory error reading Excel file: {str(e)}")
            raise ValidationError("File is too large to process. Please reduce the file size or split into smaller files.")
        except Exception as e:
            logger.error(f"Error reading Excel file: {str(e)}")
            raise ValidationError(f"Could not read Excel file: {str(e)}")
    
    def _map_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Map Excel columns to standard field names"""
        column_mapping = {}
        
        for standard_field, possible_names in self.COLUMN_MAPPINGS.items():
            for col in df.columns:
                if col.lower() in [name.lower() for name in possible_names]:
                    column_mapping[col] = standard_field
                    break
        
        # Rename mapped columns
        df = df.rename(columns=column_mapping)
        
        return df
    
    def _validate_required_columns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Validate that required columns are present"""
        required_columns = ['name', 'email']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return {
                'valid': False,
                'error': f'Missing required columns: {", ".join(missing_columns)}. Available columns: {", ".join(df.columns)}'
            }
        
        return {'valid': True}
    
    def _process_rows(self, df: pd.DataFrame) -> List[Employee]:
        """Process DataFrame rows and create employees using bulk operations"""
        from django.db import connections

        created_employees: List[Employee] = []
        total_rows = len(df)
        batch_size = 500  # Larger bulk size for performance

        logger.info(f"Processing {total_rows} rows with bulk_create (batch_size={batch_size})")

        # Prepare/clean columns
        df = df.copy()
        df['name'] = df['name'].apply(self._clean_string_value)
        df['email'] = df['email'].apply(self._clean_string_value)

        # Parse arrival_date if present
        if 'arrival_date' in df.columns:
            df['arrival_date'] = df['arrival_date'].apply(self._parse_date)
        else:
            df['arrival_date'] = pd.NaT

        # Drop rows missing required fields
        def has_required(row):
            return bool(row['name']) and bool(row['email']) and ('@' in row['email'])

        valid_mask = df.apply(has_required, axis=1)
        invalid_rows = df[~valid_mask]
        for idx, row in invalid_rows.iterrows():
            self.errors.append({
                'row': idx + 2,
                'error': f"Missing/invalid required fields: name='{row.get('name')}', email='{row.get('email')}'",
                'data': row.to_dict()
            })
        df = df[valid_mask]

        # Handle duplicates against DB in one query
        incoming_emails = df['email'].tolist()
        existing_emails = set(
            Employee.objects.filter(campaign=self.campaign, email__in=incoming_emails)
            .values_list('email', flat=True)
        )

        rows_to_create = df[~df['email'].isin(existing_emails)]

        # Add errors for duplicates if not replacing
        if existing_emails and not self.replace_existing:
            for idx, row in df[df['email'].isin(existing_emails)].iterrows():
                self.errors.append({
                    'row': idx + 2,
                    'error': f"Employee with email {row.get('email')} already exists in this campaign",
                    'data': row.to_dict()
                })

        # Build Employee objects
        employee_objects: List[Employee] = []
        for idx, row in rows_to_create.iterrows():
            arrival_date = row.get('arrival_date') or date.today()
            employee_objects.append(Employee(
                name=row['name'],
                email=row['email'],
                arrival_date=arrival_date,
                campaign=self.campaign
            ))
            self.processed_count += 1

        # Bulk create employees
        if employee_objects:
            created_employees = Employee.objects.bulk_create(employee_objects, batch_size=batch_size)
            self.created_count += len(created_employees)

        # Build attributes for all new employees
        attributes_to_create: List[EmployeeAttribute] = []
        skip_fields = {'name', 'email', 'arrival_date'}
        attribute_columns = [c for c in df.columns if c not in skip_fields]

        # Map emails to created employees for quick lookup
        email_to_employee = {e.email: e for e in created_employees}
        for idx, row in rows_to_create.iterrows():
            employee = email_to_employee.get(row['email'])
            if not employee:
                continue
            for column in attribute_columns:
                value = row.get(column)
                if pd.notna(value) and str(value).strip() != '':
                    attributes_to_create.append(EmployeeAttribute(
                        employee=employee,
                        campaign=self.campaign,
                        attribute_key=column,
                        attribute_value=str(value)
                    ))

        if attributes_to_create:
            EmployeeAttribute.objects.bulk_create(attributes_to_create, batch_size=batch_size)

        logger.info(
            f"Completed processing: {self.created_count} employees created, "
            f"{len(self.errors)} errors, {len(attributes_to_create)} attributes created"
        )
        return created_employees
    
    def _process_single_row(self, row: pd.Series, index: int) -> Employee:
        """Process a single row and create employee"""
        # Extract required fields
        name = self._clean_string_value(row.get('name'))
        email = self._clean_string_value(row.get('email'))
        
        if not name or not email:
            raise ValidationError(f"Missing required fields: name={name}, email={email}")
        
        # Validate email format
        if '@' not in email:
            raise ValidationError(f"Invalid email format: {email}")
        
        # Handle arrival_date
        arrival_date = self._parse_date(row.get('arrival_date'))
        if not arrival_date:
            arrival_date = date.today()  # Default to today if not provided
        
        # Check for duplicate email in the same campaign
        if Employee.objects.filter(email=email, campaign=self.campaign).exists():
            if self.replace_existing:
                # Delete existing employee in this campaign
                Employee.objects.filter(email=email, campaign=self.campaign).delete()
            else:
                raise ValidationError(f"Employee with email {email} already exists in this campaign")
        
        # Create employee
        employee = Employee.objects.create(
            name=name,
            email=email,
            arrival_date=arrival_date,
            campaign=self.campaign
        )
        
        # Create attributes for additional columns
        self._create_attributes(employee, row)
        
        return employee
    
    def _create_attributes(self, employee: Employee, row: pd.Series):
        """Create employee attributes from additional columns"""
        # Skip standard fields
        skip_fields = ['name', 'email', 'arrival_date']
        
        for column, value in row.items():
            if column not in skip_fields and pd.notna(value):
                EmployeeAttribute.objects.create(
                    employee=employee,
                    campaign=self.campaign,
                    attribute_key=column,
                    attribute_value=str(value)
                )
    
    def _clean_string_value(self, value) -> str:
        """Clean and validate string values"""
        if pd.isna(value):
            return ""
        return str(value).strip()
    
    def _parse_date(self, value) -> date:
        """Parse date from various formats"""
        if pd.isna(value):
            return None
        
        if isinstance(value, date):
            return value
        
        if isinstance(value, datetime):
            return value.date()
        
        # Try parsing string dates
        try:
            if isinstance(value, str):
                # Common date formats
                for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y']:
                    try:
                        return datetime.strptime(value.strip(), fmt).date()
                    except ValueError:
                        continue
        except:
            pass
        
        return None
