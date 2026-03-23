import { Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import {
  colors,
  listItemStyle,
  listStyle,
  paragraphStyle,
} from "../components/styles.js";

export interface ProspectStatusEmailProps {
  dancerName: string;
  schoolName: string;
  status: "accepted" | "in_review" | "released";
  submissionsUrl: string;
}

const statusConfig = {
  accepted: {
    color: colors.statusAccepted,
    title: "Congratulations!",
    message: "has moved you forward in their recruiting process",
    description:
      "This is exciting news - the program is interested in you and wants to continue the conversation. This could mean they're inviting you to visit campus, have a call with coaches, or take the next step in their process.",
    nextSteps: [
      "Check your email for any follow-up communication from the program",
      "Prepare questions you'd like to ask about the team and program",
      "Continue updating your profile with new achievements and videos",
    ],
  },
  in_review: {
    color: colors.statusInReview,
    title: "You're on their radar!",
    message: "is now reviewing your submission",
    description:
      "Great news - the coaching staff is actively reviewing your profile and CRV. They're considering you among their prospects for their program.",
    nextSteps: [
      "Keep your profile updated with your latest achievements",
      "Make sure your videos showcase your best work",
      "Stay patient - the review process takes time",
    ],
  },
  released: {
    color: colors.statusReleased,
    title: "Status Update",
    message: "has updated your recruiting status",
    description:
      "While this particular program has decided to move in a different direction, remember that your recruiting journey is just beginning. There are many programs out there looking for dancers just like you.",
    nextSteps: [
      "Don't get discouraged - this is a normal part of the recruiting process",
      "Continue exploring and connecting with other programs",
      "Use this as motivation to keep improving and showcasing your talent",
    ],
  },
};

export function ProspectStatusEmail({
  dancerName,
  schoolName,
  status,
  submissionsUrl,
}: ProspectStatusEmailProps) {
  const config = statusConfig[status];

  return (
    <Layout preview={`Recruiting Update from ${schoolName}`}>
      <Text style={paragraphStyle}>Hi {dancerName},</Text>

      <Text
        style={{
          ...paragraphStyle,
          fontSize: "20px",
          fontWeight: "600",
          color: config.color,
        }}
      >
        {config.title}
      </Text>

      <Text style={paragraphStyle}>
        <strong>{schoolName}</strong> {config.message}.
      </Text>

      <Text style={paragraphStyle}>{config.description}</Text>

      <Text style={{ ...paragraphStyle, fontWeight: "600" }}>
        What You Can Do Next:
      </Text>
      <ul style={listStyle}>
        {config.nextSteps.map((step, index) => (
          <li key={index} style={listItemStyle}>
            {step}
          </li>
        ))}
      </ul>

      <Button href={submissionsUrl}>View Your Submissions</Button>

      <Text style={paragraphStyle}>
        Best of luck,
        <br />
        The Studio 2 Stadium Team
      </Text>
    </Layout>
  );
}

export default ProspectStatusEmail;
