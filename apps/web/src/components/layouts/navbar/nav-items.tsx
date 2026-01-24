import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/features/auth/api/mutations";
import { useSession } from "@/features/auth/api/queries";
import { $api } from "@/lib/api/client";
import { Link } from "@tanstack/react-router";

export function DancerNavItems() {
  const { session } = useSession();

  const { mutate, isPending } = useLogout();

  const test = $api.useMutation("post", "/auth/test");

  return (
    <div className="flex items-center gap-2">
      <Link to="/">For You</Link>
      <Link to="/u/$username" params={{ username: session.username! }}>
        Profile
      </Link>
      <Link to="/explore">Explore</Link>
      <Link
        to="/u/$username/recruiting"
        params={{ username: session.username! }}
      >
        Recruiting
      </Link>
      <Link to="/events">Events</Link>
      <Link to="/resources">Resources</Link>
      <Button
        disabled={isPending}
        variant="outline"
        size="sm"
        onClick={() => mutate(undefined)}
      >
        {isPending ? (
          <>
            <Spinner />
            Logging out...
          </>
        ) : (
          "Logout"
        )}
      </Button>
      <Button
        disabled={test.isPending}
        variant="outline"
        size="sm"
        onClick={() => test.mutate(undefined)}
      >
        {isPending ? (
          <>
            <Spinner />
            Logging out...
          </>
        ) : (
          "401"
        )}
      </Button>
    </div>
  );
}

export function SchoolNavItems() {
  const { session } = useSession();
  const logout = useLogout();

  return (
    <div className="flex items-center gap-2">
      <Link to="/">For You</Link>
      <Link to="/school/$username" params={{ username: session.username! }}>
        Profile
      </Link>
      <Link to="/explore">Explore</Link>
      <Link
        to="/school/$username/recruiting"
        params={{ username: session.username! }}
      >
        Recruiting
      </Link>
      <Link to="/events">Events</Link>
      <Button
        disabled={logout.isPending}
        variant="outline"
        size="sm"
        onClick={() => logout.mutate(undefined)}
      >
        {logout.isPending ? (
          <>
            <Spinner />
            Logging out...
          </>
        ) : (
          "Logout"
        )}
      </Button>
    </div>
  );
}
