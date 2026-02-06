import { MainLogo } from "@/components/shared/main-logo";

export function PendingComponent() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6">
      <MainLogo className="h-5 dark:invert" />
      <div className="bg-border h-0.5 w-36 overflow-hidden rounded-full">
        <div className="bg-brand animate-loading-bar h-full w-2/5 rounded-full" />
      </div>
    </div>
  );
}
