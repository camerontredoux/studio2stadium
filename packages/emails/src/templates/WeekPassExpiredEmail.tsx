import { Column, Img, Row, Section, Text } from "@react-email/components";
import {
  WEEK_PASS_ASSET_BASE_URL,
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

export interface WeekPassPlanPrice {
  label: string;
  price: string;
  per: string;
  /** Outline the row in tan, as the design does for the 3-month plan. */
  highlight?: boolean;
}

export interface WeekPassExpiredEmailProps {
  /** Blank or missing falls back to "there". */
  firstName?: string | null;
  plansUrl: string;
  preferencesUrl: string;
  unsubscribeUrl: string;
  postalAddress: string;
  /**
   * The plan rows. Defaults are the approved design's figures; confirm they
   * match the live Stripe Prices before activation.
   */
  plans?: WeekPassPlanPrice[];
  assetBaseUrl?: string;
}

/** Proposed preview (inbox snippet) text. */
export const WEEK_PASS_EXPIRED_PREVIEW =
  "Keep exploring. Unlock more with Premium.";

export const WEEK_PASS_DESIGN_PLANS: WeekPassPlanPrice[] = [
  { label: "Monthly", price: "$25", per: "/ month" },
  {
    label: "Season Pass",
    price: "$69",
    per: "/ 3 months",
    highlight: true,
  },
  { label: "Annual", price: "$250", per: "/ year" },
];

const FEATURES = [
  {
    icon: "icon-radar.png",
    title: "More programs on your radar.",
    body: "Follow programs without the Week Pass’s five-program limit.",
  },
  {
    icon: "icon-upload.png",
    title: "A direct way to submit your video.",
    body: "Seniors can use Common Recruit to submit to participating programs during submission windows.",
  },
  {
    icon: "icon-gears.png",
    title: "More time to put S2S to work.",
    body: "Research teams, update your profile, and plan your next clinics and events.",
  },
];

function greetingName(firstName?: string | null) {
  const trimmed = firstName?.trim();
  return trimmed ? trimmed : "there";
}

function Feature({
  iconUrl,
  title,
  body,
  last,
}: {
  iconUrl: string;
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
        className="wp-icon-col"
        valign="middle"
        align="center"
        style={{ width: "100px", padding: "16px 0" }}
      >
        <Img
          src={iconUrl}
          alt=""
          width="64"
          height="64"
          style={{ display: "block", margin: "0 auto", border: 0 }}
        />
      </Column>
      <Column valign="middle" style={{ width: "3px", padding: "16px 0" }}>
        <div
          style={{
            width: "3px",
            height: "60px",
            backgroundColor: weekPassColors.tan,
          }}
        />
      </Column>
      <Column valign="middle" style={{ padding: "16px 0 16px 16px" }}>
        <Text
          role="heading"
          aria-level={3}
          className="wp-step-title"
          style={{
            margin: "0 0 4px",
            fontFamily: displayFont,
            fontSize: "21px",
            lineHeight: "27px",
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
            lineHeight: "22px",
            color: weekPassColors.text,
          }}
        >
          {body}
        </Text>
      </Column>
    </Row>
  );
}

function PlanRow({ plan }: { plan: WeekPassPlanPrice }) {
  const featured = Boolean(plan.highlight);
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{
        border: `2px solid ${featured ? weekPassColors.tan : "#dddddd"}`,
        borderRadius: "8px",
        margin: "0 0 12px",
        borderCollapse: "separate",
      }}
    >
      <tbody>
        <tr>
          <td
            valign="middle"
            width="46%"
            className="wp-plan-label-cell"
            style={{ width: "46%", padding: "14px 10px 14px 20px" }}
          >
            <Text
              className="wp-plan-label"
              style={{
                margin: 0,
                fontFamily: displayFont,
                fontSize: "24px",
                lineHeight: "30px",
                fontWeight: 800,
                textTransform: "uppercase",
                color: weekPassColors.ink,
              }}
            >
              {plan.label}
            </Text>
          </td>
          <td width="1" style={{ width: "1px", padding: "12px 0" }}>
            <div
              style={{
                width: "1px",
                height: "44px",
                backgroundColor: weekPassColors.rule,
              }}
            />
          </td>
          <td
            valign="middle"
            className="wp-plan-price-cell"
            style={{ padding: "10px 16px 10px 20px", whiteSpace: "nowrap" }}
          >
            <Text style={{ margin: 0, color: weekPassColors.ink }}>
              <span
                className="wp-price"
                style={{
                  fontFamily: displayFont,
                  fontSize: "44px",
                  lineHeight: "50px",
                  fontWeight: 800,
                  letterSpacing: "-1px",
                }}
              >
                {plan.price}
              </span>
              <span
                className="wp-per"
                style={{
                  fontFamily: bodyFont,
                  fontSize: "17px",
                  fontWeight: 600,
                }}
              >
                &nbsp;{plan.per}
              </span>
            </Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function WeekPassExpiredEmail({
  firstName,
  plansUrl,
  preferencesUrl,
  unsubscribeUrl,
  postalAddress,
  plans = WEEK_PASS_DESIGN_PLANS,
  assetBaseUrl = WEEK_PASS_ASSET_BASE_URL,
}: WeekPassExpiredEmailProps) {
  return (
    <WeekPassLayout preview={WEEK_PASS_EXPIRED_PREVIEW}>
      <WeekPassHero
        eyebrow="Your next move"
        title={["Your week was", "just the beginning."]}
        subtitle="Keep exploring. Unlock more with Premium."
        backgroundUrl={`${assetBaseUrl}/hero-expired.jpg`}
        assetBaseUrl={assetBaseUrl}
      />
      <WeekPassBody>
        <Text
          role="heading"
          aria-level={2}
          className="wp-h2"
          style={{ ...h2Style, fontSize: "34px", margin: "0 0 10px" }}
        >
          Hi {greetingName(firstName)},
        </Text>
        <Text style={bodyTextStyle}>
          Your S2S Week Pass has ended. Ready for more time to explore your
          options and more ways to take the next step?
        </Text>
        <Text
          role="heading"
          aria-level={2}
          className="wp-h2"
          style={{ ...h2Style, margin: "8px 0 4px" }}
        >
          Make room for what{"’"}s next.
        </Text>
        <Section style={{ margin: "0 0 26px" }}>
          {FEATURES.map((feature, i) => (
            <Feature
              key={feature.icon}
              iconUrl={`${assetBaseUrl}/${feature.icon}`}
              title={feature.title}
              body={feature.body}
              last={i === FEATURES.length - 1}
            />
          ))}
        </Section>
        <Text
          role="heading"
          aria-level={2}
          className="wp-h2"
          style={{ ...h2Style, margin: "0 0 16px" }}
        >
          Choose your next chapter.
        </Text>
        {plans.map((plan) => (
          <PlanRow key={plan.label} plan={plan} />
        ))}
        <Text
          style={{
            margin: "4px 0 18px",
            fontFamily: bodyFont,
            fontSize: "14px",
            lineHeight: "20px",
            color: weekPassColors.text,
            textAlign: "center",
          }}
        >
          Plans renew automatically. Manage your subscription in your account.
        </Text>
        <WeekPassButton href={plansUrl}>
          Explore Premium Plans&nbsp;&rarr;
        </WeekPassButton>
        <Text
          style={{
            margin: "20px 0 0",
            fontFamily: displayFont,
            fontSize: "20px",
            lineHeight: "26px",
            fontWeight: 600,
            color: weekPassColors.ink,
            textAlign: "center",
          }}
        >
          Give yourself time to take the next step.
        </Text>
      </WeekPassBody>
      <WeekPassFooter
        preferencesUrl={preferencesUrl}
        unsubscribeUrl={unsubscribeUrl}
        postalAddress={postalAddress}
        reason="You're receiving this because your Studio 2 Stadium Week Pass ended and your email notifications are on."
        assetBaseUrl={assetBaseUrl}
      />
    </WeekPassLayout>
  );
}

WeekPassExpiredEmail.PreviewProps = {
  firstName: "Avery",
  plansUrl: "https://app.studio2stadium.com/checkout",
  preferencesUrl: "https://app.studio2stadium.com/settings/account",
  unsubscribeUrl: "https://api.studio2stadium.com/unsubscribe?token=preview",
  postalAddress: "[postal address not configured]",
} satisfies WeekPassExpiredEmailProps;

export default WeekPassExpiredEmail;
