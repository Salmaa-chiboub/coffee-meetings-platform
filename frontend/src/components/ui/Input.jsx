import React from 'react';
import clsx from 'clsx';

const Input = ({
  label,
  error,
  helperText,
  className,
  ...props
}) => {
  const inputClasses = clsx(
    'block w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      'border-gray-300 focus:border-primary-500 focus:ring-primary-500': !error,
      'border-red-300 focus:border-red-500 focus:ring-red-500': error,
    },
    className
  );

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
