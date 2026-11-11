import type { z } from "zod";
import type { schemas } from "../../../api/schemas";

type PortfolioValues = z.infer<typeof schemas.updatePortfolio>;

/**
 * What Edit Profile sends on Save. The biography (marked `rich`, the format
 * the editor writes) goes only when it differs from the value the form
 * started with, including when it was cleared to "". An unchanged biography
 * is left out, so saving other fields keeps a `plain` biography as it was.
 */
export function portfolioSubmission(
  values: PortfolioValues,
  initialBiography: string,
): PortfolioValues {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { biography = "", biographyFormat, ...rest } = values;

  return biography === initialBiography
    ? rest
    : { ...rest, biography, biographyFormat: "rich" };
}
