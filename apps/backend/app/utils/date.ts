export const getDate = (span: number, unit: "sec" | "ms" = "ms") => {
  return new Date(Date.now() + (unit === "sec" ? span * 1000 : span));
};

export const getDateAndTime = (datetime: Date) => {
  const time = datetime.toLocaleString("en-US", {
    timeStyle: "short",
  });

  const date = datetime.toLocaleString("en-US", {
    dateStyle: "medium",
  });

  return { time, date };
};

/** A billing date for Dancers, such as "November 22, 2026", in US Eastern time. */
export const formatBillingDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
