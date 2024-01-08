import type MessageBox from "sap/m/MessageBox";
import RenderManager from "sap/ui/core/RenderManager";
import UIComponent from "sap/ui/core/UIComponent";
import Device from "sap/ui/Device";
import { render } from "virtual:@cpro-js/ui5-vite-app-plugin/runtime";

/**
 * @namespace react.ui5.vite
 */
export default class Component extends UIComponent {
  private scriptPromise!: Promise<void>;
  private appElementId!: string;
  private unmountApp?: () => void;

  public static metadata = {
    manifest: "json",
  };

  /**
   * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
   * @public
   * @override
   */
  public init(): void {
    super.init();
    // load custom App code
    this.scriptPromise = this._loadScriptModule(this.resolveUri("/main.tsx"));
    this.appElementId = this.createId("custom-app");

    // set content density class for standalone apps only, launchpad set this already based on the manifest
    if (!this.isLaunchpad()) {
      const densityClass = this._getContentDensityClass();
      if (densityClass != null) {
        document.body.classList.remove("sapUiSizeCozy", "sapUiSizeCompact");
        document.body.classList.add(densityClass);
      }
    }
  }

  render(oRenderManager: RenderManager) {
    oRenderManager.openStart("div");
    oRenderManager.attr("id", this.appElementId);
    oRenderManager.attr("style", "height: 100%;");
    oRenderManager.openEnd();
    oRenderManager.close("div");
  }

  async onAfterRendering() {
    super.onAfterRendering();

    try {
      await this.scriptPromise;

      const el = document.getElementById(this.appElementId) as HTMLElement;
      // // set text direction for web components
      const rtl = sap.ui.getCore().getConfiguration().getRTL();
      el.dir = rtl ? "rtl" : "ltr";

      this.unmountApp = render(el, {
        component: this,
      });
    } catch (e: Error | unknown) {
      console.error(e);
      // lazy load to speed up initial page load
      sap.ui.require(["sap/m/MessageBox"], function (MsgBox: MessageBox) {
        MsgBox.error("message" in (e as Error) ? (e as Error).message : "Failed to load app");
      });
      return;
    }
  }

  public destroy() {
    this.unmountApp?.();
    super.destroy();
  }

  public isLaunchpad(): boolean {
    return sap.ushell != null;
  }

  /**
   * Pass the relative path of your AJAX call and get a fully qualified URL back which works in all environments (local development, standalone, launchpad, etc.).
   */
  public resolveUri(uri: string): string {
    return this.getManifestObject().resolveUri(uri);
  }

  /**
   * Gets the current content density class either "sapUiSizeCozy", " sapUiSizeCompact".
   * Note: Launchpad sets this classes automatically based on the manifest while standalone apps require manual configuration.
   *
   * @public
   * @return {string, undefined} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' or undefined if none found
   */
  public getCurrentContentDensityClass(): string | undefined {
    if (document.body.classList.contains("sapUiSizeCozy")) {
      return "sapUiSizeCozy";
    } else if (document.body.classList.contains("sapUiSizeCompact")) {
      return "sapUiSizeCompact";
    }
    return undefined;
  }

  /**
   * Gets the content density class to set on document.body or undefined if no action is required
   *
   * @return {string, undefined} - content density class to set or undefined if no action necessary
   */
  private _getContentDensityClass(): "sapUiSizeCozy" | "sapUiSizeCompact" | undefined {
    const bCozySupported = !!this.getManifestEntry("/sap.ui5/contentDensities/cozy");
    const bCompactSupported = !!this.getManifestEntry("/sap.ui5/contentDensities/compact");

    if (!bCozySupported && !bCompactSupported) {
      // not supported use default
      return;
    }

    const currentClass = this.getCurrentContentDensityClass();
    if (
      (currentClass === "sapUiSizeCozy" && bCozySupported) ||
      (currentClass === "sapUiSizeCompact" && bCompactSupported)
    ) {
      // class already set, do nothing
      return;
    } else if (bCompactSupported && !Device.support.touch) {
      return "sapUiSizeCompact";
    } else if (bCozySupported) {
      return "sapUiSizeCozy";
    }
    // nothing found
    return;
  }

  private _loadScriptModule(srcUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const head = document.head || document.getElementsByTagName("head")[0];
      const script = document.createElement("script");
      script.type = "module";
      script.src = srcUrl;
      script.onload = function () {
        this.onerror = this.onload = null;
        resolve();
      };
      script.onerror = function () {
        this.onerror = this.onload = null;
        reject(new Error("Failed to load " + this.src));
      };

      head.appendChild(script);
    });
  }
}
