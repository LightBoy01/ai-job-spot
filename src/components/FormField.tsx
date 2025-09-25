import React from 'react';
import {
  UseFormRegister,
  FieldError,
  FieldValues,
  Path,
} from 'react-hook-form';
import { JobFormData } from '@/lib/validationSchemas';

interface FormFieldProps<TFieldValues extends FieldValues = JobFormData> {
  id: string;
  name: Path<TFieldValues>;
  label: string;
  type?: string;
  placeholder?: string;
  value?: string | number | readonly string[] | undefined;
  onChange?: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onBlur?: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  error?: FieldError;
  register?: UseFormRegister<TFieldValues>;
  rows?: number;
  isTextArea?: boolean;
  isSelect?: boolean;
  options?: { value: string; label: string }[];
  required?: boolean;
  checked?: boolean;
}

const FormField = <TFieldValues extends FieldValues = JobFormData>({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  register,
  rows = 3,
  isTextArea = false,
  isSelect = false,
  options,
  required = false,
  checked,
}: FormFieldProps<TFieldValues>) => {
  const inputClasses = `w-full p-3 bg-neutral-50 rounded-md border ${error ? 'border-red-500' : 'border-neutral-200'} focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition`;

  const commonProps = {
    id,
    placeholder,
    className: inputClasses,
    ...(register ? { ...register(name) } : { name, value, onChange, onBlur }),
    required,
  };

  let inputElement;
  if (isTextArea) {
    inputElement = <textarea {...commonProps} rows={rows}></textarea>;
  } else if (isSelect) {
    inputElement = (
      <select {...commonProps}>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (type === 'checkbox') {
    inputElement = (
      <input
        type="checkbox"
        id={id}
        className="h-5 w-5 text-secondary rounded border-neutral-300 focus:ring-secondary"
        {...(register ? { ...register(name) } : { name, checked, onChange })}
      />
    );
  } else {
    inputElement = <input type={type} {...commonProps} />;
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-neutral-700 mb-2"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {inputElement}
      {error && (
        <span className="text-red-500 text-sm mt-1 block">{error.message}</span>
      )}
    </div>
  );
};

export default FormField;
