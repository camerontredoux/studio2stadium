# Org Email Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign OrgInviteEmail and OrgRosterAddedEmail to match a premium branded layout — dark org-branded header, accent-bordered info sections, "Get Started Guide" video card, and org-branded footer.

**Architecture:** Replace the current Layout-wrapped templates with a new OrgEmailLayout that provides an Html/Head/Body/Container shell without the white-card wrapper, allowing each template to render three visual bands: dark header, white body, dark footer. The welcome video section becomes a styled "Get Started Guide" card with a button link (no YouTube thumbnail). A new `logoUrl` prop is wired from `org.logoUrl` through the backend.

**Tech Stack:** React Email (@react-email/components), AdonisJS mail services, TypeScript

## Global Constraints

- No database migration — logoUrl already exists on the organizations table
- Do not modify the shared Layout, Button, or Footer components — other emails depend on them
- Brand color is `org.primaryColor`, passed as `brandColor` (already wired)
- Logo URL is `org.logoUrl` (available on the org model, not yet wired to emails)
- The S2S logo URL is `https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png`
- Welcome video URL is already wired as `welcomeVideoUrl` — replace the thumbnail rendering with a "Get Started Guide" card containing a button link
- OrgInviteEmail = new users (no S2S account); OrgRosterAddedEmail = existing users (account already set up)
- Keep existing prop interfaces backward-compatible — `logoUrl` is optional

---

### Task 1: Backend — Wire logoUrl to Email Templates

**Files:**
- Modify: `packages/emails/src/templates/OrgInviteEmail.tsx` (add `logoUrl` to interface only)
- Modify: `packages/emails/src/templates/OrgRosterAddedEmail.tsx` (add `logoUrl` to interface only)
- Modify: `apps/backend/app/shared/org/invite-email.ts` (add to data interface + pass through)
- Modify: `apps/backend/app/shared/org/roster-added-email.ts` (add to data interface + pass through)

**Interfaces:**
- Consumes: `org.logoUrl` from the organizations table (already on the model)
- Produces: `logoUrl?: string | null` prop available on both email template interfaces

- [ ] **Step 1: Add `logoUrl` to OrgInviteEmailProps**

In `packages/emails/src/templates/OrgInviteEmail.tsx`, add to the interface:

```tsx
export interface OrgInviteEmailProps {
  firstName: string;
  orgName: string;
  eventName?: string | null;
  eventDateLabel?: string | null;
  venueName?: string | null;
  type: "dancer" | "coach";
  inviteUrl: string;
  brandColor?: string | null;
  welcomeVideoUrl?: string | null;
  logoUrl?: string | null;
}
```

Destructure it in the component function signature alongside the other props.

- [ ] **Step 2: Add `logoUrl` to OrgRosterAddedEmailProps**

In `packages/emails/src/templates/OrgRosterAddedEmail.tsx`, add to the interface:

```tsx
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
```

Destructure it in the component function signature alongside the other props.

- [ ] **Step 3: Wire logoUrl through OrgInviteMailData and send functions**

In `apps/backend/app/shared/org/invite-email.ts`:

Add to `OrgInviteMailData`:
```typescript
logoUrl: string | null;
```

In `OrgInviteMail.prepare()`, pass it to the template call:
```typescript
logoUrl: this.data.logoUrl,
```

In both `sendOrgInviteEmail` and `sendOrgInviteEmailOrThrow`, add to the data object:
```typescript
logoUrl: org.logoUrl ?? null,
```

- [ ] **Step 4: Wire logoUrl through OrgRosterAddedMailData and send function**

In `apps/backend/app/shared/org/roster-added-email.ts`:

Add to `OrgRosterAddedMailData`:
```typescript
logoUrl: string | null;
```

In `OrgRosterAddedMail.prepare()`, pass it to the template call:
```typescript
logoUrl: this.data.logoUrl,
```

In `sendOrgRosterAddedEmail`, add to the data object:
```typescript
logoUrl: org.logoUrl ?? null,
```

- [ ] **Step 5: Verify emails package builds and backend typechecks**

Run:
```bash
cd packages/emails && pnpm build
```

