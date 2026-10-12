'use client';
import { Fragment } from 'react';
import { Link } from '@/lib/router';
import type { Block } from '@/content/blog';

/** Renders [text](/path) and **bold** inside a string. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          return link[2].startsWith('/') ? (
            <Link key={i} to={link[2]}>
              {link[1]}
            </Link>
          ) : (
            <a key={i} href={link[2]} target="_blank" rel="noopener">
              {link[1]}
            </a>
          );
        }
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i}>{bold[1]}</strong>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export function RichBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if ('h2' in b) return <h2 key={i}>{b.h2}</h2>;
        if ('h3' in b) return <h3 key={i}>{b.h3}</h3>;
        if ('p' in b)
          return (
            <p key={i}>
              <Inline text={b.p} />
            </p>
          );
        if ('ul' in b)
          return (
            <ul key={i}>
              {b.ul.map((li) => (
                <li key={li}>
                  <Inline text={li} />
                </li>
              ))}
            </ul>
          );
        if ('ol' in b)
          return (
            <ol key={i}>
              {b.ol.map((li) => (
                <li key={li}>
                  <Inline text={li} />
                </li>
              ))}
            </ol>
          );
        if ('note' in b)
          return (
            <p key={i} className="rounded-xl border border-gold/35 bg-gold-soft/60 px-5 py-4 text-[0.98rem]">
              <Inline text={b.note} />
            </p>
          );
        return (
          <div key={i} className="overflow-x-auto rounded-xl border border-line">
            <table>
              <thead>
                <tr>
                  {b.table.head.map((h, j) => (
                    <th key={j} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.table.rows.map((r, j) => (
                  <tr key={j}>
                    {r.map((c, k) => (k === 0 ? <th key={k} scope="row">{c}</th> : <td key={k}>{c}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
}
