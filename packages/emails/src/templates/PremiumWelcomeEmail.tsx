import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors, paragraphStyle } from "../components/styles.js";

export interface PremiumWelcomeEmailProps {
  firstName: string;
}

const HEADER_BG = "https://images.studio2stadium.com/assets/PremiumWelcome_Background.png"
const HERO_BG =
  "https://d1wf5hycmlyms9.cloudfront.net/dcf07b79a52fb0c0964b14285be63a0143661a70d740dc08-c31b-4680-b7e4-264fc550dca2.jpg";
const LOGO =
  "https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png";

const headerTitle = {
  fontSize: "28px",
  textAlign: "center" as const,
  margin: "20px 0",
  fontWeight: 400,
  color: colors.text,
};

const welcomeHeading = {
  fontSize: "24px",
  textAlign: "left" as const,
  margin: "12px 0",
  fontWeight: "bold" as const,
  color: colors.text,
};

const subheading = {
  fontSize: "18px",
  textAlign: "left" as const,
  margin: "12px 0",
  fontWeight: "bold" as const,
  color: colors.text,
}

const leftP = {
  ...paragraphStyle,
  textAlign: "left" as const,
  mmargin: "10px 20px 16px"
}

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
      <Section
        className="email-hero-mobile"
        style={{
          backgroundImage: `url(${HEADER_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "top",
          height: "250px",
        }}>
        <Row className="email-hero-row-mobile" style={{ paddingTop: "180px" }}>
          <Text>
            Welcome to Premium
          </Text>
        </Row>
      </Section>

      <Text style={welcomeHeading}>
        You're In - Let's Get Started
      </Text>

      <Text style={leftP}>
        Hi {firstName},
      </Text>

      <Text style={leftP}>
        Welcome to Studio 2 Stadium Premium! We're thrilled to have you here and excited
        to support you on your journey from the studio to the stadium.
      </Text>
      <Text style={leftP}>
        You now have access to every tool and resource we've built to help dancers like
        you get discovered by college programs. Explore the platform, make the most of
        what's available, and don't hesitate to reach out if you need anything.
      </Text>

      <Section
        style={{
          border: '1px solid #fce303',
          padding: '20px',
          borderRadius: '10px',
          background: 'linear-gradient(90deg,rgba(255, 251, 219, 1) 0%, rgba(255, 248, 189, 1) 100%)',
          marginTop: '20px',
          marginBottom: '20px'
        }}
      >
        <Row>
          <Text style={{ fontWeight: 'bold', margin: '0', fontSize: '18px', color: colors.text }}>
            Your Premium Member Bonus
          </Text>
        </Row>
        <Row>
          <Text style={{ fontSize: '16px', color: colors.text }}>
            As a thank you for becoming a Premium member, you&apos;re receiving <strong>25% off your first consulting call.</strong>
          </Text>
        </Row>
        <Row>
          <Text style={{ fontSize: '16px', color: colors.text }}>
            Ready for personalized guidance? Book a one-on-one call with us. We&apos;ll help you navigate the college dance,
            identify the programs that are the right fit, and create a strategy that works for you.
          </Text>
        </Row>
        <Row>
          <Link href={calendlyConsultingUrl()}>
            <Text
              style={{
                background: 'black',
                padding: '15px 20px',
                textDecoration: 'none',
                color: 'white',
                width: 'fit-content',
                borderRadius: '10px',
                fontWeight: 'bold'
              }}
            >
              Book Your Call →
            </Text>
          </Link>
        </Row>
      </Section>

      <Text style={{ ...subheading, marginTop: '30px' }}>
        Three Things to do First
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
              Complete your profile
            </Text>
            <Text style={featureText}>
              This is your first impression with coaches. Make it count.
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
              Explore college programs
            </Text>
            <Text style={featureText}>
              Browse programs, filter by what matters to you, and start building your target list.
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
              Use everything available to you
            </Text>
            <Text style={featureText}>
              From video training to event tagging, take advantage of all your Premium resources.
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={{ textAlign: "center" as const, padding: "0 8px 8px" }}>
        <Text style={closing}>
          We're here to help you every step of the way. You&apos;ve got this.
        </Text>
        <Text style={closing}>Cheering for you,</Text>
        <Text style={closing}>
          Abbey & The Studio 2 Stadium Team
        </Text>
      </Section>
    </Layout>
  );
}

export default PremiumWelcomeEmail;
