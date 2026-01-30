import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { SparklesIcon } from "lucide-react";

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
    <Frame compact className="group h-full">
      <FramePanel className="border-none! rounded-2xl">
        <div className="relative">
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

        <div className="rounded-b-2xl relative p-3 sm:p-4 flex flex-col gap-2.5 flex-1 bg-linear-to-br from-brand/10 via-brand/5 to-background group-hover:from-brand/16 group-hover:via-brand/8 transition-colors border-b">
          <div
            className="absolute inset-0 overflow-hidden text-brand opacity-[0.12] dark:opacity-[0.06] pointer-events-none"
            aria-hidden
          >
            <SparklesIcon className="absolute -top-1 -left-2 size-13 rotate-20" />
            <SparklesIcon className="absolute top-2 left-[55%] size-7 -rotate-48" />
            <SparklesIcon className="absolute -top-2 right-[8%] size-10 rotate-5" />
            <SparklesIcon className="absolute top-[42%] left-[18%] size-6 -rotate-30" />
            <SparklesIcon className="absolute top-[55%] right-[30%] size-9 rotate-70" />
            <SparklesIcon className="absolute -bottom-2 left-[40%] size-11 -rotate-10" />
            <SparklesIcon className="absolute bottom-3 -right-2 size-8 rotate-42" />
            <SparklesIcon className="absolute -bottom-1 left-[5%] size-12 -rotate-58" />
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
