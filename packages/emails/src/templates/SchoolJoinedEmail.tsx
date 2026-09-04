import { Column, Link, Row, Section, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors } from "../components/styles.js";

export interface SchoolJoinedEmailProps {
  dancerName: string;
  upgradeUrl: string;
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

export function SchoolJoinedEmail({
  dancerName,
  upgradeUrl,
}: SchoolJoinedEmailProps) {
  return (
    <Layout preview="A new school joined — upgrade to explore programs on Studio 2 Stadium">
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
            <Text style={sectionLabel}>A NEW SCHOOL JOINED</Text>
          </Column>
          <Column style={{ width: "22%", verticalAlign: "middle" }}>
            <div style={sectionRule} />
          </Column>
        </Row>
      </Section>

      <Text style={headline}>
        A new school just joined
        <br />
        <span style={headlineAccent}>Studio 2 Stadium.</span>
      </Text>
      <div style={heroDivider} />
      <Text style={bodyText}>
        Hi {dancerName}, don't miss your chance to explore their profile —
        upcoming event details, team expectations, and exclusive program
        insights straight from the coach.
      </Text>

      <Section style={{ textAlign: "center" as const }}>
        <Link href={upgradeUrl} style={goldButton}>
          UPGRADE TO PREMIUM
        </Link>
      </Section>

      <Section style={band}>
        <Text style={bandBody}>
          More schools are joining every week.{" "}
          <span style={bandGold}>
            Upgrade now and take the lead in your dance journey.
          </span>
        </Text>
      </Section>
    </Layout>
  );
}

export default SchoolJoinedEmail;
