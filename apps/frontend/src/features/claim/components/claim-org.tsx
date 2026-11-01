import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ApiSchemas } from "@/lib/api/client";
import { handleApiError } from "@/lib/api/errors";
import { useLogout } from "@/lib/session";
import { Link } from "@tanstack/react-router";
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { useState } from "react";
import { useClaimOrg } from "../api/mutations";
import { claimAccess, claimedDestination } from "../lib";

type ClaimedOrg = ApiSchemas["EventtiersClaimResponse"]["orgs"][number];

interface ClaimOrgProps {
  session: { id: string; displayEmail: string };
  token: string;
  userId: string;
}

/**
 * The page a claim link opens (ADR 0007). The route has already made sure
 * someone is signed in; this checks it is the account the link was emailed
 * to, and claims the Org for it on request.
 */
export function ClaimOrg({ session, token, userId }: ClaimOrgProps) {
  if (claimAccess(session, userId) === "wrong_account") {
    return <WrongAccount email={session.displayEmail} />;
  }

  return <ClaimForm token={token} userId={userId} />;
}

function ClaimForm({ token, userId }: { token: string; userId: string }) {
  const { mutate, isPending } = useClaimOrg();
  const [claimed, setClaimed] = useState<ClaimedOrg[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (claimed) return <Claimed orgs={claimed} />;

  const claim = () => {
    setError(null);
    mutate(
      { body: { token, userId } },
      {
        onSuccess: (data) => setClaimed(data.orgs),
        onError: handleApiError({
          onValidation: (_field, message) => setError(message),
          onError: (err) => setError(err.message),
        }),
      },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-center text-sm">
        An Org was bought for this account. Claim it to become its admin.
      </p>
      {error && <ClaimError message={error} />}
      <Button disabled={isPending} className="w-full" onClick={claim}>
        {isPending ? <Spinner label="Claiming..." /> : "Claim your Org"}
      </Button>
    </div>
  );
}

export function ClaimError({ message }: { message: string }) {
  return (
    <Alert variant="error">
      <CircleAlertIcon />
      <AlertTitle>Could not claim</AlertTitle>
      <AlertDescription>
        {message} Ask for a new claim link, or use &quot;Forgot password&quot;
        on the sign-in page: setting a new password from the email we send also
        claims your Org.
      </AlertDescription>
    </Alert>
  );
}

export function Claimed({ orgs }: { orgs: ClaimedOrg[] }) {
  const destination = claimedDestination(orgs);

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="success">
        <CircleCheckIcon />
        <AlertTitle>Org claimed</AlertTitle>
        <AlertDescription>
          You are now the admin of {orgs.map((org) => org.name).join(", ")}.
        </AlertDescription>
      </Alert>
      {destination && (
        <Button className="w-full" render={<Link {...destination} />}>
          Go to your Org
        </Button>
      )}
    </div>
  );
}

export function WrongAccount({ email }: { email: string }) {
  const { mutate, isPending } = useLogout();

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="error">
        <CircleAlertIcon />
        <AlertTitle>Different account</AlertTitle>
        <AlertDescription>
          You are signed in as {email}, but this link is for the account it was
          emailed to. Sign out, then open the link again and sign in with that
          account.
        </AlertDescription>
      </Alert>
      <Button
        disabled={isPending}
        variant="outline"
        className="w-full"
        onClick={() => mutate({})}
      >
        {isPending ? <Spinner label="Signing out..." /> : "Sign out"}
      </Button>
    </div>
  );
}
