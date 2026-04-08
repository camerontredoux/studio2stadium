import { useState } from "react";
import { useOrg } from "@/features/org/context/use-org";
import { $api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrgRegisterForm({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: () => void;
}) {
  const { org } = useOrg();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const register = $api.useMutation("post", "/orgs/{slug}/register");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({
        params: { path: { slug: org.slug } },
        body: { token, firstName, lastName, password },
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setError(msg ?? "Your invite link is invalid or expired.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-sm space-y-5 p-6 text-white"
    >
      {org.logoUrl && (
        <img src={org.logoUrl} alt={org.name} className="mx-auto h-16" />
      )}
      <h1 className="text-center text-2xl font-semibold">
        You're in! Let's finish your {org.name} profile.
      </h1>
      <p className="text-center text-sm opacity-80">
        This link is just for you. Takes 30 seconds.
      </p>
      <div className="space-y-2">
        <Label htmlFor="firstName" className="text-white">
          First name
        </Label>
        <Input
          id="firstName"
          autoFocus
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName" className="text-white">
          Last name
        </Label>
        <Input
          id="lastName"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">
          Create a password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 text-base"
        />
        <p className="text-xs opacity-70">At least 8 characters.</p>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <Button
        type="submit"
        disabled={register.isPending}
        className="h-12 w-full text-base font-semibold"
        style={{ background: "var(--org-accent)", color: "white" }}
      >
        {register.isPending ? "Creating account..." : "Finish sign up"}
      </Button>
    </form>
  );
}
