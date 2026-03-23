import { Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import { paragraphStyle } from "../components/styles.js";

export interface SchoolJoinedEmailProps {
  dancerName: string;
  upgradeUrl: string;
}

export function SchoolJoinedEmail({ dancerName, upgradeUrl }: SchoolJoinedEmailProps) {
  return (
    <Layout
      preview={`A new school joined — upgrade to explore programs on Studio 2 Stadium`}>
      <Text style={paragraphStyle}>Hi {dancerName},</Text>
      <Text style={paragraphStyle}>
        A new school just joined Studio 2 Stadium!
      </Text>
      <Text style={paragraphStyle}>
        Don&apos;t miss your chance to explore their profile including upcoming
        event details, team expectations, and exclusive program insights from
        the coach.
      </Text>
      <Text style={paragraphStyle}>
        More schools are joining every week. Don&apos;t get left behind.
      </Text>
      <Text style={paragraphStyle}>
        Upgrade to Premium now and take the lead in your dance journey!
      </Text>
      <Button href={upgradeUrl}>Upgrade to Premium</Button>
    </Layout>
  );
}

export default SchoolJoinedEmail;
