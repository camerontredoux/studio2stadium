import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Link } from "@tanstack/react-router";
import { SparklesIcon } from "lucide-react";

export function Unsubscribed() {
  return (
    <div className="flex flex-col gap-6 px-2">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="text-brand border-brand">
            <SparklesIcon />
          </EmptyMedia>
          <EmptyTitle>Unlock Premium Features</EmptyTitle>
          <EmptyDescription>
            Get access to exclusive content, advanced analytics, priority
            support, and more with a Studio2Stadium Pro membership.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            className="border-brand text-brand"
            render={<Link to="/checkout" />}
          >
            Upgrade to Premium
          </Button>
        </EmptyContent>
      </Empty>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Exclusive Content",
            description: "Access premium tutorials and behind-the-scenes.",
          },
          {
            title: "Priority Support",
            description: "Get help faster with dedicated support channels.",
          },
          {
            title: "Advanced Analytics",
            description: "Track your progress with detailed insights.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="bg-muted/30 rounded-lg border p-4"
          >
            <h3 className="text-sm font-medium">{feature.title}</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
