import { Heading, Link, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import {
  linkStyle,
  listItemStyle,
  listStyle,
  paragraphStyle,
} from "../components/styles.js";

export interface DigestDancer {
  name: string;
  profileUrl: string;
}

export interface ProspectSubmissionsDigestEmailProps {
  schoolName: string;
  newSubmissions: DigestDancer[];
  earlySubmissions: DigestDancer[];
  reviewUrl: string;
}

function DancerList({ dancers }: { dancers: DigestDancer[] }) {
  if (dancers.length === 0) {
    return <Text style={paragraphStyle}>No submissions in this group.</Text>;
  }

  return (
    <ul style={listStyle}>
      {dancers.map((dancer) => (
        <li key={dancer.profileUrl} style={listItemStyle}>
          <Link href={dancer.profileUrl} style={linkStyle}>
            {dancer.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ProspectSubmissionsDigestEmail({
  schoolName,
  newSubmissions,
  earlySubmissions,
  reviewUrl,
}: ProspectSubmissionsDigestEmailProps) {
  return (
    <Layout preview={`Recruiting submissions ready for ${schoolName} to review`}>
      <Text style={paragraphStyle}>Hi {schoolName},</Text>
      <Text style={paragraphStyle}>
        Your latest recruiting video submissions are ready for review on Studio 2
        Stadium. You can set each prospect&rsquo;s status to{" "}
        <strong>In Review</strong>, <strong>Released</strong>, or{" "}
        <strong>Accepted</strong>.
      </Text>

      <Heading as="h2" style={{ fontSize: "18px", margin: "24px 0 8px" }}>
        New Submissions
      </Heading>
      <DancerList dancers={newSubmissions} />

      <Heading as="h2" style={{ fontSize: "18px", margin: "24px 0 8px" }}>
        Early Submissions
      </Heading>
      <DancerList dancers={earlySubmissions} />

      <Button href={reviewUrl}>Update Status</Button>
    </Layout>
  );
}

export default ProspectSubmissionsDigestEmail;
