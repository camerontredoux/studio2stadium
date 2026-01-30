import { MainLogo } from "@/components/shared/main-logo";

export function PendingComponent() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center gap-6">
      <MainLogo className="h-5 dark:invert" />
      <div className="w-36 h-0.5 rounded-full bg-border overflow-hidden">
        <div className="h-full w-2/5 rounded-full bg-brand animate-loading-bar" />
      </div>
    </div>
  );
}
