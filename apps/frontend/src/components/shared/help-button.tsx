import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { HelpCircleIcon } from "lucide-react";

/**
 * The top-bar "?" button. Opens the FAQ page, which includes a Contact Us form
 * at the bottom. The FAQ content is tailored to the signed-in account type.
 */
export function HelpButton() {
  return (
    <Button
      size="icon"
      variant="secondary"
      className="rounded-full"
      render={<Link to="/faq" />}
    >
      <HelpCircleIcon className="size-5" />
      <span className="sr-only">Help &amp; FAQ</span>
    </Button>
  );
}
