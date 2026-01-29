export type Filter<T> = {
  label: string;
  id: string;
  type: "input" | "select" | "toggle" | "multi-select" | "range";
  paramKey: T;
  options?: { label: string; value: string }[];
};
