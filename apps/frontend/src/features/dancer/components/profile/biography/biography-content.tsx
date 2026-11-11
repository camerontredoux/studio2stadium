import { Fragment } from "react";
import { type BiographyFormat, type Line, parseBiography } from "./format";

/** A stored biography, formatted. Plain biographies render as they always have. */
export function BiographyContent({
  text,
  format,
}: {
  text: string;
  format: BiographyFormat;
}) {
  if (format === "plain") return text;

  return (
    <div className="flex flex-col gap-3">
      {parseBiography(text).map((block, index) =>
        block.type === "paragraph" ? (
          <p key={index}>
            <Lines lines={block.lines} />
          </p>
        ) : (
          <ul
            key={index}
            className="marker:text-muted-foreground flex list-disc flex-col gap-1 pl-5"
          >
            {block.items.map((lines, item) => (
              <li key={item}>
                <Lines lines={lines} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

function Lines({ lines }: { lines: Line[] }) {
  return lines.map((line, index) => (
    <Fragment key={index}>
      {index > 0 ? <br /> : null}
      {line.map((run, i) => {
        let node: React.ReactNode = run.text;
        if (run.italic) node = <em>{node}</em>;
        if (run.bold) node = <strong className="font-semibold">{node}</strong>;
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </Fragment>
  ));
}
