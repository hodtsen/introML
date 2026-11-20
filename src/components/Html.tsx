import type { ElementType } from "react";

// Viser HTML som er laget av byggskriptet fra vårt eget innhold (ikke brukerinput).
export default function Html({ html, as: Tag = "div", className }: { html: string; as?: ElementType; className?: string }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
