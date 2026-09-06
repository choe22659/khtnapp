// src/types/katex.d.ts
declare module 'react-katex' {
  import * as React from 'react';

  export interface KatexProps {
    math?: string;
    children?: React.ReactNode;
    errorColor?: string;
    renderError?: (error: Error | TypeError) => React.ReactNode;
    strict?: boolean | string | ((errorCode: string, errorMsg: string, token: object) => string);
  }

  export const InlineMath: React.ComponentType<KatexProps>;
  export const BlockMath: React.ComponentType<KatexProps>;
}

declare module 'katex/dist/katex.min.css';