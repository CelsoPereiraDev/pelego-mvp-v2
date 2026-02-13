import { subDays, startOfMonth, subMonths, startOfToday } from 'date-fns';
import { DateShortcut } from '@/types/components';

/**
 * Default date shortcuts for the DatePicker component
 * Following Portuguese naming conventions
 */
export const defaultDateShortcuts: DateShortcut[] = [
  {
    label: 'Hoje',
    getValue: () => startOfToday(),
  },
  {
    label: 'Ontem',
    getValue: () => subDays(startOfToday(), 1),
  },
  {
    label: 'Últimos 7 dias',
    getValue: () => subDays(startOfToday(), 7),
  },
  {
    label: 'Últimos 30 dias',
    getValue: () => subDays(startOfToday(), 30),
  },
  {
    label: 'Este mês',
    getValue: () => startOfMonth(new Date()),
  },
  {
    label: 'Mês passado',
    getValue: () => startOfMonth(subMonths(new Date(), 1)),
  },
];
