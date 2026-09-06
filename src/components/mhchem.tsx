'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import 'katex/dist/contrib/mhchem.js';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

export default function MathView({ math, block = false, className = '' }: MathViewProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Xóa nội dung cũ trước khi render lại
    containerRef.current.innerHTML = '';

    if (!math) return;

    // Nếu chuỗi không chứa dấu $, render trực tiếp dưới dạng văn bản thường
    if (!math.includes('$')) {
      containerRef.current.textContent = math;
      return;
    }

    // Tách chuỗi theo regex tìm $$...$$ hoặc $...$
    const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
    const parts = math.split(regex);

    parts.forEach((part) => {
      if (!part) return;

      // Xử lý công thức Block $$ ... $$
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2).trim();
        const span = document.createElement('span');
        try {
          katex.render(formula, span, { displayMode: true, throwOnError: false });
        } catch (e) {
          span.textContent = part;
        }
        containerRef.current?.appendChild(span);
      } 
      // Xử lý công thức Inline $ ... $
      else if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1).trim();
        const span = document.createElement('span');
        try {
          katex.render(formula, span, { displayMode: block, throwOnError: false });
        } catch (e) {
          span.textContent = part;
        }
        containerRef.current?.appendChild(span);
      } 
      // Xử lý văn bản thường
      else {
        const textNode = document.createTextNode(part);
        containerRef.current?.appendChild(textNode);
      }
    });
  }, [math, block]);

  return <span ref={containerRef} className={className} />;
}