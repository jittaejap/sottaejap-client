export function toDateIso(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addCalendarMonths(value: string, months: number, preferredDay?: number) {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number)
  const targetMonth = new Date(year, month - 1 + months, 1)
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate()
  return toDateIso(
    new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth(),
      Math.min(preferredDay ?? day, lastDay),
    ),
  )
}
