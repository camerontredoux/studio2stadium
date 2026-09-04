import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors } from "../components/styles.js";

export interface SchoolWelcomeEmailProps {
  firstName: string;
  schoolName: string;
  dashboardUrl: string;
}

const HERO_BG = "https://studio2stadium.com/img/school-welcome-2x.jpg";

// Gold line-art step icons (export from Canva, upload to R2 at these paths).
const ICON_STEP_PROFILE =
  "https://studio2stadium.com/img/icon-program-profile-v2.png";
const ICON_STEP_PROSPECTS =
  "https://studio2stadium.com/img/icon-discover-prospects-v2.png";
const ICON_STEP_CLARITY =
  "https://studio2stadium.com/img/icon-give-clarity-v2.png";
const ICON_STEP_PROMOTE =
  "https://studio2stadium.com/img/icon-promote-program-v2.png";

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

const heroCard = {
  backgroundColor: "#141414",
  backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.15) 100%), url(${HERO_BG})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  borderRadius: "14px",
  overflow: "hidden" as const,
  margin: "8px 0 4px",
};

const heroTextCol = {
  width: "60%",
  verticalAlign: "middle" as const,
  padding: "36px 28px",
};

const heroSpacerCol = {
  width: "40%",
  padding: 0,
};

const heroWelcome = {
  color: "#ffffff",
  fontSize: "30px",
  fontWeight: 700,
  lineHeight: "1.1",
  margin: 0,
};

const heroBrand = {
  color: colors.primary,
  fontSize: "30px",
  fontWeight: 700,
  lineHeight: "1.1",
  margin: "0 0 14px",
};

const heroDivider = {
  width: "44px",
  height: "2px",
  backgroundColor: "#6b6b6b",
  margin: "0 0 18px",
};

const heroLead = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "1.3",
  margin: "0 0 6px",
};

const heroSubtitle = {
  color: "#d6d6d6",
  fontSize: "15px",
  lineHeight: "1.4",
  margin: "0 0 22px",
};

const heroButton = {
  display: "inline-block",
  backgroundColor: colors.primary,
  color: "#1a1a1a",
  textDecoration: "none",
  fontWeight: "bold" as const,
  fontSize: "13px",
  letterSpacing: "0.5px",
  borderRadius: "8px",
  padding: "12px 24px",
  whiteSpace: "nowrap" as const,
};

const introText = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: colors.text,
  textAlign: "left" as const,
  margin: "16px 0 0",
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

const stepBadgeCol = {
  width: "34px",
  verticalAlign: "top" as const,
};

const numBadge = {
  display: "inline-block",
  width: "24px",
  height: "24px",
  lineHeight: "24px",
  borderRadius: "50%",
  backgroundColor: "#1a1a1a",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
};

const stepIconCol = {
  width: "72px",
  verticalAlign: "top" as const,
};

const stepIconBox = {
  width: "56px",
  height: "56px",
  border: `1px solid ${colors.primary}`,
  borderRadius: "12px",
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
};

const stepTextCol = {
  verticalAlign: "top" as const,
  paddingLeft: "8px",
};

const stepTitle = {
  margin: "0 0 4px",
  fontSize: "16px",
  fontWeight: "bold" as const,
  lineHeight: "1.25",
  color: colors.text,
};

const stepDesc = {
  margin: 0,
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#4b4b4b",
};

const stepSection = {
  margin: "0 0 18px",
};

const gold = { color: colors.primary, fontWeight: "bold" as const };

const closingText = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: colors.text,
  textAlign: "left" as const,
  margin: "16px 0 0",
};

