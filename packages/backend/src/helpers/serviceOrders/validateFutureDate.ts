export function validateFutureDate(date: Date): boolean {
  const now = new Date();

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);

  return date > now && date <= oneYearFromNow;
}
