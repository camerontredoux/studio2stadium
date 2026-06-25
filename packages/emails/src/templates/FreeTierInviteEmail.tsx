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

export interface FreeTierInviteEmailProps {
  firstName: string;
  orgName: string;
  eventName?: string | null;
  inviteUrl: string;
  upgradeUrl: string;
  contactEmail?: string | null;
  tierExpiryMonths?: number;
  brandColor?: string | null;
  logoUrl?: string | null;
}

const S2S_LOGO =
  "https://userdata.studio2stadium.com/logos/s2s-wordmark-white.png";

export function FreeTierInviteEmail({
  orgName,
  inviteUrl,
  upgradeUrl,
  contactEmail,
  tierExpiryMonths = 3,
  logoUrl,
}: FreeTierInviteEmailProps) {
  const btnColor = "#2563eb";
  const previewText = `You're officially in The Vault — complete your free profile`;

  const checkItems = [
    "Dance videos",
    "Awards & accomplishments",
    "Training background",
    "References",
    "Academics",
    "Digital dance resume",
  ];

  const coachBenefitsLeft = [
    "Review your information",
    "Revisit your profile",
  ];
  const coachBenefitsRight = [
    "Compare recruits",
    "Continue evaluating dancers",
  ];

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
                width={160}
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
              width={200}
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
        <Text
          style={{
            fontSize: "26px",
            fontWeight: "800",
            color: colors.text,
            margin: "0 0 8px",
            lineHeight: "1.2",
          }}
        >
          You&apos;re officially in The Vault.
        </Text>
        <Text style={{ ...paragraphStyle, margin: "0 0 20px" }}>
          Right now, coaches can only see your basic registration information.
        </Text>
        <Text
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: colors.text,
            margin: "0 0 8px",
          }}
        >
          Want to stand out?
        </Text>
        <Text style={{ ...paragraphStyle, margin: "0 0 24px" }}>
          Unlock your full Vault profile to give college coaches a complete
          picture of who you are as a dancer.
        </Text>

        {/* ── Complete Your Free Profile card ── */}
        <Section
          style={{
            borderLeft: `4px solid ${btnColor}`,
            borderRadius: "8px",
            padding: "20px 24px",
            margin: "0 0 24px",
            backgroundColor: colors.backgroundMuted,
          }}
        >
          <Text
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: colors.text,
              margin: "0 0 8px",
            }}
          >
            Complete Your Free Profile
          </Text>
          <Text
            style={{
              ...paragraphStyle,
              margin: "0 0 12px",
              fontSize: "15px",
            }}
          >
            Add:
          </Text>
          {checkItems.map((item) => (
            <Row key={item} style={{ margin: "0 0 6px" }}>
              <Column style={{ width: "24px", verticalAlign: "top" }}>
                <Text
                  style={{
                    fontSize: "15px",
                    color: btnColor,
                    margin: "0",
                    lineHeight: "1.6",
                  }}
                >
                  &#x2713;
                </Text>
              </Column>
              <Column>
                <Text
                  style={{
                    fontSize: "15px",
                    color: colors.text,
                    margin: "0",
                    lineHeight: "1.6",
                  }}
                >
                  {item}
                </Text>
              </Column>
            </Row>
          ))}
          <ReactEmailButton
            href={inviteUrl}
            style={{
              display: "inline-block",
              backgroundColor: btnColor,
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              padding: "12px 28px",
              borderRadius: "6px",
              textDecoration: "none",
              marginTop: "16px",
            }}
          >
            Complete My Free Profile
          </ReactEmailButton>
        </Section>

        {/* ── Recruiting Doesn't End card ── */}
        <Section
          style={{
            borderLeft: `4px solid ${btnColor}`,
            borderRadius: "8px",
            padding: "20px 24px",
            margin: "0 0 24px",
            backgroundColor: colors.backgroundMuted,
          }}
        >
          <Text
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: colors.text,
              margin: "0 0 8px",
            }}
          >
            Recruiting Doesn&apos;t End When the Event Does
          </Text>
          <Text
            style={{
              ...paragraphStyle,
              margin: "0 0 12px",
              fontSize: "15px",
            }}
          >
            The event may only last a weekend, but recruiting doesn&apos;t end
            when the event does.
          </Text>
          <Text
            style={{
              ...paragraphStyle,
              margin: "0 0 16px",
              fontSize: "15px",
            }}
          >
            Your Vault profile remains active for{" "}
            <strong>{tierExpiryMonths} months</strong>, giving college coaches
            additional time to:
          </Text>

          {/* 2-column benefits list */}
          <Row style={{ margin: "0 0 16px" }}>
            <Column style={{ width: "50%", verticalAlign: "top" }}>
              {coachBenefitsLeft.map((item) => (
                <Row key={item} style={{ margin: "0 0 6px" }}>
                  <Column style={{ width: "24px", verticalAlign: "top" }}>
                    <Text
                      style={{
                        fontSize: "14px",
                        color: btnColor,
                        margin: "0",
                        lineHeight: "1.5",
                      }}
                    >
                      &#x2713;
                    </Text>
                  </Column>
                  <Column>
                    <Text
                      style={{
                        fontSize: "14px",
                        color: colors.text,
                        margin: "0",
                        lineHeight: "1.5",
                      }}
                    >
                      {item}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Column>
            <Column style={{ width: "50%", verticalAlign: "top" }}>
              {coachBenefitsRight.map((item) => (
                <Row key={item} style={{ margin: "0 0 6px" }}>
                  <Column style={{ width: "24px", verticalAlign: "top" }}>
                    <Text
                      style={{
                        fontSize: "14px",
                        color: btnColor,
                        margin: "0",
                        lineHeight: "1.5",
                      }}
                    >
                      &#x2713;
                    </Text>
                  </Column>
                  <Column>
                    <Text
                      style={{
                        fontSize: "14px",
                        color: colors.text,
                        margin: "0",
                        lineHeight: "1.5",
                      }}
                    >
                      {item}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Column>
          </Row>

          <Text
            style={{
              ...paragraphStyle,
              margin: "0 0 16px",
              fontSize: "15px",
            }}
          >
            Make sure they&apos;re seeing more than just your registration
            information.
          </Text>
          <ReactEmailButton
            href={upgradeUrl}
            style={{
              display: "inline-block",
              backgroundColor: btnColor,
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "600",
              padding: "12px 28px",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            Unlock My Full Vault Profile
          </ReactEmailButton>
        </Section>

        {/* ── Questions section ── */}
        {contactEmail && (
          <Section style={{ margin: "0 0 24px" }}>
            <Row>
              <Column style={{ width: "40px", verticalAlign: "top" }}>
                <Text
                  style={{
                    fontSize: "24px",
                    margin: "0",
                    lineHeight: "1",
                  }}
                >
                  &#x2709;
                </Text>
              </Column>
              <Column>
                <Text
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: colors.text,
                    margin: "0 0 2px",
                  }}
                >
                  Questions?
                </Text>
                <Text style={{ ...paragraphStyle, margin: "0" }}>
                  Email{" "}
                  <Link
                    href={`mailto:${contactEmail}`}
                    style={{ color: btnColor }}
                  >
                    {contactEmail}
                  </Link>
                </Text>
              </Column>
            </Row>
          </Section>
        )}

        {/* ── Closing ── */}
        <Text style={{ ...paragraphStyle, margin: "0 0 0" }}>
          We&apos;re excited to help you maximize your recruiting opportunities
          and get the most out of your Vault experience.
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

export default FreeTierInviteEmail;
