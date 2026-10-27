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

// Pages within one column height above or below the visible area are drawn.
// Pages further away keep their size but give their canvas memory back.
const NEAR_MARGIN = "100% 0px";

// Width over height of a US Letter page, until the real size is known.
const LETTER_ASPECT = 8.5 / 11;

type SchedulePdfPagesProps = {
  /** Resolves to the PDF's bytes. Called once per mount. */
  load: (signal: AbortSignal) => Promise<Uint8Array>;
  /** Called once the first page is drawn. */
  onReady: () => void;
  /** Called when the file can't be fetched or parsed. */
  onError: () => void;
};

type LoadedPdf = {
  doc: PDFDocumentProxy;
  /** Width over height of each page, in page order. */
  aspects: number[];
};

/**
 * Draws one page into the canvas at `width` CSS pixels and marks it
 * `data-drawn`. Returns a cleanup that cancels a draw still in progress.
 */
function drawPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  width: number,
  onRendered?: () => void,
) {
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
    task = page.render({ canvas, viewport });
    task.promise.then(
      () => {
        if (cancelled) return;
        canvas.dataset.drawn = "";
        onRendered?.();
      },
      // A re-render on resize or scroll cancels the previous one.
      () => {},
    );
  });

  return () => {
    cancelled = true;
    task?.cancel();
  };
}

function PdfPage({
  doc,
  pageNumber,
  aspect,
  width,
  root,
  onRendered,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  aspect: number;
  width: number;
  root: HTMLElement;
  onRendered?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry?.isIntersecting ?? false),
      { root, rootMargin: NEAR_MARGIN },
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [root]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;
    if (!near) {
      // Zero size frees the bitmap; CSS keeps the placeholder at page size.
      canvas.width = 0;
      canvas.height = 0;
      delete canvas.dataset.drawn;
      return;
    }
    return drawPage(doc, pageNumber, canvas, width, onRendered);
  }, [doc, pageNumber, width, near, onRendered]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Page ${pageNumber} of ${doc.numPages}`}
      className="block w-full bg-white shadow-sm"
      style={{ aspectRatio: aspect }}
    />
  );
}

/**
 * Draws a PDF's pages into canvases stacked in a scrolling column, the full
 * width of the column. Only pages near the visible area are drawn; the rest
 * are blank placeholders at their page's size. Loaded on demand, so pdf.js
 * stays out of the dashboard bundle.
 */
function SchedulePdfPages({ load, onReady, onError }: SchedulePdfPagesProps) {
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [width, setWidth] = useState(0);

  // Keep the latest callbacks without refetching when the parent re-renders.
  const callbacks = useRef({ load, onReady, onError });
  useEffect(() => {
    callbacks.current = { load, onReady, onError };
  });

  useEffect(() => {
    const controller = new AbortController();
    let task: PDFDocumentLoadingTask | null = null;

    (async () => {
      const data = await callbacks.current.load(controller.signal);
      if (controller.signal.aborted) return;
      task = getDocument({ data });
      const doc = await task.promise;
      // Page sizes come from each page's dictionary; nothing is drawn yet.
      const aspects = await Promise.all(
        Array.from({ length: doc.numPages }, async (_, i) => {
          const { width: w, height: h } = (
            await doc.getPage(i + 1)
          ).getViewport({ scale: 1 });
          return w / h;
        }),
      );
      if (!controller.signal.aborted) setPdf({ doc, aspects });
    })().catch(() => {
      if (!controller.signal.aborted) callbacks.current.onError();
    });

    return () => {
      controller.abort();
      void task?.destroy();
    };
  }, []);

  // Render at the column's width, and again when it changes (rotation, resize).
  useEffect(() => {
    if (!scrollEl) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(scrollEl);
    return () => observer.disconnect();
  }, [scrollEl]);

  const handleFirstRendered = useCallback(
    () => callbacks.current.onReady(),
    [],
  );

  return (
    <div
      ref={setScrollEl}
      role="document"
      aria-label="Event schedule"
      className="absolute inset-0 overflow-y-auto overscroll-contain p-(--space-8)"
    >
      {pdf && scrollEl && width > 0 && (
        <div className="flex flex-col gap-(--space-8)">
          {pdf.aspects.map((aspect, i) => (
            <PdfPage
              key={i + 1}
              doc={pdf.doc}
              pageNumber={i + 1}
              aspect={aspect || LETTER_ASPECT}
              width={width}
              root={scrollEl}
              onRendered={i === 0 ? handleFirstRendered : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Draws only the PDF's first page into a canvas the width of its parent, for
 * the collapsed widget's preview. The canvas takes `className`, and stays
 * blank until the page is drawn.
 */
function SchedulePdfFirstPage({
  load,
  onReady,
  onError,
  className,
}: SchedulePdfPagesProps & { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = useState(0);

  const callbacks = useRef({ load, onReady, onError });
  useEffect(() => {
    callbacks.current = { load, onReady, onError };
  });

  useEffect(() => {
    const controller = new AbortController();
    let task: PDFDocumentLoadingTask | null = null;

    (async () => {
      const data = await callbacks.current.load(controller.signal);
      if (controller.signal.aborted) return;
      task = getDocument({ data });
      const loaded = await task.promise;
      if (!controller.signal.aborted) setDoc(loaded);
    })().catch(() => {
      if (!controller.signal.aborted) callbacks.current.onError();
    });

    return () => {
      controller.abort();
      void task?.destroy();
    };
  }, []);

  useEffect(() => {
    const parent = canvasRef.current?.parentElement;
    if (!parent) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const handleRendered = useCallback(() => callbacks.current.onReady(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!doc || !canvas || width <= 0) return;
    return drawPage(doc, 1, canvas, width, handleRendered);
  }, [doc, width, handleRendered]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}

export default SchedulePdfPages;
export { SchedulePdfFirstPage };
export type { SchedulePdfPagesProps };
