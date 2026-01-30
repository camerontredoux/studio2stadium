export type Filter = {
  label: string;
  id: string;
  type: "input" | "select" | "toggle" | "multi-select" | "range";
  paramKey: string;
  options?: { label: string; value: string }[];
};
