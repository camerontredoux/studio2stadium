import {
  Body,
  Container,
  Head,
  Html,
  Preview,
} from "@react-email/components";
import type { ReactNode } from "react";
import { colors, containerStyle, fontFamily } from "./styles.js";

interface OrgEmailLayoutProps {
  preview: string;
  children: ReactNode;
}

const responsiveEmailCss = `
  @media only screen and (max-width: 600px) {
    .org-email-header-logo-col {
      display: none !important;
      width: 0 !important;
      max-width: 0 !important;
      overflow: hidden !important;
    }
  }
`;

export function OrgEmailLayout({ preview, children }: OrgEmailLayoutProps) {
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
        <Container style={containerStyle}>{children}</Container>
      </Body>
    </Html>
  );
}
