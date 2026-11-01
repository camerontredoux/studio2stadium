import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors } from "../components/styles.js";

export interface DancerWelcomeEmailProps {
  firstName: string;
  profileUrl: string;
}

const HERO_BG = "https://studio2stadium.com/img/dancer-welcome-2x.jpg";
const ICON_UPLOAD =
  "https://d1wf5hycmlyms9.cloudfront.net/uploadec19450d-c273-4948-a6bc-f20f26af9b57.png";
const personHead = {
  width: "12px",
  height: "12px",
  border: `2px solid black`,
  borderRadius: "50%",
  margin: "0 auto",
};
const personBody = {
  width: "22px",
  height: "11px",
  border: `2px solid black`,
  borderBottom: "none",
  borderTopLeftRadius: "11px",
  borderTopRightRadius: "11px",
  margin: "3px auto 0",
};
const ICON_DISCOVER =
  "https://d1wf5hycmlyms9.cloudfront.net/f428bb6d06bceee73dd0a8798458720611eb543f6485b641-ccf2-490b-b79c-586be08472d4.png";

const SIGNUP_URL = "https://app.studio2stadium.com/checkout";
const S2_MARK =
  "https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png";

const premiumFeatures = [
  "Unlimited video uploads",
  "See who's viewing your profile",
  "Track coach communication",
  "Submit your Common Recruiting Video",
  "Access exclusive recruiting resources",
];

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
  backgroundPosition: "center right",
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
  margin: "0 0 14px",
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
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: "bold" as const,
  fontSize: "13px",
  letterSpacing: "0.5px",
  borderRadius: "8px",
  padding: "12px 24px",
};

const startHereLabel = {
  margin: 0,
  fontSize: "15px",
  fontWeight: "bold" as const,
  letterSpacing: "2px",
  textAlign: "center" as const,
  whiteSpace: "nowrap" as const,
  color: colors.text,
};

const startHereRule = {
  height: "1px",
  backgroundColor: colors.primary,
  fontSize: "1px",
  lineHeight: "1px",
};

const cardCell = {
  width: "32.5%",
  verticalAlign: "top" as const,
  backgroundColor: "#F8F6F0",
  borderRadius: "12px",
  padding: "24px 12px",
};

const cardSpacer = {
  width: "8px",
  fontSize: "1px",
  lineHeight: "1px",
};

const cardIconCell = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  backgroundColor: "rgba(197, 168, 128, 0.18)",
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
};

const numBadge = {
  display: "inline-block",
  width: "22px",
  height: "22px",
  lineHeight: "22px",
  borderRadius: "50%",
  backgroundColor: colors.primary,
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
};

const badgeCol = {
  width: "26px",
  verticalAlign: "top" as const,
  paddingTop: "1px",
};

const cardTitle = {
  margin: 0,
  fontSize: "12px",
  fontWeight: "bold" as const,
  lineHeight: "1.3",
  color: colors.primary,
  minHeight: "31px",
};

const cardDesc = {
  margin: "12px 0 0",
  fontSize: "12px",
  lineHeight: "1.45",
  color: "#6b6b6b",
};

const sectionRule = {
  height: "1px",
  backgroundColor: colors.primary,
  fontSize: "1px",
  lineHeight: "1px",
  margin: "8px 0 24px",
};

const starCircle = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  border: `2px solid ${colors.primary}`,
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
};

const starGlyph = {
  color: colors.primary,
  fontSize: "22px",
  lineHeight: "1",
};

const readyHeading = {
  fontSize: "26px",
  fontWeight: "bold" as const,
  color: colors.text,
  margin: "18px 0 12px",
  lineHeight: "1.15",
};

const readyBody = {
  fontSize: "15px",
  lineHeight: "1.55",
  color: colors.text,
  margin: 0,
};

const premiumCol = {
  verticalAlign: "top" as const,
  paddingLeft: "24px",
  borderLeft: `1px solid ${colors.border}`,
};

