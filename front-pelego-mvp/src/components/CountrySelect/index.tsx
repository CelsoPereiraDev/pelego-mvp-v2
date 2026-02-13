
import { OptionProps, SingleValue } from 'react-select';
import Flag from 'react-world-flags';
import countryOptions from '../../utils/countryOptions';
import SelectWithSearch from '../SelectWithSearch';

export interface FormValues {
  country: string;
}

export interface CountryOption {
  value: string;
  label: string;
}

interface CountrySelectProps {
  value: SingleValue<CountryOption>;
  onChange: (option: SingleValue<CountryOption>) => void;
}

const customSingleValue = ({ data }: { data: CountryOption }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <Flag code={data.value} style={{ marginRight: 10, height: 15 }} />
    {data.label}
  </div>
);

const customOption = (props: OptionProps<CountryOption>) => {
  const { data, innerRef, innerProps } = props;
  return (
    <div ref={innerRef} {...innerProps} style={{ display: 'flex', alignItems: 'center' }}>
      <Flag code={data.value} style={{ marginRight: 10, height: 20 }} />
      {data.label}
    </div>
  );
};

const CountrySelect: React.FC<CountrySelectProps> = (props) => (
  <SelectWithSearch
    options={countryOptions}
    components={{ SingleValue: customSingleValue, Option: customOption }}
    {...props}
  />
);

export default CountrySelect;
