import React from 'react';

interface TextInputProps {
  label: string;
  errorMessage?: string;
  width?: string;
  value?: number | string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export default function TextInput({
  label,
  errorMessage,
  width,
  value,
  onChange,
  placeholder,
}: TextInputProps) {
  const borderColor = errorMessage ? 'border-red-600' : 'border-black';

  return (
    <div className="flex flex-row items-end gap-2 justify-between min-w-min">
      <label>{label}</label>
      <div className="flex flex-col gap-[2px]">
        <input
          className={`border-[1px] ${borderColor} w-[${width}]`}
          value={String(value)}
          onChange={onChange}
          placeholder={placeholder}
        />
        {errorMessage && (
          <span className="text-xs text-red-600 font-light text-center">{errorMessage}</span>
        )}
      </div>
    </div>
  );
}
