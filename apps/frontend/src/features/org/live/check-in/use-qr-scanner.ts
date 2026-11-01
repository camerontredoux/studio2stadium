import * as React from "react";

import { useCallbackRef } from "@/components/hooks/use-callback-ref";

export type QrScannerStatus =
  | "stopped"
  | "starting"
  | "scanning"
  | "paused"
  | "denied"
  | "no-camera"
  | "insecure"
  | "error";

type Detector = {
  detect: (
    source: HTMLVideoElement | ImageBitmap,
  ) => Promise<{ rawValue: string }[]>;
};

type NativeDetectorClass = {
  new (options: { formats: string[] }): Detector;
  getSupportedFormats: () => Promise<string[]>;
};

/** About 10 decodes a second. */
const FRAME_MS = 100;
/** The same code is ignored until it has been out of view this long. */
const REPEAT_MS = 4000;

let detectorPromise: Promise<Detector> | undefined;

/**
 * The browser's own BarcodeDetector where it reads QR codes (Chrome on Android
 * and macOS), else the zxing-wasm ponyfill (Safari, Firefox, desktop Chrome on
 * Linux and Windows). Both load only when a scanner first runs; the .wasm is a
 * Vite asset from our own build, never the library's default CDN.
 */
function loadDetector(): Promise<Detector> {
  detectorPromise ??= (async () => {
    const Native = (globalThis as { BarcodeDetector?: NativeDetectorClass })
      .BarcodeDetector;
    if (Native) {
      const formats = await Native.getSupportedFormats().catch(
        (): string[] => [],
      );
      if (formats.includes("qr_code"))
        return new Native({ formats: ["qr_code"] });
    }
    const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] =
      await Promise.all([
        import("barcode-detector/ponyfill"),
        import("zxing-wasm/reader/zxing_reader.wasm?url"),
      ]);
    prepareZXingModule({
      overrides: {
        locateFile: (path: string, prefix: string) =>
          path.endsWith(".wasm") ? wasmUrl : prefix + path,
      },
    });
    return new BarcodeDetector({ formats: ["qr_code"] });
  })();
  detectorPromise.catch(() => {
    detectorPromise = undefined;
  });
  return detectorPromise;
}

/** Photos are scaled down to this on their long side before decoding. */
const PHOTO_MAX_PX = 2000;

/**
 * Reads the first QR code in a still image (the "Take photo" fallback) with the
 * same decoder as the live camera. Resolves undefined when there is none.
 */
export async function decodeImage(file: Blob): Promise<string | undefined> {
  const detector = await loadDetector();
  let bitmap = await createImageBitmap(file);
  const long = Math.max(bitmap.width, bitmap.height);
  if (long > PHOTO_MAX_PX) {
    const scale = PHOTO_MAX_PX / long;
    const scaled = await createImageBitmap(bitmap, {
      resizeWidth: Math.round(bitmap.width * scale),
      resizeHeight: Math.round(bitmap.height * scale),
      resizeQuality: "high",
    });
    bitmap.close();
    bitmap = scaled;
  }
  try {
    const codes = await detector.detect(bitmap);
    return codes.find((c) => c.rawValue)?.rawValue;
  } finally {
    bitmap.close();
  }
}

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

async function openCamera(deviceId: string | undefined) {
  const media = navigator.mediaDevices;
  if (deviceId) {
    return media.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    });
  }
  try {
    return await media.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
  } catch (error) {
    if (cameraFailure(error) === "denied") throw error;
    return media.getUserMedia({ video: true, audio: false });
  }
}

