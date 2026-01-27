import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StatsSection() {
  return (
    <Card>
      <CardHeader className="border-b gap-0">
        <CardTitle className="text-base">Your Week</CardTitle>
        <CardDescription className="text-xs">
          Track your popularity this week.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-accent p-4">
            <p className="text-2xl font-semibold">127</p>
            <p className="text-sm">Videos Watched</p>
          </div>
          <div className="rounded-lg bg-accent p-4">
            <p className="text-2xl font-semibold">20</p>
            <p className="text-sm">Profile Views</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
