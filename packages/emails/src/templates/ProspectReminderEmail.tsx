import { Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import { paragraphStyle } from "../components/styles.js";

export interface ProspectReminderEmailProps {
  reviewUrl: string;
}

export function ProspectReminderEmail({ reviewUrl }: ProspectReminderEmailProps) {
  return (
    <Layout preview="A quick reminder to review and update your prospects">
      <Text style={paragraphStyle}>Hi Coach,</Text>
      <Text style={paragraphStyle}>
        This is a friendly reminder to log into <strong>Studio 2 Stadium</strong>{" "}
        and review your prospects. Updating each dancer&rsquo;s status (In Review,
        Released, or Accepted) gives them clarity on where they stand and helps
        bring more transparency to the recruiting process.
      </Text>
      <Text style={paragraphStyle}>
        Your updates not only guide dancers but also keep the recruiting journey
        organized and efficient for you.
      </Text>
      <Button href={reviewUrl}>Log In to Review &amp; Update Status</Button>
      <Text style={paragraphStyle}>
        Thank you for helping us build a clearer, more connected recruiting
        experience for dancers and programs alike.
      </Text>
      <Text style={paragraphStyle}>
        With appreciation,
        <br />
        Abbey &amp; The Studio 2 Stadium Team
      </Text>
    </Layout>
  );
}

export default ProspectReminderEmail;
