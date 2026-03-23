import { render } from "@react-email/render";
import type { ReactElement } from "react";

export async function renderEmail(template: ReactElement): Promise<string> {
  return render(template);
}

export async function renderEmailText(template: ReactElement): Promise<string> {
  return render(template, { plainText: true });
}
