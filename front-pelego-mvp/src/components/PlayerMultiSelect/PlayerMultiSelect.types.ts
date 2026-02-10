import { SelectOption } from '@/types/components';

export interface PlayerMultiSelectProps {
  options: SelectOption[];
  value: SelectOption[];
  onChange: (selected: SelectOption[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  error?: string;
  isClearable?: boolean;
  isSearchable?: boolean;
  maxSelections?: number;
}