export function SchoolWelcomeEmail({
  firstName,
  schoolName,
  dashboardUrl,
}: SchoolWelcomeEmailProps) {
  return (
    <Layout preview="Welcome to Studio 2 Stadium - your recruiting tools are ready!">
      <Section style={{ textAlign: "center" as const, padding: "8px 0 20px" }}>
        <Text style={logoWordmark}>
          studio<span style={{ color: colors.primary }}>2</span>stadium
        </Text>
        <Text style={logoTagline}>STAND IN YOUR SPOTLIGHT</Text>
      </Section>

      <Section className="email-hero-mobile" style={heroCard}>
        <Row>
          <Column
            className="email-dancer-hero-cta-col-mobile"
            style={heroTextCol}>
            <Text style={heroWelcome}>Welcome to</Text>
            <Text style={heroBrand}>Studio 2 Stadium.</Text>
            <div style={heroDivider} />
            <Text style={heroLead}>Your recruiting tools are ready.</Text>
            <Text style={heroSubtitle}>
              Explore, connect, and recruit with confidence, all in one
              place.
            </Text>
            <Link
              className="email-hero-cta-mobile"
              href={dashboardUrl}
              style={{...heroButton, color: "#FFFFFF"}}>
              EXPLORE YOUR DASHBOARD &nbsp;&rarr;
            </Link>
          </Column>
          <Column
            className="email-dancer-hero-logo-mobile"
            style={heroSpacerCol}
          />
        </Row>
      </Section>

      <Text style={introText}>
        Hi {firstName}, your <strong>{schoolName}</strong> account is verified
        and ready to go.
      </Text>
      <Text style={introText}>
        Studio 2 Stadium was built to make recruiting more organized, connected,
        and transparent, giving you the tools to discover prospective
        dancers, promote your program, and stay engaged throughout the
        recruiting process.
      </Text>

      <Section style={{ margin: "28px 0 20px" }}>
        <Row>
          <Column style={{ width: "22%", verticalAlign: "middle" }}>
            <div style={sectionRule} />
          </Column>
          <Column style={{ padding: "0 12px", verticalAlign: "middle" }}>
            <Text style={sectionLabel}>MAKE S2S WORK FOR YOU</Text>
          </Column>
          <Column style={{ width: "22%", verticalAlign: "middle" }}>
            <div style={sectionRule} />
          </Column>
        </Row>
      </Section>

      <Section style={stepSection}>
        <Row>
          <Column style={stepBadgeCol}>
            <span style={numBadge}>1</span>
          </Column>
          <Column style={stepIconCol}>
            <table role="presentation" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={stepIconBox}>
                    <Img
                      src={ICON_STEP_PROFILE}
                      alt=""
                      width={32}
                      height={32}
                      style={{ display: "inline-block", verticalAlign: "middle" }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </Column>
          <Column style={stepTextCol}>
            <Text style={stepTitle}>Complete Your Program Profile</Text>
            <Text style={stepDesc}>
              Keep your academics, team information, styles and recruiting
              preferences current to help S2S create more accurate matches. Be
              sure to set your Skill Priorities from <span style={gold}>1&ndash;5</span>,
              with <strong>1</strong> representing a preferred skill and <strong> 5 </strong> 
              representing a skill your program considers essential.
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={stepSection}>
        <Row>
          <Column style={stepBadgeCol}>
            <span style={numBadge}>2</span>
          </Column>
          <Column style={stepIconCol}>
            <table role="presentation" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={stepIconBox}>
                    <Img
                      src={ICON_STEP_PROSPECTS}
                      alt=""
                      width={32}
                      height={32}
                      style={{ display: "inline-block", verticalAlign: "middle" }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </Column>
          <Column style={stepTextCol}>
            <Text style={stepTitle}>Discover &amp; Follow Prospects</Text>
            <Text style={stepDesc}>
              Search and filter dancers based on what matters to your program.
              When you follow a dancer, <span style={gold}>they&rsquo;re notified</span>{" "}
              of your interest, and their future profile updates automatically
              appear in your <span style={gold}>Home Feed</span>, helping you
              track progress without repeatedly searching.
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={stepSection}>
        <Row>
          <Column style={stepBadgeCol}>
            <span style={numBadge}>3</span>
          </Column>
          <Column style={stepIconCol}>
            <table role="presentation" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={stepIconBox}>
                    <Img
                      src={ICON_STEP_CLARITY}
                      alt=""
                      width={32}
                      height={32}
                      style={{ display: "inline-block", verticalAlign: "middle" }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </Column>
          <Column style={stepTextCol}>
            <Text style={stepTitle}>Give Dancers Clarity</Text>
            <Text style={stepDesc}>
              Use <span style={gold}>Prospect Statuses</span> to communicate where
              dancers stand in your recruiting process. Keeping statuses current
              helps organize your prospects while giving dancers greater
              transparency throughout their journey.
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={stepSection}>
        <Row>
          <Column style={stepBadgeCol}>
            <span style={numBadge}>4</span>
          </Column>
          <Column style={stepIconCol}>
            <table role="presentation" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={stepIconBox}>
                    <Img
                      src={ICON_STEP_PROMOTE}
                      alt=""
                      width={32}
                      height={32}
                      style={{ display: "inline-block", verticalAlign: "middle" }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </Column>
          <Column style={stepTextCol}>
            <Text style={stepTitle}>Promote Your Program</Text>
            <Text style={stepDesc}>
              Add upcoming clinics, auditions and events with{" "}
              <span style={gold}>direct registration links</span>. Updates to your
              program profile also appear in the Home Feed of dancers who follow
              you, keeping your program visible and your community informed.
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={{ textAlign: "center" as const, margin: "24px 0 8px" }}>
        <Link href={dashboardUrl} style={{...heroButton, color: "#FFFFFF"}}>
          EXPLORE YOUR DASHBOARD &nbsp;&rarr;
        </Link>
      </Section>

      <div style={{ ...sectionRule, margin: "24px 0 0" }} />

      <Text style={closingText}>
        Keeping your profile current, following prospects and updating recruiting
        statuses helps create a more efficient recruiting experience for
        coaches, and a more transparent one for dancers.
      </Text>
      <Text style={closingText}>
        We&rsquo;re continually improving Studio 2 Stadium alongside the coaches
        who use it. If there&rsquo;s a tool, feature or improvement that would
        make recruiting easier for your program,{" "}
        <span style={gold}>we&rsquo;d love to hear from you.</span>
      </Text>
      <Text style={closingText}>
        <strong>Thank you for the time, energy and care</strong> you pour into
        your athletes and programs. We&rsquo;re grateful to have you on Studio 2
        Stadium and excited to continue building a better recruiting experience
        together.
      </Text>
      <Text style={{ ...closingText, fontWeight: "bold" }}>
        The Studio 2 Stadium Team
      </Text>
    </Layout>
  );
}

export default SchoolWelcomeEmail;