const checkBadge = {
  display: "inline-block",
  width: "20px",
  height: "20px",
  lineHeight: "20px",
  borderRadius: "50%",
  backgroundColor: colors.primary,
  color: "#ffffff",
  fontSize: "11px",
  fontWeight: "bold" as const,
  textAlign: "center" as const,
};

const checkText = {
  margin: 0,
  fontSize: "14px",
  lineHeight: "1.35",
  color: colors.text,
};

const unlockButton = {
  display: "inline-block",
  backgroundColor: colors.primary,
  color: "#1a1a1a",
  textDecoration: "none",
  fontWeight: "bold" as const,
  fontSize: "15px",
  letterSpacing: "1px",
  borderRadius: "8px",
  padding: "14px 32px",
};

const supportBand = {
  backgroundColor: "#F8F6F0",
  borderRadius: "12px",
  padding: "24px",
  margin: "28px 0 0",
};

const supportText = {
  fontSize: "16px",
  lineHeight: "1.5",
  color: colors.text,
  margin: 0,
};

const signatureName = {
  fontFamily: '"Snell Roundhand", "Apple Chancery", cursive',
  fontStyle: "italic" as const,
  fontSize: "34px",
  color: colors.text,
  margin: "0 0 2px",
  lineHeight: "1",
  textAlign: "left" as const,
};

const signatureSub = {
  fontSize: "15px",
  fontWeight: "bold" as const,
  color: colors.primary,
  margin: 0,
  lineHeight: "1.3",
  textAlign: "left" as const,
};

