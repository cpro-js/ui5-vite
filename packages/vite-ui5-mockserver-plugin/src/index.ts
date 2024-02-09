import FEMockserver, { MockserverConfiguration } from "@sap-ux/fe-mockserver-core";
import glob from "fast-glob";
import type { Plugin } from "vite";

export default (options: MockserverConfiguration): Plugin => {
  const mockServer: FEMockserver =
    // @ts-ignore: invalid bundling...
    "default" in FEMockserver ? new FEMockserver.default(options) : new FEMockserver(options);
  let allFiles: string[] = [];

  return {
    name: "vite-ui5-mockserver-plugin",
    configureServer(server) {
      // install mock server middleware after all others
      return () => {
        server.middlewares.use(mockServer.getRouter());
      };
    },
    configurePreviewServer(server) {
      // install mock server middleware after all others
      return () => {
        server.middlewares.use(mockServer.getRouter());
      };
    },
    async buildStart() {
      // find all referenced files and add them to watchlist
      const allMetadataFiles = options.services.map((service) => service.metadataPath);
      const allMockFiles = await Promise.all(
        options.services
          .filter((service) => service.mockdataPath != null && service.watch)
          .map((service) => glob("*", { cwd: service.mockdataPath, absolute: true })),
      );

      allFiles = [...allMetadataFiles, ...allMockFiles.flat()];

      allFiles.forEach((file) => {
        this.addWatchFile(file);
      });
    },
    handleHotUpdate({ file, server }) {
      const changedFile = allFiles.find((f) => f === file);
      if (!changedFile) {
        return;
      }

      // no way to wait until the mock server is restarted -> use timeout
      setTimeout(() => {
        // UI5 files changed -> force full page reload
        server.hot.send({ type: "full-reload" });
      }, 500);
    },
  };
};
