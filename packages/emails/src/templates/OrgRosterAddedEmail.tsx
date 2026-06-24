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

export interface OrgRosterAddedEmailProps {
  firstName: string;
  orgName: string;
  eventName?: string | null;
  eventDateLabel?: string | null;
  venueName?: string | null;
  type: "dancer" | "coach";
  dashboardUrl: string;
  brandColor?: string | null;
  welcomeVideoUrl?: string | null;
  logoUrl?: string | null;
}

const S2S_LOGO =
  "https://app.studio2stadium.com/logos/s2s-wordmark-white.png";

export function OrgRosterAddedEmail({
  firstName,
  orgName,
  eventName,
  eventDateLabel,
  venueName,
  type,
  dashboardUrl,
  brandColor,
  welcomeVideoUrl,
  logoUrl,
}: OrgRosterAddedEmailProps) {
  const accent = brandColor || colors.primary;
  const previewText = eventName
    ? `You've been added to ${eventName} with ${orgName}`
    : `You've been added to ${orgName}`;

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
          <Column style={{ textAlign: "center" as const }}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                alt={orgName}
                width={120}
                height="auto"
                style={{ margin: "0 auto 12px" }}
              />
            ) : (
              <Text
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#ffffff",
                  textAlign: "center" as const,
                  margin: "0 0 12px",
                  fontFamily,
                }}
              >
                {orgName}
              </Text>
            )}
            <Img
              src={S2S_LOGO}
              alt="Studio 2 Stadium"
              width={140}
              height="auto"
              style={{ margin: "0 auto" }}
            />
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
          {eventName ? (
            <>
              <strong style={{ fontStyle: "italic" }}>{eventName}</strong> is
              almost here and we&apos;re excited to have you involved!
            </>
          ) : (
            <>
              <strong>{orgName}</strong> has added you to the roster and
              we&apos;re excited to have you!
            </>
          )}
        </Text>
        <Text style={paragraphStyle}>
          {type === "dancer" ? (
            <>
              The <strong>{orgName}</strong> platform gives you one place to
              explore opportunities, connect with coaches, and stay organized
              {eventName ? " throughout the event" : ""}.
            </>
          ) : (
            <>
              The <strong>{orgName}</strong> platform gives you one place to
              explore dancer profiles, identify top prospects, and stay
              organized{eventName ? " throughout the event" : ""}.
            </>
          )}
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
                  fontWeight: "700" as const,
                  fontStyle: "italic" as const,
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

        {/* ── Already have an account section ── */}
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
            If you already have an S2S account:
          </Text>
          <Text style={{ ...paragraphStyle, margin: "0 0 4px" }}>
            Your profile has been automatically updated. You can now access both
            S2S and the <strong>{orgName}</strong> platform directly from your
            dashboard. No extra steps needed.
          </Text>
        </Section>

        {/* Dashboard CTA */}
        <Section style={{ margin: "0 0 24px" }}>
          <ReactEmailButton
            href={dashboardUrl}
            style={{
              display: "inline-block",
              backgroundColor: colors.primary,
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              padding: "10px 24px",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            Go to Dashboard
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
            <Link href={dashboardUrl} style={{ color: colors.primary }}>
              {dashboardUrl}
            </Link>
          </Text>
        </Section>

        {/* ── Welcome video card ── */}
        {welcomeVideoUrl && (
          <Section
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: "8px",
              padding: "24px",
              margin: "0 0 24px",
            }}
          >
            <Text
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#ffffff",
                margin: "0 0 8px",
              }}
            >
              Get Started Guide
            </Text>
            <Text
              style={{
                fontSize: "14px",
                lineHeight: "1.5",
                color: "#cccccc",
                margin: "0 0 16px",
              }}
            >
              We&apos;ve put together a quick walkthrough of the sign-up process
              and how to navigate the platform:
            </Text>
            <ReactEmailButton
              href={welcomeVideoUrl}
              style={{
                display: "inline-block",
                backgroundColor: colors.primary,
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                padding: "10px 24px",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              Watch Tutorial Video
            </ReactEmailButton>
          </Section>
        )}

        {/* ── Closing ── */}
        <Text style={paragraphStyle}>
          We&apos;re excited for you to take advantage of everything the
          platform offers
          {eventName ? (
            <>
              {" "}
              and make the most of your time at{" "}
              <strong style={{ fontStyle: "italic" }}>{eventName}</strong>
            </>
          ) : null}
          .
        </Text>
        <Text
          style={{
            ...paragraphStyle,
            borderTop: `1px solid ${colors.border}`,
            paddingTop: "20px",
            marginTop: "16px",
          }}
        >
          — The Studio 2 Stadium and <strong>{orgName}</strong> Teams
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
          &copy; {new Date().getFullYear()} Studio 2 Stadium &amp;{" "}
          <strong>{orgName}</strong>
        </Text>
        <Text
          style={{
            fontSize: "11px",
            color: "#666666",
            margin: "0",
            textAlign: "center" as const,
          }}
        >
          This email was sent to you as a registered participant of{" "}
          <strong>{orgName}</strong>.
        </Text>
      </Section>
    </OrgEmailLayout>
  );
}

export default OrgRosterAddedEmail;
