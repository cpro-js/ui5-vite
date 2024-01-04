sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/core/EventBus",
    "sap/ui/Device",
    "sap/ui/core/routing/HashChanger",
    "sap/m/MessageBox",
  ],
  function (UIComponent, EventBus, Device, HashChanger, MessageBox) {
    "use strict";

    return UIComponent.extend("react.ui5.vite.Component", {
      metadata: {
        manifest: "json",
      },

      init: function () {
        UIComponent.prototype.init.apply(this, arguments);
        this.scriptPromise = this._loadModule(this._resolveUri("/main.tsx"));

        this.eventBus = new EventBus();
        sap.ui.getCore().attachThemeChanged(this.onThemeChanged, this);
        sap.ui
          .getCore()
          .attachLocalizationChanged(this.onLocalizationChanged, this);

        // set cozy/compact classes correctly
        this.applyContentDensityClass();
      },

      render: function (oRenderManager) {
        this.reactId = this.createId("react");

        oRenderManager.openStart("div");
        oRenderManager.attr("id", this.reactId);
        oRenderManager.attr("style", "height: 100%;");
        oRenderManager.openEnd();
        oRenderManager.close("div");
      },

      onAfterRendering: function () {
        UIComponent.prototype.onAfterRendering.apply(this, arguments);

        this.scriptPromise
          .then(() => {
            var oEl = document.getElementById(this.reactId);

            // // set text direction for web components
            var bRtl = sap.ui.getCore().getConfiguration().getRTL();
            oEl.dir = bRtl ? "rtl" : "ltr";

            var oAppContext = this.getAppContext();
            var oLaunchpadContext = this.getLaunchpadContext();

            var eventBus = this.eventBus;
            var that = this;

            this.reactUnmount = window["UI5_RUNNER@react.ui5.vite"].start(oEl, {
              rootNode: oEl,
              context: oAppContext,
              launchpad: oLaunchpadContext,
              setTheme: function (sTheme) {
                sap.ui.getCore().applyTheme(sTheme);
              },
              subscribeToThemeChanges: function (cb) {
                eventBus.subscribe(
                  "onThemeChanged",
                  function (channel, eventId, data) {
                    cb(data.theme);
                  }
                );
              },
              setLocale: function (sLocale) {
                sap.ui.getCore().getConfiguration().setLanguage(sLocale);
              },
              subscribeToLocaleChanges: function (cb) {
                eventBus.subscribe(
                  "onLocaleChanged",
                  function (channel, eventId, data) {
                    cb(data.locale);
                  }
                );
              },
              resolveUri: function (sUri) {
                return that.getManifestObject().resolveUri(sUri);
              },
            });
          })
          .catch((e) => {
            console.error(e);
            MessageBox.error("message" in e ? e.message : "Failed to load app");
          });
      },

      destroy: function () {
        this.reactUnmount();

        UIComponent.prototype.destroy.apply(this, arguments);

        this.eventBus.destroy();
        sap.ui.getCore().detachThemeChanged(this.onThemeChanged, this);
        sap.ui
          .getCore()
          .detachLocalizationChanged(this.onLocalizationChanged, this);
      },

      onThemeChanged: function (oEvent) {
        var sTheme = oEvent.getParameters().theme;
        this.eventBus.publish("onThemeChanged", {
          theme: sTheme,
        });
      },

      onLocalizationChanged: function (oEvent) {
        var oChanges = oEvent.getParameters().changes;
        if (oChanges.language != null) {
          this.eventBus.publish("onLocaleChanged", {
            locale: oChanges.language,
          });
        }
      },

      getAppContext: function () {
        var oComponentData = this.getComponentData && this.getComponentData();
        var oStartupParameters =
          oComponentData && oComponentData.startupParameters
            ? oComponentData.startupParameters
            : {};
        // BCP-47 language list, e.g. de-DE, en-US, en
        var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
        // current theme e.g. sap_fiori_3
        var sTheme = sap.ui.getCore().getConfiguration().getTheme();
        // current animation mode, e.g. basic, full, minimal or none
        var sAnimationMode = sap.ui
          .getCore()
          .getConfiguration()
          .getAnimationMode();

        return {
          startupParameters: oStartupParameters,
          locale: sCurrentLocale,
          theme: sTheme,
          animationMode: sAnimationMode,
        };
      },

      isLaunchpad() {
        return sap.ushell != null;
      },

      getLaunchpadContext: function () {
        var bLaunchpad = this.isLaunchpad();

        if (!bLaunchpad) {
          return undefined;
        }

        var that = this;
        var oParseResult = this.parseShellHash(new HashChanger().getHash());

        return {
          semanticObject: oParseResult.semanticObject,
          action: oParseResult.action,
          setTitle: function (title) {
            return that.getService("ShellUIService").then(function (service) {
              service.setTitle(title);
            });
          },
          setHierarchy: function (aHierarchyLevels) {
            return that.getService("ShellUIService").then(function (service) {
              service.setHierarchy(aHierarchyLevels);
            });
          },
          setBackNavigation: function (cb) {
            return that.getService("ShellUIService").then(function (service) {
              service.setBackNavigation(function () {
                cb();
              });
            });
          },
          setRelatedApps: function (aRelatedApps) {
            return that.getService("ShellUIService").then(function (service) {
              service.setRelatedApps(aRelatedApps);
            });
          },
          isInitialNavigation: function () {
            return sap.ushell.Container.getServiceAsync(
              "CrossApplicationNavigation"
            ).then(function (service) {
              return service.isInitialNavigation();
            });
          },
          navigateToLaunchpad: function () {
            return sap.ushell.Container.getServiceAsync(
              "CrossApplicationNavigation"
            ).then(function (service) {
              service.toExternal({
                target: {
                  shellHash: "#",
                },
              });
            });
          },
          navigateToExternal: function (oTarget) {
            return sap.ushell.Container.getServiceAsync(
              "CrossApplicationNavigation"
            ).then(function (service) {
              service.toExternal({
                target: {
                  semanticObject: oTarget.semanticObject,
                  action: oTarget.action,
                },
                params: oTarget.params != null ? oTarget.params : {},
              });
            });
          },
          setDirtyFlag: function (bDirty) {
            sap.ushell.Container.setDirtyFlag(bDirty);
          },
          getDirtyFlag: function () {
            return sap.ushell.Container.getDirtyFlag();
          },
        };
      },

      parseShellHash: function (sHash) {
        var SPLIT_SHELL_APP_HASH = /^(?:#|)([\S\s]*?)(&\/[\S\s]*)?$/;
        var EXTRACT_SHELL_HASH =
          /^(([A-Za-z0-9_/]+)-([A-Za-z0-9_/-]+)(~([A-Z0-9a-z=+/]+))?)?([?]([^&]|(&[^/]))*&?)?$/;
        var splitResult = SPLIT_SHELL_APP_HASH.exec(sHash);

        if (
          splitResult == null ||
          splitResult[1] === "" ||
          !EXTRACT_SHELL_HASH.test(splitResult[1])
        ) {
          return {
            semanticObject: undefined,
            action: undefined,
          };
        }

        var extractResult = EXTRACT_SHELL_HASH.exec(splitResult[1]);

        return {
          semanticObject: extractResult[2],
          action: extractResult[3],
        };
      },

      applyContentDensityClass: function () {
        // set content density class for standalone apps only, launchpad set this already based on the manifest
        if (!this.isLaunchpad()) {
          var sClass = this.getContentDensityClass();
          if (sClass != null) {
            jQuery(document.body)
              .removeClass("sapUiSizeCozy sapUiSizeCompact")
              .addClass(sClass);
          }
        }
      },

      /**
       * Gets the current content density class either "sapUiSizeCozy", " sapUiSizeCompact".
       * Note: Launchpad sets this classes automatically based on the manifest while standalone apps require manual configuration.
       *
       * @public
       * @return {string, null} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' or null if none found
       */
      getCurrentContentDensityClass: function () {
        if (jQuery(document.body).hasClass("sapUiSizeCozy")) {
          return "sapUiSizeCozy";
        } else if (jQuery(document.body).hasClass("sapUiSizeCompact")) {
          return "sapUiSizeCompact";
        }
        return null;
      },

      /**
       * Gets the content density class to set on document.body or null if no action is required
       *
       * @return {string, null} - content density class to set or null if no action necessary
       */
      getContentDensityClass: function () {
        var bCozySupported = !!this.getManifestEntry(
          "/sap.ui5/contentDensities/cozy"
        );
        var bCompactSupported = !!this.getManifestEntry(
          "/sap.ui5/contentDensities/compact"
        );

        if (!bCozySupported && !bCompactSupported) {
          // not supported use default
          return null;
        }

        var currentClass = this.getCurrentContentDensityClass();
        if (
          (currentClass === "sapUiSizeCozy" && bCozySupported) ||
          (currentClass === "sapUiSizeCompact" && bCompactSupported)
        ) {
          // class already set, do nothing
          return null;
        } else if (bCompactSupported && !Device.support.touch) {
          return "sapUiSizeCompact";
        } else if (bCozySupported) {
          return "sapUiSizeCozy";
        }
        // nothing found
        return null;
      },
      _loadModule(srcUrl) {
        return new Promise((resolve, reject) => {
          var head = document.head || document.getElementsByTagName("head")[0];
          var script = document.createElement("script");
          script.type = "module";
          script.src = srcUrl;
          script.onload = function () {
            this.onerror = this.onload = null;
            resolve();
          };
          script.onerror = function () {
            this.onerror = this.onload = null;
            reject(new Error("Failed to load " + this.src), script);
          };

          head.appendChild(script);
        });
      },

      _resolveUri(uri) {
        return this.getManifestObject().resolveUri(uri);
      },
    });
  }
);
