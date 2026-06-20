import {
  Column,
  Img,
  Link,
  Row,
  Section,
  Text,
  Button as ReactEmailButton,
} from "@react-email/components";
import { OrgEmailLayout } from "../components/OrgEmailLayout.js";
import { colors, paragraphStyle, fontFamily } from "../components/styles.js";

export interface SchoolAccountInviteEmailProps {
  firstName: string;
  orgName: string;
  eventName?: string | null;
  eventDateLabel?: string | null;
  venueName?: string | null;
  registerUrl: string;
  brandColor?: string | null;
  logoUrl?: string | null;
}

const S2S_LOGO =
  "https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png";

export function SchoolAccountInviteEmail({
  firstName,
  orgName,
  eventName,
  eventDateLabel,
  venueName,
  registerUrl,
  brandColor,
  logoUrl,
}: SchoolAccountInviteEmailProps) {
  const accent = brandColor || colors.primary;
  const previewText = eventName
    ? `Create your Studio2Stadium account to join ${eventName}`
    : `Create your Studio2Stadium account to join ${orgName}`;

  return (
    <OrgEmailLayout preview={previewText}>
      {/* ── Dark header ── */}
      <Section
        style={{
          backgroundColor: "#111111",
          padding: "24px 32px",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Row>
          <Column style={{ width: "20%" }} />
          <Column style={{ width: "60%", textAlign: "center" as const }}>
            {logoUrl && (
              <Img
                src={logoUrl}
                alt={orgName}
                width={120}
                height="auto"
                style={{ margin: "0 auto 12px" }}
              />
            )}
            <Text
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#ffffff",
                textAlign: "center" as const,
                margin: "0 0 4px",
                fontFamily,
              }}
            >
              {orgName}
            </Text>
          </Column>
          <Column
            className="org-email-header-logo-col"
            style={{
              width: "20%",
              textAlign: "right" as const,
              verticalAlign: "top",
            }}
          >
            <Img src={S2S_LOGO} alt="Studio 2 Stadium" width={48} height="auto" />
          </Column>
        </Row>
        <Text
          style={{
            fontSize: "11px",
            color: "#999999",
            textAlign: "center" as const,
            margin: "8px 0 0",
            letterSpacing: "0.05em",
          }}
        >
          Featuring Technology From Studio 2 Stadium
        </Text>
      </Section>

      {/* ── White body ── */}
      <Section
        style={{
          backgroundColor: "#ffffff",
          padding: "32px",
          borderLeft: `1px solid ${colors.border}`,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <Text style={paragraphStyle}>Hi {firstName},</Text>
        <Text style={paragraphStyle}>
          {orgName} has added you as a coach
          {eventName ? ` for ${eventName}` : ""}. Create your Studio2Stadium
          school account to get instant access to your event roster and start
          connecting with your dancers.
        </Text>

        {/* Event details (if available) */}
        {(eventDateLabel || venueName) && (
          <Section
            style={{
              backgroundColor: colors.backgroundMuted,
              borderLeft: `3px solid ${accent}`,
              borderRadius: "4px",
              padding: "12px 16px",
              margin: "0 0 24px",
            }}
          >
            {eventName && (
              <Text
                style={{
                  ...paragraphStyle,
                  fontWeight: "600" as const,
                  margin: "0 0 4px",
                }}
              >
                {eventName}
              </Text>
            )}
            {eventDateLabel && (
              <Text style={{ ...paragraphStyle, margin: "0 0 4px", fontSize: "14px" }}>
                {eventDateLabel}
              </Text>
            )}
            {venueName && (
              <Text
                style={{
                  ...paragraphStyle,
                  margin: "0",
                  fontSize: "14px",
                  color: colors.textMuted,
                }}
              >
                {venueName}
              </Text>
            )}
          </Section>
        )}

        {/* ── Create account section ── */}
        <Section
          style={{
            borderLeft: `4px solid ${accent}`,
            padding: "16px 20px",
            margin: "0 0 24px",
          }}
        >
          <Text
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: colors.text,
              margin: "0 0 8px",
            }}
          >
            Get started:
          </Text>
          <Text style={{ ...paragraphStyle, margin: "0 0 16px" }}>
            Create your school account to access the{" "}
            {eventName ?? orgName} platform and start reviewing your roster:
          </Text>
          <ReactEmailButton
            href={registerUrl}
            style={{
              display: "inline-block",
              backgroundColor: accent,
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              padding: "10px 24px",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            Create Account
          </ReactEmailButton>
          <Text
            style={{
              fontSize: "12px",
              color: colors.textMuted,
              margin: "12px 0 0",
              wordBreak: "break-all" as const,
            }}
          >
            Or copy and paste this link:{" "}
            <Link href={registerUrl} style={{ color: colors.primary }}>
              {registerUrl}
            </Link>
          </Text>
        </Section>

        {/* ── Closing ── */}
        <Text style={paragraphStyle}>
          We&apos;re excited for you to take advantage of everything the
          platform offers
          {eventName ? ` and make the most of your time at ${eventName}` : ""}.
        </Text>
        <Text
          style={{
            ...paragraphStyle,
            borderTop: `1px solid ${colors.border}`,
            paddingTop: "20px",
            marginTop: "16px",
          }}
        >
          — The Studio 2 Stadium and {orgName} Teams
        </Text>
      </Section>

      {/* ── Dark footer ── */}
      <Section
        style={{
          backgroundColor: "#111111",
          padding: "20px 32px",
          borderRadius: "0 0 8px 8px",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontSize: "12px",
            color: "#999999",
            margin: "0 0 4px",
            textAlign: "center" as const,
          }}
        >
          &copy; {new Date().getFullYear()} Studio 2 Stadium &amp; {orgName}
        </Text>
        <Text
          style={{
            fontSize: "11px",
            color: "#666666",
            margin: "0",
            textAlign: "center" as const,
          }}
        >
          This email was sent to you as an invited coach of {orgName}.
        </Text>
      </Section>
    </OrgEmailLayout>
  );
}

export default SchoolAccountInviteEmail;
