import Select, { GroupBase, Props, StylesConfig } from 'react-select';

const customStyles: StylesConfig = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'hsl(var(--background))',
    borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
    color: 'hsl(var(--foreground))',
    boxShadow: state.isFocused ? `0 0 0 1px hsl(var(--ring))` : 'none',
    '&:hover': {
      borderColor: 'hsl(var(--input))',
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    '&:hover': {
      backgroundColor: 'hsl(var(--accent))',
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'hsl(var(--foreground))',
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'hsl(var(--background))',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'hsl(var(--muted-foreground))',
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    backgroundColor: 'hsl(var(--border))',
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'hsl(var(--muted))',
    color: 'hsl(var(--foreground))',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'hsl(var(--foreground))',
    padding: '5px 3px 3px 6px',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: 'hsl(var(--foreground))',
    '&:hover': {
      backgroundColor: 'hsl(var(--accent))',
      color: 'hsl(var(--foreground))',
    },
  }),
};

export default function SelectWithSearch<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: Props<Option, IsMulti, Group>) {
  return (
    <Select<Option, IsMulti, Group>
      styles={customStyles as unknown as StylesConfig<Option, IsMulti, Group>}
      {...props}
    />
  );
}
