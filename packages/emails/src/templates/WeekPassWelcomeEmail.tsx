import { Column, Img, Row, Section, Text } from "@react-email/components";
import {
  WEEK_PASS_ASSET_BASE_URL,
  weekPassAssetUrl,
  type WeekPassAssetName,
  type WeekPassAssetUrls,
  WeekPassBody,
  WeekPassButton,
  WeekPassFooter,
  WeekPassHero,
  WeekPassLayout,
  bodyFont,
  bodyTextStyle,
  displayFont,
  h2Style,
  weekPassColors,
} from "../components/WeekPassLayout.js";

/**
 * "current": the approved design, for a pass that starts at purchase.
 * "queued": a pass bought while access is still running, so it starts later.
 * The queued wording is a PROPOSAL awaiting review; the approved design only
 * covers a pass that starts now.
 */
export type WeekPassWelcomeVariant = "current" | "queued";

export interface WeekPassWelcomeEmailProps {
  variant: WeekPassWelcomeVariant;
  /** Blank or missing falls back to "there". */
  firstName?: string | null;
  /** When this pass starts, already formatted with an explicit time zone. */
  startsAt: string;
  /** When the Dancer's continuous access ends, formatted with a time zone. */
  accessEndsAt: string;
  profileUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
  postalAddress: string;
  assetBaseUrl?: string;
  /** Explicit image URLs, overriding `assetBaseUrl` for those images. */
  assets?: WeekPassAssetUrls;
}

/** Proposed preview (inbox snippet) text for each variant. */
export function weekPassWelcomePreview(
  variant: WeekPassWelcomeVariant,
  startsAt: string,
) {
  return variant === "current"
    ? "Seven days to explore your options and take your next step."
    : `Your next seven days start ${startsAt}.`;
}

const COPY = {
  current: {
    title: ["Your week", "starts now."],
    subtitle: "Seven days to explore your options and take your next step.",
  },
  queued: {
    title: ["Your next week", "is lined up."],
    subtitle:
      "Seven more days to explore your options, starting when your current access ends.",
  },
} as const;

const STEPS = [
  {
    number: "01",
    title: "Build your profile.",
    body: "Add a clear photo, your training background, and videos that show your current dancing. Give verified college coaches a useful picture of who you are.",
  },
  {
    number: "02",
    title: "Find programs worth a closer look.",
    body: "Explore teams and use your five follows to keep track of programs that interest you. Look beyond familiar names. You might discover a team you hadn’t considered.",
  },
  {
    number: "03",
    title: "Plan your next opportunity.",
    body: "Check the Event Calendar for upcoming clinics and events. Choose opportunities that help you learn more about the programs on your list.",
  },
];

function greetingName(firstName?: string | null) {
  const trimmed = firstName?.trim();
  return trimmed ? trimmed : "there";
}

function DateBox({
  variant,
  startsAt,
  accessEndsAt,
  iconUrl,
}: {
  variant: WeekPassWelcomeVariant;
  startsAt: string;
  accessEndsAt: string;
  iconUrl: string;
}) {
  const line = {
    margin: 0,
    fontFamily: displayFont,
    fontSize: "19px",
    lineHeight: "26px",
    fontWeight: 600,
    color: weekPassColors.ink,
  };
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{
        border: `2px solid ${weekPassColors.tan}`,
        margin: "0 0 28px",
      }}
    >
      <tbody>
        <tr>
          <td
            width="64"
            align="center"
            valign="middle"
            style={{
              width: "64px",
              padding: "14px 0 14px 12px",
            }}
          >
            <Img
              src={iconUrl}
              alt=""
              width="36"
              height="30"
              style={{ display: "block", border: 0 }}
            />
          </td>
          <td
            width="1"
            style={{
              width: "1px",
              padding: "10px 0",
            }}
          >
            <div
              style={{
                width: "1px",
                height: "40px",
                backgroundColor: weekPassColors.rule,
              }}
            />
          </td>
          <td
            className="wp-date-box"
            valign="middle"
            style={{ padding: "14px 16px" }}
          >
            {variant === "queued" ? (
              <Text style={{ ...line, marginBottom: "4px" }}>
                Your pass starts: <strong>{startsAt}</strong>
              </Text>
            ) : null}
            <Text style={line}>
              Your access ends: <strong>{accessEndsAt}</strong>
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Step({
  number,
  title,
  body,
  last,
}: {
  number: string;
  title: string;
  body: string;
  last: boolean;
}) {
  return (
    <Row
      style={{
        borderBottom: last ? "none" : `1px solid ${weekPassColors.rule}`,
      }}
    >
      <Column
        className="wp-num-col"
        valign="top"
        style={{ width: "112px", padding: "18px 0" }}
      >
        <Text
          className="wp-num"
          style={{
            margin: 0,
            fontFamily: displayFont,
            fontSize: "76px",
            lineHeight: "76px",
            fontWeight: 800,
            letterSpacing: "-3px",
            color: weekPassColors.tanDeep,
          }}
        >
          {number}
        </Text>
      </Column>
      <Column valign="top" style={{ padding: "18px 0 18px 8px" }}>
        <Text
          className="wp-step-title"
          role="heading"
          aria-level={3}
          style={{
            margin: "0 0 6px",
            fontFamily: displayFont,
            fontSize: "22px",
            lineHeight: "28px",
            fontWeight: 800,
            color: weekPassColors.ink,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            margin: 0,
            fontFamily: bodyFont,
            fontSize: "16px",
            lineHeight: "23px",
            color: weekPassColors.text,
          }}
        >
          {body}
        </Text>
      </Column>
    </Row>
  );
}

