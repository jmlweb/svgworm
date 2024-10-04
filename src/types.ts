export type AppAction = (
  src?: string,
  dest?: string,
  cliOptions?: {
    optimize?: boolean;
    clean?: boolean;
  },
) => Promise<void>;

export interface Result {
  id: string;
  src: string;
  content: string;
}

export interface Formatter {
  formatSVG: (svg: string) => Promise<string>;
  formatTS: (template: string) => Promise<string>;
}