Then check backend types (only our files):
```bash
cd apps/backend && pnpm typecheck 2>&1 | grep -E '(invite-email|roster-added-email|error TS)' | head -20
```

Expected: Clean build, no new type errors in our files.

- [ ] **Step 6: Commit**

```bash
git add packages/emails/src/templates/OrgInviteEmail.tsx packages/emails/src/templates/OrgRosterAddedEmail.tsx apps/backend/app/shared/org/invite-email.ts apps/backend/app/shared/org/roster-added-email.ts
git commit -m "feat(emails): wire org logoUrl to invite and roster-added email templates"
```

---

### Task 2: Create OrgEmailLayout Component

**Files:**
- Create: `packages/emails/src/components/OrgEmailLayout.tsx`

**Interfaces:**
- Consumes: `colors`, `fontFamily`, `containerStyle` from `./styles.js`
- Produces: `OrgEmailLayout` component with props `{ preview: string; children: ReactNode }`

This layout provides the Html/Head/Body/Container shell WITHOUT the white-card Section wrapper or the S2S Footer. Org email templates control their own visual sections (dark header, white body, dark footer) as children.

- [ ] **Step 1: Create OrgEmailLayout**

Create `packages/emails/src/components/OrgEmailLayout.tsx`:

```tsx
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
```

- [ ] **Step 2: Export from the package**

In `packages/emails/src/index.ts`, add (alongside the other component exports, not with templates):

```typescript
export { OrgEmailLayout } from "./components/OrgEmailLayout.js";
```

Note: Only add this export if other email templates also export their layout. Check the existing exports — if only templates and their props are exported, skip this step and just import directly in the template files.

- [ ] **Step 3: Verify build**

```bash
cd packages/emails && pnpm build
```

Expected: Clean build.

- [ ] **Step 4: Commit**

```bash
git add packages/emails/src/components/OrgEmailLayout.tsx packages/emails/src/index.ts
git commit -m "feat(emails): add OrgEmailLayout component for branded org emails"
```

---

### Task 3: Redesign OrgInviteEmail (New Users)

**Files:**
- Modify: `packages/emails/src/templates/OrgInviteEmail.tsx` (full redesign)

**Interfaces:**
- Consumes: `OrgEmailLayout` from `../components/OrgEmailLayout.js`, all existing props + `logoUrl`
- Produces: redesigned `OrgInviteEmail` component (same export name, same props interface)

The redesigned template has four visual bands:
1. **Dark header** — org logo centered, org name, S2S logo in top-right, "Featuring Technology From Studio 2 Stadium" tagline
2. **White body** — greeting, intro paragraph, event details woven into text, accent-bordered "If you're new to S2S" section with Create Account button
3. **Video card** — dark background "Get Started Guide" section with button link to `welcomeVideoUrl` (replaces the old YouTube thumbnail), only renders when `welcomeVideoUrl` is set
4. **Dark footer** — closing text, sign-off, copyright with org name

- [ ] **Step 1: Rewrite OrgInviteEmail**

Replace the entire component body in `packages/emails/src/templates/OrgInviteEmail.tsx` with the redesigned template. Keep the same interface and export.

```tsx
import {
  Column,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { OrgEmailLayout } from "../components/OrgEmailLayout.js";
import { Button as ReactEmailButton } from "@react-email/components";
import { colors, paragraphStyle, fontFamily } from "../components/styles.js";

export interface OrgInviteEmailProps {
  firstName: string;
  orgName: string;
  eventName?: string | null;
  eventDateLabel?: string | null;
  venueName?: string | null;
  type: "dancer" | "coach";
  inviteUrl: string;
  brandColor?: string | null;
  welcomeVideoUrl?: string | null;
  logoUrl?: string | null;
}

const S2S_LOGO =
  "https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png";

export function OrgInviteEmail({
  firstName,
  orgName,
  eventName,
  eventDateLabel,
  venueName,
  type,
  inviteUrl,
  brandColor,
  welcomeVideoUrl,
  logoUrl,
}: OrgInviteEmailProps) {
  const accent = brandColor || colors.primary;
  const previewText = eventName
    ? `You're invited to ${eventName} with ${orgName}`
    : `You're invited to ${orgName}`;

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
          {eventName
            ? `${orgName} is almost here and we're excited to have you involved!`
            : `${orgName} has invited you to join and we're excited to have you!`}
        </Text>
        <Text style={paragraphStyle}>
          {type === "dancer"
            ? `The ${eventName ?? orgName} platform gives you one place to explore opportunities, connect with coaches, and stay organized${eventName ? " throughout the event" : ""}.`
            : `The ${eventName ?? orgName} platform gives you one place to explore dancer profiles, identify top prospects, and stay organized${eventName ? " throughout the event" : ""}.`}
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

        {/* ── New to S2S section ── */}
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
            If you&apos;re new to S2S:
          </Text>
          <Text style={{ ...paragraphStyle, margin: "0 0 16px" }}>
            You&apos;ll need to create an account to access the{" "}
            {eventName ?? orgName} platform:
          </Text>
          <ReactEmailButton
            href={inviteUrl}
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
                backgroundColor: accent,
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
          This email was sent to you as a registered participant of {orgName}.
        </Text>
      </Section>
    </OrgEmailLayout>
  );
}

