import { Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors } from "../components/styles.js";
import { paragraphStyle } from "../components/styles.js";

export interface SchoolRejectedEmailProps {
  firstName: string;
  schoolName: string;
  reason?: string;
}

const reasonBlockStyle = {
  borderLeft: `4px solid ${colors.primary}`,
  backgroundColor: colors.backgroundMuted,
  padding: "16px 20px",
  margin: "0 0 24px",
  borderRadius: "4px",
};

const reasonTextStyle = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: colors.text,
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};

const reasonLabelStyle = {
  fontSize: "13px",
  fontWeight: "600" as const,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: colors.textMuted,
  margin: "0 0 8px",
};

export function SchoolRejectedEmail({
  firstName,
  schoolName,
  reason,
}: SchoolRejectedEmailProps) {
  return (
    <Layout preview={`Update on your Studio 2 Stadium application`}>
      <Text style={paragraphStyle}>Hi {firstName},</Text>
      <Text style={paragraphStyle}>
        Thank you for applying to Studio 2 Stadium with{" "}
        <strong>{schoolName}</strong>. After reviewing your application, we
        weren't able to approve it at this time.
      </Text>
      {reason ? (
        <div style={reasonBlockStyle}>
          <Text style={reasonLabelStyle}>Reason from our team</Text>
          <Text style={reasonTextStyle}>{reason}</Text>
        </div>
      ) : null}
      <Text style={paragraphStyle}>
        If you'd like to discuss this decision or provide additional
        information, just reply to this email and our team will be happy to
        help. You're welcome to reapply once any concerns above have been
        addressed.
      </Text>
      <Text style={paragraphStyle}>
        Warmly,
        <br />
        Abbey Nugent & The Studio 2 Stadium Team
      </Text>
    </Layout>
  );
}

export default SchoolRejectedEmail;
