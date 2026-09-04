import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors } from "../components/styles.js";

export interface PremiumWelcomeEmailProps {
  firstName: string;
  profileUrl?: string;
  consultationUrl?: string;
}

const PROFILE_URL_DEFAULT = "https://app.studio2stadium.com/profile";
const CONSULTATION_URL_DEFAULT = "https://app.studio2stadium.com/consultation";

const HERO_BG = "https://studio2stadium.com/img/premium-welcome-2x.jpg";

// Line-art icons (upload to R2 at these paths).
const ICON_BELL = "https://studio2stadium.com/img/icon-bell.png";

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
  backgroundColor: "#ffffff",
  backgroundImage: `linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.92) 32%, rgba(255,255,255,0.4) 56%, rgba(255,255,255,0) 82%), url(${HERO_BG})`,
  backgroundSize: "cover",
  backgroundPosition: "center right",
  borderRadius: "14px",
  overflow: "hidden" as const,
  border: `1px solid ${colors.border}`,
  margin: "8px 0 4px",
};

const heroTextCol = {
  width: "58%",
  verticalAlign: "middle" as const,
  padding: "40px 28px",
};

const heroSpacerCol = {
  width: "42%",
  padding: 0,
};

const heroEyebrow = {
  color: colors.text,
  fontSize: "13px",
  fontWeight: "bold" as const,
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
  margin: 0,
};

const heroBrand = {
  color: colors.primary,
  fontSize: "44px",
  fontWeight: 800,
  lineHeight: "1",
  margin: "4px 0 0",
};

const heroDivider = {
  width: "44px",
  height: "2px",
  backgroundColor: colors.primary,
  margin: "16px 0 18px",
};

const heroSubtitle = {
  color: colors.text,
  fontSize: "16px",
  lineHeight: "1.4",
  margin: "0 0 22px",
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
  whiteSpace: "nowrap" as const,
};

const introHi = {
  fontSize: "20px",
  fontWeight: "bold" as const,
  color: colors.text,
  textAlign: "left" as const,
  margin: "16px 0 0",
};

const introText = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: colors.text,
  textAlign: "left" as const,
  margin: "12px 0 0",
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

const numBadge = {
  display: "block",
  margin: 0,
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "34px",
  lineHeight: "1",
  fontWeight: "bold" as const,
  letterSpacing: "-1px",
  color: "#E7E0D0",
};

const cardCell = {
  width: "32.5%",
  verticalAlign: "top" as const,
  backgroundColor: "#F8F6F0",
  borderRadius: "12px",
  padding: "22px 16px",
};

const cardSpacer = {
  width: "10px",
  fontSize: "1px",
  lineHeight: "1px",
};

const cardTitle = {
  margin: 0,
  marginTop: "10px",
  fontSize: "15px",
  fontWeight: "bold" as const,
  lineHeight: "1.25",
  color: colors.text,
};

const cardRule = {
  width: "28px",
  height: "2px",
  backgroundColor: colors.primary,
  margin: "12px 0 12px",
};

const cardDesc = {
  margin: 0,
  fontSize: "13px",
  lineHeight: "1.5",
  color: "#4b4b4b",
};

const band = {
  backgroundColor: "#F8F6F0",
  borderRadius: "14px",
  padding: "28px 26px",
  margin: "28px 0 0",
};

const bellCircle = {
  width: "64px",
  height: "64px",
  borderRadius: "50%",
  backgroundColor: colors.primary,
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
};

const bandHeading = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: colors.text,
  lineHeight: "1.15",
  margin: "16px 0 0",
};

const bandSub = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#4b4b4b",
  margin: 0,
};

const bandRightCol = {
  verticalAlign: "top" as const,
  paddingLeft: "26px",
  borderLeft: `1px solid ${colors.border}`,
};

const bandBody = {
  fontSize: "15px",
  lineHeight: "1.55",
  color: colors.text,
  margin: 0,
};

const bandGold = {
  fontSize: "15px",
  lineHeight: "1.45",
  fontWeight: "bold" as const,
  color: colors.primary,
  margin: "14px 0 0",
};

const consultBand = {
  padding: "4px 26px 8px",
  textAlign: "center" as const,
};

const consultHeadline = {
  fontSize: "34px",
  fontWeight: "bold" as const,
  color: colors.text,
  lineHeight: "1.1",
  margin: "0 0 10px",
};

const consultSub = {
  fontSize: "15px",
  lineHeight: "1.55",
  color: "#4b4b4b",
  margin: "0 auto 20px",
  maxWidth: "420px",
};

const closingBody = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: colors.text,
  margin: 0,
};

const closingSignature = {
  fontSize: "15px",
  fontWeight: "bold" as const,
  color: colors.primary,
  margin: 0,
};

