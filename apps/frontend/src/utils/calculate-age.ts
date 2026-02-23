import { differenceInYears } from "date-fns";

export function calculateAge(birthday: string) {
  return differenceInYears(new Date(), new Date(birthday));
}
