'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateShortcutsSidebar } from './DateShortcutsSidebar';
import { DualCalendarView } from './DualCalendarView';
import { DatePickerWithShortcutsProps } from './DatePickerWithShortcuts.types';
import { defaultDateShortcuts } from '@/utils/dateShortcuts';
import { cn } from '@/lib/utils';

export const DatePickerWithShortcuts: React.FC<DatePickerWithShortcutsProps> = ({
  value,
  onChange,
  shortcuts = defaultDateShortcuts,
  allowFutureDates = true,
  defaultValue,
  minDate,
  maxDate,
  placeholder = 'Selecione uma data',
  error,
  id,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value || defaultValue
  );

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    onChange(date);
    setOpen(false); // Close popover after selection
  };

  const handleSelectShortcut = (date: Date) => {
    handleSelectDate(date);
  };

  // Sync internal state with external value
  if (value !== selectedDate) {
    setSelectedDate(value);
  }

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground',
              error && 'border-destructive'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex gap-4">
            {/* Shortcuts Sidebar */}
            {shortcuts.length > 0 && (
              <DateShortcutsSidebar
                shortcuts={shortcuts}
                selectedDate={selectedDate}
                onSelectShortcut={handleSelectShortcut}
              />
            )}

            {/* Dual Calendar View */}
            <DualCalendarView
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              minDate={minDate}
              maxDate={maxDate}
              allowFutureDates={allowFutureDates}
            />
          </div>
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};
