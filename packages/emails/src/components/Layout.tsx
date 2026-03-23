import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section
} from "@react-email/components";
import type { ReactNode } from "react";
import { Footer } from "./Footer.js";
import { colors, containerStyle, fontFamily } from "./styles.js";

interface LayoutProps {
  preview: string;
  children: ReactNode;
}

/** Mobile styles in <Head>: supported by most webmail + iOS; Outlook desktop often ignores @media. */
const responsiveEmailCss = `
  @media only screen and (max-width: 600px) {
    .email-hero-mobile {
      background-image: none !important;
      height: auto !important;
      min-height: 0 !important;
      padding-top: 0 !important;
      padding-bottom: 16px !important;
    }
    .email-hero-row-mobile {
      padding-top: 0 !important;
    }
    a.email-hero-cta-mobile {
      background-color: #c5a880 !important;
      color: #ffffff !important;
    }
    .email-dancer-hero-logo-mobile {
      display: none !important;
      width: 0 !important;
      max-width: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    .email-dancer-hero-cta-col-mobile {
      width: 100% !important;
      max-width: 100% !important;
      text-align: center !important;
    }
    .email-premium-hero-logo-col-mobile {
      width: 100% !important;
      text-align: center !important;
    }
    .email-premium-hero-logo-col-mobile img {
      margin-left: auto !important;
      margin-right: auto !important;
    }
  }
`;

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head>
        <style>{responsiveEmailCss}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.backgroundMuted,
          fontFamily,
          margin: 0,
          padding: 0,
        }}
      >
        <Container style={containerStyle}>
          <Section
            style={{
              backgroundColor: colors.background,
              borderRadius: "8px",
              padding: "32px",
              border: `1px solid ${colors.border}`,
            }}
          >
            {children}
          </Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}
