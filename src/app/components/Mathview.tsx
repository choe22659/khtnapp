'use client';
import { useEffect, useRef } from 'react';
import katex from 'katex';


interface MathViewProps {
  math: string;
  block?: boolean;
}

export default function MathView({ math, block = false }: MathViewProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      katex.render(math, containerRef.current, {
        displayMode: block,
        throwOnError: false,
      });
    }
  }, [math, block]);

  return <span ref={containerRef} />;
}