import { Loader2Icon } from "lucide-react";

import { cn } from "@/components/utils/cn";

function Spinner({
  className,
  label,
  ...props
}: React.ComponentProps<typeof Loader2Icon> & { label?: string }) {
  return (
    <>
      <Loader2Icon
        aria-label="Loading"
        className={cn("animate-spin", className)}
        role="status"
        {...props}
      />
      {label}
    </>
  );
}

export { Spinner };
