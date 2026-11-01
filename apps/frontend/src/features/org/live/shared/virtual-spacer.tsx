/** Stands in for a table's rows scrolled out of view. */
export function Spacer({ height }: { height: number }) {
  if (height <= 0) return null;
  return <div aria-hidden className="col-span-full" style={{ height }} />;
}
