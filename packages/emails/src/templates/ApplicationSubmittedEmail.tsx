import { Text } from "@react-email/components";
import { Button } from "../components/Button.js";
import { Layout } from "../components/Layout.js";
import { headingStyle, paragraphStyle } from "../components/styles.js";

export interface ApplicationSubmittedEmailProps {
  schoolName: string;
  applicantName: string;
  applicantEmail: string;
  submittedAt: string;
  applicationsUrl: string;
}

export function ApplicationSubmittedEmail({
  schoolName,
  applicantName,
  applicantEmail,
  submittedAt,
  applicationsUrl,
}: ApplicationSubmittedEmailProps) {
  return (
    <Layout preview={`New school application: ${schoolName}`}>
      <Text style={headingStyle}>New School Application</Text>
      <Text style={paragraphStyle}>
        <strong>School:</strong> {schoolName}
      </Text>
      <Text style={paragraphStyle}>
        <strong>Applicant:</strong> {applicantName} ({applicantEmail})
      </Text>
      <Text style={paragraphStyle}>
        <strong>Submitted:</strong> {submittedAt}
      </Text>
      <Button href={applicationsUrl}>Review Application</Button>
    </Layout>
  );
}

export default ApplicationSubmittedEmail;
