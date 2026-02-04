import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

export function Example() {
  const listRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useWindowVirtualizer({
    count: 10000,
    estimateSize: () => 35,
    overscan: 5,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  return (
    <>
      <div ref={listRef} className="List">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((item) => (
            <div
              key={item.key}
              className={item.index % 2 ? "ListItemOdd" : "ListItemEven"}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${item.size}px`,
                transform: `translateY(${
                  item.start - virtualizer.options.scrollMargin
                }px)`,
              }}
            >
              Row {item.index}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
