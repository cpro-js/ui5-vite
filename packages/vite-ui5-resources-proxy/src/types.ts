export interface ViteUI5ResourcesProxyPluginOptions {
  /**
   * The UI5 version. If this property is not defined, latest version will be used
   */
  version?: "latest" | string;
  /**
   *  Target URL to which all requests from /resources and /test-resources are forwarded.
   *  Default: https://ui5.sap.com
   */
  url?: string;
  /**
   * Enables debug output
   * Default: false
   */
  debug?: boolean;
}
