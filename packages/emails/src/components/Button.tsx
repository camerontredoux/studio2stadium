import { Button as ReactEmailButton } from "@react-email/components";
import { colors } from "./styles.js";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
}

export function Button({ href, children }: ButtonProps) {
  return (
    <ReactEmailButton
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: colors.primary,
        color: "#ffffff",
        fontSize: "16px",
        fontWeight: "600",
        padding: "12px 24px",
        borderRadius: "6px",
        textDecoration: "none",
        textAlign: "center" as const,
        marginTop: "8px",
        marginBottom: "16px",
      }}
    >
      {children}
    </ReactEmailButton>
  );
}