export function DancerWelcomeEmail({
  firstName,
  profileUrl,
}: DancerWelcomeEmailProps) {
  return (
    <Layout preview="Welcome to Studio 2 Stadium - we're so excited you're here!">
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
            <Text style={heroSubtitle}>
              Your recruiting journey starts here.
            </Text>
            <Link className="email-hero-cta-mobile" href={profileUrl} style={heroButton}>
              COMPLETE YOUR PROFILE
            </Link>
          </Column>
          <Column
            className="email-dancer-hero-logo-mobile"
            style={heroSpacerCol}
          />
        </Row>
      </Section>

      <Text style={{ fontSize: 20, marginTop: "8px", textAlign: "left", color: colors.primary, fontWeight: "bold"}}>
        Hi {firstName}, 
      </Text>
      <Text style={{ textAlign: "left" }}>
        Welcome! Your free profile is now live, giving you a 
        place to showcase who you are and become visible to 
        verified college coaches. 
      </Text>
      <Text style={{ fontSize: 16, textAlign: "left", fontWeight: "bold" }}>
        Let&apos;s get you started.
      </Text>
      <Section style={{ margin: "20px 0 4px" }}>
        <Row>
          <Column style={{ width: "34%", verticalAlign: "middle" }}>
            <div style={startHereRule} />
          </Column>
          <Column style={{ padding: "0 12px", verticalAlign: "middle" }}>
            <Text style={startHereLabel}>START HERE</Text>
          </Column>
          <Column style={{ width: "34%", verticalAlign: "middle" }}>
            <div style={startHereRule} />
          </Column>
        </Row>
      </Section>

      <Section style={{ margin: "12px 0 8px" }}>
        <Row>
          <Column style={cardCell}>
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              align="center"
              style={{ margin: "0 auto 16px" }}>
              <tbody>
                <tr>
                  <td style={cardIconCell}>
                    <div style={personHead} />
                    <div style={personBody} />
                  </td>
                </tr>
              </tbody>
            </table>
            <Row>
              <Column style={badgeCol}>
                <span style={numBadge}>1</span>
              </Column>
              <Column style={{ verticalAlign: "top" }}>
                <Text style={cardTitle}>Complete your recruiting profile</Text>
              </Column>
            </Row>
            <Text style={cardDesc}>
              Tell coaches who you are beyond the dance floor.
            </Text>
          </Column>
          <Column style={cardSpacer}>&nbsp;</Column>
          <Column style={cardCell}>
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              align="center"
              style={{ margin: "0 auto 16px" }}>
              <tbody>
                <tr>
                  <td style={cardIconCell}>
                    <Img
                      src={ICON_UPLOAD}
                      alt=""
                      width={30}
                      height={30}
                      style={{ display: "inline-block", verticalAlign: "middle" }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <Row>
              <Column style={badgeCol}>
                <span style={numBadge}>2</span>
              </Column>
              <Column style={{ verticalAlign: "top" }}>
                <Text style={cardTitle}>Upload your <br /> best photos</Text>
              </Column>
            </Row>
            <Text style={cardDesc}>
              Showcase your training, performance, and personality.
            </Text>
          </Column>
          <Column style={cardSpacer}>&nbsp;</Column>
          <Column style={cardCell}>
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              align="center"
              style={{ margin: "0 auto 16px" }}>
              <tbody>
                <tr>
                  <td style={cardIconCell}>
                    <Img
                      src={ICON_DISCOVER}
                      alt=""
                      width={30}
                      height={30}
                      style={{ display: "inline-block", verticalAlign: "middle" }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <Row>
              <Column style={badgeCol}>
                <span style={numBadge}>3</span>
              </Column>
              <Column style={{ verticalAlign: "top" }}>
                <Text style={cardTitle}>Start exploring colleges &amp; events</Text>
              </Column>
            </Row>
            <Text style={cardDesc}>
              See what&apos;s possible and begin planning your recruiting journey.
            </Text>
          </Column>
        </Row>
      </Section>

      <div style={sectionRule} />
      <Section style={{ margin: "8px 0 0" }}>
        <Row>
          <Column
            style={{
              width: "42%",
              verticalAlign: "top",
              paddingRight: "24px",
            }}>
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              style={{ margin: 0 }}>
              <tbody>
                <tr>
                  <td style={starCircle}>
                    <span style={starGlyph}>&#9733;</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <Text style={readyHeading}>
              Ready for{" "}
              <span style={{ color: colors.primary }}>more?</span>
            </Text>
            <Text style={readyBody}>
              When you&apos;re ready, Premium unlocks powerful tools to help you
              stand out and stay organized throughout your recruiting journey.
            </Text>
          </Column>
          <Column style={premiumCol}>
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              style={{ width: "100%" }}>
              <tbody>
                {premiumFeatures.map((feature, i) => (
                  <tr key={feature}>
                    <td
                      style={{
                        width: "30px",
                        verticalAlign: "middle",
                        padding: "10px 0",
                        borderTop:
                          i === 0 ? "none" : `1px solid ${colors.border}`,
                      }}>
                      <span style={checkBadge}>&#10003;</span>
                    </td>
                    <td
                      style={{
                        verticalAlign: "middle",
                        padding: "10px 0 10px 10px",
                        borderTop:
                          i === 0 ? "none" : `1px solid ${colors.border}`,
                      }}>
                      <Text style={checkText}>{feature}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Section style={{ marginTop: "20px" }}>
              <Link href={SIGNUP_URL} style={{...unlockButton, color: "#FFFFFF" }}>
                UNLOCK PREMIUM
              </Link>
            </Section>
          </Column>
        </Row>
      </Section>

      <Section style={supportBand}>
        <Row>
          <Column style={{ verticalAlign: "middle", paddingLeft: "8px" }}>
            <Text style={supportText}>
              No matter where you are in your recruiting journey, we&apos;re here
              to{" "}
              <br />
              <span style={{ color: colors.primary, fontWeight: "bold" }}>
                support you
              </span>{" "}
              every step of the way.
            </Text>
          </Column>
          <Column
            style={{
              verticalAlign: "middle",
              textAlign: "left" as const,
              paddingLeft: "24px",
              borderLeft: `1px solid ${colors.border}`,
            }}>
            <Text style={signatureSub}>
              The Studio 2 Stadium Team
            </Text>
          </Column>
        </Row>
      </Section>
    </Layout>
  );
}

export default DancerWelcomeEmail;
