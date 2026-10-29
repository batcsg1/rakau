// "14 Mar, 7:50 pm" this year, "14 Mar 2025, 7:50 pm" otherwise, in the device's time zone.
// Lists show the time too, so trees recorded on the same day can be told apart (UAT I4/I11, #59)
export function shortDateTime(iso: string): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
}
