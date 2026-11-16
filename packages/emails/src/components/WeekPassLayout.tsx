import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

/**
 * Black, white and tan frame shared by the two Week Pass emails, built from
 * Abbey's approved designs. Everything a reader needs is live text: the
 * wordmark, headline, dates, body, buttons and footer links all survive
 * blocked images. The only images are decorative crops of the supplied
 * artwork (alt=""), so a client that blocks them shows a plain black hero.
 */

export const weekPassColors = {
  black: "#000000",
  ink: "#111111",
  text: "#1c1c1c",
  muted: "#5b5b5b",
  rule: "#cccccc",
  tan: "#be9d70",
  tanDeep: "#b58f5a",
  white: "#ffffff",
  page: "#f2efe9",
  footerLink: "#bdbdbd",
};

export const displayFont =
  "Montserrat, 'Helvetica Neue', Helvetica, Arial, sans-serif";
export const bodyFont =
  "Montserrat, 'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Where the decorative crops are served from. They are not hosted yet: see
 * `packages/emails/assets/week-pass/README.md`.
 */
export const WEEK_PASS_ASSET_BASE_URL =
  "https://studio2stadium.com/img/week-pass";

const css = `
  body { -webkit-text-size-adjust: 100%; }
  .wp-hero-title { font-size: 56px !important; }
  @media only screen and (max-width: 600px) {
    .wp-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .wp-hero-title { font-size: 40px !important; line-height: 42px !important; }
    .wp-hero-sub { font-size: 16px !important; line-height: 22px !important; }
    .wp-h2 { font-size: 26px !important; line-height: 30px !important; }
    .wp-num { font-size: 52px !important; line-height: 52px !important; width: 72px !important; }
    .wp-num-col { width: 72px !important; }
    .wp-step-title { font-size: 19px !important; }
    .wp-cta { font-size: 21px !important; }
    .wp-price { font-size: 32px !important; }
    .wp-plan-label { font-size: 18px !important; }
    .wp-badge { font-size: 10px !important; letter-spacing: 0.2px !important; padding: 1px 6px !important; }
    .wp-plan-label-cell { padding-left: 14px !important; padding-right: 6px !important; }
    .wp-plan-price-cell { padding-left: 12px !important; padding-right: 10px !important; }
    .wp-per { font-size: 14px !important; }
    .wp-date-box { font-size: 16px !important; }
    .wp-icon-col { width: 52px !important; }
    .wp-icon-col img { width: 44px !important; height: 44px !important; }
  }
  @media only screen and (max-width: 360px) {
    .wp-hero-title { font-size: 34px !important; line-height: 37px !important; }
    .wp-price { font-size: 27px !important; }
    .wp-per { font-size: 12px !important; }
    .wp-plan-label { font-size: 16px !important; }
    .wp-plan-label-cell { padding-left: 12px !important; padding-right: 4px !important; }
    .wp-plan-price-cell { padding-left: 10px !important; padding-right: 8px !important; }
  }
`;

/**
 * The genuine Studio 2 Stadium wordmark (the app's `MainLogo` vector, white
 * on black, tan "2"), as an image. Never set as text. The alt text is styled
 * so it still reads as the brand name on black when images are blocked.
 */
export function Logo({
  assetBaseUrl,
  width,
}: {
  assetBaseUrl: string;
  width: number;
}) {
  const height = Math.round((width * 131) / 1200);
  return (
    <Img
      src={`${assetBaseUrl}/logo-wordmark-white.png`}
      alt="Studio 2 Stadium"
      width={String(width)}
      height={String(height)}
      style={{
        display: "block",
        margin: "0 auto",
        width: `${width}px`,
        maxWidth: "100%",
        height: "auto",
        border: 0,
        color: weekPassColors.white,
        fontFamily: displayFont,
        fontSize: `${Math.round(height * 0.75)}px`,
        fontWeight: 800,
        textAlign: "center",
      }}
    />
  );
}

/** Outlook (Word engine) ignores CSS backgrounds; VML draws the same image. */
const HERO_VML_HEIGHT = 330;
function vmlOpen(url: string) {
  return `<!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:${HERO_VML_HEIGHT}px;"><v:fill type="frame" src="${url}" color="#000000" /><v:textbox inset="0,0,0,0"><![endif]-->`;
}
const VML_CLOSE = `<!--[if gte mso 9]></v:textbox></v:rect><![endif]-->`;

export interface WeekPassHeroProps {
  eyebrow: string;
  /** Lines of the headline, each on its own line on wide screens. */
  title: string[];
  subtitle: string;
  /**
   * The design's court-floor artwork with its baked-in text masked to black,
   * drawn behind the live text. Black when images are blocked.
   */
  backgroundUrl: string;
  assetBaseUrl: string;
}

