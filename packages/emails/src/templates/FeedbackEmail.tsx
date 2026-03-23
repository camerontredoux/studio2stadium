import { Hr, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors, headingStyle, paragraphStyle } from "../components/styles.js";

export interface FeedbackEmailProps {
  type: "bug" | "feature" | "improvement" | "other";
  message: string;
  page?: string;
  userId: string;
  userEmail: string;
  userName: string;
}

const typeLabels: Record<FeedbackEmailProps["type"], string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  improvement: "Improvement Suggestion",
  other: "Feedback",
};

export function FeedbackEmail({
  type,
  message,
  page,
  userId,
  userEmail,
  userName,
}: FeedbackEmailProps) {
  return (
    <Layout preview={`${typeLabels[type]} from ${userName}`}>
      <Text style={headingStyle}>{typeLabels[type]}</Text>
      <Text style={paragraphStyle}>
        <strong>From:</strong> {userName} ({userEmail})
      </Text>
      <Text style={paragraphStyle}>
        <strong>User ID:</strong> {userId}
      </Text>
      {page && (
        <Text style={paragraphStyle}>
          <strong>Page:</strong> {page}
        </Text>
      )}
      <Hr style={{ borderColor: colors.border, margin: "16px 0" }} />
      <Text style={{ ...paragraphStyle, whiteSpace: "pre-wrap" }}>
        {message}
      </Text>
    </Layout>
  );
}

export default FeedbackEmail;
