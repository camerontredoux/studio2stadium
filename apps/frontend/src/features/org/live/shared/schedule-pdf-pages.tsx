// The legacy build also runs on the older iOS Safari versions dancers still use.
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { useCallback, useEffect, useRef, useState } from "react";

GlobalWorkerOptions.workerSrc = workerUrl;

// Sharp on retina screens without the canvas memory of a 3x render.
const MAX_PIXEL_RATIO = 2;

type SchedulePdfPagesProps = {
  /** Same-origin-safe URL that returns the PDF's bytes to a credentialed fetch. */
  url: string;
  /** Called once the first page is drawn. */
  onReady: () => void;
  /** Called when the file can't be fetched or parsed. */
  onError: () => void;
};

function PdfPage({
  doc,
  pageNumber,
  width,
  onRendered,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  onRendered?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;
    let cancelled = false;
    let task: RenderTask | null = null;

    void doc.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const viewport = page.getViewport({
        scale: (width / base.width) * ratio,
      });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      setAspect(base.width / base.height);
      task = page.render({ canvas, viewport });
      task.promise.then(
        () => {
          if (!cancelled) onRendered?.();
        },
        // A re-render on resize cancels the previous one; nothing to report.
        () => {},
      );
    });

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, pageNumber, width, onRendered]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Page ${pageNumber} of ${doc.numPages}`}
      className="block w-full bg-white shadow-sm"
      style={{ aspectRatio: aspect ?? 8.5 / 11 }}
    />
  );
}

/**
 * Draws every page of a PDF into canvases stacked in a scrolling column.
 * Used where the browser's own viewer fails inside an iframe: iOS Safari
 * draws only page 1 as a still image, and Android Chrome draws nothing.
 * Loaded on demand, so pdf.js stays out of the dashboard bundle.
 */
function SchedulePdfPages({ url, onReady, onError }: SchedulePdfPagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = useState(0);

  // Keep the latest callbacks without refetching when the parent re-renders.
  const callbacks = useRef({ onReady, onError });
  useEffect(() => {
    callbacks.current = { onReady, onError };
  });

  useEffect(() => {
    const controller = new AbortController();
    let task: PDFDocumentLoadingTask | null = null;

    (async () => {
      const res = await fetch(url, {
        credentials: "include",
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Schedule fetch failed: ${res.status}`);
      const data = new Uint8Array(await res.arrayBuffer());
      if (controller.signal.aborted) return;
      task = getDocument({ data });
      setDoc(await task.promise);
    })().catch(() => {
      if (!controller.signal.aborted) callbacks.current.onError();
    });

    return () => {
      controller.abort();
      void task?.destroy();
    };
  }, [url]);

  // Render at the column's width, and again when it changes (rotation, resize).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleFirstRendered = useCallback(
    () => callbacks.current.onReady(),
    [],
  );

  return (
    <div
      ref={scrollRef}
      role="document"
      aria-label="Event schedule"
      className="absolute inset-0 overflow-y-auto overscroll-contain p-(--space-8)"
    >
      {doc && width > 0 && (
        <div className="flex flex-col gap-(--space-8)">
          {Array.from({ length: doc.numPages }, (_, i) => (
            <PdfPage
              key={i + 1}
              doc={doc}
              pageNumber={i + 1}
              width={width}
              onRendered={i === 0 ? handleFirstRendered : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SchedulePdfPages;
export type { SchedulePdfPagesProps };
