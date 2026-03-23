import { Link, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import { linkStyle, paragraphStyle } from "../components/styles.js";

export interface ForgotPasswordEmailProps {
  resetUrl: string;
}

export function ForgotPasswordEmail({ resetUrl }: ForgotPasswordEmailProps) {
  return (
    <Layout preview="Reset your password">
      <Text style={paragraphStyle}>
        You requested a password reset.
      </Text>
      <Text style={paragraphStyle}>
        Click the button below to reset your password:
      </Text>
      <Button href={resetUrl}>Reset Password</Button>
      <Text style={paragraphStyle}>
        Or copy and paste this link into your browser:{" "}
        <Link href={resetUrl} style={linkStyle}>
          {resetUrl}
        </Link>
      </Text>
      <Text style={paragraphStyle}>
        This link will expire in 15 minutes.
      </Text>
      <Text style={paragraphStyle}>
        If you didn't request this, you can safely ignore this email.
      </Text>
    </Layout>
  );
}

export default ForgotPasswordEmail;
