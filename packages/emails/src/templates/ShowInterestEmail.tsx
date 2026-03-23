import { Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import { paragraphStyle } from "../components/styles.js";

export interface ShowInterestEmailProps {
  schoolName: string;
  dancerName: string;
  dancerProfileUrl: string;
  interestCount: number;
}

export function ShowInterestEmail({
  schoolName,
  dancerName,
  dancerProfileUrl,
  interestCount,
}: ShowInterestEmailProps) {
  const countText =
    interestCount === 1
      ? "This is their first time showing interest"
      : `They've shown interest ${interestCount} times`;

  return (
    <Layout preview={`${dancerName} is interested in ${schoolName}!`}>
      <Text style={paragraphStyle}>Great news!</Text>
      <Text style={paragraphStyle}>
        <strong>{dancerName}</strong> just showed interest in{" "}
        <strong>{schoolName}</strong>.
      </Text>
      <Text style={paragraphStyle}>{countText}.</Text>
      <Button href={dancerProfileUrl}>View Their Profile</Button>
    </Layout>
  );
}

export default ShowInterestEmail;