export function PremiumWelcomeEmail({
  firstName,
  profileUrl = PROFILE_URL_DEFAULT,
  consultationUrl = CONSULTATION_URL_DEFAULT,
}: PremiumWelcomeEmailProps) {
  return (
    <Layout preview="You're officially Premium — let's make it count!">
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
            <Text style={heroEyebrow}>You&apos;re officially</Text>
            <Text style={heroBrand}>PREMIUM.</Text>
            <div style={heroDivider} />
            <Text style={heroSubtitle}>You&apos;re in. Let&apos;s make it count.</Text>
            <Link href={profileUrl} style={goldButton}>
              COMPLETE YOUR PROFILE
            </Link>
          </Column>
          <Column
            className="email-dancer-hero-logo-mobile"
            style={heroSpacerCol}
          />
        </Row>
      </Section>

      <Text style={introHi}>Hi {firstName},</Text>
      <Text style={introText}>
        You&apos;re officially Premium! You now have access to the full Studio 2
        Stadium recruiting toolkit, built to help you get discovered, find
        the right programs, and stay organized throughout your college dance
        journey.
      </Text>
      <Text style={{ ...introText, fontWeight: "bold" }}>
        Let&apos;s get you started.
      </Text>

      <Section style={{ margin: "24px 0 16px" }}>
        <Row>
          <Column style={{ width: "34%", verticalAlign: "middle" }}>
            <div style={sectionRule} />
          </Column>
          <Column style={{ padding: "0 12px", verticalAlign: "middle" }}>
            <Text style={sectionLabel}>START HERE</Text>
          </Column>
          <Column style={{ width: "34%", verticalAlign: "middle" }}>
            <div style={sectionRule} />
          </Column>
        </Row>
      </Section>

      <Section style={{ margin: "12px 0 8px" }}>
        <Row>
          <Column style={cardCell}>
            <span style={numBadge}>01</span>
            <Text style={cardTitle}>Complete your recruiting profile</Text>
            <div style={cardRule} />
            <Text style={cardDesc}>
              Add your skills, preferences, academics, and more. The more
              complete your profile is, the better we can help match you with
              programs that align with you.
            </Text>
          </Column>
          <Column style={cardSpacer}>&nbsp;</Column>
          <Column style={cardCell}>
            <span style={numBadge}>02</span>
            <Text style={cardTitle}>Upload your best content</Text>
            <div style={cardRule} />
            <Text style={cardDesc}>
              Show coaches your technique, skills, training, and progress with
              unlimited video uploads.
            </Text>
          </Column>
          <Column style={cardSpacer}>&nbsp;</Column>
          <Column style={cardCell}>
            <span style={numBadge}>03</span>
            <Text style={cardTitle}>Find &amp; follow your schools</Text>
            <div style={cardRule} />
            <Text style={cardDesc}>
              Explore programs, follow the ones you&apos;re interested in, and
              keep track of your recruiting activity.
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={band}>
        <Row>
          <Column style={{ width: "42%", verticalAlign: "top", paddingRight: "24px" }}>
            <table role="presentation" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={bellCircle}>
                    <Img
                      src={ICON_BELL}
                      alt=""
                      width={30}
                      height={30}
                      style={{ display: "inline-block", verticalAlign: "middle" }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <Text style={bandHeading}>Keep your profile active.</Text>
            <div style={{ ...heroDivider, margin: "14px 0" }} />
            <Text style={bandSub}>
              Your profile is designed to grow with you.
            </Text>
          </Column>
          <Column style={bandRightCol}>
            <Text style={bandBody}>
              When you add a new video or update your profile, coaches who follow
              you can see those updates directly in their Home Feed, making
              it easier for them to keep up with your progress.
            </Text>
            <Text style={bandGold}>
              New skill? New video? New accomplishment? Add it.
            </Text>
            <Section style={{ marginTop: "18px" }}>
              <Link href={profileUrl} style={goldButton}>
                UPDATE YOUR PROFILE
              </Link>
            </Section>
          </Column>
        </Row>
      </Section>

      <Section style={{ margin: "32px 0 16px" }}>
        <Row>
          <Column style={{ width: "26%", verticalAlign: "middle" }}>
            <div style={sectionRule} />
          </Column>
          <Column style={{ padding: "0 12px", verticalAlign: "middle" }}>
            <Text style={sectionLabel}>PREMIUM PERK</Text>
          </Column>
          <Column style={{ width: "26%", verticalAlign: "middle" }}>
            <div style={sectionRule} />
          </Column>
        </Row>
      </Section>

      <Section style={consultBand}>
        <Text style={consultHeadline}>25% off your first consultation</Text>
        <Text style={consultSub}>
          Sit down one-on-one with our team to map out your recruiting
          strategy. As a Premium member, your first consultation is 25% off.
        </Text>
        <Link href={consultationUrl} style={goldButton}>
          BOOK HERE
        </Link>
      </Section>

      <Section style={band}>
        <Row>
          <Column style={{ width: "62%", verticalAlign: "middle", paddingRight: "24px" }}>
            <Text style={closingBody}>
              Your journey is just getting started, and you don&apos;t have to navigate 
              it alone. Keep showing up, keep growing, and{" "}
              <span style={{ color: colors.primary, fontWeight: "bold" }}>
                keep standing in your spotlight.
              </span>{" "}
              We&apos;ll be here with the tools and support to help you move 
              forward, and we can&apos;t wait to see where it takes you.
            </Text>
          </Column>
          <Column
            style={{
              verticalAlign: "middle",
              textAlign: "left" as const,
              paddingLeft: "24px",
              borderLeft: `1px solid ${colors.border}`,
            }}>
            <Text style={closingSignature}>The Studio 2 Stadium Team</Text>
          </Column>
        </Row>
      </Section>
    </Layout>
  );
}

export default PremiumWelcomeEmail;
