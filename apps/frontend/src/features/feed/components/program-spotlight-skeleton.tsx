import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SparklesIcon } from "lucide-react";

export function ProgramSpotlightSkeleton() {
  return (
    <div className="overflow-clip rounded-2xl border">
      <div className="from-brand/10 via-brand/5 to-background relative overflow-clip bg-linear-to-br p-4">
        <div className="text-brand absolute -top-1 -left-2 -z-10 flex items-center gap-2 opacity-10">
          <SparklesIcon className="size-24 rotate-6" />
          <SparklesIcon className="size-16 rotate-186" />
        </div>
        <div className="flex justify-between gap-2">
          <h2 className="font-semibold">Program Spotlight</h2>
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
        <p className="text-muted-foreground text-sm">
          Based on your profile and preferences
        </p>
      </div>
      <div className="from-brand/10 via-background to-background grid grid-cols-1 gap-2 border-t bg-linear-to-tl p-2 sm:grid-cols-2 sm:gap-4 sm:p-4">
        <Skeleton className="aspect-video rounded-2xl" />
        <div className="flex flex-col gap-2 sm:gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="space-y-2">
              <h3 className="text-muted-foreground text-sm">
                Program Strengths
              </h3>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="mt-0.5 flex flex-1 items-center gap-2">
              <Button className="w-full">View Program</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
