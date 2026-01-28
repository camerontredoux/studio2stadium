import { Frame, FramePanel } from "@/components/ui/frame";

export function StatsSection() {
  return (
    <Frame>
      <FramePanel>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-accent p-4">
            <p className="text-2xl font-semibold">127</p>
            <p className="text-sm">Video Hits</p>
          </div>
          <div className="rounded-lg bg-accent p-4">
            <p className="text-2xl font-semibold">20</p>
            <p className="text-sm">Profile Views</p>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}
