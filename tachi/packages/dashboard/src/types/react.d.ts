// Type definitions for React components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: any;
      h1: any;
      h2: any;
      h3: any;
      p: any;
      button: any;
      input: any;
      textarea: any;
      label: any;
      pre: any;
      span: any;
      ol: any;
      li: any;
    }
  }
}

declare module 'react' {
  export function useState<T>(initialState: T): [T, (newState: T | ((prev: T) => T)) => void];
  export default React;
  export const React: any;
}

export {};
