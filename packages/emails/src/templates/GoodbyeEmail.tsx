import { Link, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { linkStyle, paragraphStyle } from "../components/styles.js";

export interface GoodbyeEmailProps {
  firstName: string;
  siteUrl: string;
}

export function GoodbyeEmail({ firstName, siteUrl }: GoodbyeEmailProps) {
  return (
    <Layout preview="We're sorry to see you go!">
      <Text style={paragraphStyle}>Hi {firstName},</Text>
      <Text style={paragraphStyle}>
        Your Studio2Stadium account has been successfully deleted.
      </Text>
      <Text style={paragraphStyle}>
        All of your data has been removed from our systems.
      </Text>
      <Text style={paragraphStyle}>
        If you ever want to come back, we'd love to have you. You can create a
        new account anytime at{" "}
        <Link href={siteUrl} style={linkStyle}>
          {siteUrl}
        </Link>
        .
      </Text>
      <Text style={paragraphStyle}>
        Thank you for being part of our community.
      </Text>
      <Text style={paragraphStyle}>
        Best wishes,
        <br />
        The Studio2Stadium Team
      </Text>
    </Layout>
  );
}

export default GoodbyeEmail;
