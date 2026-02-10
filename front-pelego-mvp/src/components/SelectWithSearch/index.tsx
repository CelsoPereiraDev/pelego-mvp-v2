import Select from "react-select";

const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: "hsl(224, 71%, 4%)",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
    color: "hsl(var(--foreground))",
    boxShadow: state.isFocused ? `0 0 0 1px hsl(var(--ring))` : "none",
    "&:hover": {
      borderColor: "hsl(var(--input))",
    },
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? "hsl(var(--light-hover))" 
      : "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    "&:hover": {
      backgroundColor: "hsl(var(--light-hover))",
    },
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "hsl(var(--text-light-gray))",
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: "hsl(var(--background))",
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "hsl(var(--placeholder))",
  }),
  // dropdownIndicator: (provided: any, state: any) => ({
  //   ...provided,
  //   color: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
  //   "&:hover": {
  //     color: "hsl(var(--ring))",
  //   },
  // }),
  indicatorSeparator: (provided: any) => ({
    ...provided,
    backgroundColor: "hsl(var(--border))",
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: "#1F2937",
    color: "hsl(var(--text-light-gray))"
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    color: "hsl(var(--text-light-gray))",
    padding: "5px 3px 3px 6px"
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: "hsl(var(--text-light-gray))",
    "&:hover": {
      backgroundColor: "#374151",
      color: "hsl(var(--text-light-gray))",
    },
  }),
};

export default function SelectWithSearch(props: any) {
  return <Select styles={customStyles} {...props} />;
}
