import { Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { Button } from "../components/Button.js";
import { paragraphStyle } from "../components/styles.js";

export interface PaymentFailedEmailProps {
  firstName: string;
  /** The day the member loses Premium if the card is not updated. */
  accessEndsOn: string;
  membershipUrl: string;
}

export function PaymentFailedEmail({
  firstName,
  accessEndsOn,
  membershipUrl,
}: PaymentFailedEmailProps) {
  return (
    <Layout preview="Update your card to keep your Studio 2 Stadium Premium access">
      <Text style={paragraphStyle}>Hi {firstName},</Text>
      <Text style={paragraphStyle}>
        We couldn't process the payment to renew your Studio 2 Stadium
        Premium membership. Your card may have expired, or your bank may
        have declined the charge.
      </Text>
      <Text style={paragraphStyle}>
        You keep full Premium access while we retry the payment. If the
        payment still hasn't gone through by <strong>{accessEndsOn}</strong>,
        your Premium access ends on that day.
      </Text>
      <Text style={paragraphStyle}>
        To keep your access, update your card. Go to Membership settings and
        select Manage billing.
      </Text>
      <Button href={membershipUrl}>Update your card</Button>
      <Text style={paragraphStyle}>
        If you have already updated your card, you can ignore this email.
      </Text>
      <Text style={paragraphStyle}>
        Warmly,
        <br />
        The Studio 2 Stadium Team
      </Text>
    </Layout>
  );
}

export default PaymentFailedEmail;
