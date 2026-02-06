import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HeartIcon, MessageCircleIcon, VerifiedIcon } from "lucide-react";

export function FeedItem() {
  return (
    <div className="overflow-clip [contain-intrinsic-block-size:auto_450px] [content-visibility:auto] sm:rounded-xl sm:border">
      <div className="relative aspect-video">
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
        <img
          src="https://images.unsplash.com/photo-1724436781032-c1645c5783ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYwNTQ4OTIwfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Feed Item"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-2 p-2 sm:p-4">
        <div className="flex items-start gap-2">
          <Avatar className="size-10 rounded-xl sm:size-11">
            <AvatarImage src="https://github.com/camerontredoux.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="flex items-center gap-1 text-sm font-semibold sm:text-base">
              University of Washington{" "}
              <VerifiedIcon className="text-brand size-4" />
            </h3>
            <p className="text-muted-foreground flex items-center gap-1 text-xs sm:text-sm">
              posted a video <span>•</span>{" "}
              <span className="text-xs font-medium sm:text-sm">
                2 hours ago
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Est modi
            cumque tempore. Ipsa suscipit quidem quisquam tenetur, maxime
            explicabo. Harum minus adipisci consectetur modi incidunt eaque
            laudantium magnam omnis assumenda.
          </div>
          <div className="flex items-center gap-2 border-t pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <HeartIcon className="size-4" />{" "}
              <span className="text-xs sm:text-sm">847</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageCircleIcon className="size-3.5" />{" "}
              <span className="text-xs sm:text-sm">123</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
