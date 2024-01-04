export interface RenderOptions {
  /**
   * Pass the relative path of your AJAX call and get a fully qualified URL back which works in all environments (local development, standalone, launchpad, etc.).
   */
  resolveUri(path: string): string;
}

export function register(render: (rootNode: HTMLElement, options?: RenderOptions) => () => void): void;

export function render(rootNode: HTMLElement, options?: RenderOptions): () => void;
