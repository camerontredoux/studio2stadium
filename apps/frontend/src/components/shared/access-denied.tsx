import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { LockKeyholeIcon } from "lucide-react";
import { Button } from "../ui/button";

export function AccessDenied({ description }: { description: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center">
      <Card className="border-border/80 w-full max-w-md text-center shadow-sm">
        <CardHeader className="flex flex-col items-center gap-3 pb-2">
          <div className="bg-destructive/10 flex size-14 items-center justify-center rounded-full">
            <LockKeyholeIcon className="text-destructive-foreground size-7" />
          </div>
          <CardTitle className="text-xl">Access Denied</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center pt-2">
          <Button render={<Link to="/checkout" />}>Subscribe</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
