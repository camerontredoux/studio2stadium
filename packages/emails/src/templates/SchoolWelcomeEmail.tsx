import { Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import {
  listItemStyle,
  listStyle,
  paragraphStyle,
} from "../components/styles.js";

export interface SchoolWelcomeEmailProps {
  firstName: string;
  schoolName: string;
  dashboardUrl: string;
}

export function SchoolWelcomeEmail({
  firstName,
  schoolName,
  dashboardUrl,
}: SchoolWelcomeEmailProps) {
  return (
    <Layout preview={`Welcome to the Studio 2 Stadium community!`}>
      <Text style={paragraphStyle}>Hi {firstName},</Text>
      <Text style={paragraphStyle}>
        Welcome to the Studio 2 Stadium community! Your account for{" "}
        <strong>{schoolName}</strong> is now live and verified.
      </Text>
      <Text style={paragraphStyle}>
        Here's a quick guide to help you get started:
      </Text>
      <ol style={listStyle}>
        <li style={listItemStyle}>
          <strong>Explore prospects</strong> - Browse dancer profiles and use
          filters to find the perfect fit for your program.
        </li>
        <li style={listItemStyle}>
          <strong>Use the Prospect Status tool</strong> - Update dancers on their
          recruiting status to keep communication clear and organized.
        </li>
        <li style={listItemStyle}>
          <strong>Favorite profiles</strong> - Save dancers you're interested in
          to easily track and compare your top prospects.
        </li>
        <li style={listItemStyle}>
          <strong>Post events</strong> - Share upcoming clinics, auditions, and
          other events with dancers who follow your program.
        </li>
      </ol>
      <Button href={dashboardUrl}>Go to Your Dashboard</Button>
      <Text style={paragraphStyle}>
        We're excited to have you on board and look forward to helping you
        connect with talented dancers!
      </Text>
      <Text style={paragraphStyle}>
        Warmly,
        <br />
        Abbey Nugent & The Studio 2 Stadium Team
      </Text>
    </Layout>
  );
}

export default SchoolWelcomeEmail;
