import { Column, Link, Row, Section, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors } from "../components/styles.js";

export interface ForgotPasswordEmailProps {
  resetUrl: string;
}

const logoWordmark = {
  fontSize: "30px",
  fontWeight: 800,
  letterSpacing: "-0.5px",
  textAlign: "center" as const,
  margin: "0 0 6px",
  color: colors.text,
};

const logoTagline = {
  fontSize: "12px",
  letterSpacing: "3px",
  textAlign: "center" as const,
  margin: 0,
  fontWeight: 600,
  color: colors.primary,
};

const sectionLabel = {
  margin: 0,
  fontSize: "15px",
  fontWeight: "bold" as const,
  letterSpacing: "2px",
  textAlign: "center" as const,
  whiteSpace: "nowrap" as const,
  color: colors.text,
};

const sectionRule = {
  height: "1px",
  backgroundColor: colors.primary,
  fontSize: "1px",
  lineHeight: "1px",
};

const iconTile = {
  width: "128px",
  height: "128px",
  borderRadius: "50%",
  backgroundColor: "#F8F6F0",
  border: `1px solid ${colors.border}`,
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
  overflow: "hidden" as const,
};

const iconMark = {
  fontSize: "56px",
  lineHeight: "128px",
  margin: 0,
};

const headline = {
  fontSize: "26px",
  fontWeight: "bold" as const,
  color: colors.text,
  lineHeight: "1.15",
  textAlign: "center" as const,
  margin: "22px 0 0",
};

const headlineAccent = {
  color: colors.primary,
};

const heroDivider = {
  width: "44px",
  height: "2px",
  backgroundColor: colors.primary,
  margin: "16px auto 18px",
};

const bodyText = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: colors.text,
  textAlign: "center" as const,
  margin: "0 auto 22px",
  maxWidth: "440px",
};

const goldButton = {
  display: "inline-block",
  backgroundColor: colors.primary,
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "bold" as const,
  fontSize: "13px",
  letterSpacing: "0.5px",
  borderRadius: "8px",
  padding: "13px 26px",
};

const fallbackText = {
  fontSize: "13px",
  lineHeight: "1.5",
  color: colors.textMuted,
  textAlign: "center" as const,
  margin: "18px auto 0",
  maxWidth: "440px",
  wordBreak: "break-all" as const,
};

const fallbackLink = {
  color: colors.primary,
  textDecoration: "underline",
};

const band = {
  backgroundColor: "#F8F6F0",
  borderRadius: "14px",
  padding: "24px 26px",
  margin: "28px 0 0",
  textAlign: "center" as const,
};

const bandBody = {
  fontSize: "15px",
  lineHeight: "1.55",
  color: colors.text,
  margin: 0,
};

const bandGold = {
  color: colors.primary,
  fontWeight: "bold" as const,
};

function LockIcon() {
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      align="center"
      style={{ margin: "0 auto" }}>
      <tbody>
        <tr>
          <td style={iconTile}>
            <Text style={iconMark}>🔒</Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function ForgotPasswordEmail({ resetUrl }: ForgotPasswordEmailProps) {
  return (
    <Layout preview="Reset your password">
      <Section style={{ textAlign: "center" as const, padding: "8px 0 20px" }}>
        <Text style={logoWordmark}>
          studio<span style={{ color: colors.primary }}>2</span>stadium
        </Text>
        <Text style={logoTagline}>STAND IN YOUR SPOTLIGHT</Text>
      </Section>

      <Section style={{ margin: "8px 0 20px" }}>
        <Row>
          <Column style={{ width: "22%", verticalAlign: "middle" }}>
            <div style={sectionRule} />
          </Column>
          <Column style={{ padding: "0 12px", verticalAlign: "middle" }}>
            <Text style={sectionLabel}>RESET YOUR PASSWORD</Text>
          </Column>
          <Column style={{ width: "22%", verticalAlign: "middle" }}>
            <div style={sectionRule} />
          </Column>
        </Row>
      </Section>

      <Section>
        <LockIcon />
      </Section>

      <Text style={headline}>
        Let's get you back <span style={headlineAccent}>in.</span>
      </Text>
      <div style={heroDivider} />
      <Text style={bodyText}>
        We received a request to reset your password. Click the button below to
        choose a new one and get back to your spotlight.
      </Text>

      <Section style={{ textAlign: "center" as const }}>
        <Link href={resetUrl} style={goldButton}>
          RESET PASSWORD
        </Link>
      </Section>

      <Text style={fallbackText}>
        Or copy and paste this link into your browser:{" "}
        <Link href={resetUrl} style={fallbackLink}>
          {resetUrl}
        </Link>
      </Text>

      <Section style={band}>
        <Text style={bandBody}>
          This link expires in 15 minutes.{" "}
          <span style={bandGold}>
            Didn't request this? You can safely ignore this email.
          </span>
        </Text>
      </Section>
    </Layout>
  );
}

export default ForgotPasswordEmail;