export function WeekPassWelcomeEmail({
  variant,
  firstName,
  startsAt,
  accessEndsAt,
  profileUrl,
  preferencesUrl,
  unsubscribeUrl,
  postalAddress,
  assetBaseUrl = WEEK_PASS_ASSET_BASE_URL,
  assets,
}: WeekPassWelcomeEmailProps) {
  const asset = (name: WeekPassAssetName) =>
    weekPassAssetUrl(name, assetBaseUrl, assets);
  const copy = COPY[variant];
  const intro =
    variant === "current"
      ? "Welcome to your S2S Week Pass! You’ve got seven days to explore college dance programs, build your recruiting profile, and get more intentional about your next steps."
      : `Welcome to your S2S Week Pass! Your new seven days begin ${startsAt}, right when your current access ends, so there’s no gap. Use them to explore college dance programs, build your recruiting profile, and get more intentional about your next steps.`;

  return (
    <WeekPassLayout preview={weekPassWelcomePreview(variant, startsAt)}>
      <WeekPassHero
        eyebrow="Welcome to your Week Pass"
        title={[...copy.title]}
        subtitle={copy.subtitle}
        backgroundUrl={asset("hero-welcome.jpg")}
        logoUrl={asset("logo-wordmark-white.png")}
      />
      <WeekPassBody>
        <DateBox
          variant={variant}
          startsAt={startsAt}
          accessEndsAt={accessEndsAt}
          iconUrl={asset("icon-calendar.png")}
        />
        <Text
          role="heading"
          aria-level={2}
          className="wp-h2"
          style={{ ...h2Style, fontSize: "34px", margin: "0 0 10px" }}
        >
          Hi {greetingName(firstName)},
        </Text>
        <Text style={bodyTextStyle}>{intro}</Text>
        <Text
          role="heading"
          aria-level={2}
          className="wp-h2"
          style={{ ...h2Style, margin: "8px 0 0" }}
        >
          Let{"’"}s put this week to work.
        </Text>
        <Section style={{ margin: "0 0 22px" }}>
          {STEPS.map((step, i) => (
            <Step key={step.number} {...step} last={i === STEPS.length - 1} />
          ))}
        </Section>
        <WeekPassButton href={profileUrl}>
          Build My Profile&nbsp;&rarr;
        </WeekPassButton>
        <Section
          style={{
            margin: "28px 0 0",
            borderLeft: `3px solid ${weekPassColors.tan}`,
          }}
        >
          <Row>
            <Column
              className="wp-icon-col"
              valign="middle"
              style={{ width: "72px", padding: "4px 0 4px 18px" }}
            >
              <Img
                src={asset("icon-shield.png")}
                alt=""
                width="44"
                height="46"
                style={{ display: "block", border: 0 }}
              />
            </Column>
            <Column valign="middle" style={{ padding: "4px 0 4px 12px" }}>
              <Text
                style={{
                  margin: "0 0 2px",
                  fontFamily: displayFont,
                  fontSize: "19px",
                  lineHeight: "25px",
                  fontWeight: 800,
                  color: weekPassColors.ink,
                }}
              >
                Your recruiting journey is personal.
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: bodyFont,
                  fontSize: "15px",
                  lineHeight: "21px",
                  color: weekPassColors.text,
                }}
              >
                Other dancers can’t view your full recruiting profile.
              </Text>
            </Column>
          </Row>
        </Section>
      </WeekPassBody>
      <WeekPassFooter
        preferencesUrl={preferencesUrl}
        unsubscribeUrl={unsubscribeUrl}
        postalAddress={postalAddress}
        reason="You're receiving this because you bought a Studio 2 Stadium Week Pass."
        logoUrl={asset("logo-wordmark-white.png")}
      />
    </WeekPassLayout>
  );
}

WeekPassWelcomeEmail.PreviewProps = {
  variant: "current",
  firstName: "Avery",
  startsAt: "Monday, November 16, 2026 at 10:15 AM MST",
  accessEndsAt: "Monday, November 23, 2026 at 10:15 AM MST",
  profileUrl: "https://app.studio2stadium.com/avery",
  preferencesUrl: "https://app.studio2stadium.com/settings/account",
  unsubscribeUrl: "https://api.studio2stadium.com/unsubscribe?token=preview",
  postalAddress: "[postal address not configured]",
} satisfies WeekPassWelcomeEmailProps;

export default WeekPassWelcomeEmail;