function cameraFailure(error: unknown): QrScannerStatus {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "no-camera";
  return "error";
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function useDocumentVisible() {
  return React.useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}

type UseQrScannerOptions = {
  /** Camera on while true. It starts without a click and stops the moment this turns false. */
  active: boolean;
  /** Keeps the camera on but stops decoding, e.g. while a scan is being checked. */
  paused?: boolean;
  /** A decoded QR text. The same text is not repeated until it has been out of view for 4s. */
  onCode: (text: string) => void;
};

/**
 * Runs the camera into `videoRef` and reads QR codes from it continuously.
 * One stream at a time: a new start waits for the previous one to settle, so
 * StrictMode's double mount or a quick camera switch never leaves a stream on.
 * The camera also stops while the tab is hidden and resumes when it returns.
 */
export function useQrScanner({
  active,
  paused = false,
  onCode,
}: UseQrScannerOptions) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const visible = useDocumentVisible();
  const [deviceId, setDeviceId] = React.useState<string>();
  const [attempt, setAttempt] = React.useState(0);
  const [camera, setCamera] = React.useState<{
    key: string;
    status: QrScannerStatus;
    deviceId?: string;
    facingMode?: string;
  }>();
  const [cameras, setCameras] = React.useState<string[]>([]);
  const [decoderFailed, setDecoderFailed] = React.useState(false);
  const chain = React.useRef<Promise<void>>(Promise.resolve());
  const lastSeen = React.useRef<{ text: string; at: number } | null>(null);
  const emit = useCallbackRef(onCode);

  const secure = typeof window === "undefined" || window.isSecureContext;
  const supported =
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  const running = active && visible && secure && supported;
  const key = `${deviceId ?? ""}:${attempt}`;

  React.useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let stream: MediaStream | undefined;
    const video = videoRef.current;

    chain.current = chain.current.then(async () => {
      if (cancelled) return;
      try {
        stream = await openCamera(deviceId);
      } catch (error) {
        if (!cancelled) setCamera({ key, status: cameraFailure(error) });
        return;
      }
      if (cancelled) {
        stopStream(stream);
        return;
      }
      if (video) {
        video.srcObject = stream;
        video.play().catch(() => {});
      }
      const settings = stream.getVideoTracks()[0]?.getSettings();
      setCamera({
        key,
        status: "scanning",
        deviceId: settings?.deviceId,
        facingMode: settings?.facingMode,
      });
      const devices = await navigator.mediaDevices
        .enumerateDevices()
        .catch(() => []);
      if (!cancelled) {
        setCameras(
          devices
            .filter((d) => d.kind === "videoinput" && d.deviceId)
            .map((d) => d.deviceId),
        );
      }
    });

    return () => {
      cancelled = true;
      if (stream) stopStream(stream);
      if (video) video.srcObject = null;
    };
  }, [running, deviceId, key]);

  let status: QrScannerStatus;
  if (!secure) status = "insecure";
  else if (!supported) status = "no-camera";
  else if (!active) status = "stopped";
  else if (!visible) status = "paused";
  else if (decoderFailed) status = "error";
  else status = camera?.key === key ? camera.status : "starting";

  const decoding = running && status === "scanning" && !paused;

  React.useEffect(() => {
    const video = videoRef.current;
    if (!decoding || !video) return;
    let stopped = false;
    let busy = false;
    let last = 0;
    let frame: number | undefined;
    let detector: Detector | undefined;

    loadDetector().then(
      (d) => {
        detector = d;
      },
      () => {
        if (!stopped) setDecoderFailed(true);
      },
    );

    const schedule = () => {
      if (stopped) return;
      frame =
        "requestVideoFrameCallback" in video
          ? video.requestVideoFrameCallback(tick)
          : requestAnimationFrame(tick);
    };

    const tick = async () => {
      const now = performance.now();
      if (
        detector &&
        !busy &&
        now - last >= FRAME_MS &&
        video.readyState >= 2
      ) {
        last = now;
        busy = true;
        try {
          const codes = await detector.detect(video);
          const text = codes.find((c) => c.rawValue)?.rawValue;
          if (text && !stopped) {
            const seen = lastSeen.current;
            const repeat = seen?.text === text && now - seen.at < REPEAT_MS;
            lastSeen.current = { text, at: now };
            if (!repeat) emit(text);
          }
        } catch {
          // A frame that can't be read (e.g. mid camera switch); try the next.
        } finally {
          busy = false;
        }
      }
      schedule();
    };

    schedule();
    return () => {
      stopped = true;
      if (frame === undefined) return;
      if ("cancelVideoFrameCallback" in video)
        video.cancelVideoFrameCallback(frame);
      else cancelAnimationFrame(frame);
    };
  }, [decoding, emit]);

  const switchCamera = React.useCallback(() => {
    if (cameras.length < 2) return;
    const index = cameras.indexOf(camera?.deviceId ?? "");
    setDeviceId(cameras[(index + 1) % cameras.length]);
  }, [cameras, camera?.deviceId]);

  const retry = React.useCallback(() => {
    setDecoderFailed(false);
    setAttempt((n) => n + 1);
  }, []);

  return {
    videoRef,
    status,
    canSwitchCamera: status === "scanning" && cameras.length > 1,
    // Mirror the preview like a selfie view, except for a rear camera.
    mirrored: camera?.facingMode !== "environment",
    switchCamera,
    retry,
  };
}
