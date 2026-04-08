import { useState } from "react";
import { useOrg } from "@/features/org/context/use-org";
import { $api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrgLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { org } = useOrg();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = $api.useMutation("post", "/auth/login");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ body: { email, password } });
      onSuccess();
    } catch {
      setError("Incorrect email or password.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-sm space-y-6 p-6"
      style={{ color: "white" }}
    >
      {org.logoUrl && (
        <img src={org.logoUrl} alt={org.name} className="mx-auto h-16 w-auto" />
      )}
      <h1 className="text-center text-2xl font-semibold">Welcome to {org.name}</h1>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-12 text-base"
        />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <Button
        type="submit"
        disabled={login.isPending}
        className="h-12 w-full text-base font-semibold"
        style={{ background: "var(--org-accent, #e94560)", color: "white" }}
      >
        {login.isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
