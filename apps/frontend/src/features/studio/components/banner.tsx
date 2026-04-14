import {
  Frame,
  FramePanel,
} from "@/components/ui/frame";
import { MapPinIcon } from "lucide-react";

export function StudioBanner() {
  return (
    <Frame compact>
      <FramePanel side="top">
        <div className="relative isolate transform-gpu overflow-clip border-b">
          <img
            src={"https://pointemagazine.com/wp-content/uploads/2023/12/Hoyun-KANG-Sujet-%C2%A9Loboff-OnP-05-hd_Web_R1-1024x825.webp"}
            alt={"test"}
            className="h-48 w-full scale-105 rounded-2xl object-cover sm:h-64"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/70 via-black/20 to-transparent" />
        </div>

        <img
          src={"https://images.unsplash.com/photo-1557053910-d9eadeed1c58?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8d29tYW4lMjBwb3J0cmFpdHxlbnwwfHwwfHx8MA%3D%3D"}
          alt={"test"}
          className="absolute top-28 left-4 z-20 size-18 rounded-full bg-black object-cover shadow-xs sm:top-36 sm:size-32"
        />

        <div className="from-brand/10 via-brand/5 to-background relative flex flex-col gap-2 bg-linear-to-br px-6 pb-5 pt-6">
          <div className="flex flex-col gap-y-1 text-sm">
            <h1 className="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
              Dance Studio
            </h1>
            <div className="flex flex-row items-center gap-x-1.5 text-brand">
              <MapPinIcon className="size-4 shrink-0" />
              <h2 className="leading-tight font-normal tracking-tight sm:text-base">
                Boulder, CO
              </h2>
            </div>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}