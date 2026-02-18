declare module 'esbuild' {
  export function build(options: {
    entryPoints: string[];
    bundle?: boolean;
    format?: string;
    platform?: string;
    outfile?: string;
    external?: string[];
    packages?: string;
  }): Promise<void>;
}
