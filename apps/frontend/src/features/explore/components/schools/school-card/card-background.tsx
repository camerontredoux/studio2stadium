const GRAD_CAP_MASK =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 130' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><defs><g id='c'><path d='M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z'/><path d='M22 10v6'/><path d='M6 12.5V16a6 3 0 0 0 12 0v-3.5'/></g></defs><use href='%23c' transform='translate(-4,-8) scale(2) rotate(15,12,12)'/><use href='%23c' transform='translate(150,4) scale(1.33) rotate(-20,12,12)'/><use href='%23c' transform='translate(260,-12) scale(1.67) rotate(40,12,12)'/><use href='%23c' transform='translate(397,8) scale(1.17) rotate(-10,12,12)'/><use href='%23c' transform='translate(452,-4) scale(2.33) rotate(25,12,12)'/><use href='%23c' transform='translate(60,94) scale(1.5) rotate(-30,12,12)'/><use href='%23c' transform='translate(250,94) scale(1.83) rotate(10,12,12)'/><use href='%23c' transform='translate(408,82) scale(2.17) rotate(-18,12,12)'/></svg>";

const gradCapMaskStyle = {
  maskImage: `url("${GRAD_CAP_MASK}")`,
  WebkitMaskImage: `url("${GRAD_CAP_MASK}")`,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
} as React.CSSProperties;

export function CardBackground() {
  return (
    <div
      className="bg-brand pointer-events-none absolute inset-0 -z-10 opacity-[0.08] dark:opacity-[0.03]"
      style={gradCapMaskStyle}
      aria-hidden
    />
  );
}
