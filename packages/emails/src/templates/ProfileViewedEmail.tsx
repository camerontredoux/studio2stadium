import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors } from "../components/styles.js";

/** Pre-blurred generic badge shown to free users so no real logo is ever
 *  revealed (CSS blur is unreliable across email clients). Upload the file at
 *  packages/emails/assets/blurred-school-logo.png to this path. */
const BLURRED_LOGO_URL = "https://studio2stadium.com/img/blurred-school-logo.png";

export interface ProfileViewedEmailProps {
  dancerName: string;
  schoolName: string;
  schoolProfileUrl: string;
  /** School logo/avatar to feature (blurred for freemium, clear for Premium) */
  schoolLogoUrl?: string;
  /** When true, show upgrade-focused copy for free (non-Premium) users */
  freemium?: boolean;
  /** CTA target when `freemium` is true (e.g. membership settings) */
  upgradeUrl?: string;
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

const logoTile = {
  width: "128px",
  height: "128px",
  borderRadius: "50%",
  backgroundColor: "#F8F6F0",
  border: `1px solid ${colors.border}`,
  textAlign: "center" as const,
  verticalAlign: "middle" as const,
  overflow: "hidden" as const,
};

const logoImg = {
  display: "inline-block",
  verticalAlign: "middle" as const,
  objectFit: "cover" as const,
  borderRadius: "50%",
};

const mysteryMark = {
  fontSize: "56px",
  fontWeight: 800,
  lineHeight: "128px",
  color: colors.primary,
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

function SchoolLogo({
  schoolLogoUrl,
  freemium,
}: {
  schoolLogoUrl?: string;
  freemium: boolean;
}) {
  // Free users never see the real logo — always the pre-blurred generic badge.
  // Premium users see the actual logo (or a "?" placeholder if none exists).
  const src = freemium ? BLURRED_LOGO_URL : schoolLogoUrl;

  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      align="center"
      style={{ margin: "0 auto" }}>
      <tbody>
        <tr>
          <td style={logoTile}>
            {src ? (
              <Img
                src={src}
                alt={freemium ? "" : "School logo"}
                width={128}
                height={128}
                style={logoImg}
              />
            ) : (
              <Text style={mysteryMark}>?</Text>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function ProfileViewedEmail({
  dancerName,
  schoolName,
  schoolProfileUrl,
  schoolLogoUrl,
  freemium = false,
  upgradeUrl,
}: ProfileViewedEmailProps) {
  const label = freemium ? "SOMEONE'S INTERESTED" : "YOU'VE BEEN NOTICED";

  return (
    <Layout
      preview={
        freemium
          ? "A school viewed your profile — upgrade to Premium to see which one"
          : `${schoolName} viewed your profile!`
      }>
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
            <Text style={sectionLabel}>{label}</Text>
          </Column>
          <Column style={{ width: "22%", verticalAlign: "middle" }}>
            <div style={sectionRule} />
          </Column>
        </Row>
      </Section>

      <Section>
        <SchoolLogo schoolLogoUrl={schoolLogoUrl} freemium={freemium} />
      </Section>

      {freemium ? (
        <>
          <Text style={headline}>
            A school just viewed{" "}
            <span style={headlineAccent}>your profile.</span>
          </Text>
          <div style={heroDivider} />
          <Text style={bodyText}>
            Hi {dancerName}, a program on Studio 2 Stadium is checking you out.
            Upgrade to Premium to reveal who viewed your profile and connect
            with their program.
          </Text>
          <Section style={{ textAlign: "center" as const }}>
            {upgradeUrl ? (
              <Link href={upgradeUrl} style={goldButton}>
                UPGRADE TO PREMIUM
              </Link>
            ) : null}
          </Section>
          <Section style={band}>
            <Text style={bandBody}>
              Every view is a signal that your hard work is getting seen.{" "}
              <br />
              <span style={bandGold}>Keep standing in your spotlight.</span>
            </Text>
          </Section>
        </>
      ) : (
        <>
          <Text style={headline}>
            <span style={headlineAccent}>{schoolName}</span> viewed your
            profile.
          </Text>
          <div style={heroDivider} />
          <Text style={bodyText}>
            Great news, {dancerName}! {schoolName} just checked out your profile
            on Studio 2 Stadium. Explore their program and follow them to keep
            track of your recruiting activity.
          </Text>
          <Section style={{ textAlign: "center" as const }}>
            <Link href={schoolProfileUrl} style={goldButton}>
              VIEW THEIR PROGRAM
            </Link>
          </Section>
          <Section style={band}>
            <Text style={bandBody}>
              Keep your profile fresh with new videos and updates.{" "}
              <span style={bandGold}>
                The more you share, the more you get seen.
              </span>
            </Text>
          </Section>
        </>
      )}
    </Layout>
  );
}

export default ProfileViewedEmail;
