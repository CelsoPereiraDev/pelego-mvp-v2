import Select, { GroupBase, Props, StylesConfig } from "react-select";

const customStyles: StylesConfig = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "hsl(224, 71%, 4%)",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
    color: "hsl(var(--foreground))",
    boxShadow: state.isFocused ? `0 0 0 1px hsl(var(--ring))` : "none",
    "&:hover": {
      borderColor: "hsl(var(--input))",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? "hsl(var(--light-hover))"
      : "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    "&:hover": {
      backgroundColor: "hsl(var(--light-hover))",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "hsl(var(--text-light-gray))",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "hsl(var(--background))",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "hsl(var(--placeholder))",
  }),
  indicatorSeparator: (provided) => ({
    ...provided,
    backgroundColor: "hsl(var(--border))",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#1F2937",
    color: "hsl(var(--text-light-gray))"
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "hsl(var(--text-light-gray))",
    padding: "5px 3px 3px 6px"
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "hsl(var(--text-light-gray))",
    "&:hover": {
      backgroundColor: "#374151",
      color: "hsl(var(--text-light-gray))",
    },
  }),
};

export default function SelectWithSearch<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(props: Props<Option, IsMulti, Group>) {
  return <Select<Option, IsMulti, Group> styles={customStyles as StylesConfig<Option, IsMulti, Group>} {...props} />;
}
