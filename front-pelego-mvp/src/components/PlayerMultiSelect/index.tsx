'use client';

import Select, { MultiValue, StylesConfig } from 'react-select';
import { PlayerMultiSelectProps } from './PlayerMultiSelect.types';
import { SelectOption } from '@/types/components';
import { cn } from '@/lib/utils';

const customStyles: StylesConfig<SelectOption, true> = {
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
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'hsl(var(--muted))',
    color: 'hsl(var(--muted-foreground))',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'hsl(var(--muted-foreground))',
    padding: '5px 3px 3px 6px',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: 'hsl(var(--muted-foreground))',
    '&:hover': {
      backgroundColor: 'hsl(var(--accent))',
      color: 'hsl(var(--foreground))',
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

export const PlayerMultiSelect: React.FC<PlayerMultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  isDisabled = false,
  error,
  isClearable = true,
  isSearchable = true,
  maxSelections,
}) => {
  const handleChange = (newValue: MultiValue<SelectOption>) => {
    const selectedArray = Array.from(newValue);

    // Check max selections limit
    if (maxSelections && selectedArray.length > maxSelections) {
      return;
    }

    onChange(selectedArray);
  };

  const isMaxReached = maxSelections !== undefined && value.length >= maxSelections;

  return (
    <div className="w-full">
      <Select<SelectOption, true>
        isMulti
        options={options}
        value={value}
        onChange={handleChange}
        placeholder={isMaxReached ? `Máximo de ${maxSelections} seleções` : placeholder}
        isDisabled={isDisabled || isMaxReached}
        isClearable={isClearable}
        isSearchable={isSearchable}
        styles={customStyles}
        noOptionsMessage={() => 'Nenhuma opção disponível'}
        closeMenuOnSelect={false}
        className="react-select-container"
        classNamePrefix="react-select"
      />
      {error && <p className={cn('text-xs text-destructive mt-1')}>{error}</p>}
    </div>
  );
};
