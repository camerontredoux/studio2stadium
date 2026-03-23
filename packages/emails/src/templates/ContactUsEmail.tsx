import { Hr, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors, headingStyle, paragraphStyle } from "../components/styles.js";

export interface ContactUsEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function ContactUsEmail({
  name,
  email,
  subject,
  message,
}: ContactUsEmailProps) {
  return (
    <Layout preview={`Contact Form: ${subject}`}>
      <Text style={headingStyle}>Contact Form Submission</Text>
      <Text style={paragraphStyle}>
        <strong>From:</strong> {name} ({email})
      </Text>
      <Text style={paragraphStyle}>
        <strong>Subject:</strong> {subject}
      </Text>
      <Hr style={{ borderColor: colors.border, margin: "16px 0" }} />
      <Text style={{ ...paragraphStyle, whiteSpace: "pre-wrap" }}>
        {message}
      </Text>
    </Layout>
  );
}

export default ContactUsEmail;
