export function makeBirthday(birthday: {
  year: number;
  month: number;
  day: number;
}) {
  return [birthday.year, birthday.month, birthday.day]
    .map((n) => String(n).padStart(2, "0"))
    .join("-");
}
