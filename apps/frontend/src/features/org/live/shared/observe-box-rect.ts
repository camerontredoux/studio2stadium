import { observeElementRect, type Virtualizer } from "@tanstack/react-virtual";

/**
 * Reports a scroll box's size to its virtualizer, standing in the viewport's
 * height while the box has none.
 *
 * A box that takes its height from its rows measures 0 when it holds none, and
 * the virtualizer shows no rows for a 0 height, so the box never grows. That
 * happened on the check-in desk after resizing from phone to desktop width:
 * the box virtualizer starts again from nothing there, and the Dancers panel
 * stayed empty. Sized to the viewport, the first rows render and give the box
 * its real height, which the next report carries.
 */
export function observeBoxRect<T extends Element>(
  instance: Virtualizer<T, Element>,
  cb: (rect: { width: number; height: number }) => void,
) {
  return observeElementRect(instance, (rect) =>
    cb(
      rect.height > 0
        ? rect
        : { ...rect, height: instance.targetWindow?.innerHeight ?? 0 },
    ),
  );
}
