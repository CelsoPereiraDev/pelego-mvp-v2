'use client';

import { Button } from '@/components/ui/button';
import { DateShortcutsSidebarProps } from './DatePickerWithShortcuts.types';
import { isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

export const DateShortcutsSidebar: React.FC<DateShortcutsSidebarProps> = ({
  shortcuts,
  selectedDate,
  onSelectShortcut,
}) => {
  return (
    <div className="flex flex-col gap-1 border-r border-border pr-3 min-w-[140px]">
      {shortcuts.map((shortcut) => {
        const shortcutDate = shortcut.getValue();
        const isSelected = selectedDate && isSameDay(shortcutDate, selectedDate);

        return (
          <Button
            key={shortcut.label}
            type="button"
            variant={isSelected ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSelectShortcut(shortcutDate)}
            className={cn(
              'justify-start text-sm font-normal',
              isSelected && 'bg-primary text-primary-foreground',
            )}>
            {shortcut.label}
          </Button>
        );
      })}
    </div>
  );
};
