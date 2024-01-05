import fs from "fs";
import path from "path";
import { parse } from "url";
import { EmittedAsset, PluginContext } from "rollup";
import { HmrContext, normalizePath, PreviewServer, ViteDevServer } from "vite";
import { BasePlugin } from "./BasePlugin.ts";

export class ServePlugin extends BasePlugin {
  private files: Array<EmittedAsset & { id: string }> = [];

  configureServer = async (server: ViteDevServer) => {
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
        const fileToServe = this.files.find(
          (f) => !!f.fileName && normalizePath(pathname) === this.basePath + normalizePath(f.fileName),
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

  configurePreviewServer(server: PreviewServer) {
    const regexUrlStartsWithHash = /\/~([a-f0-9]*)~\//;
    const outDir = server.config.build.outDir;
    const cacheBusterJson: Record<string, string> = JSON.parse(
      fs.readFileSync(path.join(outDir, "sap-ui-cachebuster-info.json"), "utf8"),
    );
    const swappedKeyValueCacheBusterJson = Object.fromEntries(Object.entries(cacheBusterJson).map((a) => a.reverse()));

    // register our middleware to process cache buster files before all other middleware
    server.middlewares.use(async (req, res, next) => {
      if (req.method !== "GET" || !req.url) {
        return next();
      }
      const { pathname } = parse(req.url, false);
      if (!pathname) {
        return next();
      }

      const matches = regexUrlStartsWithHash.exec(pathname);
      if (!matches || !swappedKeyValueCacheBusterJson[matches[1]]) {
        return next();
      }

      // found in cache buster --> simplify URL and pass it to the static file middleware
      req.url = req.url.replace(regexUrlStartsWithHash, "/");
      next();
    });
  }

  buildStart(context: PluginContext) {
    this.files = this.getUi5Files();
    this.files.forEach((f) => context.addWatchFile(f.id));
  }

  watchChange(id: string) {
    const changedFile = this.files.find((f) => f.id === id);
    if (!changedFile) {
      return;
    }
    // files changed --> read and process all UI5 files again
    this.files = this.getUi5Files();
  }

  handleHotUpdate(context: HmrContext) {
    const changedFile = this.files.find((f) => f.id === context.file);
    if (!changedFile) {
      return;
    }
    // UI5 files changed -> force full page reload
    context.server.ws.send({ type: "full-reload" });
  }

  private async getFile(options: {
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