export default OrgInviteEmail;
```

- [ ] **Step 2: Verify build**

```bash
cd packages/emails && pnpm build
```

Expected: Clean build, no type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/emails/src/templates/OrgInviteEmail.tsx
git commit -m "feat(emails): redesign OrgInviteEmail with org-branded layout"
```

---

### Task 4: Redesign OrgRosterAddedEmail (Existing Users)

**Files:**
- Modify: `packages/emails/src/templates/OrgRosterAddedEmail.tsx` (full redesign)

**Interfaces:**
- Consumes: `OrgEmailLayout` from `../components/OrgEmailLayout.js`, all existing props + `logoUrl`
- Produces: redesigned `OrgRosterAddedEmail` component (same export name, same props interface)

Same visual structure as OrgInviteEmail but with the "already have an account" path instead of "new to S2S". The accent-bordered section tells the user their profile has been automatically updated and they can access the platform from their dashboard.

- [ ] **Step 1: Rewrite OrgRosterAddedEmail**

Replace the entire component body in `packages/emails/src/templates/OrgRosterAddedEmail.tsx`:

```tsx
import {
  Column,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { OrgEmailLayout } from "../components/OrgEmailLayout.js";
import { Button as ReactEmailButton } from "@react-email/components";
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
  "https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png";

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
          {eventName
            ? `${orgName} is almost here and we're excited to have you involved!`
            : `${orgName} has added you to the roster and we're excited to have you!`}
        </Text>
        <Text style={paragraphStyle}>
          {type === "dancer"
            ? `The ${eventName ?? orgName} platform gives you one place to explore opportunities, connect with coaches, and stay organized${eventName ? " throughout the event" : ""}.`
            : `The ${eventName ?? orgName} platform gives you one place to explore dancer profiles, identify top prospects, and stay organized${eventName ? " throughout the event" : ""}.`}
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
            S2S and the {eventName ?? orgName} platform directly from your
            dashboard. No extra steps needed.
          </Text>
        </Section>

        {/* Dashboard CTA */}
        <Section style={{ margin: "0 0 24px" }}>
          <ReactEmailButton
            href={dashboardUrl}
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
            Go to Dashboard
          </ReactEmailButton>
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
                backgroundColor: accent,
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
          This email was sent to you as a registered participant of {orgName}.
        </Text>
      </Section>
    </OrgEmailLayout>
  );
}

export default OrgRosterAddedEmail;
```

- [ ] **Step 2: Verify build**

```bash
cd packages/emails && pnpm build
```

Expected: Clean build, no type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/emails/src/templates/OrgRosterAddedEmail.tsx
git commit -m "feat(emails): redesign OrgRosterAddedEmail with org-branded layout"
```

---

### Task 5: End-to-End Verification

**Files:** None modified — verification only.

- [ ] **Step 1: Verify full emails package build**

```bash
cd packages/emails && pnpm build
```

Expected: Clean ESM + DTS build.

- [ ] **Step 2: Verify frontend build**

```bash
cd apps/frontend && pnpm build
```

Expected: Clean build (frontend imports from the emails package indirectly via backend types).

- [ ] **Step 3: Test OrgInviteEmail renders correctly with all props**

