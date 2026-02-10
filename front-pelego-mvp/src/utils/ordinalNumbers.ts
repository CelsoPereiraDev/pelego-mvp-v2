/**
 * Converts a number to its ordinal representation in Portuguese
 * Examples: 1 -> 1º, 2 -> 2º, 3 -> 3º, etc.
 *
 * @param num - The number to convert (1-based index)
 * @returns The ordinal string representation
 */
export const getOrdinalNumber = (num: number): string => {
  return `${num}º`;
};

/**
 * Gets the ordinal label for a goal based on its index (0-based)
 * Examples: 0 -> "1º gol", 1 -> "2º gol", etc.
 *
 * @param index - The zero-based index of the goal
 * @param teamName - The name of the team
 * @returns The formatted ordinal goal label
 */
export const getOrdinalGoalLabel = (index: number, teamName: string): string => {
  return `${getOrdinalNumber(index + 1)} gol do ${teamName}`;
};
