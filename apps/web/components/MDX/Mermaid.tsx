'use client';
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
    if (ref.current) {
      const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;

      mermaid.render(id, chart)
        .then(({ svg, bindFunctions }) => {
          if (ref.current) {
            ref.current.innerHTML = svg;
            bindFunctions?.(ref.current);
          }
        })
        .catch((err) => {
          console.error('Failed to render mermaid diagram', err);
        });
    }
  }, [chart]);

  return <div ref={ref} className="my-4" />;
} 