```bash
cd packages/emails && node -e "
const { OrgInviteEmail } = require('./build/index.js');
const { renderToStaticMarkup } = require('react-dom/server');
const html = renderToStaticMarkup(OrgInviteEmail({
  firstName: 'Sarah',
  orgName: 'Sharpen Up Summit',
  eventName: 'The Summit 2026',
  eventDateLabel: 'June 20-22, 2026',
  venueName: 'Dallas Convention Center',
  type: 'dancer',
  inviteUrl: 'https://app.studio2stadium.com/invite/abc123',
  brandColor: '#c5a880',
  welcomeVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  logoUrl: 'https://example.com/logo.png',
}));
console.log('Has dark header:', html.includes('background-color:#111111') || html.includes('background-color: #111111'));
console.log('Has org name in header:', html.includes('Sharpen Up Summit'));
console.log('Has S2S logo:', html.includes('s2slogo'));
console.log('Has org logo:', html.includes('example.com/logo.png'));
console.log('Has new-to-S2S section:', html.includes('new to S2S'));
console.log('Has Create Account button:', html.includes('Create Account'));
console.log('Has Get Started Guide:', html.includes('Get Started Guide'));
console.log('Has Watch Tutorial Video:', html.includes('Watch Tutorial Video'));
console.log('Has footer with org name:', html.includes('Studio 2 Stadium &amp; Sharpen Up Summit'));
console.log('Has featuring tagline:', html.includes('Featuring Technology'));
"
```

Expected: All checks `true`.

- [ ] **Step 4: Test OrgRosterAddedEmail renders correctly**

```bash
cd packages/emails && node -e "
const { OrgRosterAddedEmail } = require('./build/index.js');
const { renderToStaticMarkup } = require('react-dom/server');
const html = renderToStaticMarkup(OrgRosterAddedEmail({
  firstName: 'Sarah',
  orgName: 'Sharpen Up Summit',
  eventName: 'The Summit 2026',
  eventDateLabel: 'June 20-22, 2026',
  venueName: 'Dallas Convention Center',
  type: 'dancer',
  dashboardUrl: 'https://app.studio2stadium.com/dashboard',
  brandColor: '#c5a880',
  welcomeVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  logoUrl: 'https://example.com/logo.png',
}));
console.log('Has dark header:', html.includes('background-color:#111111') || html.includes('background-color: #111111'));
console.log('Has already-have-account section:', html.includes('already have an S2S account'));
console.log('Has auto-updated text:', html.includes('automatically updated'));
console.log('Has Go to Dashboard button:', html.includes('Go to Dashboard'));
console.log('Has Get Started Guide:', html.includes('Get Started Guide'));
console.log('Has footer with org name:', html.includes('Studio 2 Stadium &amp; Sharpen Up Summit'));
"
```

Expected: All checks `true`.

- [ ] **Step 5: Regression — test without optional props**

```bash
cd packages/emails && node -e "
const { OrgInviteEmail } = require('./build/index.js');
const { OrgRosterAddedEmail } = require('./build/index.js');
const { renderToStaticMarkup } = require('react-dom/server');

const inviteHtml = renderToStaticMarkup(OrgInviteEmail({
  firstName: 'Test',
  orgName: 'Test Org',
  type: 'coach',
  inviteUrl: 'https://example.com/invite',
}));
console.log('Invite without optionals - no logo img:', !inviteHtml.includes('<img'));
console.log('Invite without optionals - no video section:', !inviteHtml.includes('Get Started Guide'));
console.log('Invite without optionals - has org name:', inviteHtml.includes('Test Org'));

const rosterHtml = renderToStaticMarkup(OrgRosterAddedEmail({
  firstName: 'Test',
  orgName: 'Test Org',
  type: 'dancer',
  dashboardUrl: 'https://example.com/dashboard',
}));
console.log('Roster without optionals - no video section:', !rosterHtml.includes('Get Started Guide'));
console.log('Roster without optionals - has org name:', rosterHtml.includes('Test Org'));
"
```

Expected: All checks `true`.

- [ ] **Step 6: Final commit (if any fixes needed)**

Only if verification steps required fixes. Otherwise, skip.
