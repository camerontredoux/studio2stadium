import { Badge } from "@/components/ui/badge";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import type { CSSProperties, ReactNode } from "react";

const SPARKLE_MASK =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 100' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><defs><g id='s'><path d='M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z'/><path d='M20 2v4'/><path d='M22 4h-4'/><circle cx='4' cy='20' r='2'/></g></defs><use href='%23s' transform='translate(-8,-12) scale(2.17) rotate(20,12,12)'/><use href='%23s' transform='translate(165,7) scale(0.95) rotate(-48,12,12)'/><use href='%23s' transform='translate(252,-8) scale(1.35) rotate(5,12,12)'/><use href='%23s' transform='translate(54,42) scale(1) rotate(-30,12,12)'/><use href='%23s' transform='translate(174,55) scale(1.2) rotate(70,12,12)'/><use href='%23s' transform='translate(120,88) scale(1.83) rotate(-10,12,12)'/><use href='%23s' transform='translate(280,76) scale(1.05) rotate(42,12,12)'/><use href='%23s' transform='translate(15,92) scale(2) rotate(-58,12,12)'/></svg>";

const sparkleMaskStyle = {
  maskImage: `url("${SPARKLE_MASK}")`,
  WebkitMaskImage: `url("${SPARKLE_MASK}")`,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
} as CSSProperties;

interface ContentCardProps {
  image: string;
  imageAlt: string;
  badge?: string;
  title: string;
  footer: ReactNode;
  children?: ReactNode;
}

export function ContentCard({
  image,
  imageAlt,
  badge,
  title,
  footer,
  children,
}: ContentCardProps) {
  return (
    <Frame
      compact
      className="group"
    >
      <FramePanel side="top">
        <div className="relative isolate transform-gpu border-b">
          <img
            loading="lazy"
            src={image}
            alt={imageAlt}
            className="h-48 w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/80 to-transparent" />
          {badge && (
            <Badge
              variant="brand"
              className="absolute top-2.5 left-2.5 capitalize"
            >
              {badge}
            </Badge>
          )}
        </div>

        <div className="from-brand/10 via-background to-background group-hover:from-brand/8 group-hover:via-brand/4 relative flex flex-1 flex-col gap-2.5 bg-linear-to-br p-3 transition-colors duration-75 sm:p-4">
          <div
            className="bg-brand pointer-events-none absolute inset-0 opacity-[0.12] dark:opacity-[0.06]"
            style={sparkleMaskStyle}
            aria-hidden
          />
          <div className="flex flex-1 flex-col gap-1.5">
            <h3 className="group-hover:text-brand truncate text-base leading-snug font-semibold transition-colors">
              {title}
            </h3>
            {children}
          </div>
        </div>
      </FramePanel>

      <FrameFooter className="gap-2 px-3 py-2.5 sm:px-4">{footer}</FrameFooter>
    </Frame>
  );
}
