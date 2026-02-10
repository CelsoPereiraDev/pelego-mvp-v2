import { SelectOption } from '@/types/components';

export interface PlayerSelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  error?: string;
  isClearable?: boolean;
  isSearchable?: boolean;
}
