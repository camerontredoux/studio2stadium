import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame"
import {
  MapPinIcon,
} from "lucide-react";

export default function ProfileBanner() {
  return (
     <Frame compact>
      <FramePanel side="top">
        <div className="relative isolate transform-gpu overflow-clip border-b">
          <img
            src={"https://pointemagazine.com/wp-content/uploads/2023/12/Hoyun-KANG-Sujet-%C2%A9Loboff-OnP-05-hd_Web_R1-1024x825.webp"}
            alt={"test"}
            className="h-48 w-full scale-105 rounded-2xl object-cover blur-sm sm:h-64"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/70 via-black/20 to-transparent" />
        </div>

        <img
            src={"https://images.unsplash.com/photo-1557053910-d9eadeed1c58?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8d29tYW4lMjBwb3J0cmFpdHxlbnwwfHwwfHx8MA%3D%3D"}
          alt={"test"}
          className="absolute top-31 left-4 z-20 size-20 rounded-full bg-black object-cover shadow-xs sm:top-35 sm:size-45"
        />
        <div className="from-brand/10 via-brand/5 to-background relative flex flex-col gap-1 bg-linear-to-br p-4  pt-20 pl-10 pr-10">
          <div className="flex flex-col gap-x-4 gap-y-2 text-sm">
             <h1 className="text-xl leading-tight font-bold tracking-tight sm:text-2xl ">"test"</h1>
             <div className="flex flex-row items-center gap-x-1">
                <MapPinIcon className="text-brand size-4 shrink-0" />
                <h2 className="leading-tight font-regular tracking-tight sm:text-xl text-brand ">"test"</h2>
             </div>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}