'use client';

import Select, { SingleValue, StylesConfig } from 'react-select';
import { PlayerSelectProps } from './PlayerSelect.types';
import { SelectOption } from '@/types/components';
import { cn } from '@/lib/utils';

const customStyles: StylesConfig<SelectOption, false> = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'hsl(var(--background))',
    borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
    color: 'hsl(var(--foreground))',
    boxShadow: state.isFocused ? '0 0 0 1px hsl(var(--ring))' : 'none',
    '&:hover': {
      borderColor: 'hsl(var(--input))',
    },
    minHeight: '40px',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    '&:hover': {
      backgroundColor: 'hsl(var(--accent))',
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'hsl(var(--muted-foreground))',
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'hsl(var(--popover))',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    boxShadow: 'var(--shadow)',
    zIndex: 50,
  }),
  menuList: (provided) => ({
    ...provided,
    padding: '4px',
  }),
  input: (provided) => ({
    ...provided,
    color: 'hsl(var(--foreground))',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'hsl(var(--foreground))',
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    backgroundColor: 'hsl(var(--border))',
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: 'hsl(var(--muted-foreground))',
    '&:hover': {
      color: 'hsl(var(--foreground))',
    },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: 'hsl(var(--muted-foreground))',
    '&:hover': {
      color: 'hsl(var(--foreground))',
    },
  }),
};

export const PlayerSelect: React.FC<PlayerSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  isDisabled = false,
  error,
  isClearable = true,
  isSearchable = true,
}) => {
  const handleChange = (newValue: SingleValue<SelectOption>) => {
    onChange(newValue?.value || '');
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="w-full">
      <Select<SelectOption, false>
        options={options}
        value={selectedOption || null}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        styles={customStyles}
        noOptionsMessage={() => 'Nenhuma opção disponível'}
        className="react-select-container"
        classNamePrefix="react-select"
      />
      {error && <p className={cn('text-xs text-destructive mt-1')}>{error}</p>}
    </div>
  );
};
