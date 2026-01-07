export type CalendarCell =
  | { type: "empty" }
  | { type: "day"; day: number };

export function buildMonthGrid(year: number, monthIndex0: number) {
  // monthIndex0: 0=Jan ... 11=Dec
  const firstDate = new Date(year, monthIndex0, 1);
  const firstWeekday = firstDate.getDay(); // 0=Sun ... 6=Sat
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();

  const cells: CalendarCell[] = [];

  // leading empties
  for (let i = 0; i < firstWeekday; i++) cells.push({ type: "empty" });

  // days
  for (let d = 1; d <= daysInMonth; d++) cells.push({ type: "day", day: d });

  // trailing empties to complete weeks
  while (cells.length % 7 !== 0) cells.push({ type: "empty" });

  return { year, monthIndex0, daysInMonth, firstWeekday, cells };
}
