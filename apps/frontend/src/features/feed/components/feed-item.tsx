import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CircleCheckIcon, HeartIcon, MessageCircleIcon } from "lucide-react";

export function FeedItem() {
  return (
    <div className="sm:rounded-xl sm:border overflow-clip">
      <div className="relative aspect-video">
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
        <img
          src="https://images.unsplash.com/photo-1724436781032-c1645c5783ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYwNTQ4OTIwfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Feed Item"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-2 sm:p-4 flex flex-col gap-2">
        <div className="flex gap-2 items-start">
          <Avatar className="size-10 sm:size-11 rounded-xl">
            <AvatarImage src="https://github.com/camerontredoux.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-1">
              University of Washington{" "}
              <CircleCheckIcon className="size-4 text-blue-500" />
            </h3>
            <p className="text-xs sm:text-sm flex items-center gap-1 text-muted-foreground">
              posted a video <span>•</span>{" "}
              <span className="font-medium text-xs sm:text-sm">
                2 hours ago
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex text-sm sm:text-base items-center gap-2">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Est modi
            cumque tempore. Ipsa suscipit quidem quisquam tenetur, maxime
            explicabo. Harum minus adipisci consectetur modi incidunt eaque
            laudantium magnam omnis assumenda.
          </div>
          <div className="border-t flex items-center gap-2 pt-2">
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
