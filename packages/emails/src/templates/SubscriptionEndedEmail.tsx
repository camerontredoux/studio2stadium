import { Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import {
  listItemStyle,
  listStyle,
  paragraphStyle,
} from "../components/styles.js";

export interface SubscriptionEndedEmailProps {
  firstName: string;
  upgradeUrl: string;
}

export function SubscriptionEndedEmail({
  firstName,
  upgradeUrl,
}: SubscriptionEndedEmailProps) {
  return (
    <Layout preview="Your Studio 2 Stadium Premium subscription has expired">
      <Text style={paragraphStyle}>Hi {firstName},</Text>
      <Text style={paragraphStyle}>
        Your Studio 2 Stadium Premium subscription has officially expired. We
        hope you enjoyed your time as a premium member and found value in the
        enhanced features.
      </Text>
      <Text style={paragraphStyle}>
        As a reminder, premium members get access to:
      </Text>
      <ul style={listStyle}>
        <li style={listItemStyle}>
          <strong>See who's viewing your profile</strong> - Know which coaches
          and programs are checking you out
        </li>
        <li style={listItemStyle}>
          <strong>Explore every collegiate program</strong> - Full access to
          browse and research all programs in our database
        </li>
        <li style={listItemStyle}>
          <strong>Track upcoming events</strong> - Stay on top of clinics,
          auditions, and other recruiting events
        </li>
        <li style={listItemStyle}>
          <strong>Access the video training library</strong> - Improve your
          skills with our collection of training videos
        </li>
        <li style={listItemStyle}>
          <strong>Connect directly with programs and coaches</strong> - Reach out
          to the programs you're interested in
        </li>
      </ul>
      <Text style={paragraphStyle}>
        Ready to continue your recruiting journey with all the tools at your
        fingertips?
      </Text>
      <Button href={upgradeUrl}>Upgrade to Premium Now</Button>
      <Text style={paragraphStyle}>
        Thank you for being part of the Studio 2 Stadium community!
      </Text>
      <Text style={paragraphStyle}>
        Warmly,
        <br />
        The Studio 2 Stadium Team
      </Text>
    </Layout>
  );
}

export default SubscriptionEndedEmail;
