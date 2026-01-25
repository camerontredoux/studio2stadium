import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/features/login/api/mutations";
import { useSession } from "@/features/login/api/queries";
import { Link } from "@tanstack/react-router";

export function DancerNavItems() {
  const { session } = useSession();

  const { mutate, isPending } = useLogout();

  return (
    <div className="flex items-center gap-2">
      <Link to="/">For You</Link>
      <Link to="/u/$username" params={{ username: session.username }}>
        Profile
      </Link>
      <Link to="/explore">Explore</Link>
      <Link
        to="/u/$username/recruiting"
        params={{ username: session.username }}
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
    </div>
  );
}

export function SchoolNavItems() {
  const { session } = useSession();
  const logout = useLogout();

  return (
    <div className="flex items-center gap-2">
      <Link to="/">For You</Link>
      <Link to="/school/$username" params={{ username: session.username }}>
        Profile
      </Link>
      <Link to="/explore">Explore</Link>
      <Link
        to="/school/$username/recruiting"
        params={{ username: session.username }}
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
