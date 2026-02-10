import { DateShortcut } from '@/types/components';

export interface DatePickerWithShortcutsProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  shortcuts?: DateShortcut[];
  allowFutureDates?: boolean;
  defaultValue?: Date;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  error?: string;
  id?: string;
}

export interface DateShortcutsSidebarProps {
  shortcuts: DateShortcut[];
  selectedDate: Date | undefined;
  onSelectShortcut: (date: Date) => void;
}

export interface DualCalendarViewProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  allowFutureDates?: boolean;
}
