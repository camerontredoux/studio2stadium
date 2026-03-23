export const colors = {
  primary: "#c5a880",
  primaryDark: "#b39670",
  secondary: "#1b3a61",
  text: "#1f2937",
  textMuted: "#6b7280",
  background: "#ffffff",
  backgroundMuted: "#f9fafb",
  border: "#e5e7eb",
  statusAccepted: "#22c55e",
  statusInReview: "#f97316",
  statusReleased: "#ef4444",
};

export const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const containerStyle = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "40px 20px",
};

export const headingStyle = {
  fontSize: "24px",
  fontWeight: "600" as const,
  color: colors.text,
  margin: "0 0 24px",
};

export const paragraphStyle = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: colors.text,
  margin: "0 0 16px",
};

export const linkStyle = {
  color: colors.primary,
  textDecoration: "underline",
};

export const listStyle = {
  margin: "0 0 16px",
  paddingLeft: "24px",
};

export const listItemStyle = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: colors.text,
  marginBottom: "8px",
};
