# DropZone

A dashed upload area that fills an empty tile, with a short instruction and a size limit.

- The dashed border is `line-dashed` and lifts to `line-hover` on hover. The note under it is mono `fg-3` ("Max 25 MB").
- Keep the instruction one line: "Drop a PDF or image, or Browse".
- Consumer provides: `accept`, `onChange`, and optional `title`, `buttonLabel`, `note`.
