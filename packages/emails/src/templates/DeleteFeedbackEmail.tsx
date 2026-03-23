import { Hr, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors, headingStyle, paragraphStyle } from "../components/styles.js";

export interface DeleteFeedbackEmailProps {
  userId: string;
  userEmail: string;
  userName: string;
  feedback?: string;
}

export function DeleteFeedbackEmail({
  userId,
  userEmail,
  userName,
  feedback,
}: DeleteFeedbackEmailProps) {
  return (
    <Layout preview="Account Deleted">
      <Text style={headingStyle}>Account Deleted</Text>
      <Text style={paragraphStyle}>
        <strong>User:</strong> {userName} ({userEmail})
      </Text>
      <Text style={paragraphStyle}>
        <strong>User ID:</strong> {userId}
      </Text>
      {feedback ? (
        <>
          <Hr style={{ borderColor: colors.border, margin: "16px 0" }} />
          <Text style={paragraphStyle}>
            <strong>Feedback:</strong>
          </Text>
          <Text style={{ ...paragraphStyle, whiteSpace: "pre-wrap" }}>
            {feedback}
          </Text>
        </>
      ) : (
        <Text style={{ ...paragraphStyle, fontStyle: "italic" }}>
          No feedback provided
        </Text>
      )}
    </Layout>
  );
}

export default DeleteFeedbackEmail;
