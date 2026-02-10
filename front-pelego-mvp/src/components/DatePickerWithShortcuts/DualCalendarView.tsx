'use client';

import { Calendar } from '@/components/ui/calendar';
import { DualCalendarViewProps } from './DatePickerWithShortcuts.types';
import { addMonths, isAfter, isBefore, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DualCalendarView: React.FC<DualCalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
  allowFutureDates = true,
}) => {
  const today = startOfToday();
  const effectiveMaxDate = !allowFutureDates ? today : maxDate;

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    // Check if date is within allowed range
    if (minDate && isBefore(date, minDate)) return;
    if (effectiveMaxDate && isAfter(date, effectiveMaxDate)) return;

    onSelectDate(date);
  };

  const currentMonth = selectedDate || today;
  const nextMonth = addMonths(currentMonth, 1);

  return (
    <div className="flex gap-4">
      {/* Current Month */}
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        month={currentMonth}
        locale={ptBR}
        disabled={(date) => {
          if (minDate && isBefore(date, minDate)) return true;
          if (effectiveMaxDate && isAfter(date, effectiveMaxDate)) return true;
          return false;
        }}
        className="rounded-md border"
      />

      {/* Next Month */}
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        month={nextMonth}
        locale={ptBR}
        disabled={(date) => {
          if (minDate && isBefore(date, minDate)) return true;
          if (effectiveMaxDate && isAfter(date, effectiveMaxDate)) return true;
          return false;
        }}
        className="rounded-md border"
      />
    </div>
  );
};
