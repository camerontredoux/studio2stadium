import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { CheckIcon } from "lucide-react";

interface SuccessViewProps {
  schoolCount: number;
  onViewSubmissions: () => void;
}

export function SuccessView({
  schoolCount,
  onViewSubmissions,
}: SuccessViewProps) {
  return (
    <Empty className="h-full border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CheckIcon className="text-success-foreground" />
        </EmptyMedia>
        <EmptyTitle>Submissions Sent</EmptyTitle>
        <EmptyDescription>
          Your video has been submitted to {schoolCount} school
          {schoolCount !== 1 ? "s" : ""}. You can track their responses on the
          recruiting dashboard.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onViewSubmissions}>View Submissions</Button>
      </EmptyContent>
    </Empty>
    // <div className="flex flex-col items-center justify-center gap-6 py-20 text-center max-lg:pb-24">
    //   <div className="relative">
    //     <div className="bg-success/10 rounded-full p-6">
    //       <CheckIcon className="text-success-foreground size-10" />
    //     </div>
    //   </div>
    //   <div className="flex flex-col gap-1.5">
    //     <h2 className="text-2xl font-bold tracking-tight">Submissions Sent</h2>
    //     <p className="text-muted-foreground max-w-md">
    //       Your video has been submitted to {schoolCount} school
    //       {schoolCount !== 1 ? "s" : ""}. You can track their responses on the
    //       recruiting dashboard.
    //     </p>
    //   </div>
    //   <Button size="lg" onClick={onViewSubmissions}>
    //     View Submissions
    //   </Button>
    // </div>
  );
}
