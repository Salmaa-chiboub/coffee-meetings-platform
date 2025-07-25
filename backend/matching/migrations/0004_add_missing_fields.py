# Generated manually to add missing fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('matching', '0003_alter_campaignmatchingcriteria_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='campaignmatchingcriteria',
            name='created_by',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='employeepair',
            name='email_error_message',
            field=models.TextField(blank=True),
        ),
    ]
