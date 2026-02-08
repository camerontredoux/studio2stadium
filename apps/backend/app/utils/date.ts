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
