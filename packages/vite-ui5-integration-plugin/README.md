# Vite UI5 Integration Plugin

> Integrates your application created by Vite with your preferred front-end framework into the SAPUI5 environment system
> with ease.

The main idea of this plugin is to provide an easy way to integrate your third party framework application into Fiori's
Launchpad and still having the same SAPUI5 API access as a real SAPUI5 application.

How does it work? We simply wrap your application in a custom SAPUI5 Component and load your app from there. This gives
you full access to SAPUI5 APIs by passing them from the SAPUI5 Component directly into your application.

This plugin basically acts as a mediator between your App and SAPUI5 and

- ... bundles your application into a SAPUI5-compatible application
- ... provides a runtime layer for rendering and unmounting your application directly from SAPUI5
- ... takes care of your asset URLs
- ... patches HMR support in development mode when loaded via SAPUI5

**Note**: We are using this plugin to build applications with React.js and UI5 Web Components, but other frameworks
should work, too.

## Setup

... will come soon. In the meantime please have a look at the example folder for now.

## License

MIT - see [License](./LICENSE.md).
