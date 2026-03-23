import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { colors } from "./styles.js";

const LOGO_URL =
  "https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png";
const WEBSITE_ICON =
  "https://d1wf5hycmlyms9.cloudfront.net/internet-svgrepo-comdc030971-a2db-47ef-8f08-05139b6d9d36.png";
const EMAIL_ICON =
  "https://d1wf5hycmlyms9.cloudfront.net/email-1-svgrepo-com58963abb-0d7a-42ed-8a5d-94b32cc0a961.png";
const INSTAGRAM_ICON =
  "https://d1wf5hycmlyms9.cloudfront.net/instagram-svgrepo-comf0d9724b-9028-4fc1-9d8c-448fa0299188.png";
const TIKTOK_ICON =
  "https://d1wf5hycmlyms9.cloudfront.net/tiktok-svgrepo-com20fe26ac-4505-4ec0-8a6d-9cb2c71d60eb.png";

export function Footer() {
  return (
    <Section style={{ marginTop: "32px" }}>
      <Row>
        <Column style={{ width: "45%", verticalAlign: "middle" }}>
          <Img
            src={LOGO_URL}
            style={{ margin: "0 auto" }}
            alt="Studio 2 Stadium"
            width="100"
            height="auto"
          />
        </Column>

        <Column
          style={{
            verticalAlign: "middle",
            textAlign: "center" as const,
          }}>
          <div
            style={{
              width: "1px",
              height: "100px",
              backgroundColor: colors.border,
              margin: "0",
            }}
          />
        </Column>

        <Column style={{ width: "45%", verticalAlign: "middle" }}>
          <table cellPadding={0} cellSpacing={4}>
            <tbody>
              <tr>
                <td>
                  <Link
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: "12px",
                    }}
                    href="https://studio2stadium.com">
                    <Img
                      src={WEBSITE_ICON}
                      alt="Website"
                      width="16"
                      height="16"
                      style={{ marginRight: "8px" }}
                    />
                    studio2stadium.com
                  </Link>
                </td>
              </tr>
              <tr>
                <td>
                  <Link
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: "12px",
                    }}
                    href="mailto:info@studio2stadium.com">
                    <Img
                      src={EMAIL_ICON}
                      alt="Email"
                      width="16"
                      height="16"
                      style={{ marginRight: "8px" }}
                    />
                    info@studio2stadium.com
                  </Link>
                </td>
              </tr>
              <tr>
                <td>
                  <Link
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: "12px",
                    }}
                    href="https://instagram.com/studio2stadium_">
                    <Img
                      src={INSTAGRAM_ICON}
                      alt="Instagram"
                      width="16"
                      height="16"
                      style={{ marginRight: "8px" }}
                    />
                    studio2stadium_
                  </Link>
                </td>
              </tr>
              <tr>
                <td>
                  <Link
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: "12px",
                    }}
                    href="https://tiktok.com/@studio2stadium">
                    <Img
                      src={TIKTOK_ICON}
                      alt="TikTok"
                      width="16"
                      height="16"
                      style={{ marginRight: "8px" }}
                    />
                    studio2stadium
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </Column>
      </Row>
      <Text
        style={{
          fontSize: "12px",
          color: colors.textMuted,
          textAlign: "center" as const,
          margin: "16px 0 0",
        }}>
        &copy; {new Date().getFullYear()} Studio 2 Stadium. All rights reserved.
      </Text>
    </Section>
  );
}
