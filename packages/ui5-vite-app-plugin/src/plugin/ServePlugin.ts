import { parse } from "url";
import { EmittedAsset } from "rollup";
import { normalizePath, ViteDevServer } from "vite";
import { BasePlugin } from "./BasePlugin.ts";

export class ServePlugin extends BasePlugin {
  configureServer = async (server: ViteDevServer) => {
    const ui5Files = this.getUi5Files();
    // serve all virtual files
    return () => {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" || !req.originalUrl) {
          return next();
        }
        const { pathname } = parse(req.originalUrl, false);
        if (!pathname) {
          return next();
        }
        const fileToServe = ui5Files.find(
          (f) => !!f.fileName && normalizePath(pathname) === "/" + normalizePath(f.fileName),
        );

        if (!fileToServe || fileToServe.type !== "asset" || !fileToServe.fileName || !fileToServe.source) {
          return next();
        }

        const { data, mimeType } = await this.getFile({
          file: fileToServe as Required<EmittedAsset>,
          url: pathname,
          server: server,
        });

        if (mimeType) {
          res.setHeader("Content-Type", mimeType);
        }
        res.statusCode = 200;
        res.end(data);
      });
    };
  };

  async getFile(options: {
    url: string;
    server: ViteDevServer;
    file: Required<EmittedAsset>;
  }): Promise<{ mimeType?: string; data: string }> {
    const mimeType = options.file.fileName.endsWith(".html")
      ? "text/html"
      : options.file.fileName.endsWith(".json")
        ? "application/json"
        : undefined;

    const data = options.file.fileName.endsWith(".html")
      ? // transform html to apply all html transformations (e.g. development scripts like vite-client, react-refresh)
        await options.server.transformIndexHtml(options.url, options.file.source.toString())
      : // no transform necessary for all other file types
        options.file.source.toString();
    return {
      mimeType,
      data,
    };
  }
}
