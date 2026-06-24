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

export function OrgEmailLayout({ preview, children }: OrgEmailLayoutProps) {
  return (
    <Html>
      <Head />
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
