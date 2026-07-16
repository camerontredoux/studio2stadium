/**
 * iOS Safari's iframe-embedded PDF/image viewer can only be panned, not
 * pinch-zoomed back out - a WebKit limitation, not a CSS bug. On mobile,
 * hand the file to the OS-level viewer in a new tab instead, which has
 * full zoom. Desktop keeps the inline dialog.
 */
export function openEventSchedule(
  fileUrl: string,
  setOpen: (open: boolean) => void,
) {
  if (window.matchMedia("(max-width: 639px)").matches) {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
    return;
  }
  setOpen(true);
}
