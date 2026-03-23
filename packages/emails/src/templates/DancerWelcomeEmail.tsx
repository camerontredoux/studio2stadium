import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors, paragraphStyle } from "../components/styles.js";

export interface DancerWelcomeEmailProps {
  firstName: string;
  profileUrl: string;
}

const HERO_BG =
  "https://d1wf5hycmlyms9.cloudfront.net/f8eb0074f3bc11f6b9ec7056e4dafdf444e01584dabb9745-705f-47f9-a05d-5c182ece1f0b.png";
const LOGO =
  "https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png";
const ICON_UPLOAD =
  "https://d1wf5hycmlyms9.cloudfront.net/uploadec19450d-c273-4948-a6bc-f20f26af9b57.png";
const ICON_ACCESS =
  "https://d1wf5hycmlyms9.cloudfront.net/e68a6ab6c4903b7ddaa7fa1e318e9fd3307b0adfbfc6dcb0-6f0d-4419-a27e-ba6b4d097bad.png";
const ICON_DISCOVER =
  "https://d1wf5hycmlyms9.cloudfront.net/f428bb6d06bceee73dd0a8798458720611eb543f6485b641-ccf2-490b-b79c-586be08472d4.png";

const SIGNUP_URL = "https://app.studio2stadium.com/checkout";

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

const featureCol = {
  width: "33%",
  textAlign: "center" as const,
  verticalAlign: "top" as const,
  fontSize: "14px",
  color: colors.text,
  lineHeight: "1.5",
};

const upgradeHeading = {
  fontSize: "18px",
  textAlign: "center" as const,
  margin: "0 0 12px",
  color: "#000",
};

const upgradeListItem = {
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "0 0 8px",
  color: colors.text,
};

export function DancerWelcomeEmail({
  firstName,
  profileUrl,
}: DancerWelcomeEmailProps) {
  return (
    <Layout preview="Welcome to Studio 2 Stadium - we're so excited you're here!">
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
        <Row className="email-hero-row-mobile" style={{ paddingTop: "140px" }}>
          <Column
            className="email-dancer-hero-cta-col-mobile"
            align="left"
            valign="bottom"
            style={{ padding: "10px" }}>
            <Link
              className="email-hero-cta-mobile"
              href={SIGNUP_URL}
              style={{
                backgroundColor: "#fff",
                color: "#000",
                padding: "10px 20px",
                borderRadius: "6px",
                fontWeight: "bold",
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-block",
              }}>
              Unlock access. Be seen first.
            </Link>
          </Column>
          <Column
            className="email-dancer-hero-logo-mobile"
            align="right"
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
        -
      </Text>
      <Text style={{ ...welcomeHeading, marginTop: 0 }}>
        we&apos;re <span style={{ fontWeight: "bold" }}>so</span> excited
        you&apos;re here!
      </Text>

      <Text style={centeredP}>
        Hi {firstName}, by creating your free profile, you&apos;ve taken your
        first step toward getting noticed by college coaches. You now have a
        space to tell your story, track your progress, and explore what&apos;s
        possible.
      </Text>
      <Text style={{ ...centeredP, fontWeight: "bold" }}>
        Here&apos;s what you can do right now:
      </Text>

      <Section style={{ margin: "24px 0" }}>
        <Row>
          <Column style={featureCol}>
            <Img
              src={ICON_UPLOAD}
              alt=""
              width={36}
              height={36}
              style={{ display: "block", margin: "0 auto 8px" }}
            />
            <Text
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.5",
                color: colors.text,
              }}>
              Build your digital resume
            </Text>
          </Column>
          <Column style={featureCol}>
            <Img
              src={ICON_ACCESS}
              alt=""
              width={36}
              height={36}
              style={{ display: "block", margin: "0 auto 8px" }}
            />
            <Text
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.5",
                color: colors.text,
              }}>
              Access blogs
            </Text>
          </Column>
          <Column style={featureCol}>
            <Img
              src={ICON_DISCOVER}
              alt=""
              width={36}
              height={36}
              style={{ display: "block", margin: "0 auto 8px" }}
            />
            <Text
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.5",
                color: colors.text,
              }}>
              Get discovered by schools
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={{ margin: "24px 4px" }}>
        <Text style={{ ...welcomeHeading, marginBottom: "8px" }}>
          Want to go further, <span style={{ fontWeight: "bold" }}>faster</span>
          ?
        </Text>
        <Text style={upgradeHeading}>Upgrade to Premium ($20/month) to:</Text>
        <Text style={upgradeListItem}>✓ Upload unlimited videos</Text>
        <Text style={upgradeListItem}>
          ✓ See which schools are viewing your profile
        </Text>
        <Text style={upgradeListItem}>
          ✓ Stay organized with calendar tools
        </Text>
        <Text style={upgradeListItem}>
          ✓ Access our exclusive training library
        </Text>
        <Text style={upgradeListItem}>✓ Track communication with programs</Text>
        <Text style={upgradeListItem}>✓ Show up on coaches home page</Text>
        <Text style={{ ...upgradeListItem, fontWeight: "bold" }}>
          ✓ NEW! Prospect Status System:
        </Text>
        <Text style={{ ...upgradeListItem, fontWeight: "bold" }}>
          When you submit your Common Recruiting Video, let programs know.
        </Text>
        <Text style={{ ...upgradeListItem, fontWeight: "bold" }}>
          Coaches can update your status—so you&apos;ll know if your video is in
          review, released, or accepted.
        </Text>
        <Section style={{ textAlign: "center" as const, marginTop: "16px" }}>
          <Link
            href={SIGNUP_URL}
            style={{
              display: "inline-block",
              backgroundColor: colors.primary,
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: "bold",
              borderRadius: "6px",
              padding: "10px 70px",
              fontSize: "16px",
            }}>
            Upgrade to Premium
          </Link>
        </Section>
      </Section>

      <Section style={{ textAlign: "center" as const, padding: "12px 8px 0" }}>
        <Text style={{ ...paragraphStyle, textAlign: "center" }}>
          The more active you are, the more doors you&apos;ll open.
        </Text>
        <Text
          style={{
            ...paragraphStyle,
            textAlign: "center",
            fontWeight: "bold",
          }}>
          We&apos;re here to support you every step of the way.
        </Text>
        <Text
          style={{ ...paragraphStyle, textAlign: "center", marginBottom: 0 }}>
          Abbey & The Studio <strong>2</strong> Stadium Team
        </Text>
      </Section>
    </Layout>
  );
}

export default DancerWelcomeEmail;
