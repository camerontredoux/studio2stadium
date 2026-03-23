import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors, linkStyle, paragraphStyle } from "../components/styles.js";

export interface PremiumWelcomeEmailProps {
  firstName: string;
}

const HERO_BG =
  "https://d1wf5hycmlyms9.cloudfront.net/dcf07b79a52fb0c0964b14285be63a0143661a70d740dc08-c31b-4680-b7e4-264fc550dca2.jpg";
const LOGO =
  "https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png";
const ICON_CONSULTING =
  "https://d1wf5hycmlyms9.cloudfront.net/strokeb856cf71-6500-4122-b3e7-dd37363f1c60.png";
const ICON_LIBRARY =
  "https://d1wf5hycmlyms9.cloudfront.net/c4074ac47f2cc82061236c15c691dd762863903f19100796-e2da-41ab-8608-4a6cfa85c7b9.png";
const ICON_TAG =
  "https://d1wf5hycmlyms9.cloudfront.net/tagbfed9d19-8eec-4ddd-b892-97b72d2fc20a.png";

const headerTitle = {
  fontSize: "28px",
  textAlign: "center" as const,
  margin: "20px 0",
  fontWeight: 400,
  color: colors.text,
};

const welcomeHeading = {
  fontSize: "24px",
  textAlign: "center" as const,
  margin: "12px 0",
  fontWeight: "normal" as const,
  color: colors.text,
};

const centeredP = {
  ...paragraphStyle,
  textAlign: "center" as const,
  margin: "10px 20px 16px",
};

const featureText = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: colors.text,
  margin: "0",
  textAlign: "left" as const,
};

const stepNumber = {
  display: "inline-block",
  verticalAlign: "top",
  textAlign: "center" as const,
  lineHeight: "32px",
  border: "1px solid #000",
  borderRadius: "50%",
  fontSize: "14px",
  fontWeight: "bold",
  width: "32px",
  height: "32px",
  marginRight: "10px",
};

const closing = {
  textAlign: "center" as const,
  fontSize: "15px",
  lineHeight: "1.6",
  color: colors.text,
  margin: "0 0 12px",
};

function calendlyConsultingUrl() {
  const d = new Date();
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `https://calendly.com/studiotostadium/s2s-dancer-consulting-coaching-call?preview_source=et_card&month=${month}`;
}

