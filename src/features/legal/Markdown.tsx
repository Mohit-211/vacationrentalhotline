import type { ReactNode } from "react";

// The small part of Markdown the legal documents (src/content/legal) use:
//
//   # to #### headings      one line each; each gets an id from its text, so
//                           [a link](#1-what-information-do-we-collect) reaches it
//   paragraphs              separated by a blank line; a line break inside a
//                           paragraph is kept (addresses)
//   - item / 1. item        lists, one item per line
//   | a | b |               tables; the first row is the header, then | --- |
//   **bold** *italic* ***both*** [text](https://…)
//   \* \[ \] \| \\          those characters as plain text

type Block =
  | { kind: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; ordered: boolean; start: number; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] };

const HEADING = /^(#{1,4})\s+(.+)$/;
const LIST_ITEM = /^(?:-|(\d+)\.)\s+(.*)$/;
const TABLE_ROW = /^\|.*\|\s*$/;

const startsBlock = (line: string) => HEADING.test(line) || LIST_ITEM.test(line) || TABLE_ROW.test(line);

/** Cells of a "| a | b |" row; "\|" stays inside its cell. */
const tableCells = (line: string) =>
  line
    .trim()
    .slice(1, -1)
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length as 1 | 2 | 3 | 4, text: heading[2].trim() });
      i++;
    } else if (TABLE_ROW.test(line)) {
      const rows: string[][] = [];
      for (; i < lines.length && TABLE_ROW.test(lines[i].trim()); i++) rows.push(tableCells(lines[i]));
      const [header = [], ...body] = rows;
      blocks.push({ kind: "table", header, rows: body.filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell))) });
    } else if (LIST_ITEM.test(line)) {
      const ordered = LIST_ITEM.exec(line)?.[1] !== undefined;
      const start = Number(LIST_ITEM.exec(line)?.[1] ?? 1);
      const items: string[] = [];
      for (; i < lines.length; i++) {
        const item = LIST_ITEM.exec(lines[i].trim());
        if (!item || (item[1] !== undefined) !== ordered) break;
        items.push(item[2].trim());
      }
      blocks.push({ kind: "list", ordered, start, items });
    } else {
      const paragraph: string[] = [];
      for (; i < lines.length && lines[i].trim() && !startsBlock(lines[i].trim()); i++) paragraph.push(lines[i].trim());
      blocks.push({ kind: "paragraph", lines: paragraph });
    }
  }
  return blocks;
}

const INLINE = /\\([\\*[\]|])|\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let key = 0;
  for (let match = INLINE.exec(rest); match; match = INLINE.exec(rest)) {
    if (match.index > 0) nodes.push(rest.slice(0, match.index));
    const [, escaped, both, bold, italic, linkText, href] = match;
    if (escaped !== undefined) nodes.push(escaped);
    else if (both !== undefined)
      nodes.push(
        <strong key={key++}>
          <em>{renderInline(both)}</em>
        </strong>,
      );
    else if (bold !== undefined) nodes.push(<strong key={key++}>{renderInline(bold)}</strong>);
    else if (italic !== undefined) nodes.push(<em key={key++}>{renderInline(italic)}</em>);
    else if (/^https?:\/\//.test(href))
      nodes.push(
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer">
          {renderInline(linkText)}
        </a>,
      );
    else
      nodes.push(
        <a key={key++} href={href}>
          {renderInline(linkText)}
        </a>,
      );
    rest = rest.slice(match.index + match[0].length);
  }
  if (rest) nodes.push(rest);
  return nodes;
}

/** The text a heading shows, without Markdown. */
const plainText = (text: string) =>
  text
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/(?<!\\)\*+/g, "")
    .replace(/\\([\\*[\]|])/g, "$1");

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");

/** Renders a document written in the Markdown subset above. */
export function Markdown({ source }: { source: string }) {
  const used = new Map<string, number>();
  const headingId = (text: string) => {
    const slug = slugify(plainText(text));
    const count = (used.get(slug) ?? 0) + 1;
    used.set(slug, count);
    return count === 1 ? slug : `${slug}-${count}`;
  };

  return parseBlocks(source).map((block, index) => {
    switch (block.kind) {
      case "heading": {
        const Heading = `h${block.level}` as const;
        return (
          <Heading key={index} id={headingId(block.text)}>
            {renderInline(block.text)}
          </Heading>
        );
      }
      case "paragraph":
        return (
          <p key={index}>
            {block.lines.map((line, n) => (
              <span key={n}>
                {n > 0 && <br />}
                {renderInline(line)}
              </span>
            ))}
          </p>
        );
      case "list": {
        const items = block.items.map((item, n) => <li key={n}>{renderInline(item)}</li>);
        return block.ordered ? (
          <ol key={index} start={block.start === 1 ? undefined : block.start}>
            {items}
          </ol>
        ) : (
          <ul key={index}>{items}</ul>
        );
      }
      case "table":
        return (
          // Wide tables scroll sideways on phones instead of widening the page.
          <div key={index} className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  {block.header.map((cell, n) => (
                    <th key={n}>{renderInline(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, n) => (
                      <td key={n}>{renderInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  });
}
