import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { useSession } from "@/lib/session";
import { readinessOf, usePremiumRoadmap } from "@/shared/premium-roadmap/hooks";
import { Link } from "@tanstack/react-router";
import { TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";

/**
 * Explains that following (favoriting) a program sends the dancer's profile to
 * the coach, and warns when the profile or video isn't finished. Following
 * happens only when the dancer picks Continue.
 */
export function FollowConfirmDialog({
  open,
  onOpenChange,
  school,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: { id: string; name: string };
  onConfirm: () => void;
}) {
  const session = useSession();
  const { roadmap } = usePremiumRoadmap();
  // Dancers without a roadmap get the ready variant: there is no cheap
  // readiness signal for them.
  const readiness = readinessOf(roadmap);
  const ready = readiness !== "not_ready";

  useEffect(() => {
    if (open) {
      track("premium_favorite_disclosure_viewed", {
        program_id: school.id,
        readiness,
        roadmap_version: roadmap?.version,
      });
    }
    // Send once per opening, with the readiness shown at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleContinue = () => {
    track("premium_favorite_confirmed", {
      program_id: school.id,
      readiness,
      roadmap_version: roadmap?.version,
    });
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Connect with this program</AlertDialogTitle>
          <AlertDialogDescription>
            Favoriting {school.name} will follow the school and send your S2S
            profile directly to the coach.
            {/* When not ready, the review prompt moves into the warning. */}
            {ready && " Review your profile and video before continuing."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!ready && (
          <div className="px-6 pb-4">
            <Alert variant="warning">
              <TriangleAlertIcon />
              <AlertTitle>Your profile or video isn't finished</AlertTitle>
              <AlertDescription>
                The coach will see your profile as it is now. Review your
                profile and video before continuing.
              </AlertDescription>
            </Alert>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogClose
            render={<Button variant="ghost" className="sm:mr-auto" />}
          >
            Not Yet
          </AlertDialogClose>
          <Button
            variant="outline"
            render={
              <Link to="/$username" params={{ username: session.username }} />
            }
          >
            Review Profile
          </Button>
          <Button onClick={handleContinue}>Continue</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
