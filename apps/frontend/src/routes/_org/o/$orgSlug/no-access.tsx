import { createFileRoute, Link } from "@tanstack/react-router";
import { OrgAuthLayout } from "@/features/org/components/org-auth-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRosterClaim } from "@/features/org/api/roster-claim-queries";
import { CheckCircle2Icon, ShieldXIcon } from "lucide-react";
import { useState } from "react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Route = createFileRoute("/_org/o/$orgSlug/no-access")({
  component: NoAccessPage,
});

function NoAccessPage() {
  const { orgSlug } = Route.useParams();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [claimedEmail, setClaimedEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createClaim = useCreateRosterClaim();

  const trimmedEmail = claimedEmail.trim();
  const emailInvalid =
    trimmedEmail.length > 0 && !EMAIL_PATTERN.test(trimmedEmail);
  const canSubmit =
    firstName.trim().length > 0 && lastName.trim().length > 0 && !emailInvalid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      await createClaim.mutateAsync({
        params: { path: { slug: orgSlug } },
        body: {
          claimedFirstName: firstName.trim(),
          claimedLastName: lastName.trim(),
          claimedEmail: claimedEmail.trim() || undefined,
          note: note.trim() || undefined,
        },
      });
      setSubmitted(true);
    } catch (err) {
      const e2 = err as { code?: string; message?: string };
      setError(
        e2?.code === "ALREADY_ON_ROSTER"
          ? "This account is already on the roster. Try refreshing the page."
          : (e2?.message ?? "Could not send your request. Please try again."),
      );
    }
  };

  if (submitted) {
    return (
      <OrgAuthLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-success/10 flex size-12 items-center justify-center rounded-full">
            <CheckCircle2Icon className="text-success size-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">Request sent</h2>
            <p className="text-muted-foreground text-sm">
              The event organizer will review your request and connect your
              account to your registration. You&rsquo;ll see the event here once
              they do.
            </p>
          </div>
          <Link
            to="/"
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            Go home
          </Link>
        </div>
      </OrgAuthLayout>
    );
  }

  return (
    <OrgAuthLayout>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-muted flex size-12 items-center justify-center rounded-full">
          <ShieldXIcon className="text-muted-foreground size-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">No event access</h2>
          <p className="text-muted-foreground text-sm">
            You are not on the roster for this event. If a parent or studio
            registered you, it may be under a different email. Let the organizer
            know and they can connect it to this account.
          </p>
        </div>

        {!showForm ? (
          <div className="flex w-full flex-col gap-2">
            <Button className="w-full" onClick={() => setShowForm(true)}>
              I&rsquo;m registered for this event
            </Button>
            <Link
              to="/"
              className={buttonVariants({
                variant: "ghost",
                className: "w-full",
              })}
            >
              Go home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-3 text-left">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="claim-first">First name</Label>
                <Input
                  id="claim-first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="claim-last">Last name</Label>
                <Input
                  id="claim-last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="claim-email">
                Email used to register{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="claim-email"
                type="email"
                value={claimedEmail}
                onChange={(e) => setClaimedEmail(e.target.value)}
                placeholder="Email"
                aria-invalid={emailInvalid}
              />
              {emailInvalid ? (
                <p className="text-destructive text-xs">
                  Enter a valid email address.
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Helps the organizer find you faster. Leave blank if unsure.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="claim-note">
                Anything else{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="claim-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Studio name, bib number, or anything that identifies you"
                rows={3}
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex flex-col gap-2 pt-1">
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || createClaim.isPending}
              >
                {createClaim.isPending ? (
                  <Spinner label="Sending…" />
                ) : (
                  "Send request"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </OrgAuthLayout>
  );
}
