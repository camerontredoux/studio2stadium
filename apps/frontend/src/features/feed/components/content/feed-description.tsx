export function FeedDescription({ caption }: { caption: string | null }) {
  return (
    <div className="flex flex-col gap-2">
      {caption ? (
        <div className="mt-2 flex items-center gap-2 text-sm sm:mt-4 sm:text-base">
          {caption}
        </div>
      ) : null}
      {/* <div className="flex items-center gap-2 border-t pt-2">
        <Button variant="ghost" size="xs" className="flex items-center gap-2">
          <HeartIcon className="size-4" />{" "}
          <span className="text-xs sm:text-sm">847</span>
        </Button>
        <Button variant="ghost" size="xs" className="flex items-center gap-2">
          <MessageCircleIcon className="size-3.5" />{" "}
          <span className="text-xs sm:text-sm">123</span>
        </Button>
      </div> */}
    </div>
  );
}