export function WeekPassHero({
  eyebrow,
  title,
  subtitle,
  backgroundUrl,
  assetBaseUrl,
}: WeekPassHeroProps) {
  const cellProps = {
    background: backgroundUrl,
    bgcolor: weekPassColors.black,
  } as Record<string, string>;
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ backgroundColor: weekPassColors.black }}
    >
      <tbody>
        <tr>
          <td
            {...cellProps}
            valign="top"
            className="wp-hero-cell"
            style={{
              backgroundColor: weekPassColors.black,
              backgroundImage: `url(${backgroundUrl})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right bottom",
              backgroundSize: "cover",
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: vmlOpen(backgroundUrl) }} />
            <div className="wp-pad" style={{ padding: "26px 40px 34px" }}>
              <Logo assetBaseUrl={assetBaseUrl} width={300} />
              <Text
                style={{
                  margin: "20px 0 8px",
                  fontFamily: displayFont,
                  fontSize: "15px",
                  lineHeight: "20px",
                  fontWeight: 700,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: weekPassColors.tan,
                }}
              >
                {eyebrow}
              </Text>
              <Text
                className="wp-hero-title"
                role="heading"
                aria-level={1}
                style={{
                  margin: 0,
                  fontFamily: displayFont,
                  fontSize: "56px",
                  lineHeight: "56px",
                  fontWeight: 800,
                  letterSpacing: "-1.5px",
                  color: weekPassColors.white,
                }}
              >
                {title.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < title.length - 1 ? <br /> : null}
                  </span>
                ))}
              </Text>
              <Text
                className="wp-hero-sub"
                style={{
                  margin: "12px 0 0",
                  fontFamily: bodyFont,
                  fontSize: "18px",
                  lineHeight: "26px",
                  fontWeight: 500,
                  color: weekPassColors.white,
                }}
              >
                {subtitle}
              </Text>
            </div>
            <div dangerouslySetInnerHTML={{ __html: VML_CLOSE }} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function WeekPassButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{ margin: "8px 0 0" }}
    >
      <tbody>
        <tr>
          <td align="center" style={{ backgroundColor: weekPassColors.tan }}>
            <Link
              href={href}
              className="wp-cta"
              style={{
                display: "block",
                padding: "16px 12px",
                fontFamily: displayFont,
                fontSize: "26px",
                lineHeight: "32px",
                fontWeight: 800,
                color: weekPassColors.ink,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              {children}
            </Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export interface WeekPassFooterProps {
  preferencesUrl: string;
  unsubscribeUrl: string;
  /** The business's physical postal address, from configuration. */
  postalAddress: string;
  /** Why this reader got the email. */
  reason: string;
  assetBaseUrl: string;
}

export function WeekPassFooter({
  preferencesUrl,
  unsubscribeUrl,
  postalAddress,
  reason,
  assetBaseUrl,
}: WeekPassFooterProps) {
  const small = {
    margin: "0",
    fontFamily: bodyFont,
    fontSize: "13px",
    lineHeight: "20px",
    color: weekPassColors.footerLink,
    textAlign: "center" as const,
  };
  return (
    <Section
      style={{ backgroundColor: weekPassColors.black }}
      bgcolor={weekPassColors.black}
    >
      <Section className="wp-pad" style={{ padding: "26px 40px 28px" }}>
        <Logo assetBaseUrl={assetBaseUrl} width={190} />
        <Text
          style={{
            margin: "6px 0 14px",
            fontFamily: bodyFont,
            fontSize: "20px",
            lineHeight: "26px",
            fontStyle: "italic",
            fontWeight: 600,
            color: weekPassColors.tan,
            textAlign: "center",
          }}
        >
          Stand in Your Spotlight.
        </Text>
        <Text style={{ ...small, fontSize: "15px" }}>
          <Link
            href={preferencesUrl}
            style={{
              color: weekPassColors.footerLink,
              textDecoration: "underline",
            }}
          >
            Manage preferences
          </Link>
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <Link
            href={unsubscribeUrl}
            style={{
              color: weekPassColors.footerLink,
              textDecoration: "underline",
            }}
          >
            Unsubscribe
          </Link>
        </Text>
        <Text style={{ ...small, margin: "14px 0 0" }}>{reason}</Text>
        <Text style={{ ...small, margin: "6px 0 0" }}>
          Studio 2 Stadium · {postalAddress}
        </Text>
      </Section>
    </Section>
  );
}

export function WeekPassLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
        {/* Montserrat where the client loads web fonts (Apple Mail, iOS);
            Helvetica/Arial elsewhere. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,500;0,600;0,700;0,800;1,600&display=swap"
        />
        <style>{css}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: weekPassColors.page,
          fontFamily: bodyFont,
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            width: "100%",
            margin: "0 auto",
            backgroundColor: weekPassColors.white,
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}

/** Padding wrapper for the white body. */
export function WeekPassBody({ children }: { children: ReactNode }) {
  return (
    <Section className="wp-pad" style={{ padding: "28px 40px 32px" }}>
      {children}
    </Section>
  );
}

export const h2Style = {
  margin: "0 0 14px",
  fontFamily: displayFont,
  fontSize: "32px",
  lineHeight: "38px",
  fontWeight: 800,
  letterSpacing: "-0.5px",
  color: weekPassColors.ink,
};

export const bodyTextStyle = {
  margin: "0 0 20px",
  fontFamily: bodyFont,
  fontSize: "17px",
  lineHeight: "25px",
  color: weekPassColors.text,
};
