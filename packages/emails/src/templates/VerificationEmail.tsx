import { Link, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import { linkStyle, paragraphStyle } from "../components/styles.js";

export interface VerificationEmailProps {
  firstName: string;
  verifyUrl: string;
}

export function VerificationEmail({
  firstName,
  verifyUrl,
}: VerificationEmailProps) {
  return (
    <Layout preview="Welcome to Studio2Stadium - Verify your email">
      <Text style={paragraphStyle}>Hi {firstName},</Text>
      <Text style={paragraphStyle}>
        Welcome to Studio2Stadium! Please verify your email by clicking the
        button below:
      </Text>
      <Button href={verifyUrl}>Verify Email</Button>
      <Text style={paragraphStyle}>
        Or copy and paste this link into your browser:{" "}
        <Link href={verifyUrl} style={linkStyle}>
          {verifyUrl}
        </Link>
      </Text>
      <Text style={paragraphStyle}>
        If you didn't create this account, you can safely ignore this email.
      </Text>
    </Layout>
  );
}

export default VerificationEmail;
