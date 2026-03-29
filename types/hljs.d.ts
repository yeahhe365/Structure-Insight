// Type declarations for highlight.js (loaded via CDN script tag in index.html)

interface HljsHighlightResult {
  value: string;
  language: string;
  relevance: number;
  secondBest?: {
    language: string;
    relevance: number;
  };
  illegal: boolean;
  errorRaised?: Error;
}

interface HljsStatic {
  highlight(code: string, options: { language: string }): HljsHighlightResult;
  highlightElement(element: HTMLElement): void;
  getLanguage(name: string): { name: string; [key: string]: unknown } | undefined;
  listLanguages(): string[];
  autoHighlight(code: string): HljsHighlightResult;
  configure(options: Record<string, unknown>): void;
  registerLanguage(name: string, definition: unknown): void;
}

declare const hljs: HljsStatic;