export function PremiumWelcomeEmail({ firstName }: PremiumWelcomeEmailProps) {
  return (
    <Layout preview="Welcome to Studio 2 Stadium — we're so excited you're here!">
      <Text style={headerTitle}>
        STUDIO <span style={{ fontWeight: 700 }}>2</span> STADIUM
      </Text>

      <Section
        className="email-hero-mobile"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "top",
          height: "250px",
        }}>
        <Row className="email-hero-row-mobile" style={{ paddingTop: "180px" }}>
          <Column
            className="email-premium-hero-logo-col-mobile"
            align="left"
            valign="bottom"
            style={{ padding: "10px" }}>
            <Img
              src={LOGO}
              alt="Studio 2 Stadium"
              width={80}
              style={{ display: "block" }}
            />
          </Column>
        </Row>
      </Section>

      <Text style={welcomeHeading}>
        Welcome to Studio <span style={{ fontWeight: "bold" }}>2</span> Stadium
        Premium -
      </Text>
      <Text style={{ ...welcomeHeading, marginTop: 0 }}>
        we&apos;re <span style={{ fontWeight: "bold" }}>so</span> excited
        you&apos;re here!
      </Text>

      <Text style={centeredP}>
        Hi {firstName}, whether you&apos;re a dancer or a parent supporting this
        journey, our goal is to make you feel seen, supported, and empowered
        every step of the way. You&apos;re now part of a growing community where
        dancers and college programs can finally connect—without all the
        confusion.
      </Text>
      <Text style={{ ...centeredP, fontWeight: "bold" }}>
        Here&apos;s how we&apos;ve got your back:
      </Text>

      <Section style={{ margin: "24px 0" }}>
        <Row style={{ marginBottom: "24px" }}>
          <Column style={{ width: "44px", verticalAlign: "top" }}>
            <Img
              src={ICON_CONSULTING}
              alt=""
              width={36}
              height={36}
              style={{ display: "block" }}
            />
          </Column>
          <Column style={{ verticalAlign: "top" }}>
            <Text
              style={{
                ...featureText,
                fontWeight: "bold",
                marginBottom: "4px",
              }}>
              Free 20-minute consulting call
            </Text>
            <Text style={featureText}>
              Get your biggest questions answered, understand the college dance
              landscape, and start narrowing down schools that feel like the
              right fit.
            </Text>
            <Link
              href={calendlyConsultingUrl()}
              style={{ ...linkStyle, fontWeight: "bold" }}>
              → Schedule Your Free Call
            </Link>
          </Column>
        </Row>
        <Row style={{ marginBottom: "24px" }}>
          <Column style={{ width: "44px", verticalAlign: "top" }}>
            <Img
              src={ICON_LIBRARY}
              alt=""
              width={36}
              height={36}
              style={{ display: "block" }}
            />
          </Column>
          <Column>
            <Text
              style={{
                ...featureText,
                fontWeight: "bold",
                marginBottom: "4px",
              }}>
              Members-only video training library
            </Text>
            <Text style={featureText}>
              Access training tools, audition tips, coach insights, and
              more—designed to help you grow and stay ready for every
              opportunity.
            </Text>
          </Column>
        </Row>
        <Row>
          <Column style={{ width: "44px", verticalAlign: "top" }}>
            <Img
              src={ICON_TAG}
              alt=""
              width={36}
              height={36}
              style={{ display: "block" }}
            />
          </Column>
          <Column>
            <Text
              style={{
                ...featureText,
                fontWeight: "bold",
                marginBottom: "4px",
              }}>
              Event tagging system
            </Text>
            <Text style={featureText}>
              Use our event tagging system to stay top-of-mind. When you attend
              clinics, combines, and camps—tag them. Visibility creates
              momentum.
            </Text>
          </Column>
        </Row>
      </Section>

      <Text
        style={{
          ...paragraphStyle,
          textAlign: "center" as const,
          fontSize: "22px",
          margin: "20px 0 8px",
        }}>
        <strong>Maximize</strong> Your Experience -
      </Text>
      <Text
        style={{
          ...paragraphStyle,
          textAlign: "center" as const,
          fontSize: "22px",
          margin: "0 0 16px",
        }}>
        Here&apos;s What to Do Next:
      </Text>

      <Section style={{ padding: "0 8px 20px" }}>
        <Row style={{ marginBottom: "16px" }}>
          <Column style={{ width: "42px", verticalAlign: "top" }}>
            <Text style={stepNumber}>1</Text>
          </Column>
          <Column style={{ verticalAlign: "top" }}>
            <Text
              style={{
                ...featureText,
                fontWeight: "bold",
                marginBottom: "4px",
              }}>
              Complete your profile.
            </Text>
            <Text style={featureText}>
              This is your first impression. Coaches use your profile to start
              building their list of dancers to watch—so the more complete and
              current it is, the better.
            </Text>
          </Column>
        </Row>
        <Row style={{ marginBottom: "16px" }}>
          <Column style={{ width: "42px", verticalAlign: "top" }}>
            <Text style={stepNumber}>2</Text>
          </Column>
          <Column>
            <Text
              style={{
                ...featureText,
                fontWeight: "bold",
                marginBottom: "4px",
              }}>
              Explore college programs.
            </Text>
            <Text style={featureText}>
              Each program on Studio 2 Stadium is different— we help you filter
              by what matters to you.
            </Text>
          </Column>
        </Row>
        <Row style={{ marginBottom: "16px" }}>
          <Column style={{ width: "42px", verticalAlign: "top" }}>
            <Text style={stepNumber}>3</Text>
          </Column>
          <Column>
            <Text
              style={{
                ...featureText,
                fontWeight: "bold",
                marginBottom: "4px",
              }}>
              Keep your profile active.
            </Text>
            <Text style={featureText}>
              Update your videos, tag new events, and refresh your info often.
              Active profiles rise higher in coach home feed.
            </Text>
          </Column>
        </Row>
        <Row>
          <Column style={{ width: "42px", verticalAlign: "top" }}>
            <Text style={stepNumber}>4</Text>
          </Column>
          <Column>
            <Text
              style={{
                ...featureText,
                fontWeight: "bold",
                marginBottom: "4px",
              }}>
              Notify programs when you submit your Common Recruiting Video.
            </Text>
            <Text style={featureText}>
              Once you&apos;ve submitted it, let those programs know through the
              platform. This allows coaches to update your status (in review,
              released, or accepted), so you have more clarity on where you
              stand in the process.
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={{ textAlign: "center" as const, padding: "0 8px 8px" }}>
        <Text style={closing}>
          This journey can feel overwhelming but you don&apos;t have to do it
          alone.
        </Text>
        <Text style={closing}>
          We built Studio <strong>2</strong> Stadium to make things simpler,
          more transparent, and more connected.
        </Text>
        <Text style={{ ...closing, fontWeight: "bold" }}>
          We&apos;re here to guide you through it.
        </Text>
        <Text style={closing}>With you all the way,</Text>
        <Text style={closing}>
          Abbey & The Studio <strong>2</strong> Stadium Team
        </Text>
      </Section>
    </Layout>
  );
}

export default PremiumWelcomeEmail;
