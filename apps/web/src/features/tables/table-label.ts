/** Suggest the next table label based on how many tables exist. */
export function suggestTableLabel(existingCount: number): string {
  return `Table ${existingCount + 1}`;
}
