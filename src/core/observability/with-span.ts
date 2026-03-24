export interface Span {
  setAttribute(key: string, value: string | number | boolean): void;
}

const noopSpan: Span = {
  setAttribute() {},
};

export function withSpan<T>(name: string, fn: (span: Span) => T | Promise<T>): Promise<T> {
  void name;
  return Promise.resolve(fn(noopSpan));
}
