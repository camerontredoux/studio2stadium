import { Badge } from "@/components/ui/badge";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import type { ReactNode } from "react";

const SPARKLE_CLASSES = [
  "absolute -top-1 -left-2 size-13 rotate-20",
  "absolute top-2 left-[55%] size-7 -rotate-48",
  "absolute -top-2 right-[8%] size-10 rotate-5",
  "absolute top-[42%] left-[18%] size-6 -rotate-30",
  "absolute top-[55%] right-[30%] size-9 rotate-70",
  "absolute -bottom-2 left-[40%] size-11 -rotate-10",
  "absolute bottom-3 -right-2 size-8 rotate-42",
  "absolute -bottom-1 left-[5%] size-12 -rotate-58",
] as const;

const SPARKLE_PATH =
  "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z";

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
    <Frame compact className="group [content-visibility:auto] [contain-intrinsic-block-size:auto_250px]">
      <FramePanel side="top">
        <div className="relative border-b">
          <img
            src={image}
            alt={imageAlt}
            className="w-full h-32 sm:h-36 object-cover"
          />
          <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/80 to-transparent pointer-events-none" />
          {badge && (
            <Badge variant="brand" className="absolute top-2.5 left-2.5">
              {badge}
            </Badge>
          )}
        </div>

        <div className="relative p-3 sm:p-4 flex flex-col gap-2.5 flex-1 bg-linear-to-br from-brand/10 via-brand/5 to-background group-hover:from-brand/16 group-hover:via-brand/8 transition-colors">
          <div
            className="absolute inset-0 overflow-hidden text-brand opacity-[0.12] dark:opacity-[0.06] pointer-events-none"
            aria-hidden
          >
            {SPARKLE_CLASSES.map((cn, i) => (
              <svg
                key={i}
                className={cn}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={SPARKLE_PATH} />
                <path d="M20 2v4" />
                <path d="M22 4h-4" />
                <circle cx="4" cy="20" r="2" />
              </svg>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <h3 className="font-semibold text-sm sm:text-base leading-snug line-clamp-2 sm:min-h-11 group-hover:text-brand transition-colors">
              {title}
            </h3>
            {children}
          </div>
        </div>
      </FramePanel>

      <FrameFooter className="gap-2 px-3 sm:px-4 py-2.5">{footer}</FrameFooter>
    </Frame>
  );
}
