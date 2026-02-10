// Shared component types for the application

/**
 * Generic select option interface
 * Used across all select/dropdown components
 */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  meta?: Record<string, unknown>;
}

/**
 * Date shortcut configuration
 * Used in DatePicker component
 */
export interface DateShortcut {
  label: string;
  getValue: () => Date;
}

/**
 * Player option with metadata
 * Extended SelectOption for player-specific data
 */
export interface PlayerOption extends SelectOption {
  meta?: {
    overall?: number;
    position?: string;
    country?: string;
  };
}
