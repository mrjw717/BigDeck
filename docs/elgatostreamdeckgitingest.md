================================================
FILE: README.md
================================================
<div align="center">

[![Stream Deck SDK banner](https://images.ctfassets.net/8j9xr8kwdre8/1ihLKCwNWEfPixs27dq0c0/130be66a5173f332e4caa892a3462893/banner.png)](https://docs.elgato.com/sdk)

# Stream Deck SDK

[![SDK documentation](https://img.shields.io/badge/Documentation-2ea043?labelColor=grey&logo=gitbook&logoColor=white)](https://docs.elgato.com/sdk)
[![Elgato homepage](https://img.shields.io/badge/Elgato-3431cf?labelColor=grey&logo=elgato)](https://elgato.com)
[![Join the Marketplace Makers Discord](https://img.shields.io/badge/Marketplace%20Makers-5662f6?labelColor=grey&logo=discord&logoColor=white)](https://discord.gg/GehBUcu627)
[![Stream Deck npm package](https://img.shields.io/npm/v/%40elgato/streamdeck?logo=npm&logoColor=white)](https://www.npmjs.com/package/@elgato/streamdeck)
[![Build status](https://img.shields.io/github/actions/workflow/status/elgatosf/streamdeck/build.yml?branch=main&label=Build&logo=GitHub)](https://github.com/elgatosf/streamdeck/actions)

</div>

Welcome to the Stream Deck SDK — Designed to make creating plugins for Stream Deck easy, the Stream Deck SDK provides everything you need to connect and communicate with Stream Deck app, letting you focus on the fun stuff.

> Creating Stream Deck plugins with Node.js requires Node.js v20. When installing Node.js, we recommended using a version manager such as [nvm](https://github.com/creationix/nvm) (macOS) or [nvm-windows](https://github.com/coreybutler/nvm-windows) (Windows).

## 🚀 Quick Start

The [Stream Deck CLI](https://github.com/elgatosf/cli) provides commands for creating, testing, and bundling your plugins, and is the easiest way to get started building for Stream Deck. You can also [learn more about getting started](https://docs.elgato.com/streamdeck/sdk/introduction/getting-started) in our documentation.

1. With Node.js installed, install the CLI.

```bash
npm install -g @elgato/cli@latest
```

2. Once installed, run the `create` command to initialize the creation wizard.

```bash
streamdeck create
```

<p align="center">
  <img src="./assets/cli-create.gif">
</p>

## 📂 File Structure

After creating a plugin with `streamdeck create` you'll be provided with a local environment for building a plugin.

```
/
├── *.sdPlugin/
│   ├── bin/
│   ├── imgs/
│   ├── logs/
│   ├── ui/
│   │   └── increment-counter.html
│   └── manifest.json
├── src/
│   ├── actions/
│   │   └── increment-counter.ts
│   └── plugin.ts
├── package.json
├── rollup.config.mjs
└── tsconfig.json
```

The `package.json` provides two scripts for building the plugin.

- `npm run build` - builds the plugin.
- `npm run watch` - continuously watches for changes, and hot-reloads the plugin after build.

## 🎛️ Actions

Actions are the star of the show and enable users to interact with your plugin. Actions are represented as classes that inherit from `SingletonAction`, enabling your plugin to receive events from Stream Deck, for example key down, dial rotate, etc.

The following is an example of an action that listens for the `keyDown` event, and then sets the title of the source action.

```typescript
import { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";

@action({ UUID: "com.elgato.hello-world.say-hello" })
export class SayHelloAction extends SingletonAction {
    /**
     * Listen for the key down event that occurs when a user presses
     * a Stream Deck button, and change the title of the action.
     */
    async onKeyDown(ev: KeyDownEvent) {
        await ev.action.setTitle("Hello world");
    }
}
```

## 🔎 Debugging

Plugins can be debugged using any Node.js debugger, for example Visual Studio Code, Chrome, etc., and by default will have debugging enabled when created with the Stream Deck CLI `streamdeck create` command.

You can configure debugging within the [manifest's Node.js configuration](https://docs.elgato.com/streamdeck/sdk/references/manifest#nodejs).

<!-- prettier-ignore-start -->

```jsonc
{
    // ...
    "Nodejs": {
        "Version": "20",
        "Debug": "enabled"
    },
}
```

<!-- prettier-ignore-end -->

There are four available options when configuring the `Debug` property within the manifest:

- `"enabled"` - the plugin will run with [`--inspect`](https://nodejs.org/api/cli.html#--inspecthostport) allowing debuggers to connect.
- `"break"` - the plugin will launch with [`--inspect-brk`](https://nodejs.org/api/cli.html#--inspect-brkhostport) and will await a debugger attaching before running.
- `string` - a collection of [CLI arguments](https://nodejs.org/api/cli.html) supplied to the plugin.
- `undefined` - debugging is disabled.

> When running the plugin in either debug mode `"enabled"` or `"break"`, a random available port will be allocated to the debug listener each time the plugin launches. If you wish to listen on a specific port, the `Debug` value can be set to a string of CLI arguments, for example to listen on port `12345`, the `Debug` value would be `--inspect=127.0.0.1:12345`.

## 📖 Further Reading

- [Making your first changes](https://docs.elgato.com/streamdeck/sdk/introduction/your-first-changes).
- Learn about [key](https://docs.elgato.com/streamdeck/sdk/guides/keys) and [dial](https://docs.elgato.com/streamdeck/sdk/guides/dials) actions.
- Understand your plugin's metadata within the [manifest JSON file](https://docs.elgato.com/streamdeck/sdk/references/manifest)
- Bundle your plugin for [distribution](https://docs.elgato.com/streamdeck/sdk/guides/distribution).
- Explore [Stream Deck plugin samples](https://github.com/elgatosf/streamdeck-plugin-samples)



================================================
FILE: CHANGELOG.md
================================================
<!--

## {version}

⚠️ Breaking change
✨ New
🐞 Fix
♻️ Refactor / Enhance / Update
⬆️ Upgrading

-->

# Change Log

## 2.0.0

### ✨ New

- Added support for DRM protection.
- Added support for embedded resources.
- Added `onDidReceiveResources` to `SingletonAction`.
- Added `setResources(resources)` to action.
- Added `getResources()` to action.
- Added support for experimental message identifiers.

### ♻️ Refactor

- Streamlined sending messages to the UI:
    - Before: `streamDeck.ui.current?.sendToPropertyInspector(...)`
    - After: `streamDeck.ui.sendToPropertyInspector(...)`
- Streamlined property inspector action information:
    - Before: `streamDeck.ui.current?`
    - After: `streamDeck.ui.action`
- Removed manifest namespace.
- Removed browser import.
- Removed property inspector types and routing.
- Updated module resolution to `NodeNext` for better interoperability.
- Removed rollup bundling to improve dependency resolution.

### 🐞 Fix

- Updated manifest parsing to be optional.

## 1.4.0

### ✨ New

- Add `streamDeck.devices.onDidChange` event; occurs when a device name or size changes.

### ♻️ Update

- Device size now reflects visible canvas size of scalable devices, for example Stream Deck Mobile and Virtual Stream Deck.

## 1.4.1

### ♻️ Update

- Add SDK version compatibility check.

## 1.4.0

### ✨ New

- Add `streamDeck.devices.onDidChange` event; occurs when a device name or size changes.

### ♻️ Update

- Device size now reflects visible canvas size of scalable devices, for example Stream Deck Mobile and Virtual Stream Deck.

## 1.3.1

### 🐞 Fix

- Update reading of the manifest to be lazy to improve mocking within tests.

## 1.3.0

### ✨ New

- Add support for serializing enumerable collections.

### ♻️ Update

- Improve documentation for profile switching.
- Update dependencies.

## 1.2.1

### ♻️ Update

- Update `@elgato/schemas` dependency.

### 🐞 Fix

- Fix Node.js engine requirements.

## 1.2.0

### ✨ New

- Add support for Chinese (Traditional).

### 🐞 Fix

- Fix types of `EventEmitter` event arguments.

## 1.1.0

### ✨ New

- Add [`.drop()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/drop), [`.flapMap()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/flatMap), [`.take()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/take), and [`.toArray()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator/toArray) iterator helper polyfills to `Enumerable`.

### ♻️ Update

- Update `SingletonAction.actions` to return an `Enumerable`.

## 1.0.1

### ♻️ Update

- Update minimum allowed log level in production to be `DEBUG` to assist with debugging (default remains `INFO`).

## 1.0.0

### ✨ New

- Add action tracking, allowing access to currently visible actions.
    - `streamDeck.actions` — all visible actions.
    - `SingletonAction.actions` — visible actions that match the action's UUID.
- Add `setTitle` to `DialAction`, allowing you to set the title of a layout.
- Add `Enumerable` class for creating readonly collections.
- Add device information to `Action` provided in event arguments.
- Add iterator helpers to `streamDeck.devices` and `streamDeck.actions`.

### 🐞 Fix

- Fix missing language support for Korean (ko).
- Fix TypeScript declaration incorrectly exporting types as classes.

### ♻️ Update

- Remove `streamDeck.actions.createController` in favor of `streamDeck.actions.getActionById`.
- Remove `Action.sendToPropertyInspector` in favour of `streamDeck.ui.current.sendToPropertyInspector`.
- Remove `ev.deviceId` in favour of `ev.action.device.id`.
- Rename `onDidConnect` to `onConnected` within the UI.

## 0.4.0-beta

### ✨ New

- Package can now be imported in both Node.js and the browser (in the scope of a property inspector).
- Add support for property inspector.
    - Add `streamDeck.onDidConnect` event listener.
    - Add `streamDeck.settings` namespace for interacting with settings.
    - Add `streamDeck.system` namespace for system-related operations.
    - Add `streamDeck.plugin` namespace for bi-direction communication with the plugin and the UI.
- Add `isInMultiAction` to the property inspector's action information.

### 🐞 Fix

- `Coordinates` type could erroneously have a non-number type for `row`.
- Fix support for allowed types within payloads.
- Fix localization lookup to index from `Localization`.
- Fix race condition when tracking the property inspector.
- Fix `streamDeck.setGlobalSettings` to require settings that extend `JsonObject`.

### ♻️ Update

- Update layout and manifest references to propagate from [`@elgato/schemas`](https://github.com/elgatosf/schemas).
- Localization lookup will now return the key if the resource is not defined.
- Update structure of JSON localizations.
- Update `State` type to allow for more than two states.
- Update routing to prevent exposure of internal messages.
- Update build to export Stream Deck API types.
- Update `ws` dependency.

## 0.3.0

### ✨ New

- Add cross-compatible event emitter with type support.
- Add pattern validation for manifest's `Version`.
- Add validation of colors defined within the manifest.

### 🐞 Fix

- Fix `PayloadObject` not being exported; enables inheritance of actions.
- Fix manifest layout not allowing `$A0` as a pre-defined value.

### ♻️ Update

- Update manifest file path validation to prevent referencing a file outside of the plugin directory.
- Update manifest file path validation to allow periods.
- Update manifest UUID validation to allow more than 3 segments.
- Update manifest UUID validation to prevent underscores.
- Update documentation of `Actions[].Image` to reflect support for .gif files.
- Update default export to be named (improving VSCode intellisense).

### 🗑️ Remove

- Remove `$A2` incorrectly being listed as a pre-defined layout.

## 0.2.0

### ✨ New

#### Stream Deck 6.5

- Add support for receiving messages via deep-linking.
    - URL format: `streamdeck://plugins/message/<PLUGIN_UUID>/<MESSAGE>`
    - Accessible as part of the `system` namespace, `streamDeck.system.onDidReceiveDeepLink`
- Add support for switching to a specific profile page when calling `switchToProfile`.
- Add `controller` information to `WillAppear` and `WillDisappear` events for multi-actions.
- Add support for Node.js plugins with the `.cjs` or `.mjs` file extensions.

#### Node.js SDK

- Add `profiles`, `settings`, `system`, and `ui` namespaces.
- Add `streamDeck.actions.createController(id)` to enable the control of a contextualized action.
- Add `streamDeck.devices.getDeviceBy(deviceId)` to enable the selection of a device by identifier.
- Add `length`, `forEach`, and `[Symbol.iterator]` to `streamDeck.devices` to enable iteration.

### ♻️ Improvements

- Refactor `streamDeck.devices` to namespace.
- Update manifest JSON schema to support Stream Deck 6.5.
- Improve enum support in manifest and layout JSON schemas.
- Node.js runtime updated to v20.8.1.

### 🐞 Bug Fixes

- Correctly validate paths without extensions in manifest JSON schema.
- Default `text-overflow` set to `ellipsis` in layout JSON schema.

## 0.1.0

### ✨ New

- Add Stream Deck communication client (see `streamDeck.client`).
- Add support for receiving all events (Stream Deck 6.4).
- Add support for sending all commands (Stream Deck 6.4).
- Add action routing (see `streamDeck.actions`).
- Add centralized device information tracking (see `streamDeck.devices`).
- Add local file-based logging framework (see `streamDeck.logger`).
- Add localization support (see `streamDeck.i18n`).
- Add manifest information (see `streamDeck.manifest`).
- Add Stream Deck and plugin information (see `streamDeck.info`).



================================================
FILE: eslint.config.mjs
================================================
import { config } from "@elgato/eslint-config";

export default config.strict;



================================================
FILE: LICENSE
================================================
MIT License

Copyright (c) Corsair Memory Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.



================================================
FILE: package.json
================================================
{
    "name": "@elgato/streamdeck",
    "version": "2.0.0",
    "description": "The official Node.js SDK for creating Stream Deck plugins.",
    "main": "./dist/plugin/index.js",
    "type": "module",
    "engines": {
        "node": ">=20.5.1"
    },
    "files": [
        "./dist/**/*.js",
        "./dist/**/*.d.ts"
    ],
    "exports": "./dist/plugin/index.js",
    "types": "./dist/plugin/index.d.ts",
    "scripts": {
        "build": "rm -rf ./dist && tsc -p tsconfig.build.json",
        "watch": "rm -rf ./dist && tsc -p tsconfig.build.json -w",
        "lint": "eslint --max-warnings 0",
        "lint:fix": "prettier . --write",
        "preversion": "npm run build && npm test && npm run lint",
        "test": "vitest --run --reporter verbose",
        "test:coverage": "vitest run --coverage",
        "test:watch": "vitest"
    },
    "prettier": "@elgato/prettier-config",
    "repository": {
        "type": "git",
        "url": "git+https://github.com/elgatosf/streamdeck.git"
    },
    "keywords": [
        "elgato",
        "stream deck",
        "plugin",
        "sdk",
        "framework",
        "marketplace",
        "maker"
    ],
    "author": {
        "name": "Elgato",
        "url": "https://www.elgato.com"
    },
    "license": "MIT",
    "bugs": {
        "url": "https://github.com/elgatosf/streamdeck/issues"
    },
    "homepage": "https://github.com/elgatosf/streamdeck#readme",
    "devDependencies": {
        "@elgato/eslint-config": "^0.3.1",
        "@elgato/prettier-config": "^0.2.6",
        "@tsconfig/node20": "^20.1.4",
        "@types/node": "^24.5.2",
        "@types/ws": "^8.5.14",
        "@vitest/coverage-v8": "^3.2.4",
        "eslint": "^9.18.0",
        "mock-socket": "^9.3.1",
        "prettier": "^3.4.2",
        "tslib": "^2.8.1",
        "typescript": "^5.7.3",
        "vitest": "^3.2.4",
        "vitest-websocket-mock": "^0.5.0"
    },
    "dependencies": {
        "@elgato/schemas": "^0.4.10",
        "@elgato/utils": "^0.4.1",
        "ws": "^8.18.0"
    }
}



================================================
FILE: tsconfig.build.json
================================================
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "declaration": true,
        "noEmit": false,
        "outDir": "dist"
    },
    "exclude": [
        "tests/*",
        "**/__mocks__/",
        "**/__tests__/"
    ]
}



================================================
FILE: tsconfig.json
================================================
{
    "extends": "@tsconfig/node20/tsconfig.json",
    "compilerOptions": {
        "customConditions": [
            "node"
        ],
        "lib": [
            "es2022",
            "esnext.disposable"
        ],
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "noEmit": true,
        "verbatimModuleSyntax": true
    },
    "include": [
        "src/",
        "tests/"
    ],
    "exclude": [
        "node_modules/"
    ]
}



================================================
FILE: vitest.config.ts
================================================
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		clearMocks: true,
		environment: "node",
		setupFiles: [
			"./tests/__setup__/global.ts",
			"./tests/__setup__/ws.ts",
		],
	},
});



================================================
FILE: .editorconfig
================================================
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = tab
max_line_length = 120

[*.{json,jsonc,md}]
indent_size = 4
indent_style = space

[*.{yaml,yml}]
indent_size = 2
indent_style = space


================================================
FILE: .npmrc
================================================
sign-git-tag=true



================================================
FILE: src/api/command.ts
================================================
import type { JsonObject, JsonValue } from "@elgato/utils";

import type { DidReceiveGlobalSettings, DidReceiveSettings, State } from "./events/index.js";
import type { FeedbackPayload } from "./layout.js";
import type { Resources } from "./resources.js";
import type { Target } from "./target.js";

/**
 * Command sent to Stream Deck.
 */
type CommandBase<TCommand> = {
	/**
	 * Name of the command, used to identify the request.
	 */
	event: TCommand;
};

/**
 * Command sent to Stream Deck, with payload information.
 */
type CommandBaseWithPayload<TCommand, TPayload> = CommandBase<TCommand> & {
	/**
	 * Additional information supplied as part of the command.
	 */
	payload: TPayload;
};

/**
 * A {@link CommandBase} that is associated with a specific action identified by the context..
 */
type ContextualizedCommand<TCommand> = CommandBase<TCommand> & {
	/**
	 * Defines the context of the command, e.g. which action instance the command is intended for.
	 */
	context: string;
};

/**
 * A {@link CommandBase} that is associated with a specific action identified by the context.
 */
type ContextualizedCommandWithPayload<TCommand, TPayload> = ContextualizedCommand<TCommand> & {
	/**
	 * Additional information supplied as part of the command.
	 */
	payload: TPayload;
};

/**
 * Sets the settings associated with an instance of an action.
 */
export type SetSettings = ContextualizedCommandWithPayload<"setSettings", JsonObject>;

/**
 * Gets the settings associated with an instance of an action. Causes {@link DidReceiveSettings} to be emitted.
 */
export type GetSettings = ContextualizedCommand<"getSettings"> & {
	/**
	 * Optional identifier that can be used to identify the response to this request.
	 */
	id?: string;
};

/**
 * Sets the global settings associated with the plugin.
 */
export type SetGlobalSettings = ContextualizedCommandWithPayload<"setGlobalSettings", JsonObject>;

/**
 * Gets the global settings associated with the plugin. Causes {@link DidReceiveGlobalSettings} to be emitted.
 */
export type GetGlobalSettings = ContextualizedCommand<"getGlobalSettings"> & {
	/**
	 * Optional identifier that can be used to identify the response to this request.
	 */
	id?: string;
};

/**
 * Gets secrets associated with the plugin.
 */
export type GetSecrets = ContextualizedCommand<"getSecrets">;

/**
 * Sets the resources (files) associated with the action; these resources are embedded into the action
 * when it is exported, either individually, or as part of a profile.
 *
 * Available from Stream Deck 7.1.
 */
export type SetResources = ContextualizedCommandWithPayload<"setResources", Resources>;

/**
 * Gets the resources (files) associated with the action; these resources are embedded into the action
 * when it is exported, either individually, or as part of a profile.
 *
 * Available from Stream Deck 7.1.
 */
export type GetResources = ContextualizedCommand<"getResources"> & {
	/**
	 * Optional identifier that can be used to identify the response to this request.
	 */
	id?: string;
};

/**
 * Opens the URL in the user's default browser.
 */
export type OpenUrl = CommandBaseWithPayload<
	"openUrl",
	{
		/**
		 * URL to open.
		 */
		url: string;
	}
>;

/**
 * Logs a message to the file-system.
 */
export type LogMessage = CommandBaseWithPayload<
	"logMessage",
	{
		/**
		 * Message to log.
		 */
		message: string;
	}
>;
/**
 * Sets the title displayed for an instance of an action.
 */
export type SetTitle = ContextualizedCommandWithPayload<
	"setTitle",
	{
		/**
		 * Action state the request applies to; when no state is supplied, the title is set for both states. **Note**, only applies to multi-state actions.
		 */
		state?: State;

		/**
		 * Specifies which aspects of the Stream Deck should be updated, hardware, software, or both.
		 */
		target?: Target;

		/**
		 * Title to display; when no title is specified, the title will reset to the title set by the user.
		 */
		title?: string;
	}
>;

/**
 * Sets the image associated with an action instance.
 */
export type SetImage = ContextualizedCommandWithPayload<
	"setImage",
	{
		/**
		 * Image to display; this can be either a path to a local file within the plugin's folder, a base64 encoded `string` with the mime type declared (e.g. PNG, JPEG, etc.),
		 */
		image?: string;

		/**
		 * Action state the command applies to; when no state is supplied, the image is set for both states. **Note**, only applies to multi-state actions.
		 */
		state?: State;

		/**
		 * Specifies which aspects of the Stream Deck should be updated, hardware, software, or both.
		 */
		target?: Target;
	}
>;

/**
 * Set's the feedback of an existing layout associated with an action instance.
 */
export type SetFeedback = ContextualizedCommandWithPayload<"setFeedback", FeedbackPayload>;

/**
 * Sets the layout associated with an action instance.
 */
export type SetFeedbackLayout = ContextualizedCommandWithPayload<
	"setFeedbackLayout",
	{
		/**
		 * Name of a pre-defined layout, or relative path to a custom one.
		 */
		layout: string;
	}
>;

/**
 * Temporarily shows an alert (i.e. warning), in the form of an exclamation mark in a yellow triangle, on the action instance. Used to provide visual feedback when an action failed.
 */
export type ShowAlert = ContextualizedCommand<"showAlert">;

/**
 * Temporarily shows an "OK" (i.e. success), in the form of a check-mark in a green circle, on the action instance. Used to provide visual feedback when an action successfully executed.
 */
export type ShowOk = ContextualizedCommand<"showOk">;

/**
 * Sets the current state of an action instance.
 */
export type SetState = ContextualizedCommandWithPayload<
	"setState",
	{
		/**
		 * State to set; this be either 0, or 1.
		 */
		state: State;
	}
>;

/**
 * Sets the trigger descriptions associated with an encoder action instance.
 */
export type SetTriggerDescription = ContextualizedCommandWithPayload<
	"setTriggerDescription",
	{
		/**
		 * Touchscreen "long-touch" interaction behavior description; when `undefined`, the description will not be shown.
		 */
		longTouch?: string;

		/**
		 * Dial "push" (press) interaction behavior description; when `undefined`, the description will not be shown.
		 */
		push?: string;

		/**
		 * Dial rotation interaction behavior description; when `undefined`, the description will not be shown.
		 */
		rotate?: string;

		/**
		 * Touchscreen "touch" interaction behavior description; when `undefined`, the description will not be shown.
		 */
		touch?: string;
	}
>;

/**
 * Switches to the profile, as distributed by the plugin, on the specified device.
 *
 * NB: Plugins may only switch to profiles distributed with the plugin, as defined within the manifest, and cannot access user-defined profiles.
 */
export type SwitchToProfile = ContextualizedCommandWithPayload<
	"switchToProfile",
	{
		/**
		 * Optional page to show when switching to the profile, indexed from 0. When `undefined`, the
		 * page that was previously visible (when switching away from the profile will be made visible.
		 */
		page?: number;

		/**
		 * Name of the profile to switch to; the name must be identical to the one provided in the manifest.
		 *
		 * When not specified, Stream Deck will switch to the previous profile.
		 */
		profile?: string;
	}
> & {
	/**
	 * Unique identifier of the device where the profile should be set.
	 */
	device: string;
};

/**
 * Sends a message to the property inspector.
 */
export type SendToPropertyInspector<TPayload extends JsonValue = JsonValue> = ContextualizedCommandWithPayload<
	"sendToPropertyInspector",
	TPayload
>;

/**
 * Command sent to Stream Deck, from the plugin.
 */
export type PluginCommand =
	| GetGlobalSettings
	| GetResources
	| GetSecrets
	| GetSettings
	| LogMessage
	| OpenUrl
	| SendToPropertyInspector
	| SetFeedback
	| SetFeedbackLayout
	| SetGlobalSettings
	| SetImage
	| SetResources
	| SetSettings
	| SetState
	| SetTitle
	| SetTriggerDescription
	| ShowAlert
	| ShowOk
	| SwitchToProfile;



================================================
FILE: src/api/device.ts
================================================
import { DeviceType } from "@elgato/schemas/streamdeck/plugins";

export { DeviceType };

/**
 * Provides information for a device.
 */
export type DeviceInfo = {
	/**
	 * Name of the device, as specified by the user in the Stream Deck application.
	 */
	readonly name: string;

	/**
	 * Number of action slots, excluding dials / touchscreens, available to the device.
	 */
	readonly size: Size;

	/**
	 * Type of the device that was connected, e.g. Stream Deck +, Stream Deck Pedal, etc. See {@link DeviceType}.
	 */
	readonly type: DeviceType;
};

/**
 * Size of the Stream Deck device.
 */
export type Size = {
	/**
	 * Number of columns available on the Stream Deck device.
	 */
	readonly columns: number;

	/**
	 * Number of rows available on the Stream Deck device.
	 */
	readonly rows: number;
};



================================================
FILE: src/api/i18n.ts
================================================
/**
 * Languages supported by Stream Deck.
 */
export const supportedLanguages = ["de", "en", "es", "fr", "ja", "ko", "zh_CN", "zh_TW"] as const;

/**
 * Language supported by Stream Deck
 */
export type Language = (typeof supportedLanguages)[number];



================================================
FILE: src/api/index.ts
================================================
export * from "./command.js";
export * from "./device.js";
export * from "./events/index.js";
export * from "./i18n.js";
export * from "./layout.js";
export * from "./registration/index.js";
export * from "./resources.js";
export * from "./target.js";

export { type Manifest } from "@elgato/schemas/streamdeck/plugins";



================================================
FILE: src/api/layout.ts
================================================
import * as schemas from "@elgato/schemas/streamdeck/plugins";

export { BarSubType } from "@elgato/schemas/streamdeck/plugins";

/**
 * Bar layout item used to render a horizontal bar with a filler, e.g. a progress bar. The amount to fill the bar by can be specified by setting the `value`.
 */
export type Bar = FeedbackPayloadItem<schemas.Bar>;

/**
 * Bar layout item used to render a horizontal bar with an indicator represented as a triangle beneath the bar. The location of the indicator can be specified by setting the `value`.
 */
export type GBar = FeedbackPayloadItem<schemas.GBar>;

/**
 * Image layout item used to render an image sourced from either a local file located under the plugin's folder, or base64 encoded `string`. The `value` defines the image.
 */
export type Pixmap = FeedbackPayloadItem<schemas.Pixmap>;

/**
 * Text layout item used to render text within a layout. **Note**, when adding a text item to the layout's JSON definition, setting the `key` to the `"title"` keyword will enable the
 * user to specify the font's settings via the property inspector, and will cause `setTitle` to update this item
 */
export type Text = FeedbackPayloadItem<schemas.Text>;

/**
 * Payload object used to update a Stream Deck encoder's (touchscreen) layout.
 */
export type FeedbackPayload = Record<string, Bar | GBar | Pixmap | Text | number | string>;

/**
 * Omits immutable properties from {@template T}.
 */
type FeedbackPayloadItem<T extends schemas.Bar | schemas.GBar | schemas.Pixmap | schemas.Text> = Partial<
	Omit<T, "key" | "rect" | "type">
>;



================================================
FILE: src/api/resources.ts
================================================
/**
 * Resources (files) associated with an action, represented as a map of keys and paths, for example.
 * ```
 * {
 *   fileOne: "c:\\hello-world.txt",
 *   anotherFile: "c:\\icon.png"
 * }
 * ```
 */
export type Resources = {
	[key: string]: string;
};



================================================
FILE: src/api/target.ts
================================================
/**
 * Defines the target of a request, i.e. whether the request should update the Stream Deck hardware, Stream Deck software (application), or both, when calling `setImage` and `setState`.
 */
export enum Target {
	/**
	 * Hardware and software should be updated as part of the request.
	 */
	HardwareAndSoftware = 0,

	/**
	 * Hardware only should be updated as part of the request.
	 */
	Hardware = 1,

	/**
	 * Software only should be updated as part of the request.
	 */
	Software = 2,
}



================================================
FILE: src/api/__mocks__/events.ts
================================================
import { DeviceType } from "../device.js";
import type * as events from "../events/index.js";

const action = "com.elgato.test.one";
const context = "context123";
const device = "device123";

/**
 * Mocked {@link events.ApplicationDidLaunch} message.
 */
export const applicationDidLaunch: events.ApplicationDidLaunch = {
	event: "applicationDidLaunch",
	payload: {
		application: "notepad.exe",
	},
};

/**
 * Mocked {@link events.ApplicationDidTerminate} message.
 */
export const applicationDidTerminate: events.ApplicationDidTerminate = {
	event: "applicationDidTerminate",
	payload: {
		application: "cmd.exe",
	},
};

/**
 * Mocked {@link events.DeviceDidConnect} message.
 */
export const deviceDidConnect: events.DeviceDidConnect = {
	event: "deviceDidConnect",
	device,
	deviceInfo: {
		name: "Test Device",
		size: {
			columns: 8,
			rows: 4,
		},
		type: DeviceType.StreamDeckXL,
	},
};

/**
 * Mocked {@link events.DeviceDidConnect} message.
 */
export const deviceDidDisconnect: events.DeviceDidDisconnect = {
	event: "deviceDidDisconnect",
	device,
};

/**
 * Mocked {@link events.DialDown} message.
 */
export const dialDown: events.DialDown<Settings> = {
	event: "dialDown",
	action,
	context,
	device,
	payload: {
		controller: "Encoder",
		coordinates: {
			column: 3,
			row: 0,
		},
		resources: {},
		settings: {
			name: "Elgato",
		},
	},
};

/**
 * Mocked {@link events.DialRotate} message.
 */
export const dialRotate: events.DialRotate<Settings> = {
	event: "dialRotate",
	action,
	context,
	device,
	payload: {
		controller: "Encoder",
		coordinates: {
			column: 3,
			row: 0,
		},
		pressed: true,
		resources: {},
		settings: {
			name: "Elgato",
		},
		ticks: -2,
	},
};

/**
 * Mocked {@link events.DialUp} message.
 */
export const dialUp: events.DialUp<Settings> = {
	...dialDown,
	event: "dialUp",
};

/**
 * Mocked {@link events.DidReceiveGlobalSettings} message.
 */
export const didReceiveGlobalSettings: events.DidReceiveGlobalSettings<Settings> = {
	event: "didReceiveGlobalSettings",
	payload: {
		settings: {
			name: "Elgato",
		},
	},
};

/**
 * Mocked {@link events.DidReceiveSettings} message.
 */
export const didReceiveSettings: events.DidReceiveSettings<Settings> = {
	action,
	context,
	device,
	event: "didReceiveSettings",
	payload: {
		controller: "Encoder",
		coordinates: {
			column: 1,
			row: 0,
		},
		isInMultiAction: false,
		resources: {},
		settings: {
			name: "Elgato",
		},
	},
};

/**
 * Mocked {@link events.KeyDown} message.
 */
export const keyDown: events.KeyDown<Settings> = {
	action,
	context,
	device,
	event: "keyDown",
	payload: {
		controller: "Keypad",
		coordinates: {
			column: 2,
			row: 2,
		},
		isInMultiAction: false,
		resources: {},
		settings: {
			name: "Elgato",
		},
		state: 1,
	},
};

/**
 * Mocked {@link events.KeyUp} message.
 */
export const keyUp: events.KeyUp<Settings> = {
	...keyDown,
	event: "keyUp",
};

/**
 * Mocked {@link events.PropertyInspectorDidAppear} message.
 */
export const propertyInspectorDidAppear: events.PropertyInspectorDidAppear = {
	action,
	context,
	device,
	event: "propertyInspectorDidAppear",
};

/**
 * Mocked {@link events.PropertyInspectorDidDisappear} message.
 */
export const propertyInspectorDidDisappear: events.PropertyInspectorDidDisappear = {
	...propertyInspectorDidAppear,
	event: "propertyInspectorDidDisappear",
};

/**
 * Mocked {@link events.DidReceivePropertyInspectorMessage} message.
 */
export const didReceivePropertyInspectorMessage: events.DidReceivePropertyInspectorMessage<Settings> = {
	action,
	context,
	event: "sendToPlugin",
	payload: {
		name: "Elgato",
	},
};

/**
 * Mocked {@link events.SystemDidWakeUp} message.
 */
export const systemDidWakeUp: events.SystemDidWakeUp = {
	event: "systemDidWakeUp",
};

/**
 * Mocked {@link events.TitleParametersDidChange} message.
 */
export const titleParametersDidChange: events.TitleParametersDidChange<Settings> = {
	action,
	context,
	device,
	event: "titleParametersDidChange",
	payload: {
		controller: "Keypad",
		coordinates: {
			column: 3,
			row: 4,
		},
		resources: {},
		settings: {
			name: "Elgato",
		},
		title: "Hello world",
		titleParameters: {
			fontFamily: "Arial",
			fontSize: 13,
			fontStyle: "Bold Italic",
			fontUnderline: true,
			showTitle: false,
			titleAlignment: "middle",
			titleColor: "#ffffff",
		},
		state: 1,
	},
};

/**
 * Mocked {@link events.TouchTap} message.
 */
export const touchTap: events.TouchTap<Settings> = {
	action,
	context,
	device,
	event: "touchTap",
	payload: {
		controller: "Encoder",
		coordinates: {
			column: 4,
			row: 0,
		},
		hold: true,
		resources: {},
		settings: {
			name: "Elgato",
		},
		tapPos: [10, 50],
	},
};

/**
 * Mocked {@link events.WillAppear} message.
 */
export const willAppear: events.WillAppear<Settings> = {
	action,
	context,
	device,
	event: "willAppear",
	payload: {
		controller: "Keypad",
		coordinates: {
			column: 8,
			row: 2,
		},
		isInMultiAction: false,
		resources: {},
		settings: {
			name: "Elgato",
		},
		state: 1,
	},
};

/**
 * Mocked {@link events.WillDisappear} message.
 */
export const willDisappear: events.WillDisappear<Settings> = {
	...willAppear,
	event: "willDisappear",
};

/**
 * Mock settings.
 */
export type Settings = {
	/**
	 * Mock property.
	 */
	name: string;
};

export type Secrets = {
	/**
	 * Mock property.
	 */
	secret: string;
};



================================================
FILE: src/api/events/action.ts
================================================
import type { Controller } from "@elgato/schemas/streamdeck/plugins";
import type { JsonObject } from "@elgato/utils";

import type { Resources } from "../resources.js";
import type { DeviceIdentifier } from "./device.js";
import type { EventIdentifier } from "./index.js";

/**
 * Occurs when the settings associated with an action instance are requested, or when the the settings
 * were updated in the property inspector.
 */
export type DidReceiveSettings<TSettings extends JsonObject> = ActionEventMessage<
	"didReceiveSettings",
	MultiActionPayload<TSettings> | SingleActionPayload<TSettings>
> & {
	/**
	 * Identifier provided when requesting the settings, used to identify the source of the request.
	 *
	 * This is always undefined if the event is received because the settings were changed in the property
	 * inspector.
	 */
	readonly id?: string;
};

/**
 * Occurs when the resources associated with an action instance are requested, or when the the resources
 * were updated in the property inspector.
 */
export type DidReceiveResources<TSettings extends JsonObject> = ActionEventMessage<
	"didReceiveResources",
	MultiActionPayload<TSettings> | SingleActionPayload<TSettings>
> & {
	/**
	 * Identifier provided when requesting the resources, used to identify the source of the request.
	 *
	 * This is always undefined if the event is received because the resources were changed in the property
	 * inspector.
	 */
	readonly id?: string;
};

/**
 * Occurs when the user updates an action's title settings in the Stream Deck application.
 */
export type TitleParametersDidChange<TSettings extends JsonObject> = ActionEventMessage<
	"titleParametersDidChange",
	Omit<SingleActionPayload<TSettings>, "isInMultiAction"> & {
		/**
		 * Title of the action, as specified by the user or dynamically by the plugin.
		 */
		readonly title: string;

		/**
		 * Defines aesthetic properties that determine how the title should be rendered.
		 */
		readonly titleParameters: {
			/**
			 * Font-family the title will be rendered with.
			 */
			readonly fontFamily: string;

			/**
			 * Font-size the title will be rendered in.
			 */
			readonly fontSize: number;

			/**
			 * Typography of the title.
			 */
			readonly fontStyle: "" | "Bold Italic" | "Bold" | "Italic" | "Regular";

			/**
			 * Determines whether the font should be underlined.
			 */
			readonly fontUnderline: boolean;

			/**
			 * Determines whether the user has opted to show, or hide the title for this action instance.
			 */
			readonly showTitle: boolean;

			/**
			 * Alignment of the title.
			 */
			readonly titleAlignment: "bottom" | "middle" | "top";

			/**
			 * Color of the title, represented as a hexadecimal value.
			 */
			readonly titleColor: string;
		};
	}
>;

/**
 * Occurs when an action appears on the Stream Deck due to the user navigating to another page, profile, folder, etc. This also occurs during startup if the action is on the "front
 * page". An action refers to _all_ types of actions, e.g. keys, dials, touchscreens, pedals, etc.
 */
export type WillAppear<TSettings extends JsonObject> = ActionEventMessage<
	"willAppear",
	MultiActionPayload<TSettings> | SingleActionPayload<TSettings>
>;

/**
 * Occurs when an action disappears from the Stream Deck due to the user navigating to another page, profile, folder, etc. An action refers to _all_ types of actions, e.g. keys, dials,
 * touchscreens, pedals, etc.
 */
export type WillDisappear<TSettings extends JsonObject> = ActionEventMessage<
	"willDisappear",
	MultiActionPayload<TSettings> | SingleActionPayload<TSettings>
>;

/**
 * Provide information that identifies an action associated with an event.
 */
export type ActionIdentifier = {
	/**
	 * Unique identifier of the action as defined within the plugin's manifest (`Actions[].UUID`) e.g. "com.elgato.wavelink.mute".
	 */
	readonly action: string;

	/**
	 * Identifies the instance of an action that caused the event, i.e. the specific key or dial. This identifier can be used to provide feedback to the Stream Deck, persist and
	 * request settings associated with the action instance, etc.
	 */
	readonly context: string;
};

/**
 * Provides information for an event relating to an action, for example `willAppear`.
 */
export type ActionEventMessage<TEvent extends string, TPayload> = ActionIdentifier &
	DeviceIdentifier &
	EventIdentifier<TEvent> & {
		/**
		 * Contextualized information for this event.
		 */
		readonly payload: TPayload;
	};

/**
 * Provides information for an event relating to an action, for example `propertyInspectorDidAppear`.
 */
export type ActionEventMessageWithoutPayload<TEvent extends string> = Omit<ActionEventMessage<TEvent, void>, "payload">;

/**
 * Additional information about the action and event that occurred as part of a single-action event.
 */
export type SingleActionPayload<
	TSettings extends JsonObject,
	TController extends Controller = Controller,
> = ActionPayload<TSettings> & {
	/**
	 * Coordinates that identify the location of an action.
	 */
	readonly coordinates: Coordinates;

	/**
	 * Defines the controller type the action is applicable to. **Keypad** refers to a standard action on a Stream Deck device, e.g. 1 of the 15 buttons on the Stream Deck MK.2,
	 * or a pedal on the Stream Deck Pedal, etc., whereas an **Encoder** refers to a dial / touchscreen on the Stream Deck +.
	 */
	readonly controller: TController;

	/**
	 * Determines whether the action is part of a multi-action.
	 *
	 * NB. Requires Stream Deck 6.7 when accessed from the property inspector.
	 */
	readonly isInMultiAction: false;

	/**
	 * Resources (files) associated with the action.
	 *
	 * Available from Stream Deck 7.1.
	 */
	readonly resources: Resources;
};

/**
 * Additional information about the action and event that occurred as part of a multi-action event.
 */
export type MultiActionPayload<TSettings extends JsonObject> = ActionPayload<TSettings> & {
	/**
	 * Defines the controller type the action is applicable to. **Keypad** refers to a standard action on a Stream Deck device, e.g. 1 of the 15 buttons on the Stream Deck MK.2,
	 * or a pedal on the Stream Deck Pedal, etc., whereas an **Encoder** refers to a dial / touchscreen on the Stream Deck +.
	 *
	 * NB: Requires Stream Deck 6.5 for `WillAppear` and `WillDisappear` events.
	 */
	readonly controller: "Keypad";

	/**
	 * Determines whether the action is part of a multi-action.
	 *
	 * NB. Requires Stream Deck 6.7 when accessed from the property inspector.
	 */
	readonly isInMultiAction: true;

	/**
	 * Resources (files) associated with the action.
	 *
	 * Available from Stream Deck 7.1.
	 */
	readonly resources: Resources;
};

/**
 * Base payload provided as part of events received, relating to an action.
 */
type ActionPayload<TSettings extends JsonObject> = {
	/**
	 * Settings associated with the action instance.
	 */
	settings: TSettings;

	/**
	 * Current state of the action; only applicable to actions that have multiple states defined within the `manifest.json` file.
	 */
	readonly state?: State;
};

/**
 * Coordinates that identify the location of an action.
 */
export type Coordinates = {
	/**
	 * Column the action instance is located in, indexed from 0.
	 */
	readonly column: number;

	/**
	 * Row the action instance is located on, indexed from 0.
	 *
	 * Note: When the device is Stream Deck +, the row can be 0 for keys (`Keypad`), and will _always_
	 * be 0 for dials (`Encoder`); to differentiate between actions types, cross-check the `controller`.
	 */
	readonly row: number;
};

/**
 * Possible states an action can be in. This only applies to actions that have multiple states defined in the plugin's manifest.json file.
 */
export type State = number;



================================================
FILE: src/api/events/device.ts
================================================
import type { DeviceInfo } from "../device.js";
import type { EventIdentifier } from "./index.js";

/**
 * Occurs when a Stream Deck device changed, for example its name or size.
 *
 * Available from Stream Deck 7.0.
 */
export type DeviceDidChange = DeviceIdentifier &
	EventIdentifier<"deviceDidChange"> & {
		/**
		 * Information about the device that changed.
		 */
		readonly deviceInfo: DeviceInfo;
	};

/**
 * Occurs when a Stream Deck device is connected. See also {@link DeviceDidDisconnect}.
 */
export type DeviceDidConnect = DeviceIdentifier &
	EventIdentifier<"deviceDidConnect"> & {
		/**
		 * Information about the newly connected device.
		 */
		readonly deviceInfo: DeviceInfo;
	};

/**
 * Occurs when a Stream Deck device is disconnected. See also {@link DeviceDidConnect}.
 */
export type DeviceDidDisconnect = DeviceIdentifier & EventIdentifier<"deviceDidDisconnect">;

/**
 * Provide information that identifies a device associated with an event.
 */
export type DeviceIdentifier = {
	/**
	 * Unique identifier of the Stream Deck device that this event is associated with.
	 */
	readonly device: string;
};



================================================
FILE: src/api/events/encoder.ts
================================================
import type { JsonObject } from "@elgato/utils";

import type { ActionEventMessage, Coordinates, SingleActionPayload } from "./action.js";
import type { KeyDown, KeyUp } from "./keypad.js";

/**
 * Occurs when the user presses a dial (Stream Deck +). See also {@link DialUp}.
 *
 * NB: For other action types see {@link KeyDown}.
 */
export type DialDown<TSettings extends JsonObject> = ActionEventMessage<"dialDown", EncoderPayload<TSettings>>;

/**
 * Occurs when the user releases a pressed dial (Stream Deck +). See also {@link DialDown}.
 *
 * NB: For other action types see {@link KeyUp}.
 */
export type DialUp<TSettings extends JsonObject> = ActionEventMessage<"dialUp", EncoderPayload<TSettings>>;

/**
 * Occurs when the user rotates a dial (Stream Deck +).
 */
export type DialRotate<TSettings extends JsonObject> = ActionEventMessage<
	"dialRotate",
	EncoderPayload<TSettings> & {
		/**
		 * Determines whether the dial was pressed whilst the rotation occurred.
		 */
		readonly pressed: boolean;

		/**
		 * Number of ticks the dial was rotated; this can be a positive (clockwise) or negative (counter-clockwise) number.
		 */
		readonly ticks: number;
	}
>;

/**
 * Occurs when the user taps the touchscreen (Stream Deck +).
 */
export type TouchTap<TSettings extends JsonObject> = ActionEventMessage<
	"touchTap",
	EncoderPayload<TSettings> & {
		/**
		 * Determines whether the tap was considered "held".
		 */
		readonly hold: boolean;

		/**
		 * Coordinates of where the touchscreen tap occurred, relative to the canvas of the action.
		 */
		readonly tapPos: [x: number, y: number];
	}
>;

/**
 * Additional information about the action and event that occurred.
 */
type EncoderPayload<TSettings extends JsonObject> = Pick<
	SingleActionPayload<TSettings, "Encoder">,
	"controller" | "resources" | "settings"
> & {
	/**
	 * Coordinates that identify the location of the action.
	 */
	readonly coordinates: Coordinates;
};



================================================
FILE: src/api/events/index.ts
================================================
import type { JsonObject, JsonValue } from "@elgato/utils";

import type {
	DidReceiveResources,
	DidReceiveSettings,
	TitleParametersDidChange,
	WillAppear,
	WillDisappear,
} from "./action.js";
import type { DeviceDidChange, DeviceDidConnect, DeviceDidDisconnect } from "./device.js";
import type { DialDown, DialRotate, DialUp, TouchTap } from "./encoder.js";
import type { KeyDown, KeyUp } from "./keypad.js";
import type {
	ApplicationDidLaunch,
	ApplicationDidTerminate,
	DidReceiveDeepLink,
	DidReceiveGlobalSettings,
	DidReceiveSecrets,
	SystemDidWakeUp,
} from "./system.js";
import type {
	DidReceivePropertyInspectorMessage,
	PropertyInspectorDidAppear,
	PropertyInspectorDidDisappear,
} from "./ui.js";

export { type Controller } from "@elgato/schemas/streamdeck/plugins";
export { type ActionIdentifier, type State } from "./action.js";
export { type DeviceIdentifier } from "./device.js";

export {
	type Coordinates,
	type DidReceiveResources,
	type DidReceiveSettings,
	type TitleParametersDidChange,
	type WillAppear,
	type WillDisappear,
} from "./action.js";
export { type DeviceDidChange, type DeviceDidConnect, type DeviceDidDisconnect } from "./device.js";
export { type DialDown, type DialRotate, type DialUp, type TouchTap } from "./encoder.js";
export { type KeyDown, type KeyUp } from "./keypad.js";
export {
	type ApplicationDidLaunch,
	type ApplicationDidTerminate,
	type DidReceiveDeepLink,
	type DidReceiveGlobalSettings,
	type SystemDidWakeUp,
} from "./system.js";
export {
	type DidReceivePropertyInspectorMessage,
	type PropertyInspectorDidAppear,
	type PropertyInspectorDidDisappear,
} from "./ui.js";

/**
 * Represents an event that is emitted by Stream Deck.
 */
export type EventIdentifier<TEvent> = {
	/**
	 * Name of the event used to identify what occurred.
	 */
	readonly event: TEvent;
};

/**
 * Events received by the plugin, from Stream Deck.
 */
export type PluginEvent =
	| ApplicationDidLaunch
	| ApplicationDidTerminate
	| DeviceDidChange
	| DeviceDidConnect
	| DeviceDidDisconnect
	| DialDown<JsonObject>
	| DialRotate<JsonObject>
	| DialUp<JsonObject>
	| DidReceiveDeepLink
	| DidReceiveGlobalSettings<JsonObject>
	| DidReceivePropertyInspectorMessage<JsonValue>
	| DidReceiveResources<JsonObject>
	| DidReceiveSecrets<JsonObject>
	| DidReceiveSettings<JsonObject>
	| KeyDown<JsonObject>
	| KeyUp<JsonObject>
	| PropertyInspectorDidAppear
	| PropertyInspectorDidDisappear
	| SystemDidWakeUp
	| TitleParametersDidChange<JsonObject>
	| TouchTap<JsonObject>
	| WillAppear<JsonObject>
	| WillDisappear<JsonObject>;

/**
 * Map of events received by the plugin, from Stream Deck.
 */
export type PluginEventMap = {
	[K in PluginEvent["event"]]: [event: Extract<PluginEvent, EventIdentifier<K>>];
};



================================================
FILE: src/api/events/keypad.ts
================================================
import type { JsonObject } from "@elgato/utils";

import type { ActionEventMessage, MultiActionPayload, SingleActionPayload, State } from "./action.js";
import type { DialDown, DialUp } from "./encoder.js";

/**
 * Occurs when the user presses a action down. See also {@link KeyUp}.
 *
 * NB: For dials / touchscreens see {@link DialDown}.
 */
export type KeyDown<TSettings extends JsonObject> = ActionEventMessage<
	"keyDown",
	MultiActionKeyGesturePayload<TSettings> | SingleActionPayload<TSettings, "Keypad">
>;

/**
 * Occurs when the user releases a pressed action. See also {@link KeyDown}.
 *
 * NB: For dials / touchscreens see {@link DialUp}.
 */
export type KeyUp<TSettings extends JsonObject> = ActionEventMessage<
	"keyUp",
	MultiActionKeyGesturePayload<TSettings> | SingleActionPayload<TSettings, "Keypad">
>;

/**
 * Additional information about the action and event that occurred as part of a multi-action event.
 */
type MultiActionKeyGesturePayload<TSettings extends JsonObject> = MultiActionPayload<TSettings> & {
	/**
	 * Desired state as specified by the user; only applicable to actions that have multiple states defined within the `manifest.json` file, and when this action instance is
	 * part of a multi-action.
	 */
	readonly userDesiredState: State;
};



================================================
FILE: src/api/events/system.ts
================================================
import type { JsonObject } from "@elgato/utils";

import type { Manifest } from "../index.js";
import type { EventIdentifier } from "./index.js";

/**
 * Occurs when a monitored application is launched. Monitored applications can be defined in the `manifest.json` file via the {@link Manifest.ApplicationsToMonitor} property. See also
 * {@link ApplicationDidTerminate}.
 */
export type ApplicationDidLaunch = ApplicationEventIdentifier<"applicationDidLaunch">;

/**
 * Occurs when a monitored application terminates. Monitored applications can be defined in the `manifest.json` file via the {@link Manifest.ApplicationsToMonitor} property. See also
 * {@link ApplicationDidLaunch}.
 */
export type ApplicationDidTerminate = ApplicationEventIdentifier<"applicationDidTerminate">;

/**
 * Occurs when the plugin receives the global settings from Stream Deck.
 */
export type DidReceiveGlobalSettings<TSettings extends JsonObject> = EventIdentifier<"didReceiveGlobalSettings"> & {
	/**
	 * Identifier provided when requesting the settings, used to identify the source of the request.
	 *
	 * This is always undefined if the event is received because the settings were changed in the property inspector.
	 */
	readonly id?: string;

	/**
	 * Additional information about the event that occurred.
	 */
	readonly payload: {
		/**
		 * Global settings associated with this plugin.
		 */
		settings: TSettings;
	};
};

/**
 * Occurs when Stream Deck receives a deep-link message intended for the plugin. The message is re-routed to the plugin, and provided as part of the payload. One-way deep-link message
 * can be routed to the plugin using the URL format `streamdeck://plugins/message/<PLUGIN_UUID>/{MESSAGE}`.
 */
export type DidReceiveDeepLink = EventIdentifier<"didReceiveDeepLink"> & {
	/**
	 * Payload containing information about the URL that triggered the event.
	 */
	readonly payload: {
		/**
		 * The deep-link URL, with the prefix omitted.
		 */
		readonly url: string;
	};
};

/**
 * Occurs when the computer wakes up.
 */
export type SystemDidWakeUp = EventIdentifier<"systemDidWakeUp">;

/**
 * Occurs when the plugin receives secrets from Stream Deck.
 */
export type DidReceiveSecrets<T extends JsonObject> = EventIdentifier<"didReceiveSecrets"> & {
	/**
	 * Payload containing secrets associated with this plugin.
	 */
	readonly payload: {
		/**
		 * Secrets associated with this plugin.
		 */
		secrets: T;
	};
};

/**
 * Provides information about a monitored application. See {@link ApplicationDidLaunch} and {@link ApplicationDidTerminate}.
 */
type ApplicationEventIdentifier<TEvent> = EventIdentifier<TEvent> & {
	/**
	 * Payload containing information about the application that triggered the event.
	 */
	readonly payload: {
		/**
		 * Name of the application that triggered the event.
		 */
		readonly application: string;
	};
};



================================================
FILE: src/api/events/ui.ts
================================================
import type { JsonValue } from "@elgato/utils";

import type { ActionEventMessage, ActionEventMessageWithoutPayload } from "./action.js";
import type { DeviceIdentifier } from "./device.js";

/**
 * Occurs when the property inspector associated with the action becomes visible, i.e. the user selected an action in the Stream Deck application. See also {@link PropertyInspectorDidDisappear}.
 */
export type PropertyInspectorDidAppear = ActionEventMessageWithoutPayload<"propertyInspectorDidAppear">;

/**
 * Occurs when the property inspector associated with the action becomes invisible, i.e. the user unselected the action in the Stream Deck application. See also {@link PropertyInspectorDidAppear}.
 */
export type PropertyInspectorDidDisappear = ActionEventMessageWithoutPayload<"propertyInspectorDidDisappear">;

/**
 * Message sent between the plugin and it's respective UI.
 */
type PluginMessage<TEvent extends string, TPayload extends JsonValue> = Omit<
	ActionEventMessage<TEvent, TPayload>,
	keyof DeviceIdentifier
>;

/**
 * Occurs when a payload was received from the UI.
 */
export type DidReceivePropertyInspectorMessage<TPayload extends JsonValue> = PluginMessage<"sendToPlugin", TPayload>;



================================================
FILE: src/api/registration/index.ts
================================================
export { type RegistrationInfo } from "./info.js";
export { RegistrationParameter } from "./parameters.js";
export { type ActionInfo, type ConnectElgatoStreamDeckSocketFn } from "./ui.js";



================================================
FILE: src/api/registration/info.ts
================================================
import type { DeviceInfo } from "../device.js";
import type { Language } from "../i18n.js";

/**
 * Information about the Stream Deck application, the plugin, the user's operating system, user's Stream Deck devices, etc.
 */
export type RegistrationInfo = {
	/**
	 * Stream Deck application specific information.
	 */
	readonly application: {
		/**
		 * Font being used by the Stream Deck application.
		 */
		readonly font: string;

		/**
		 * Users preferred language; this is used by the Stream Deck application for localization.
		 */
		readonly language: Language;

		/**
		 * Operating system.
		 */
		readonly platform: "mac" | "windows";

		/**
		 * Operating system version, e.g. "10" for Windows 10.
		 */
		readonly platformVersion: string;

		/**
		 * Stream Deck application version.
		 */
		readonly version: string;
	};

	/**
	 * Collection of preferred colors used by the Stream Deck.
	 */
	readonly colors: {
		/**
		 * Color that denotes the background of a button that is being moused over.
		 */
		readonly buttonMouseOverBackgroundColor: string;

		/**
		 * Color that denotes the background of a pressed button.
		 */
		readonly buttonPressedBackgroundColor: string;

		/**
		 * Color that denotes the border of a press button.
		 */
		readonly buttonPressedBorderColor: string;

		/**
		 * Color that denotes the text of a pressed button.
		 */
		readonly buttonPressedTextColor: string;

		/**
		 * Color of highlighted text.
		 */
		readonly highlightColor: string;
	};

	/**
	 * Pixel ratio, used to identify if the Stream Deck application is running on a high DPI screen.
	 */
	readonly devicePixelRatio: number;

	/**
	 * Devices associated with the Stream Deck application; this may include devices that are not currently connected. Use `"deviceDidConnect"` event to determine which devices are active.
	 */
	readonly devices: (DeviceInfo & {
		/**
		 * Unique identifier of the Stream Deck device.
		 */
		readonly id: string;
	})[];

	/**
	 * Information about the plugin.
	 */
	readonly plugin: {
		/**
		 * Unique identifier of the plugin, as defined by the plugin.
		 */
		readonly uuid: string;

		/**
		 * Version of the plugin.
		 */
		readonly version: string;
	};
};



================================================
FILE: src/api/registration/parameters.ts
================================================
/**
 * Defines the type of argument supplied by Stream Deck.
 */
export enum RegistrationParameter {
	/**
	 * Identifies the argument that specifies the web socket port that Stream Deck is listening on.
	 */
	Port = "-port",

	/**
	 * Identifies the argument that supplies information about the Stream Deck and the plugin.
	 */
	Info = "-info",

	/**
	 * Identifies the argument that specifies the unique identifier that can be used when registering the plugin.
	 */
	PluginUUID = "-pluginUUID",

	/**
	 * Identifies the argument that specifies the event to be sent to Stream Deck as part of the registration procedure.
	 */
	RegisterEvent = "-registerEvent",
}



================================================
FILE: src/api/registration/ui.ts
================================================
import type { JsonObject } from "@elgato/utils";

import type { ActionIdentifier, MultiActionPayload, SingleActionPayload } from "../events/action.js";
import type { DeviceIdentifier } from "../events/device.js";

/**
 * Connects to the Stream Deck, enabling the UI to interact with the plugin, and access the Stream Deck API.
 * @param port Port to be used when connecting to Stream Deck.
 * @param uuid Identifies the UI; this must be provided when establishing the connection with Stream Deck.
 * @param event Name of the event that identifies the registration procedure; this must be provided when establishing the connection with Stream Deck.
 * @param info Information about the Stream Deck application and operating system.
 * @param actionInfo Information about the action the UI is associated with.
 */
export type ConnectElgatoStreamDeckSocketFn = (
	port: string,
	uuid: string,
	event: string,
	info: string,
	actionInfo: string,
) => Promise<void> | void;

/**
 * Information about the action associated with the UI.
 * @template TSettings Settings associated with the action.
 */
export type ActionInfo<TSettings extends JsonObject = JsonObject> = ActionIdentifier &
	DeviceIdentifier & {
		/**
		 * Additional information about the action and event that occurred.
		 */
		readonly payload: MultiActionPayload<TSettings> | SingleActionPayload<TSettings>;
	};



================================================
FILE: src/api/registration/__mocks__/index.ts
================================================
import { DeviceType } from "../../device.js";
import { type ActionInfo, type RegistrationInfo } from "../index.js";

/**
 * Mocked {@link ActionInfo}.
 */
export const actionInfo: ActionInfo = {
	action: "com.elgato.test.actionOne",
	context: "abc123",
	device: "dev123",
	payload: {
		controller: "Keypad",
		isInMultiAction: false,
		coordinates: {
			column: 1,
			row: 2,
		},
		resources: {},
		settings: {
			message: "Hello world",
		},
	},
};

/**
 * Mocked {@link RegistrationInfo}.
 */
export const registrationInfo: RegistrationInfo = {
	application: {
		font: "Arial",
		language: "en",
		platform: "windows",
		platformVersion: "11",
		version: "99.8.6.54321",
	},
	colors: {
		buttonMouseOverBackgroundColor: "#ffffff",
		buttonPressedBackgroundColor: "#ffffff",
		buttonPressedBorderColor: "#ffffff",
		buttonPressedTextColor: "#ffffff",
		highlightColor: "#ffffff",
	},
	devicePixelRatio: 1,
	devices: [
		{
			id: "DEV1",
			name: "Device One",
			size: {
				columns: 5,
				rows: 3,
			},
			type: DeviceType.StreamDeck,
		},
	],
	plugin: {
		uuid: "com.elgato.test",
		version: "1.0",
	},
};



================================================
FILE: src/plugin/connection.ts
================================================
import { EventEmitter, withResolvers } from "@elgato/utils";
import WebSocket from "ws";

import type { PluginCommand, PluginEventMap, RegistrationInfo } from "../api/index.js";
import { RegistrationParameter } from "../api/index.js";
import { Version } from "./common/version.js";
import { logger } from "./logging/index.js";

/**
 * Provides a connection between the plugin and the Stream Deck allowing for messages to be sent and received.
 */
class Connection extends EventEmitter<ExtendedEventMap> {
	/**
	 * Private backing field for {@link Connection.registrationParameters}.
	 */
	private _registrationParameters: RegistrationParameters | undefined;

	/**
	 * Private backing field for {@link Connection.version}.
	 */
	private _version: Version | undefined;

	/**
	 * Used to ensure {@link Connection.connect} is invoked as a singleton; `false` when a connection is occurring or established.
	 */
	private canConnect = true;

	/**
	 * Underlying web socket connection.
	 */
	private connection = withResolvers<WebSocket>();

	/**
	 * Logger scoped to the connection.
	 */
	private readonly logger = logger.createScope("Connection");

	/**
	 * Underlying connection information provided to the plugin to establish a connection with Stream Deck.
	 * @returns The registration parameters.
	 */
	public get registrationParameters(): RegistrationParameters {
		return (this._registrationParameters ??= this.getRegistrationParameters());
	}

	/**
	 * Version of Stream Deck this instance is connected to.
	 * @returns The version.
	 */
	public get version(): Version {
		return (this._version ??= new Version(this.registrationParameters.info.application.version));
	}

	/**
	 * Establishes a connection with the Stream Deck, allowing for the plugin to send and receive messages.
	 * @returns A promise that is resolved when a connection has been established.
	 */
	public async connect(): Promise<void> {
		// Ensure we only establish a single connection.
		if (this.canConnect) {
			this.canConnect = false;

			const webSocket = new WebSocket(`ws://127.0.0.1:${this.registrationParameters.port}`);
			webSocket.onmessage = (ev: WebSocket.MessageEvent): void => this.tryEmit(ev);
			webSocket.onopen = (): void => {
				webSocket.send(
					JSON.stringify({
						event: this.registrationParameters.registerEvent,
						uuid: this.registrationParameters.pluginUUID,
					}),
				);

				// Web socket established a connection with the Stream Deck and the plugin was registered.
				this.connection.resolve(webSocket);
				this.emit("connected", this.registrationParameters.info);
			};
		}

		await this.connection.promise;
	}

	/**
	 * Sends the commands to the Stream Deck, once the connection has been established and registered.
	 * @param command Command being sent.
	 * @returns `Promise` resolved when the command is sent to Stream Deck.
	 */
	public async send(command: PluginCommand): Promise<void> {
		const connection = await this.connection.promise;
		const message = JSON.stringify(command);

		this.logger.trace(message);
		connection.send(message);
	}

	/**
	 * Gets the registration parameters, provided by Stream Deck, that provide information to the plugin, including how to establish a connection.
	 * @returns Parsed registration parameters.
	 */
	private getRegistrationParameters(): RegistrationParameters {
		const params: Partial<RegistrationParameters> = {
			port: undefined,
			info: undefined,
			pluginUUID: undefined,
			registerEvent: undefined,
		};

		const scopedLogger = logger.createScope("RegistrationParameters");

		for (let i = 0; i < process.argv.length - 1; i++) {
			const param = process.argv[i];
			const value = process.argv[++i];

			switch (param) {
				case RegistrationParameter.Port:
					scopedLogger.debug(`port=${value}`);
					params.port = value;
					break;

				case RegistrationParameter.PluginUUID:
					scopedLogger.debug(`pluginUUID=${value}`);
					params.pluginUUID = value;
					break;

				case RegistrationParameter.RegisterEvent:
					scopedLogger.debug(`registerEvent=${value}`);
					params.registerEvent = value;
					break;

				case RegistrationParameter.Info:
					scopedLogger.debug(`info=${value}`);
					params.info = JSON.parse(value);
					break;

				default:
					i--;
					break;
			}
		}

		const invalidArgs: string[] = [];
		const validate = (name: string, value: unknown): void => {
			if (value === undefined) {
				invalidArgs.push(name);
			}
		};

		validate(RegistrationParameter.Port, params.port);
		validate(RegistrationParameter.PluginUUID, params.pluginUUID);
		validate(RegistrationParameter.RegisterEvent, params.registerEvent);
		validate(RegistrationParameter.Info, params.info);

		if (invalidArgs.length > 0) {
			throw new Error(
				`Unable to establish a connection with Stream Deck, missing command line arguments: ${invalidArgs.join(", ")}`,
			);
		}

		return params as RegistrationParameters;
	}

	/**
	 * Attempts to emit the {@link ev} that was received from the {@link Connection.connection}.
	 * @param ev Event message data received from Stream Deck.
	 */
	private tryEmit(ev: WebSocket.MessageEvent): void {
		try {
			const message = JSON.parse(ev.data.toString());
			if (message.event) {
				this.logger.trace(ev.data.toString());
				this.emit(message.event, message);
			} else {
				this.logger.warn(`Received unknown message: ${ev.data}`);
			}
		} catch (err) {
			this.logger.error(`Failed to parse message: ${ev.data}`, err);
		}
	}
}

/**
 * Registration information supplied by the Stream Deck when launching the plugin, that enables the plugin to establish a secure connection with the Stream Deck.
 */
type RegistrationParameters = {
	/**
	 * Object containing information about the Stream Deck, this plugin, the user's operating system, user's Stream Deck devices, etc.
	 */
	info: RegistrationInfo;

	/**
	 * Unique identifier assigned to the plugin by Stream Deck; this value is used in conjunction with specific commands used to identify the source of the request, e.g. "getGlobalSettings".
	 */
	pluginUUID: string;

	/**
	 * Port used by the web socket responsible for communicating messages between the plugin and the Stream Deck.
	 */
	port: string;

	/**
	 * Name of the event used as part of the registration procedure when a connection with the Stream Deck is being established.
	 */
	registerEvent: string;
};

/**
 * An extended event map that includes connection events.
 */
type ExtendedEventMap = PluginEventMap & {
	/**
	 * Occurs when a connection is established.
	 */
	connected: [info: RegistrationInfo];
};

export const connection = new Connection();



================================================
FILE: src/plugin/i18n.ts
================================================
import type { JsonObject } from "@elgato/utils";
import type { Language } from "@elgato/utils/i18n";
import fs from "node:fs";
import path from "node:path";

import type { Language as SupportedLanguage } from "../api/i18n.js";
import { logger } from "./logging/index.js";

/**
 * Loads a locale from the file system.
 * @param language Language to load.
 * @returns Contents of the locale.
 */
export function fileSystemLocaleProvider(language: Language<SupportedLanguage>): JsonObject | null {
	const filePath = path.join(process.cwd(), `${language}.json`);
	if (!fs.existsSync(filePath)) {
		return null;
	}

	try {
		// Parse the translations from the file.
		const contents = fs.readFileSync(filePath, { flag: "r" })?.toString();
		return parseLocalizations(contents);
	} catch (err) {
		logger.error(`Failed to load translations from ${filePath}`, err);
		return null;
	}
}

/**
 * Parses the localizations from the specified contents, or throws a `TypeError` when unsuccessful.
 * @param contents Contents that represent the stringified JSON containing the localizations.
 * @returns The localizations; otherwise a `TypeError`.
 */
function parseLocalizations(contents: string): JsonObject {
	const json = JSON.parse(contents);
	if (json !== undefined && json !== null && typeof json === "object" && "Localization" in json) {
		return json["Localization"] as JsonObject;
	}

	throw new TypeError(`Translations must be a JSON object nested under a property named "Localization"`);
}



================================================
FILE: src/plugin/index.ts
================================================
import { I18nProvider } from "@elgato/utils/i18n";
import type { Logger } from "@elgato/utils/logging";

import type { Language, RegistrationInfo } from "../api/index.js";
import { actionService, type ActionService } from "./actions/service.js";
import { connection } from "./connection.js";
import { deviceService, type DeviceService } from "./devices/service.js";
import { fileSystemLocaleProvider } from "./i18n.js";
import { logger } from "./logging/index.js";
import * as profiles from "./profiles.js";
import { settings } from "./settings.js";
import * as system from "./system.js";
import { ui, type UIController } from "./ui.js";

export {
	BarSubType,
	DeviceType,
	Target,
	type Bar,
	type Controller,
	type Coordinates,
	type DeviceInfo,
	type FeedbackPayload,
	type GBar,
	type Language,
	type Manifest,
	type Pixmap,
	type RegistrationInfo,
	type Size,
	type State,
	type Text,
} from "../api/index.js";
export * from "./actions/index.js";
export * from "./devices/index.js";
export type * from "./events/index.js";
export { type UIController };

let i18n: I18nProvider<Language> | undefined;

export const streamDeck = {
	/**
	 * Namespace for event listeners and functionality relating to Stream Deck actions.
	 * @returns Actions namespace.
	 */
	get actions(): ActionService {
		return actionService;
	},

	/**
	 * Namespace for interacting with Stream Deck devices.
	 * @returns Devices namespace.
	 */
	get devices(): DeviceService {
		return deviceService;
	},

	/**
	 * Internalization provider, responsible for managing localizations and translating resources.
	 * @returns Internalization provider.
	 */
	get i18n(): I18nProvider<Language> {
		return (i18n ??= new I18nProvider<Language>(this.info.application.language, fileSystemLocaleProvider));
	},

	/**
	 * Registration and application information provided by Stream Deck during initialization.
	 * @returns Registration information.
	 */
	get info(): Omit<RegistrationInfo, "devices"> {
		return connection.registrationParameters.info;
	},

	/**
	 * Logger responsible for capturing log messages.
	 * @returns The logger.
	 */
	get logger(): Logger {
		return logger;
	},

	/**
	 * Namespace for Stream Deck profiles.
	 * @returns Profiles namespace.
	 */
	get profiles(): typeof profiles {
		return profiles;
	},

	/**
	 * Namespace for persisting settings within Stream Deck.
	 * @returns Settings namespace.
	 */
	get settings(): typeof settings {
		return settings;
	},

	/**
	 * Namespace for interacting with, and receiving events from, the system the plugin is running on.
	 * @returns System namespace.
	 */
	get system(): typeof system {
		return system;
	},

	/**
	 * Namespace for interacting with UI (property inspector) associated with the plugin.
	 * @returns UI namespace.
	 */
	get ui(): UIController {
		return ui;
	},

	/**
	 * Connects the plugin to the Stream Deck.
	 * @returns A promise resolved when a connection has been established.
	 */
	connect(): Promise<void> {
		return connection.connect();
	},
};

export default streamDeck;



================================================
FILE: src/plugin/manifest.ts
================================================
import { Lazy } from "@elgato/utils";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { type Manifest } from "../api/index.js";
import { Version } from "./common/version.js";

const manifest = new Lazy<Manifest | null>(() => {
	const path = join(process.cwd(), "manifest.json");
	if (!existsSync(path)) {
		throw new Error("Failed to read manifest.json as the file does not exist.");
	}

	try {
		return JSON.parse(
			readFileSync(path, {
				encoding: "utf-8",
				flag: "r",
			}).toString(),
		);
	} catch (e) {
		if (e instanceof SyntaxError) {
			return null;
		} else {
			throw e;
		}
	}
});

const softwareMinimumVersion = new Lazy<Version | null>(() => {
	if (manifest.value === null) {
		return null;
	}

	return new Version(manifest.value.Software.MinimumVersion);
});

/**
 * Gets the SDK version that the plugin requires.
 * @returns SDK version; otherwise `null` when the plugin is DRM protected.
 */
export function getSDKVersion(): number | null {
	return manifest.value?.SDKVersion ?? null;
}

/**
 * Gets the minimum version that the plugin requires.
 * @returns Minimum required version; otherwise `null` when the plugin is DRM protected.
 */
export function getSoftwareMinimumVersion(): Version | null {
	return softwareMinimumVersion.value;
}

/**
 * Gets the manifest associated with the plugin.
 * @returns The manifest; otherwise `null` when the plugin is DRM protected.
 */
export function getManifest(): Manifest | null {
	return manifest.value;
}



================================================
FILE: src/plugin/profiles.ts
================================================
import { connection } from "./connection.js";
import { requiresVersion } from "./validation.js";

/**
 * Requests the Stream Deck switches the current profile of the specified {@link deviceId} to the {@link profile}; when no {@link profile} is provided the previously active profile
 * is activated.
 *
 * NB: Plugins may only switch to profiles distributed with the plugin, as defined within the manifest, and cannot access user-defined profiles.
 * @param deviceId Unique identifier of the device where the profile should be set.
 * @param profile Optional name of the profile to switch to; when `undefined` the previous profile will be activated. Name must be identical to the one provided in the manifest.
 * @param page Optional page to show when switching to the {@link profile}, indexed from 0. When `undefined`, the page that was previously visible (when switching away from the
 * profile) will be made visible.
 * @returns `Promise` resolved when the request to switch the `profile` has been sent to Stream Deck.
 */
export function switchToProfile(deviceId: string, profile?: string, page?: number): Promise<void> {
	if (page !== undefined) {
		requiresVersion(6.5, connection.version, "Switching to a profile page");
	}

	return connection.send({
		event: "switchToProfile",
		context: connection.registrationParameters.pluginUUID,
		device: deviceId,
		payload: {
			page,
			profile,
		},
	});
}



================================================
FILE: src/plugin/settings.ts
================================================
import type { IDisposable, JsonObject } from "@elgato/utils";
import { randomUUID } from "node:crypto";

import type { DidReceiveGlobalSettings, DidReceiveSettings } from "../api/index.js";
import { actionStore } from "./actions/store.js";
import { connection } from "./connection.js";
import { ActionEvent } from "./events/action-event.js";
import { DidReceiveGlobalSettingsEvent, type DidReceiveSettingsEvent } from "./events/index.js";
import { requiresVersion } from "./validation.js";

let __useExperimentalMessageIdentifiers = false;

export const settings = {
	/**
	 * Available from Stream Deck 7.1; determines whether message identifiers should be sent when getting
	 * action-instance or global settings.
	 *
	 * When `true`, the did-receive events associated with settings are only emitted when the action-instance
	 * or global settings are changed in the property inspector.
	 * @returns The value.
	 */
	get useExperimentalMessageIdentifiers(): boolean {
		return __useExperimentalMessageIdentifiers;
	},

	/**
	 * Available from Stream Deck 7.1; determines whether message identifiers should be sent when getting
	 * action-instance or global settings.
	 *
	 * When `true`, the did-receive events associated with settings are only emitted when the action-instance
	 * or global settings are changed in the property inspector.
	 */
	set useExperimentalMessageIdentifiers(value: boolean) {
		requiresVersion(7.1, connection.version, "Message identifiers");
		__useExperimentalMessageIdentifiers = value;
	},

	/**
	 * Gets the global settings associated with the plugin.
	 * @template T The type of global settings associated with the plugin.
	 * @returns Promise containing the plugin's global settings.
	 */
	getGlobalSettings: <T extends JsonObject = JsonObject>(): Promise<T> => {
		return new Promise((resolve) => {
			connection.once("didReceiveGlobalSettings", (ev: DidReceiveGlobalSettings<T>) => resolve(ev.payload.settings));
			connection.send({
				event: "getGlobalSettings",
				context: connection.registrationParameters.pluginUUID,
				id: randomUUID(),
			});
		});
	},

	/**
	 * Occurs when the global settings are requested, or when the the global settings were updated in
	 * the property inspector.
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that removes the listener.
	 */
	onDidReceiveGlobalSettings: <T extends JsonObject = JsonObject>(
		listener: (ev: DidReceiveGlobalSettingsEvent<T>) => void,
	): IDisposable => {
		return connection.disposableOn("didReceiveGlobalSettings", (ev: DidReceiveGlobalSettings<T>) => {
			// Do nothing when the global settings were requested.
			if (settings.useExperimentalMessageIdentifiers && ev.id) {
				return;
			}

			listener(new DidReceiveGlobalSettingsEvent(ev));
		});
	},

	/**
	 * Occurs when the settings associated with an action instance are requested, or when the the settings
	 * were updated in the property inspector.
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that removes the listener.
	 */
	onDidReceiveSettings: <T extends JsonObject = JsonObject>(
		listener: (ev: DidReceiveSettingsEvent<T>) => void,
	): IDisposable => {
		return connection.disposableOn("didReceiveSettings", (ev: DidReceiveSettings<T>) => {
			// Do nothing when the action's settings were requested.
			if (settings.useExperimentalMessageIdentifiers && ev.id) {
				return;
			}

			const action = actionStore.getActionById(ev.context);
			if (action) {
				listener(new ActionEvent(action, ev));
			}
		});
	},

	/**
	 * Sets the global settings associated the plugin; these settings are only available to this plugin,
	 * and should be used to persist information securely.
	 * @param settings Settings to save.
	 * @example
	 * streamDeck.settings.setGlobalSettings({
	 *   apiKey,
	 *   connectedDate: new Date()
	 * })
	 */
	setGlobalSettings: async <T extends JsonObject>(settings: T): Promise<void> => {
		await connection.send({
			event: "setGlobalSettings",
			context: connection.registrationParameters.pluginUUID,
			payload: settings,
		});
	},
};



================================================
FILE: src/plugin/system.ts
================================================
import type { IDisposable, JsonObject } from "@elgato/utils";

import type { DidReceiveSecrets } from "../api/events/system.js";
import type { Manifest, SystemDidWakeUp } from "../api/index.js";
import { connection } from "./connection.js";
import { ApplicationEvent } from "./events/application-event.js";
import { Event } from "./events/event.js";
import {
	type ApplicationDidLaunchEvent,
	type ApplicationDidTerminateEvent,
	DidReceiveDeepLinkEvent,
	type SystemDidWakeUpEvent,
} from "./events/index.js";
import { requiresSDKVersion, requiresVersion } from "./validation.js";

/**
 * Occurs when a monitored application is launched. Monitored applications can be defined in the manifest via the {@link Manifest.ApplicationsToMonitor} property.
 * See also {@link onApplicationDidTerminate}.
 * @param listener Function to be invoked when the event occurs.
 * @returns A disposable that, when disposed, removes the listener.
 */
export function onApplicationDidLaunch(listener: (ev: ApplicationDidLaunchEvent) => void): IDisposable {
	return connection.disposableOn("applicationDidLaunch", (ev) => listener(new ApplicationEvent(ev)));
}

/**
 * Occurs when a monitored application terminates. Monitored applications can be defined in the manifest via the {@link Manifest.ApplicationsToMonitor} property.
 * See also {@link onApplicationDidLaunch}.
 * @param listener Function to be invoked when the event occurs.
 * @returns A disposable that, when disposed, removes the listener.
 */
export function onApplicationDidTerminate(listener: (ev: ApplicationDidTerminateEvent) => void): IDisposable {
	return connection.disposableOn("applicationDidTerminate", (ev) => listener(new ApplicationEvent(ev)));
}

/**
 * Occurs when a deep-link message is routed to the plugin from Stream Deck. One-way deep-link messages can be sent to plugins from external applications using the URL format
 * `streamdeck://plugins/message/<PLUGIN_UUID>/{MESSAGE}`.
 * @param listener Function to be invoked when the event occurs.
 * @returns A disposable that, when disposed, removes the listener.
 */
export function onDidReceiveDeepLink(listener: (ev: DidReceiveDeepLinkEvent) => void): IDisposable {
	requiresVersion(6.5, connection.version, "Receiving deep-link messages");
	return connection.disposableOn("didReceiveDeepLink", (ev) => listener(new DidReceiveDeepLinkEvent(ev)));
}

/**
 * Occurs when the computer wakes up.
 * @param listener Function to be invoked when the event occurs.
 * @returns A disposable that, when disposed, removes the listener.
 */
export function onSystemDidWakeUp(listener: (ev: SystemDidWakeUpEvent) => void): IDisposable {
	return connection.disposableOn("systemDidWakeUp", (ev) => listener(new Event<SystemDidWakeUp>(ev)));
}

/**
 * Opens the specified `url` in the user's default browser.
 * @param url URL to open.
 * @returns `Promise` resolved when the request to open the `url` has been sent to Stream Deck.
 */
export function openUrl(url: string): Promise<void> {
	return connection.send({
		event: "openUrl",
		payload: {
			url,
		},
	});
}

/**
 * Gets the secrets associated with the plugin.
 * @returns `Promise` resolved with the secrets associated with the plugin.
 */
export function getSecrets<T extends JsonObject = JsonObject>(): Promise<T> {
	requiresVersion(6.9, connection.version, "Secrets");
	requiresSDKVersion(3, "Secrets");

	return new Promise((resolve) => {
		connection.once("didReceiveSecrets", (ev: DidReceiveSecrets<T>) => resolve(ev.payload.secrets));
		connection.send({
			event: "getSecrets",
			context: connection.registrationParameters.pluginUUID,
		});
	});
}



================================================
FILE: src/plugin/ui.ts
================================================
import type { IDisposable, JsonObject, JsonValue } from "@elgato/utils";

import type { DidReceivePropertyInspectorMessage } from "../api/index.js";
import type { DialAction, KeyAction } from "./actions/index.js";
import { actionStore } from "./actions/store.js";
import { connection } from "./connection.js";
import { ActionWithoutPayloadEvent } from "./events/action-event.js";
import {
	type PropertyInspectorDidAppearEvent,
	type PropertyInspectorDidDisappearEvent,
	SendToPluginEvent,
} from "./events/index.js";

/**
 * Controller capable of sending/receiving payloads with the property inspector, and listening for events.
 */
class UIController {
	/**
	 * Action associated with the current property inspector.
	 */
	#action: DialAction | KeyAction | undefined;

	/**
	 * To overcome event races, the debounce counter keeps track of appear vs disappear events, ensuring
	 * we only clear the current ui when an equal number of matching disappear events occur.
	 */
	#appearanceStackCount = 0;

	/**
	 * Initializes a new instance of the {@link UIController} class.
	 */
	constructor() {
		// Track the action for the current property inspector.
		this.onDidAppear((ev) => {
			if (this.#isCurrent(ev.action)) {
				this.#appearanceStackCount++;
			} else {
				this.#appearanceStackCount = 1;
				this.#action = ev.action;
			}
		});

		this.onDidDisappear((ev) => {
			if (this.#isCurrent(ev.action)) {
				this.#appearanceStackCount--;
				if (this.#appearanceStackCount <= 0) {
					this.#action = undefined;
				}
			}
		});
	}

	/**
	 * Gets the action associated with the current property.
	 * @returns The action; otherwise `undefined` when a property inspector is not visible.
	 */
	public get action(): DialAction | KeyAction | undefined {
		return this.#action;
	}

	/**
	 * Occurs when the property inspector associated with the action becomes visible, i.e. the user
	 * selected an action in the Stream Deck application..
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onDidAppear<T extends JsonObject = JsonObject>(
		listener: (ev: PropertyInspectorDidAppearEvent<T>) => void,
	): IDisposable {
		return connection.disposableOn("propertyInspectorDidAppear", (ev) => {
			const action = actionStore.getActionById(ev.context);
			if (action) {
				listener(new ActionWithoutPayloadEvent(action, ev));
			}
		});
	}

	/**
	 * Occurs when the property inspector associated with the action disappears, i.e. the user unselected
	 * the action in the Stream Deck application.
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onDidDisappear<T extends JsonObject = JsonObject>(
		listener: (ev: PropertyInspectorDidDisappearEvent<T>) => void,
	): IDisposable {
		return connection.disposableOn("propertyInspectorDidDisappear", (ev) => {
			const action = actionStore.getActionById(ev.context);
			if (action) {
				listener(new ActionWithoutPayloadEvent(action, ev));
			}
		});
	}

	/**
	 * Occurs when a message was sent to the plugin _from_ the property inspector.
	 * @template TPayload The type of the payload received from the property inspector.
	 * @template TSettings The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onSendToPlugin<TPayload extends JsonValue = JsonValue, TSettings extends JsonObject = JsonObject>(
		listener: (ev: SendToPluginEvent<TPayload, TSettings>) => void,
	): IDisposable {
		return connection.disposableOn("sendToPlugin", (ev) => {
			const action = actionStore.getActionById(ev.context);
			if (action) {
				listener(
					new SendToPluginEvent<TPayload, TSettings>(action, ev as DidReceivePropertyInspectorMessage<TPayload>),
				);
			}
		});
	}

	/**
	 * Sends the payload to the property inspector; the payload is only sent when the property inspector
	 * is visible for an action provided by this plugin.
	 * @param payload Payload to send.
	 */
	public async sendToPropertyInspector(payload: JsonValue): Promise<void> {
		if (this.#action) {
			await connection.send({
				event: "sendToPropertyInspector",
				context: this.#action.id,
				payload,
			});
		}
	}

	/**
	 * Determines whether the specified action is the action for the current property inspector.
	 * @param action Action to check against.
	 * @returns `true` when the actions are the same.
	 */
	#isCurrent(action: DialAction | KeyAction): boolean {
		return (
			this.#action?.id === action.id &&
			this.#action?.manifestId === action.manifestId &&
			this.#action?.device?.id === action.device.id
		);
	}
}

export const ui = new UIController();
export { type UIController };



================================================
FILE: src/plugin/validation.ts
================================================
import { Version } from "./common/version.js";
import { getSDKVersion, getSoftwareMinimumVersion } from "./manifest.js";

/**
 * Validates the `SDKVersion` within the manifest fulfils the minimum required version for the specified
 * feature; when the version is not fulfilled, an error is thrown with the feature formatted into the message.
 * @param minimumVersion Minimum required SDKVersion.
 * @param feature Feature that requires the version.
 */
export function requiresSDKVersion(minimumVersion: number, feature: string): never | void {
	const sdkVersion = getSDKVersion();
	if (sdkVersion !== null && minimumVersion > sdkVersion) {
		throw new Error(
			`[ERR_NOT_SUPPORTED]: ${feature} requires manifest SDK version ${minimumVersion} or higher, but found version ${sdkVersion}; please update the "SDKVersion" in the plugin's manifest to ${minimumVersion} or higher.`,
		);
	}
}

/**
 * Validates the {@link streamDeckVersion} and manifest's `Software.MinimumVersion` are at least the {@link minimumVersion};
 * when the version is not fulfilled, an error is thrown with the {@link feature} formatted into the message.
 * @param minimumVersion Minimum required version.
 * @param streamDeckVersion Actual application version.
 * @param feature Feature that requires the version.
 */
export function requiresVersion(minimumVersion: number, streamDeckVersion: Version, feature: string): never | void {
	const required = {
		major: Math.floor(minimumVersion),
		minor: Number(minimumVersion.toString().split(".").at(1) ?? 0), // Account for JavaScript's floating point precision.
		patch: 0,
		build: 0,
	};

	if (streamDeckVersion.compareTo(required) === -1) {
		throw new Error(
			`[ERR_NOT_SUPPORTED]: ${feature} requires Stream Deck version ${required.major}.${required.minor} or higher, but current version is ${streamDeckVersion.major}.${streamDeckVersion.minor}; please update Stream Deck and the "Software.MinimumVersion" in the plugin's manifest to "${required.major}.${required.minor}" or higher.`,
		);
	}

	const softwareMinimumVersion = getSoftwareMinimumVersion();
	if (softwareMinimumVersion !== null && softwareMinimumVersion.compareTo(required) === -1) {
		throw new Error(
			`[ERR_NOT_SUPPORTED]: ${feature} requires Stream Deck version ${required.major}.${required.minor} or higher; please update the "Software.MinimumVersion" in the plugin's manifest to "${required.major}.${required.minor}" or higher.`,
		);
	}
}



================================================
FILE: src/plugin/__mocks__/connection.ts
================================================
import { vi } from "vitest";

import { registrationInfo } from "../../api/registration/__mocks__/index.js";

const { connection } = await vi.importActual<typeof import("../connection.js")>("../connection.js");

vi.spyOn(connection, "connect").mockReturnValue(Promise.resolve());
vi.spyOn(connection, "registrationParameters", "get").mockReturnValue({
	info: registrationInfo,
	pluginUUID: "abc123",
	port: "12345",
	registerEvent: "register",
});

vi.spyOn(connection, "send").mockReturnValue(Promise.resolve());

export { connection };



================================================
FILE: src/plugin/__mocks__/manifest.ts
================================================
import { vi } from "vitest";

import type { Manifest } from "../../api/index.js";
import { Version } from "../common/version.js";
import type {
	getManifest as __getManifest,
	getSoftwareMinimumVersion as __getSoftwareMinimumVersion,
} from "../manifest.js";

/**
 * Mock {@link Manifest}.
 */
export const manifest: Manifest = {
	Actions: [
		{
			Name: "Action One",
			UUID: "com.elgato.test.key",
			Icon: "imgs/actions/one",
			States: [
				{
					Image: "imgs/actions/state",
				},
			],
		},
		{
			Name: "Action Two",
			UUID: "com.elgato.test.dial",
			Icon: "imgs/actions/one",
			States: [
				{
					Image: "imgs/actions/state",
				},
			],
		},
	],
	Author: "Elgato",
	CodePath: "index.js",
	Description: "Example manifest",
	Icon: "imgs/plugin",
	Name: "Test Plugin",
	OS: [
		{
			MinimumVersion: "11",
			Platform: "windows",
		},
	],
	SDKVersion: 2,
	Software: {
		MinimumVersion: "7.1",
	},
	UUID: "com.elgato.test",
	Version: "1.0.0",
};

/**
 * Mocked `getSDKVersion`.
 */
export const getSDKVersion = vi.fn().mockReturnValue(3);

/**
 * Mocked {@link __getSoftwareMinimumVersion}.
 */
export const getSoftwareMinimumVersion = vi.fn().mockReturnValue(new Version(manifest.Software.MinimumVersion));

/**
 * Mocked {@link __getManifest}.
 */
export const getManifest = vi.fn().mockReturnValue(manifest);



================================================
FILE: src/plugin/__tests__/connection.test.ts
================================================
import { Logger } from "@elgato/utils/logging";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type WS as WebSocketServer } from "vitest-websocket-mock";

import type { Settings } from "../../api/__mocks__/events.js";
import type { ApplicationDidLaunch, DidReceiveGlobalSettings, OpenUrl } from "../../api/index.js";
import { registrationInfo } from "../../api/registration/__mocks__/index.js";
import { type connection as Connection } from "../connection.js";
import type { RegistrationInfo } from "../index.js";

vi.mock("../logging/index.js");

const port = ["-port", "12345"];
const pluginUUID = ["-pluginUUID", "abc123"];
const registerEvent = ["-registerEvent", "test_event"];
const info = ["-info", `{"plugin":{"uuid":"com.elgato.test","version":"0.1.0"}}`];

const originalArgv = process.argv;

describe("connection", () => {
	let logger!: Logger;
	let connection!: typeof Connection;
	let connectionLogger: Logger;

	// Re-import the connection to ensure a fresh state.
	beforeEach(async () => {
		connectionLogger = new Logger({
			level: "trace",
			targets: [{ write: vi.fn() }],
		});

		({ logger } = await import("../logging/index.js"));
		vi.spyOn(logger, "createScope").mockReturnValueOnce(connectionLogger);

		({ connection } = await import("../connection.js"));
		process.argv = [...port, ...pluginUUID, ...registerEvent, ...info];
	});

	// Reset modules to purge the state.
	afterEach(() => {
		process.argv = originalArgv;
		vi.resetModules();
	});

	describe("WebSocket", () => {
		let server: WebSocketServer;

		// Setup the mock server.
		beforeEach(async () => {
			const { WS } = await import("vitest-websocket-mock");
			server = new WS(`ws://127.0.0.1:${port[1]}`, { jsonProtocol: true });
		});

		// Clean-up the mock server.
		afterEach(() => server.close());

		/**
		 * Asserts {@link Connection.connect} sends the registration message to the underlying web socket.
		 */
		it("connect", async () => {
			// Arrange, act.
			await connection.connect();

			// Assert
			await expect(server).toReceiveMessage({
				event: registerEvent[1],
				uuid: pluginUUID[1],
			});
		});

		it("emits connected", async () => {
			// Arrange.
			const listener = vi.fn();

			// Act.
			connection.on("connected", listener);
			await connection.connect();

			// Assert
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toBeCalledWith<[RegistrationInfo]>(JSON.parse(info[1]));
		});

		/**
		 * Asserts {@link Connection.sends} forwards the message to the server.
		 */
		it("sends", async () => {
			// Arrange.
			await connection.connect();

			// Act.
			await connection.send({
				event: "setSettings",
				context: "abc123",
				payload: {
					message: "Hello world",
				},
			});

			// Assert.
			await expect(server).toReceiveMessage({
				event: registerEvent[1],
				uuid: pluginUUID[1],
			});

			await expect(server).toReceiveMessage({
				event: "setSettings",
				context: "abc123",
				payload: {
					message: "Hello world",
				},
			});
		});

		/**
		 * Asserts messages sent from the server are propagated by the {@link Connection}.
		 */
		it("propagates messages", async () => {
			// Arrange.
			const listener = vi.fn();
			connection.on("didReceiveGlobalSettings", listener);

			await connection.connect();

			// Act.
			server.send({
				event: "didReceiveGlobalSettings",
				payload: {
					settings: {
						name: "Elgato",
					},
				},
			} satisfies DidReceiveGlobalSettings<Settings>);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[DidReceiveGlobalSettings<Settings>]>({
				event: "didReceiveGlobalSettings",
				payload: {
					settings: {
						name: "Elgato",
					},
				},
			});
		});

		describe("logging", () => {
			/**
			 * Asserts {@link Connection} traces messages sent to the server.
			 */
			it("traces send", async () => {
				// Arrange.
				const spyOnTrace = vi.spyOn(connectionLogger, "trace");
				await connection.connect();

				// Act.
				await connection.send({
					event: "openUrl",
					payload: {
						url: "https://www.elgato.com",
					},
				});

				// Assert.
				expect(spyOnTrace).toHaveBeenCalledTimes(1);
				expect(spyOnTrace).toHaveBeenCalledWith(
					JSON.stringify({
						event: "openUrl",
						payload: {
							url: "https://www.elgato.com",
						},
					} satisfies OpenUrl),
				);
			});

			/**
			 * Asserts {@link Connection} traces valid messages received from the server.
			 */
			it("traces emit", async () => {
				// Arrange.
				const spyOnTrace = vi.spyOn(connectionLogger, "trace");
				await connection.connect();

				// Act.
				server.send({
					event: "applicationDidLaunch",
					payload: {
						application: "elgato",
					},
				} satisfies ApplicationDidLaunch);

				// Assert.
				expect(spyOnTrace).toHaveBeenCalledTimes(1);
				expect(spyOnTrace).toHaveBeenCalledWith(
					JSON.stringify({
						event: "applicationDidLaunch",
						payload: {
							application: "elgato",
						},
					} satisfies ApplicationDidLaunch),
				);
			});

			it("warns for unknown message", async () => {
				// Arrange.
				const spyOnWarn = vi.spyOn(connectionLogger, "warn");
				await connection.connect();

				// Act.
				server.send({ foo: "bar" });

				// Assert.
				expect(spyOnWarn).toHaveBeenCalledTimes(1);
				expect(spyOnWarn).toHaveBeenCalledWith(`Received unknown message: ${JSON.stringify({ foo: "bar" })}`);
			});

			it("errors invalid JSON", async () => {
				// Arrange.
				const origSerializer = server.serializer;
				server.serializer = (): string => "{ invalid }";

				const spyOnError = vi.spyOn(connectionLogger, "error");
				await connection.connect();

				// Act.
				server.send("{ invalid }");

				// Assert.
				expect(spyOnError).toHaveBeenCalledTimes(1);
				expect(spyOnError).toHaveBeenCalledWith(`Failed to parse message: { invalid }`, expect.any(Error));

				// Clean-up
				server.serializer = origSerializer;
			});
		});
	});

	describe("registration parameters", () => {
		/**
		 * Asserts the {@link Connection} is capable of parsing known arguments.
		 */
		it("parses valid arguments", () => {
			// Arrange.
			process.argv = [...port, ...pluginUUID, ...registerEvent, ...info];

			// Act.
			const parameters = connection.registrationParameters;

			// Assert.
			expect(parameters.port).toBe("12345");
			expect(parameters.pluginUUID).toBe("abc123");
			expect(parameters.registerEvent).toBe("test_event");
			expect(parameters.info).not.toBeUndefined();
			expect(parameters.info.plugin.uuid).toBe("com.elgato.test");
			expect(parameters.info.plugin.version).toBe("0.1.0");
		});

		/**
		 * Asserts the {@link Connection} ignores unknown arguments.
		 */
		it("ignores unknown arguments", () => {
			// Arrange
			process.argv = [...port, "-other", "Hello world", ...pluginUUID, ...registerEvent, ...info];

			// Act.
			const parameters = connection.registrationParameters;

			// Assert.
			expect(parameters.port).toBe("12345");
			expect(parameters.pluginUUID).toBe("abc123");
			expect(parameters.registerEvent).toBe("test_event");
			expect(parameters.info).not.toBeUndefined();
			expect(parameters.info.plugin.uuid).toBe("com.elgato.test");
			expect(parameters.info.plugin.version).toBe("0.1.0");
		});

		/**
		 * Asserts the {@link Connection} is able to handle an odd number of key-value arguments.
		 */
		it("handles uneven arguments", () => {
			// Arrange.
			process.argv = [...port, ...pluginUUID, "-bool", ...registerEvent, ...info];

			// Act.
			const parameters = connection.registrationParameters;

			// Assert.
			expect(parameters.port).toBe("12345");
			expect(parameters.pluginUUID).toBe("abc123");
			expect(parameters.registerEvent).toBe("test_event");
			expect(parameters.info).not.toBeUndefined();
			expect(parameters.info.plugin.uuid).toBe("com.elgato.test");
			expect(parameters.info.plugin.version).toBe("0.1.0");
		});

		/**
		 * Asserts the {@link Connection} logs all arguments to the {@link Logger}.
		 */
		it("logs arguments", () => {
			// Arrange
			const scopedLogger = new Logger({
				level: "trace",
				targets: [{ write: vi.fn() }],
			});

			vi.spyOn(logger, "createScope").mockReturnValueOnce(scopedLogger);
			const spyOnLoggerDebug = vi.spyOn(scopedLogger, "debug");

			// Act.
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			connection.registrationParameters; // Evaluate getter.

			// Assert.
			expect(spyOnLoggerDebug).toHaveBeenCalledTimes(4);
			expect(spyOnLoggerDebug).toBeCalledWith(`port=${[port[1]]}`);
			expect(spyOnLoggerDebug).toBeCalledWith(`pluginUUID=${[pluginUUID[1]]}`);
			expect(spyOnLoggerDebug).toBeCalledWith(`registerEvent=${[registerEvent[1]]}`);
			expect(spyOnLoggerDebug).toBeCalledWith(`info=${info[1]}`);
		});

		/**
		 * Asserts the {@link Connection} creates a scoped {@link Logger}, when parsing registration parameters.
		 */
		it("creates a scoped logger", () => {
			// Arrange.
			const spyOnCreateScope = vi.spyOn(logger, "createScope");

			// Act.
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			connection.registrationParameters; // Evaluate getter.

			// Assert.
			expect(spyOnCreateScope).toBeCalledWith("RegistrationParameters");
		});

		/**
		 * Asserts the {@link Connection} throws when there is a missing argument, and all missing arguments are included in the message, when parsing registration parameters.
		 */
		it("includes all missing arguments", () => {
			// Arrange.
			process.argv = [];

			// Act, assert.
			expect(() => connection.registrationParameters).toThrow(
				"Unable to establish a connection with Stream Deck, missing command line arguments: -port, -pluginUUID, -registerEvent, -info",
			);
		});

		/**
		 * Asserts the {@link Connection} throws when "-port" is missing, when parsing registration parameters.
		 */
		it("requires port", () => {
			// Arrange.
			process.argv = [...pluginUUID, ...registerEvent, ...info];

			// Act, assert.
			expect(() => connection.registrationParameters).toThrow(
				"Unable to establish a connection with Stream Deck, missing command line arguments: -port",
			);
		});

		/**
		 * Asserts the {@link Connection} throws when "-pluginUUID" is missing, when parsing registration parameters.
		 */
		it("requires pluginUUID", () => {
			// Arrange.
			process.argv = [...port, ...registerEvent, ...info];

			// Act, assert.
			expect(() => connection.registrationParameters).toThrow(
				"Unable to establish a connection with Stream Deck, missing command line arguments: -pluginUUID",
			);
		});

		/**
		 * Asserts the {@link Connection} throws when "-registerEvent" is missing, when parsing registration parameters.
		 */
		it("requires registerEvent", () => {
			// Arrange.
			process.argv = [...port, ...pluginUUID, ...info];

			// Act, assert.
			expect(() => connection.registrationParameters).toThrow(
				"Unable to establish a connection with Stream Deck, missing command line arguments: -registerEvent",
			);
		});

		/**
		 * Asserts the {@link Connection} throws when "-info" is missing, when parsing registration parameters.
		 */
		it("requires info", () => {
			// Arrange.
			process.argv = [...port, ...pluginUUID, ...registerEvent];

			// Act, assert.
			expect(() => connection.registrationParameters).toThrow(
				"Unable to establish a connection with Stream Deck, missing command line arguments: -info",
			);
		});
	});

	/**
	 * Asserts {@link Connection.version} is parsed from the registration information.
	 */
	it("parses version from registration info", () => {
		// Arrange.
		process.argv = [...port, ...pluginUUID, ...registerEvent, "-info", JSON.stringify(registrationInfo)];

		// Act, assert.
		expect(connection.version).not.toBeUndefined();
		expect(connection.version.major).toBe(99);
		expect(connection.version.minor).toBe(8);
		expect(connection.version.patch).toBe(6);
		expect(connection.version.build).toBe(54321);
	});
});



================================================
FILE: src/plugin/__tests__/i18n.test.ts
================================================
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fileSystemLocaleProvider } from "../i18n.js";
import { logger } from "../logging/index.js";

vi.mock("../logging/index.js");

describe("fileSystemLocaleProvider", () => {
	const mockedCwd = "c:\\temp";

	beforeEach(() => vi.spyOn(process, "cwd").mockReturnValue(mockedCwd));
	afterEach(() => vi.resetAllMocks());

	/**
	 * Assert {@link fileSystemLocaleProvider} parses translation files.
	 */
	it("reads from the language JSON file", () => {
		// Arrange.
		vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const spyOnReadFileSync = vi.spyOn(fs, "readFileSync").mockReturnValue(
			JSON.stringify({
				Localization: {
					Hello: "Hallo Welt",
				},
			}),
		);

		// Act.
		const translations = fileSystemLocaleProvider("de");

		// Assert.
		expect(translations).toEqual({ Hello: "Hallo Welt" });
		expect(spyOnReadFileSync).toHaveBeenCalledTimes(1);
		expect(spyOnReadFileSync).toHaveBeenCalledWith(path.join(mockedCwd, "de.json"), { flag: "r" });
	});

	/**
	 * Assert {@link fileSystemLocaleProvider} returns null when the translation file does not exist.
	 */
	it("returns null when the file is not found", () => {
		// Arrange.
		vi.spyOn(fs, "existsSync").mockReturnValue(false);
		const spyOnReadFileSync = vi.spyOn(fs, "readFileSync");

		// Act.
		const translations = fileSystemLocaleProvider("en");

		// Assert.
		expect(translations).toBeNull();
		expect(spyOnReadFileSync).toHaveBeenCalledTimes(0);
	});

	/**
	 * Assert {@link fileSystemLocaleProvider} returns null, and logs an error, when the contents of the file are not JSON.
	 */
	it("logs an error when the contents are not JSON", () => {
		// Arrange.
		vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const spyOnReadFileSync = vi.spyOn(fs, "readFileSync").mockReturnValue(`{"value":invalid}`);
		const spyOnLogError = vi.spyOn(logger, "error");

		// Act.
		const translations = fileSystemLocaleProvider("es");

		// Assert.
		expect(translations).toBeNull();
		expect(spyOnReadFileSync).toHaveBeenCalledTimes(1);
		expect(spyOnLogError).toHaveBeenCalledTimes(1);
		expect(spyOnLogError).toHaveBeenCalledWith(
			`Failed to load translations from ${path.join(mockedCwd, "es.json")}`,
			expect.any(SyntaxError),
		);
	});

	/**
	 * Assert {@link fileSystemLocaleProvider} returns null, and logs an error, when the contents of the file are not the expected structure.
	 */
	it("logs an error when the structure is incorrect", () => {
		// Arrange.
		vi.spyOn(fs, "existsSync").mockReturnValue(true);
		const spyOnReadFileSync = vi.spyOn(fs, "readFileSync").mockReturnValue(`{"NotLocalization":"Incorrect format"}`);
		const spyOnLogError = vi.spyOn(logger, "error");

		// Act.
		const translations = fileSystemLocaleProvider("ja");

		// Assert.
		expect(translations).toBeNull();
		expect(spyOnReadFileSync).toHaveBeenCalledTimes(1);
		expect(spyOnLogError).toHaveBeenCalledTimes(1);
		expect(spyOnLogError).toHaveBeenCalledWith(
			`Failed to load translations from ${path.join(mockedCwd, "ja.json")}`,
			expect.any(TypeError),
		);
	});
});



================================================
FILE: src/plugin/__tests__/index.test.ts
================================================
import { describe, expect, it, vi } from "vitest";

import { BarSubType, DeviceType, Target } from "../../api/index.js";
import { SingletonAction } from "../actions/singleton-action.js";
import { connection } from "../connection.js";
import streamDeckAsDefaultExport, { streamDeck } from "../index.js";
import { logger } from "../logging/index.js";

vi.mock("../../common/i18n.js");
vi.mock("../logging/index.js");
vi.mock("../manifest.js");
vi.mock("../connection.js");

describe("index", () => {
	/**
	 * Asserts the named export, matches the default export.
	 */
	it("default is streamDeck const", async () => {
		// Arrange, act, assert.
		expect(streamDeck).toBe(streamDeckAsDefaultExport);
	});

	/**
	 * Asserts the namespaces are attached to the main export.
	 */
	it("exports namespaces", async () => {
		// Arrange.
		const { actionService } = await import("../actions/service.js");
		const { deviceService } = await import("../devices/service.js");
		const profiles = await import("../profiles.js");
		const { settings } = await import("../settings.js");
		const system = await import("../system.js");
		const { ui } = await import("../ui.js");

		// Act, assert.
		expect(streamDeck.actions).toBe(actionService);
		expect(streamDeck.devices).toBe(deviceService);
		expect(streamDeck.profiles).toBe(profiles);
		expect(streamDeck.settings).toBe(settings);
		expect(streamDeck.system).toBe(system);
		expect(streamDeck.ui).toBe(ui);
	});

	/**
	 * Asserts {@link streamDeck} can connect.
	 */
	it("connects", async () => {
		// Arrange.
		const spyOnConnect = vi.spyOn(connection, "connect");

		// Act, assert.
		await streamDeck.connect();
		expect(spyOnConnect).toHaveBeenCalledTimes(1);
	});

	/**
	 * Asserts {@link streamDeck} has a logger.
	 */
	it("has logger", () => {
		expect(streamDeck.logger).toEqual(logger);
	});

	/**
	 * Asserts supporting enums, classes, and functions are exported.
	 */
	it("exports enums, classes, and functions", async () => {
		// Arrange.
		const index = (await import("../index.js")) as typeof import("../index.js");

		// Act, assert.
		expect(index.BarSubType).toBe(BarSubType);
		expect(index.DeviceType).toBe(DeviceType);
		expect(index.SingletonAction).toBe(SingletonAction);
		expect(index.Target).toBe(Target);
	});
});



================================================
FILE: src/plugin/__tests__/manifest.test.ts
================================================
import * as fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Manifest } from "../../api/index.js";
import { manifest as mockManifest } from "../__mocks__/manifest.js";

vi.mock("node:fs");

describe("manifest", () => {
	let getManifest: typeof import("../manifest.js").getManifest;
	let getSoftwareMinimumVersion: typeof import("../manifest.js").getSoftwareMinimumVersion;

	beforeEach(async () => ({ getManifest, getSoftwareMinimumVersion } = await import("../manifest.js")));
	afterEach(() => vi.resetModules());

	describe("getManifest", () => {
		it("errors when file does not exist", () => {
			// Arrange.
			vi.spyOn(process, "cwd").mockReturnValueOnce("test");

			// Act, assert.
			expect(getManifest).toThrowError("Failed to read manifest.json as the file does not exist.");
			expect(fs.existsSync).toHaveBeenCalled();
			expect(fs.existsSync).toHaveBeenCalledWith(path.join("test", "manifest.json"));
		});

		it("parses the manifest file", () => {
			// Arrange.
			vi.spyOn(fs, "existsSync").mockReturnValue(true);
			vi.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify(mockManifest));

			// Act.
			const manifest = getManifest();

			// Assert.
			expect(manifest).toEqual(mockManifest);
		});

		it("returns null when the manifest cannot be parsed", () => {
			// Arrange.
			vi.spyOn(fs, "existsSync").mockReturnValueOnce(true);
			vi.spyOn(fs, "readFileSync").mockReturnValueOnce("_");

			// Act, assert.
			expect(getManifest()).toEqual(null);
		});

		it("caches the result", () => {
			// Arrange.
			vi.spyOn(fs, "existsSync").mockReturnValue(true);
			const readSpy = vi.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify(mockManifest));

			// Act.
			const manifestOne = getManifest();
			const manifestTwo = getManifest();

			// Assert.
			expect(manifestOne).toEqual(manifestTwo);
			expect(readSpy).toHaveBeenCalledTimes(1);
		});
	});

	describe("getSoftwareMinimumVersion", () => {
		it("reads the minimum version from the manifest", () => {
			// Arrange.
			vi.spyOn(fs, "existsSync").mockReturnValue(true);
			const readSpy = vi.spyOn(fs, "readFileSync").mockReturnValueOnce(
				JSON.stringify({
					Software: {
						MinimumVersion: "6.5",
					},
				} satisfies Pick<Manifest, "Software">),
			);

			// Act.
			const version = getSoftwareMinimumVersion();

			// Assert.
			expect(version!.major).toEqual(6);
			expect(version!.minor).toEqual(5);
			expect(readSpy).toBeCalledTimes(1);
		});

		it("returns null when the manifest cannot be read", () => {
			// Arrange.
			vi.spyOn(fs, "existsSync").mockReturnValue(true);
			vi.spyOn(fs, "readFileSync").mockReturnValueOnce("_");

			// Act, assert.
			expect(getSoftwareMinimumVersion()).toEqual(null);
		});

		it("caches the result", () => {
			// Arrange.
			vi.spyOn(fs, "existsSync").mockReturnValue(true);
			const readSpy = vi.spyOn(fs, "readFileSync").mockReturnValueOnce(JSON.stringify(mockManifest));

			// Act.
			const versionOne = getSoftwareMinimumVersion();
			const versionTwo = getSoftwareMinimumVersion();

			// Assert.
			expect(versionOne).toEqual(versionTwo);
			expect(readSpy).toHaveBeenCalledTimes(1);
		});
	});
});



================================================
FILE: src/plugin/__tests__/profiles.test.ts
================================================
import { describe, expect, it, vi } from "vitest";

import type { SwitchToProfile } from "../../api/index.js";
import { Version } from "../common/version.js";
import { connection } from "../connection.js";
import { switchToProfile } from "../profiles.js";

vi.mock("../connection.js");
vi.mock("../logging/index.js");
vi.mock("../manifest.js");

describe("profiles", () => {
	describe("switchToProfile", () => {
		/**
		 * Asserts {@link switchToProfile} sends the command to the {@link connection}.
		 */
		it("sends", async () => {
			// Arrange, act.
			await switchToProfile("DEV1");
			await switchToProfile("DEV2", "Custom Profile (1)");
			await switchToProfile("DEV3", "Custom Profile (2)", 2);

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(3);
			expect(connection.send).toHaveBeenNthCalledWith<[SwitchToProfile]>(1, {
				event: "switchToProfile",
				context: connection.registrationParameters.pluginUUID,
				device: "DEV1",
				payload: {
					profile: undefined,
					page: undefined,
				},
			});
			expect(connection.send).toHaveBeenNthCalledWith<[SwitchToProfile]>(2, {
				event: "switchToProfile",
				context: connection.registrationParameters.pluginUUID,
				device: "DEV2",
				payload: {
					profile: "Custom Profile (1)",
					page: undefined,
				},
			});
			expect(connection.send).toHaveBeenNthCalledWith<[SwitchToProfile]>(3, {
				event: "switchToProfile",
				context: connection.registrationParameters.pluginUUID,
				device: "DEV3",
				payload: {
					profile: "Custom Profile (2)",
					page: 2,
				},
			});
		});

		/**
		 * Asserts {@link switchToProfile} throws an error if the Stream Deck version is earlier than 6.5.
		 */
		it("validates page parameter requires 6.5 (connection)", () => {
			// Arrange.
			vi.spyOn(connection, "version", "get").mockReturnValueOnce(new Version("6.4"));

			// Act, assert.
			expect(() => switchToProfile("DEV1", "Profile", 1)).toThrow(
				`[ERR_NOT_SUPPORTED]: Switching to a profile page requires Stream Deck version 6.5 or higher, but current version is 6.4; please update Stream Deck and the "Software.MinimumVersion" in the plugin's manifest to "6.5" or higher.`,
			);
		});
	});
});



================================================
FILE: src/plugin/__tests__/settings.test.ts
================================================
import { afterAll, beforeAll, describe, expect, it, test, vi } from "vitest";

import { type Settings } from "../../api/__mocks__/events.js";
import {
	DeviceType,
	type DidReceiveGlobalSettings,
	type DidReceiveSettings,
	type GetGlobalSettings,
	type SetGlobalSettings,
} from "../../api/index.js";
import { actionStore } from "../actions/store.js";
import { connection } from "../connection.js";
import { Device } from "../devices/device.js";
import { deviceStore } from "../devices/store.js";
import type { DidReceiveGlobalSettingsEvent, DidReceiveSettingsEvent } from "../events/index.js";
import { settings } from "../settings.js";

vi.mock("../connection.js");
vi.mock("../logging/index.js");
vi.mock("../manifest.js");
vi.mock("../actions/store.js");

describe("settings", () => {
	const { getGlobalSettings, onDidReceiveGlobalSettings, onDidReceiveSettings, setGlobalSettings } = settings;

	// Add a mock device.
	beforeAll(() => {
		deviceStore.set(
			new Device(
				"device123",
				{
					name: "Device One",
					size: {
						columns: 5,
						rows: 3,
					},
					type: DeviceType.StreamDeckXL,
				},
				true,
			),
		);
	});

	describe("sending", () => {
		/**
		 * Asserts {@link getGlobalSettings} sends the command to the {@link connection}, and await the settings.
		 */
		it("getGlobalSettings", async () => {
			// Arrange, act (Command).
			const settings = getGlobalSettings<Settings>();

			// Assert (Command).
			expect(connection.send).toHaveBeenCalledTimes(1);
			expect(connection.send).toHaveBeenLastCalledWith({
				event: "getGlobalSettings",
				context: connection.registrationParameters.pluginUUID,
				id: expect.any(String),
			} as GetGlobalSettings);

			await expect(Promise.race([settings, false])).resolves.toBe(false);

			// Act (Event).
			connection.emit("didReceiveGlobalSettings", {
				event: "didReceiveGlobalSettings",
				payload: {
					settings: {
						name: "Elgato",
					},
				},
			});
			await settings;

			// Assert (Event).
			await expect(settings).resolves.toEqual({
				name: "Elgato",
			} satisfies Settings);
		});

		/**
		 * Asserts {@link setGlobalSettings} sends the command to the {@link connection}.
		 */
		it("setGlobalSettings", async () => {
			// Arrange, act.
			await setGlobalSettings({
				name: "Elgato",
			});

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(1);
			expect(connection.send).toHaveBeenCalledWith<[SetGlobalSettings]>({
				event: "setGlobalSettings",
				context: connection.registrationParameters.pluginUUID,
				payload: {
					name: "Elgato",
				},
			});
		});
	});

	describe("receiving emits with useExperimentalMessageIdentifiers set to false", () => {
		beforeAll(() => (settings.useExperimentalMessageIdentifiers = false));

		/**
		 * Asserts {@link onDidReceiveGlobalSettings} is invoked when `didReceiveGlobalSettings` is emitted.
		 */
		test.each([undefined, "12345"])("onDidReceiveGlobalSettings (id=$0)", (id: string | undefined) => {
			// Arrange
			const listener = vi.fn();
			const ev = {
				event: "didReceiveGlobalSettings",
				id,
				payload: {
					settings: {
						name: "Elgato",
					},
				},
			} satisfies DidReceiveGlobalSettings<Settings>;

			// Act (emit).
			const disposable = onDidReceiveGlobalSettings(listener);
			connection.emit("didReceiveGlobalSettings", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[DidReceiveGlobalSettingsEvent<Settings>]>({
				settings: {
					name: "Elgato",
				},
				type: "didReceiveGlobalSettings",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});

		/**
		 * Asserts {@link onDidReceiveSettings} is invoked when `didReceiveSettings` is emitted.
		 */
		test.each([undefined, "12345"])("onDidReceiveSettings (id=$0)", (id: string | undefined) => {
			// Arrange
			const listener = vi.fn();
			const ev = {
				action: "com.elgato.test.one",
				context: "key123",
				device: "device123",
				event: "didReceiveSettings",
				id,
				payload: {
					controller: "Keypad",
					coordinates: {
						column: 0,
						row: 0,
					},
					isInMultiAction: false,
					resources: {},
					settings: {
						name: "Elgato",
					},
				},
			} satisfies DidReceiveSettings<Settings>;

			// Act (emit).
			const disposable = onDidReceiveSettings(listener);
			connection.emit("didReceiveSettings", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[DidReceiveSettingsEvent<Settings>]>({
				action: actionStore.getActionById(ev.context)!,
				payload: ev.payload,
				type: "didReceiveSettings",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});
	});

	describe("receiving does not emit with useExperimentalMessageIdentifiers set to true", () => {
		beforeAll(() => (settings.useExperimentalMessageIdentifiers = true));
		afterAll(() => (settings.useExperimentalMessageIdentifiers = false));

		test("didReceiveGlobalSettings", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				event: "didReceiveGlobalSettings",
				id: "12345",
				payload: {
					settings: {
						name: "Elgato",
					},
				},
			} satisfies DidReceiveGlobalSettings<Settings>;

			// Act.
			onDidReceiveGlobalSettings(listener);
			connection.emit("didReceiveGlobalSettings", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(0);
		});

		test("didReceiveSettings", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: "com.elgato.test.one",
				context: "key123",
				device: "device123",
				event: "didReceiveSettings",
				id: "12345",
				payload: {
					controller: "Keypad",
					coordinates: {
						column: 0,
						row: 0,
					},
					isInMultiAction: false,
					settings: {
						name: "Elgato",
					},
					resources: {},
				},
			} satisfies DidReceiveSettings<Settings>;

			// Act.
			onDidReceiveSettings(listener);
			connection.emit("didReceiveSettings", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(0);
		});
	});
});



================================================
FILE: src/plugin/__tests__/system.test.ts
================================================
import { describe, expect, it, vi } from "vitest";

import type { Secrets } from "../../api/__mocks__/events.js";
import type {
	ApplicationDidLaunch,
	ApplicationDidTerminate,
	DidReceiveDeepLink,
	OpenUrl,
	SystemDidWakeUp,
} from "../../api/index.js";
import { Version } from "../common/version.js";
import { connection } from "../connection.js";
import {
	type ApplicationDidLaunchEvent,
	type ApplicationDidTerminateEvent,
	DidReceiveDeepLinkEvent,
	type SystemDidWakeUpEvent,
} from "../events/index.js";
import * as manifest from "../manifest.js";
import {
	getSecrets,
	onApplicationDidLaunch,
	onApplicationDidTerminate,
	onDidReceiveDeepLink,
	onSystemDidWakeUp,
	openUrl,
} from "../system.js";

vi.mock("../connection.js");
vi.mock("../logging/index.js");
vi.mock("../manifest.js");

describe("system", () => {
	/**
	 * Asserts {@link onApplicationDidLaunch} is invoked when `applicationDidLaunch` is emitted.
	 */
	it("receives onApplicationDidLaunch", () => {
		// Arrange
		const listener = vi.fn();
		const ev = {
			event: "applicationDidLaunch",
			payload: {
				application: "notepad.exe",
			},
		} satisfies ApplicationDidLaunch;

		// Act (emit).
		const disposable = onApplicationDidLaunch(listener);
		connection.emit("applicationDidLaunch", ev);

		// Assert (emit).
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith<[ApplicationDidLaunchEvent]>({
			application: "notepad.exe",
			type: "applicationDidLaunch",
		});

		// Act (dispose).
		disposable.dispose();
		connection.emit(ev.event, ev as any);

		// Assert(dispose).
		expect(listener).toHaveBeenCalledTimes(1);
	});

	/**
	 * Asserts {@link onApplicationDidTerminate} is invoked when `onApplicationDidTerminate` is emitted.
	 */
	it("receives onApplicationDidTerminate", () => {
		// Arrange
		const listener = vi.fn();
		const ev = {
			event: "applicationDidTerminate",
			payload: {
				application: "notepad.exe",
			},
		} satisfies ApplicationDidTerminate;

		// Act (emit).
		const disposable = onApplicationDidTerminate(listener);
		connection.emit("applicationDidTerminate", ev);

		// Assert (emit).
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith<[ApplicationDidTerminateEvent]>({
			application: "notepad.exe",
			type: "applicationDidTerminate",
		});

		// Act (dispose).
		disposable.dispose();
		connection.emit(ev.event, ev as any);

		// Assert(dispose).
		expect(listener).toHaveBeenCalledTimes(1);
	});

	describe("onDidReceiveDeepLink", () => {
		/**
		 * Asserts {@link onDidReceiveDeepLink} is invoked when `didReceiveDeepLink` is emitted.
		 */
		it("propagates", () => {
			// Arrange
			const listener = vi.fn();
			const ev = {
				event: "didReceiveDeepLink",
				payload: {
					url: "/hello/world?foo=bar#heading",
				},
			} satisfies DidReceiveDeepLink;

			// Act (emit).
			const disposable = onDidReceiveDeepLink(listener);
			connection.emit("didReceiveDeepLink", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[DidReceiveDeepLinkEvent]>({
				url: {
					fragment: "heading",
					href: ev.payload.url,
					path: "/hello/world",
					query: "foo=bar",
					queryParameters: new URLSearchParams([["foo", "bar"]]),
				},
				type: "didReceiveDeepLink",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});

		/**
		 * Asserts {@link onDidReceiveDeepLink} throws an error if the Stream Deck version is earlier than 6.5.
		 */
		it("validates requires 6.5 (connection)", () => {
			// Arrange.
			vi.spyOn(connection, "version", "get").mockReturnValueOnce(new Version("6.4"));

			// Act, assert.
			expect(() => onDidReceiveDeepLink(vi.fn())).toThrow(
				`[ERR_NOT_SUPPORTED]: Receiving deep-link messages requires Stream Deck version 6.5 or higher, but current version is 6.4; please update Stream Deck and the "Software.MinimumVersion" in the plugin's manifest to "6.5" or higher.`,
			);
		});
	});

	/**
	 * Asserts {@link onSystemDidWakeUp} is invoked when `systemDidWakeUp` is emitted.
	 */
	it("Receives onSystemDidWakeUp", () => {
		// Arrange
		const listener = vi.fn();
		const ev = {
			event: "systemDidWakeUp",
		} satisfies SystemDidWakeUp;

		// Act (emit).
		const disposable = onSystemDidWakeUp(listener);
		connection.emit("systemDidWakeUp", ev);

		// Assert (emit).
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith<[SystemDidWakeUpEvent]>({
			type: "systemDidWakeUp",
		});

		// Act (dispose).
		disposable.dispose();
		connection.emit(ev.event, ev as any);

		// Assert(dispose).
		expect(listener).toHaveBeenCalledTimes(1);
	});

	/**
	 * Asserts {@link openUrl} sends the command to the {@link connection}.
	 */
	it("sends", async () => {
		// Arrange, act.
		await openUrl("https://www.elgato.com");

		// Assert.
		expect(connection.send).toHaveBeenCalledTimes(1);
		expect(connection.send).toHaveBeenCalledWith<[OpenUrl]>({
			event: "openUrl",
			payload: {
				url: "https://www.elgato.com",
			},
		});
	});

	describe("getSecrets", () => {
		it("requires SDKVersion 3 or higher", () => {
			// Arrange.
			vi.spyOn(manifest, "getSDKVersion").mockReturnValue(2); // Not okay
			vi.spyOn(manifest, "getSoftwareMinimumVersion").mockReturnValue(new Version("6.9")); // Okay

			// Act, assert.
			expect(() => getSecrets()).toThrow(
				`[ERR_NOT_SUPPORTED]: Secrets requires manifest SDK version 3 or higher, but found version 2; please update the "SDKVersion" in the plugin's manifest to 3 or higher.`,
			);
		});

		it("requires Software.MinimumVersion 6.9 or higher", () => {
			// Arrange.
			vi.spyOn(manifest, "getSDKVersion").mockReturnValue(3); // Okay
			vi.spyOn(manifest, "getSoftwareMinimumVersion").mockReturnValue(new Version("6.8")); // Not okay

			// Act, assert.
			expect(() => getSecrets()).toThrow(
				`[ERR_NOT_SUPPORTED]: Secrets requires Stream Deck version 6.9 or higher; please update the "Software.MinimumVersion" in the plugin's manifest to "6.9" or higher.`,
			);
		});

		it("getSecrets", async () => {
			// Arrange, act (Command).
			vi.spyOn(manifest, "getSDKVersion").mockReturnValue(3);
			vi.spyOn(manifest, "getSoftwareMinimumVersion").mockReturnValue(new Version("6.9"));

			const secrets = getSecrets<Secrets>();

			// Assert (Command).
			expect(connection.send).toHaveBeenCalledTimes(1);
			expect(connection.send).toHaveBeenLastCalledWith({
				event: "getSecrets",
				context: connection.registrationParameters.pluginUUID,
			});

			await expect(Promise.race([secrets, false])).resolves.toBe(false);

			// Act (Event).
			connection.emit("didReceiveSecrets", {
				event: "didReceiveSecrets",
				payload: {
					secrets: {
						secret: "Elgato",
					},
				},
			});
			await secrets;

			// Assert (Event).
			await expect(secrets).resolves.toEqual({
				secret: "Elgato",
			} satisfies Secrets);
		});
	});
});



================================================
FILE: src/plugin/__tests__/ui.test.ts
================================================
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Settings } from "../../api/__mocks__/events.js";
import {
	DeviceType,
	type DidReceivePropertyInspectorMessage,
	type PropertyInspectorDidAppear,
	type PropertyInspectorDidDisappear,
	type SendToPropertyInspector,
} from "../../api/index.js";
import { KeyAction } from "../actions/key.js";
import { actionStore } from "../actions/store.js";
import { connection } from "../connection.js";
import { Device } from "../devices/device.js";
import { deviceStore } from "../devices/store.js";
import {
	type PropertyInspectorDidAppearEvent,
	type PropertyInspectorDidDisappearEvent,
	SendToPluginEvent,
} from "../events/index.js";
import { ui } from "../ui.js";

vi.mock("../connection.js");
vi.mock("../actions/store.js");
vi.mock("../logging/index.js");
vi.mock("../manifest.js");

describe("UIController", () => {
	// Add a mock device.
	beforeAll(() => {
		deviceStore.set(
			new Device(
				"device123",
				{
					name: "Device One",
					size: {
						columns: 5,
						rows: 3,
					},
					type: DeviceType.StreamDeckXL,
				},
				true,
			),
		);
	});

	/**
	 * Asserts {@link ui.onDidAppear} is invoked when `propertyInspectorDidAppear` is emitted.
	 */
	it("receives onDidAppear", () => {
		// Arrange
		const listener = vi.fn();
		const ev = {
			action: "com.elgato.test.one",
			context: "key123", // Mocked in actionStore.
			device: "device123",
			event: "propertyInspectorDidAppear",
		} satisfies PropertyInspectorDidAppear;

		// Act (emit).
		const disposable = ui.onDidAppear(listener);
		connection.emit("propertyInspectorDidAppear", ev);

		// Assert (emit).
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith<[PropertyInspectorDidAppearEvent<Settings>]>({
			action: actionStore.getActionById(ev.context)!,
			type: "propertyInspectorDidAppear",
		});

		// Act (dispose).
		disposable.dispose();
		connection.emit(ev.event, ev as any);

		// Assert(dispose).
		expect(listener).toHaveBeenCalledTimes(1);
	});

	/**
	 * Asserts {@link ui.onDidDisappear} is invoked when `propertyInspectorDidDisappear` is emitted.
	 */
	it("receives onDidDisappear", () => {
		// Arrange
		const listener = vi.fn();
		const ev = {
			action: "com.elgato.test.one",
			context: "key123", // Mocked in actionStore.
			device: "device123",
			event: "propertyInspectorDidDisappear",
		} satisfies PropertyInspectorDidDisappear;

		// Act (emit).
		const disposable = ui.onDidDisappear(listener);
		connection.emit("propertyInspectorDidDisappear", ev);

		// Assert (emit).
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith<[PropertyInspectorDidDisappearEvent<Settings>]>({
			action: actionStore.getActionById(ev.context)!,
			type: "propertyInspectorDidDisappear",
		});

		// Act (dispose).
		disposable.dispose();
		connection.emit(ev.event, ev as any);

		// Assert(dispose).
		expect(listener).toHaveBeenCalledTimes(1);
	});

	/**
	 * Asserts {@link ui.onMessage} is invoked when `sendToPlugin` is emitted for an unknown route.
	 */
	it("receives onSendToPlugin", () => {
		// Arrange
		const listener = vi.fn();
		const ev = {
			action: "com.elgato.test.one",
			context: "key123", // Mocked in actionStore.
			event: "sendToPlugin",
			payload: {
				name: "Hello world",
			},
		} satisfies DidReceivePropertyInspectorMessage<Settings>;

		// Act (emit).
		const disposable = ui.onSendToPlugin(listener);
		connection.emit("sendToPlugin", ev);

		// Assert (emit).
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith<[SendToPluginEvent<Settings, Settings>]>({
			action: actionStore.getActionById(ev.context)!,
			payload: {
				name: "Hello world",
			},
			type: "sendToPlugin",
		});

		// Act (dispose).
		disposable.dispose();
		connection.emit(ev.event, ev as any);

		// Assert(dispose).
		expect(listener).toHaveBeenCalledTimes(1);
	});

	/**
	 * Asserts the UI can be sent payloads.
	 */
	it("sends sendToPropertyInspector", async () => {
		// Arrange.
		connection.emit("propertyInspectorDidAppear", {
			action: "action",
			context: "context",
			device: "device",
			event: "propertyInspectorDidAppear",
		});

		// Act.
		await ui.sendToPropertyInspector("Hello world");

		// Assert
		expect(connection.send).toHaveBeenLastCalledWith<[SendToPropertyInspector]>({
			context: "context",
			event: "sendToPropertyInspector",
			payload: "Hello world",
		});
	});

	describe("action", () => {
		beforeEach(() => {
			// Resets the event stack counter.
			const context = {
				action: "__reset__",
				context: "__reset__",
				device: "__reset__",
			};

			connection.emit("propertyInspectorDidAppear", { event: "propertyInspectorDidAppear", ...context });
			connection.emit("propertyInspectorDidDisappear", { event: "propertyInspectorDidDisappear", ...context });
		});

		/**
		 * Asserts the current action is set when the connection emits `propertyInspectorDidAppear`.
		 */
		it("sets on propertyInspectorDidAppear", () => {
			// Arrange.
			connection.emit("propertyInspectorDidAppear", {
				action: "com.elgato.test.one",
				context: "key123",
				device: "dev123",
				event: "propertyInspectorDidAppear",
			});

			// Act.
			const current = ui.action;

			// Assert.
			expect(current).toBeInstanceOf(KeyAction);
			expect(current).not.toBeUndefined();
			expect(current).toEqual(actionStore.getActionById("key123"));
		});

		/**
		 * Asserts the current action is overwritten when the connection emits `propertyInspectorDidAppear`.
		 */
		it("overwrites on propertyInspectorDidAppear", () => {
			// Arrange.
			connection.emit("propertyInspectorDidAppear", {
				action: "com.elgato.test.one",
				context: "__first__",
				device: "dev123",
				event: "propertyInspectorDidAppear",
			});

			connection.emit("propertyInspectorDidAppear", {
				action: "com.elgato.test.one",
				context: "key123",
				device: "dev123",
				event: "propertyInspectorDidAppear",
			});

			// Act.
			const action = ui.action;

			// Assert.
			expect(action).toBeInstanceOf(KeyAction);
			expect(action).not.toBeUndefined();
			expect(action).toEqual(actionStore.getActionById("key123"));
		});

		/**
		 * Asserts the current action is unset when the connection emits `propertyInspectorDidDisappear`
		 * for the current UI.
		 */
		it("clears matching PI", () => {
			// Arrange.
			const action = actionStore.getActionById("key123")!;
			const context = {
				action: action.manifestId,
				context: action.id,
				device: action.device.id,
			};

			connection.emit("propertyInspectorDidAppear", {
				...context,
				event: "propertyInspectorDidAppear",
			});

			expect(ui.action).not.toBeUndefined();
			connection.emit("propertyInspectorDidDisappear", {
				...context,
				event: "propertyInspectorDidDisappear",
			});

			// Act, assert.
			expect(ui.action).toBeUndefined();
		});

		/**
		 * Asserts the current action is not cleared when the connection emits `propertyInspectorDidDisappear`
		 * when the stack count is greater than zero.
		 */
		it("does not clear matching PI with debounce", () => {
			// Arrange.
			const action = actionStore.getActionById("key123")!;
			const context = {
				action: action.manifestId,
				context: action.id,
				device: action.device.id,
			};

			connection.emit("propertyInspectorDidAppear", {
				...context,
				event: "propertyInspectorDidAppear",
			});

			// Show twice (mock event race)
			connection.emit("propertyInspectorDidAppear", {
				...context,
				event: "propertyInspectorDidAppear",
			});

			expect(ui.action).not.toBeUndefined();
			connection.emit("propertyInspectorDidDisappear", {
				...context,
				event: "propertyInspectorDidDisappear",
			});

			// Act, assert.
			expect(ui.action).not.toBeUndefined();

			// Act, assert.
			connection.emit("propertyInspectorDidDisappear", {
				...context,
				event: "propertyInspectorDidDisappear",
			});
			expect(ui.action).toBeUndefined();
		});

		/**
		 * Asserts the current action is not cleared when the connection emits `propertyInspectorDidDisappear`
		 * for a UI that is not the current.
		 */
		it("does not clear non-matching PI", () => {
			// Arrange.
			connection.emit("propertyInspectorDidAppear", {
				action: "com.elgato.test.one",
				context: "key123",
				device: "dev123",
				event: "propertyInspectorDidAppear",
			});

			expect(ui.action).not.toBeUndefined();
			connection.emit("propertyInspectorDidDisappear", {
				action: "com.elgato.test.one",
				context: "dial123", // Mocked in actionStore
				device: "dev123",
				event: "propertyInspectorDidDisappear",
			});

			// Act, assert.
			expect(ui.action).not.toBeUndefined();
		});
	});
});



================================================
FILE: src/plugin/__tests__/validation.test.ts
================================================
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Version } from "../common/version.js";
import * as ManifestModule from "../manifest.js";
import { requiresVersion } from "../validation.js";

vi.mock("../manifest.js");

/**
 * Provides assertions for {@link requiresVersion}.
 */
describe("requiresVersion", () => {
	describe("validates application version", () => {
		beforeEach(() => vi.spyOn(ManifestModule, "getSoftwareMinimumVersion").mockReturnValue(new Version("6.5")));

		it("handles same versions", () => {
			// Arrange, act, assert.
			const appVersion = new Version("6.5.0.123");
			expect(() => requiresVersion(6.5, appVersion, "Test")).not.toThrow();
		});

		it("handles newer versions", () => {
			// Arrange, act, assert.
			const appVersion = new Version("99.0.0.0");
			expect(() => requiresVersion(6.5, appVersion, "Test")).not.toThrow();
		});

		it("throws older version", () => {
			// Arrange, act, assert.
			const appVersion = new Version("1.0.0.0");
			expect(() => requiresVersion(99, appVersion, "Test")).toThrow(
				`[ERR_NOT_SUPPORTED]: Test requires Stream Deck version 99.0 or higher, but current version is 1.0; please update Stream Deck and the "Software.MinimumVersion" in the plugin's manifest to "99.0" or higher.`,
			);
		});
	});

	describe("validates Software.MinimumVersion defined within the manifest", () => {
		const appVersion = new Version("99.0");

		it("handles same versions", () => {
			// Arrange, act, assert.
			vi.spyOn(ManifestModule, "getSoftwareMinimumVersion").mockReturnValue(new Version("6.5"));
			expect(() => requiresVersion(6.5, appVersion, "Test")).not.toThrow();
		});

		it("handles newer versions", () => {
			vi.spyOn(ManifestModule, "getSoftwareMinimumVersion").mockReturnValue(new Version("99.0"));
			expect(() => requiresVersion(6.5, appVersion, "Test")).not.toThrow();
		});

		it("throws older version", () => {
			// Arrange, act, assert.
			vi.spyOn(ManifestModule, "getSoftwareMinimumVersion").mockReturnValue(new Version("1.0"));
			expect(() => requiresVersion(99, appVersion, "Test")).toThrow(
				`[ERR_NOT_SUPPORTED]: Test requires Stream Deck version 99.0 or higher; please update the "Software.MinimumVersion" in the plugin's manifest to "99.0" or higher.`,
			);
		});
	});
});



================================================
FILE: src/plugin/actions/action.ts
================================================
import { type EventArgs, type JsonObject, withResolvers } from "@elgato/utils";
import { randomUUID } from "node:crypto";

import type {
	DidReceiveResources,
	DidReceiveSettings,
	GetResources,
	GetSettings,
	PluginEventMap,
	Resources,
} from "../../api/index.js";
import { connection } from "../connection.js";
import { requiresVersion } from "../validation.js";
import { ActionContext } from "./context.js";
import type { DialAction } from "./dial.js";
import type { KeyAction } from "./key.js";

const REQUEST_TIMEOUT = 15 * 1000; // 15s

/**
 * Provides a contextualized instance of an {@link Action}, allowing for direct communication with the Stream Deck.
 * @template T The type of settings associated with the action.
 */
export class Action<T extends JsonObject = JsonObject> extends ActionContext {
	/**
	 * Gets the resources (files) associated with this action; these resources are embedded into the
	 * action when it is exported, either individually, or as part of a profile.
	 *
	 * Available from Stream Deck 7.1.
	 * @returns The resources.
	 */
	public async getResources(): Promise<Resources> {
		requiresVersion(7.1, connection.version, "getResources");

		const res = await this.#fetch("getResources", "didReceiveResources");
		return res.payload.resources;
	}

	/**
	 * Gets the settings associated this action instance.
	 * @template U The type of settings associated with the action.D
	 * @returns Promise containing the action instance's settings.
	 */
	public async getSettings<U extends JsonObject = T>(): Promise<U> {
		const res = await this.#fetch("getSettings", "didReceiveSettings");
		return res.payload.settings as U;
	}

	/**
	 * Determines whether this instance is a dial.
	 * @returns `true` when this instance is a dial; otherwise `false`.
	 */
	public isDial(): this is DialAction {
		return this.controllerType === "Encoder";
	}

	/**
	 * Determines whether this instance is a key.
	 * @returns `true` when this instance is a key; otherwise `false`.
	 */
	public isKey(): this is KeyAction {
		return this.controllerType === "Keypad";
	}

	/**
	 * Sets the resources (files) associated with this action; these resources are embedded into the
	 * action when it is exported, either individually, or as part of a profile.
	 *
	 * Available from Stream Deck 7.1.
	 * @example
	 * action.setResources({
	 *   fileOne: "c:\\hello-world.txt",
	 *   anotherFile: "c:\\icon.png"
	 * });
	 * @param resources The resources as a map of file paths.
	 * @returns `Promise` resolved when the resources are saved to Stream Deck.
	 */
	public setResources(resources: Resources): Promise<void> {
		requiresVersion(7.1, connection.version, "setResources");

		return connection.send({
			event: "setResources",
			context: this.id,
			payload: resources,
		});
	}

	/**
	 * Sets the {@link settings} associated with this action instance. Use in conjunction with {@link Action.getSettings}.
	 * @param settings Settings to persist.
	 * @returns `Promise` resolved when the {@link settings} are sent to Stream Deck.
	 */
	public setSettings<U extends JsonObject = T>(settings: U): Promise<void> {
		return connection.send({
			event: "setSettings",
			context: this.id,
			payload: settings,
		});
	}

	/**
	 * Temporarily shows an alert (i.e. warning), in the form of an exclamation mark in a yellow triangle, on this action instance. Used to provide visual feedback when an action failed.
	 * @returns `Promise` resolved when the request to show an alert has been sent to Stream Deck.
	 */
	public showAlert(): Promise<void> {
		return connection.send({
			event: "showAlert",
			context: this.id,
		});
	}

	/**
	 * Fetches information from Stream Deck by sending the command, and awaiting the event.
	 * @param command Name of the event (command) to send.
	 * @param event Name of the event to await.
	 * @returns The payload from the received event.
	 */
	async #fetch<TEvent extends DidReceiveEvent>(
		command: GetterEvent,
		event: TEvent,
	): Promise<EventArgs<PluginEventMap, TEvent>[0]> {
		const { resolve, reject, promise } = withResolvers<EventArgs<PluginEventMap, TEvent>[0]>();

		// Set a timeout to prevent endless awaiting.
		const timeoutId = setTimeout(() => {
			listener.dispose();
			reject("The request timed out");
		}, REQUEST_TIMEOUT);

		// Listen for an event that can resolve the request.
		const listener = connection.disposableOn(event, (ev): void => {
			// Make sure the received event is for this action.
			if (ev.context == this.id) {
				clearTimeout(timeoutId);
				listener.dispose();
				resolve(ev);
			}
		});

		// Send the request; specifying an id signifies its a request.
		await connection.send({
			event: command,
			context: this.id,
			id: randomUUID(),
		});

		return promise;
	}
}

/**
 * Events that represents a request for information from Stream Deck.
 */
type GetterEvent = (GetResources | GetSettings)["event"];

/**
 * Events that represents a response of information from Stream Deck.
 */
type DidReceiveEvent = (DidReceiveResources<JsonObject> | DidReceiveSettings<JsonObject>)["event"];



================================================
FILE: src/plugin/actions/context.ts
================================================
import type { JsonObject } from "@elgato/utils";

import type { Controller, WillAppear, WillDisappear } from "../../api/index.js";
import type { Device } from "../devices/index.js";
import { deviceStore } from "../devices/store.js";

/**
 * Provides information about an instance of a Stream Deck action.
 */
export class ActionContext {
	/**
	 * Device the action is associated with.
	 */
	readonly #device: Device;

	/**
	 * Source of the action.
	 */
	readonly #source: WillAppear<JsonObject> | WillDisappear<JsonObject>;

	/**
	 * Initializes a new instance of the {@link ActionContext} class.
	 * @param source Source of the action.
	 */
	constructor(source: WillAppear<JsonObject> | WillDisappear<JsonObject>) {
		this.#source = source;

		const device = deviceStore.getDeviceById(source.device);
		if (!device) {
			throw new Error(`Failed to initialize action; device ${source.device} not found`);
		}

		this.#device = device;
	}

	/**
	 * Type of the action.
	 * - `Keypad` is a key.
	 * - `Encoder` is a dial and portion of the touch strip.
	 * @returns Controller type.
	 */
	public get controllerType(): Controller {
		return this.#source.payload.controller;
	}

	/**
	 * Stream Deck device the action is positioned on.
	 * @returns Stream Deck device.
	 */
	public get device(): Device {
		return this.#device;
	}

	/**
	 * Action instance identifier.
	 * @returns Identifier.
	 */
	public get id(): string {
		return this.#source.context;
	}

	/**
	 * Manifest identifier (UUID) for this action type.
	 * @returns Manifest identifier.
	 */
	public get manifestId(): string {
		return this.#source.action;
	}

	/**
	 * Converts this instance to a serializable object.
	 * @returns The serializable object.
	 */
	public toJSON(): object {
		return {
			controllerType: this.controllerType,
			device: this.device,
			id: this.id,
			manifestId: this.manifestId,
		};
	}
}



================================================
FILE: src/plugin/actions/decorators.ts
================================================
import type { Manifest } from "../../api/index.js";
import type { Constructor, Unpack } from "../common/utils.js";
import type { SingletonAction } from "./singleton-action.js";

/**
 * Definition used to define an action.
 */
type ActionDefinition = Pick<Unpack<Manifest["Actions"]>, "UUID">;

/**
 * Defines a Stream Deck action associated with the plugin.
 * @param definition The definition of the action, e.g. it's identifier, name, etc.
 * @returns The definition decorator.
 */
export function action(definition: ActionDefinition) {
	const manifestId = definition.UUID;

	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unused-vars
	return function <T extends Constructor<SingletonAction>>(target: T, context: ClassDecoratorContext) {
		return class extends target {
			/**
			 * The universally-unique value that identifies the action within the manifest.
			 */
			public readonly manifestId: string | undefined = manifestId;
		};
	};
}



================================================
FILE: src/plugin/actions/dial.ts
================================================
import type { JsonObject } from "@elgato/utils";

import type { Coordinates, FeedbackPayload, SetTriggerDescription, WillAppear } from "../../api/index.js";
import { connection } from "../connection.js";
import { Action } from "./action.js";

/**
 * Provides a contextualized instance of a dial action.
 * @template T The type of settings associated with the action.
 */
export class DialAction<T extends JsonObject = JsonObject> extends Action<T> {
	/**
	 * Private backing field for {@link DialAction.coordinates}.
	 */
	readonly #coordinates: Readonly<Coordinates>;

	/**
	 * Initializes a new instance of the {@see DialAction} class.
	 * @param source Source of the action.
	 */
	constructor(source: WillAppear<JsonObject>) {
		super(source);

		if (source.payload.controller !== "Encoder") {
			throw new Error("Unable to create DialAction; source event is not a Encoder");
		}

		this.#coordinates = Object.freeze(source.payload.coordinates);
	}

	/**
	 * Coordinates of the dial.
	 * @returns The coordinates.
	 */
	public get coordinates(): Readonly<Coordinates> {
		return this.#coordinates;
	}

	/**
	 * Sets the feedback for the current layout associated with this action instance, allowing for the visual items to be updated. Layouts are a powerful way to provide dynamic information
	 * to users, and can be assigned in the manifest, or dynamically via {@link Action.setFeedbackLayout}.
	 *
	 * The {@link feedback} payload defines which items within the layout will be updated, and are identified by their property name (defined as the `key` in the layout's definition).
	 * The values can either by a complete new definition, a `string` for layout item types of `text` and `pixmap`, or a `number` for layout item types of `bar` and `gbar`.
	 * @param feedback Object containing information about the layout items to be updated.
	 * @returns `Promise` resolved when the request to set the {@link feedback} has been sent to Stream Deck.
	 */
	public setFeedback(feedback: FeedbackPayload): Promise<void> {
		return connection.send({
			event: "setFeedback",
			context: this.id,
			payload: feedback,
		});
	}

	/**
	 * Sets the layout associated with this action instance. The layout must be either a built-in layout identifier, or path to a local layout JSON file within the plugin's folder.
	 * Use in conjunction with {@link Action.setFeedback} to update the layout's current items' settings.
	 * @param layout Name of a pre-defined layout, or relative path to a custom one.
	 * @returns `Promise` resolved when the new layout has been sent to Stream Deck.
	 */
	public setFeedbackLayout(layout: string): Promise<void> {
		return connection.send({
			event: "setFeedbackLayout",
			context: this.id,
			payload: {
				layout,
			},
		});
	}

	/**
	 * Sets the {@link image} to be display for this action instance within Stream Deck app.
	 *
	 * NB: The image can only be set by the plugin when the the user has not specified a custom image.
	 * @param image Image to display; this can be either a path to a local file within the plugin's folder, a base64 encoded `string` with the mime type declared (e.g. PNG, JPEG, etc.),
	 * or an SVG `string`. When `undefined`, the image from the manifest will be used.
	 * @returns `Promise` resolved when the request to set the {@link image} has been sent to Stream Deck.
	 */
	public setImage(image?: string): Promise<void> {
		return connection.send({
			event: "setImage",
			context: this.id,
			payload: {
				image,
			},
		});
	}

	/**
	 * Sets the {@link title} displayed for this action instance.
	 *
	 * NB: The title can only be set by the plugin when the the user has not specified a custom title.
	 * @param title Title to display.
	 * @returns `Promise` resolved when the request to set the {@link title} has been sent to Stream Deck.
	 */
	public setTitle(title: string): Promise<void> {
		return this.setFeedback({ title });
	}

	/**
	 * Sets the trigger (interaction) {@link descriptions} associated with this action instance. Descriptions are shown within the Stream Deck application, and informs the user what
	 * will happen when they interact with the action, e.g. rotate, touch, etc. When {@link descriptions} is `undefined`, the descriptions will be reset to the values provided as part
	 * of the manifest.
	 *
	 * NB: Applies to encoders (dials / touchscreens) found on Stream Deck + devices.
	 * @param descriptions Descriptions that detail the action's interaction.
	 * @returns `Promise` resolved when the request to set the {@link descriptions} has been sent to Stream Deck.
	 */
	public setTriggerDescription(descriptions?: TriggerDescriptionOptions): Promise<void> {
		return connection.send({
			event: "setTriggerDescription",
			context: this.id,
			payload: descriptions || {},
		});
	}

	/**
	 * @inheritdoc
	 */
	public override toJSON(): object {
		return {
			...super.toJSON(),
			coordinates: this.coordinates,
		};
	}
}

/**
 * Options that define the trigger descriptions associated with an action.
 */
export type TriggerDescriptionOptions = SetTriggerDescription["payload"];



================================================
FILE: src/plugin/actions/index.ts
================================================
export type { Action } from "./action.js";
export type { ActionContext } from "./context.js";
export { action } from "./decorators.js";
export type { DialAction, TriggerDescriptionOptions } from "./dial.js";
export type { ImageOptions, KeyAction, TitleOptions } from "./key.js";
export type { ActionService } from "./service.js";
export { SingletonAction } from "./singleton-action.js";



================================================
FILE: src/plugin/actions/key.ts
================================================
import type { JsonObject } from "@elgato/utils";

import type { Coordinates, SetImage, SetTitle, State, WillAppear } from "../../api/index.js";
import { connection } from "../connection.js";
import { Action } from "./action.js";

/**
 * Provides a contextualized instance of a key action.
 * @template T The type of settings associated with the action.
 */
export class KeyAction<T extends JsonObject = JsonObject> extends Action<T> {
	/**
	 * Private backing field for {@link KeyAction.coordinates}.
	 */
	readonly #coordinates: Readonly<Coordinates> | undefined;

	/**
	 * Source of the action.
	 */
	readonly #source: WillAppear<JsonObject>;

	/**
	 * Initializes a new instance of the {@see KeyAction} class.
	 * @param source Source of the action.
	 */
	constructor(source: WillAppear<JsonObject>) {
		super(source);

		if (source.payload.controller !== "Keypad") {
			throw new Error("Unable to create KeyAction; source event is not a Keypad");
		}

		this.#coordinates = !source.payload.isInMultiAction ? Object.freeze(source.payload.coordinates) : undefined;
		this.#source = source;
	}

	/**
	 * Coordinates of the key; otherwise `undefined` when the action is part of a multi-action.
	 * @returns The coordinates.
	 */
	public get coordinates(): Coordinates | undefined {
		return this.#coordinates;
	}

	/**
	 * Determines whether the key is part of a multi-action.
	 * @returns `true` when in a multi-action; otherwise `false`.
	 */
	public isInMultiAction(): boolean {
		return this.#source.payload.isInMultiAction;
	}

	/**
	 * Sets the {@link image} to be display for this action instance.
	 *
	 * NB: The image can only be set by the plugin when the the user has not specified a custom image.
	 * @param image Image to display; this can be either a path to a local file within the plugin's folder, a base64 encoded `string` with the mime type declared (e.g. PNG, JPEG, etc.),
	 * or an SVG `string`. When `undefined`, the image from the manifest will be used.
	 * @param options Additional options that define where and how the image should be rendered.
	 * @returns `Promise` resolved when the request to set the {@link image} has been sent to Stream Deck.
	 */
	public setImage(image?: string, options?: ImageOptions): Promise<void> {
		return connection.send({
			event: "setImage",
			context: this.id,
			payload: {
				image,
				...options,
			},
		});
	}

	/**
	 * Sets the current {@link state} of this action instance; only applies to actions that have multiple states defined within the manifest.
	 * @param state State to set; this be either 0, or 1.
	 * @returns `Promise` resolved when the request to set the state of an action instance has been sent to Stream Deck.
	 */
	public setState(state: State): Promise<void> {
		return connection.send({
			event: "setState",
			context: this.id,
			payload: {
				state,
			},
		});
	}

	/**
	 * Sets the {@link title} displayed for this action instance.
	 *
	 * NB: The title can only be set by the plugin when the the user has not specified a custom title.
	 * @param title Title to display; when `undefined` the title within the manifest will be used.
	 * @param options Additional options that define where and how the title should be rendered.
	 * @returns `Promise` resolved when the request to set the {@link title} has been sent to Stream Deck.
	 */
	public setTitle(title?: string, options?: TitleOptions): Promise<void> {
		return connection.send({
			event: "setTitle",
			context: this.id,
			payload: {
				title,
				...options,
			},
		});
	}

	/**
	 * Temporarily shows an "OK" (i.e. success), in the form of a check-mark in a green circle, on this action instance. Used to provide visual feedback when an action successfully
	 * executed.
	 * @returns `Promise` resolved when the request to show an "OK" has been sent to Stream Deck.
	 */
	public showOk(): Promise<void> {
		return connection.send({
			event: "showOk",
			context: this.id,
		});
	}

	/**
	 * @inheritdoc
	 */
	public override toJSON(): object {
		return {
			...super.toJSON(),
			coordinates: this.coordinates,
			isInMultiAction: this.isInMultiAction(),
		};
	}
}

/**
 * Options that define how to render an image associated with an action.
 */
export type ImageOptions = Omit<SetImage["payload"], "image">;

/**
 * Options that define how to render a title associated with an action.
 */
export type TitleOptions = Omit<SetTitle["payload"], "title">;



================================================
FILE: src/plugin/actions/service.ts
================================================
import { type IDisposable, type JsonObject, Lazy } from "@elgato/utils";

import type {
	DialDown,
	DialRotate,
	DialUp,
	DidReceiveResources,
	KeyDown,
	KeyUp,
	Manifest,
	TitleParametersDidChange,
	TouchTap,
	WillAppear,
	WillDisappear,
} from "../../api/index.js";
import { connection } from "../connection.js";
import { ActionEvent } from "../events/action-event.js";
import type {
	DialDownEvent,
	DialRotateEvent,
	DialUpEvent,
	DidReceiveResourcesEvent,
	KeyDownEvent,
	KeyUpEvent,
	TitleParametersDidChangeEvent,
	TouchTapEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from "../events/index.js";
import { getManifest } from "../manifest.js";
import { settings } from "../settings.js";
import { ui } from "../ui.js";
import { Action } from "./action.js";
import { ActionContext } from "./context.js";
import { DialAction } from "./dial.js";
import { KeyAction } from "./key.js";
import type { SingletonAction } from "./singleton-action.js";
import { actionStore, ReadOnlyActionStore } from "./store.js";

const manifest = new Lazy<Manifest | null>(() => getManifest());

/**
 * Provides functions, and information, for interacting with Stream Deck actions.
 */
class ActionService extends ReadOnlyActionStore {
	/**
	 * Initializes a new instance of the {@link ActionService} class.
	 */
	constructor() {
		super();

		// Adds the action to the store.
		connection.prependListener("willAppear", (ev) => {
			const action = ev.payload.controller === "Encoder" ? new DialAction(ev) : new KeyAction(ev);
			actionStore.set(action);
		});

		// Remove the action from the store.
		connection.prependListener("willDisappear", (ev) => actionStore.delete(ev.context));
	}

	/**
	 * Occurs when the user presses a dial (Stream Deck +).
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onDialDown<T extends JsonObject = JsonObject>(listener: (ev: DialDownEvent<T>) => void): IDisposable {
		return connection.disposableOn("dialDown", (ev: DialDown<T>) => {
			const action = actionStore.getActionById(ev.context);
			if (action?.isDial()) {
				listener(new ActionEvent(action, ev));
			}
		});
	}

	/**
	 * Occurs when the user rotates a dial (Stream Deck +).
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onDialRotate<T extends JsonObject = JsonObject>(listener: (ev: DialRotateEvent<T>) => void): IDisposable {
		return connection.disposableOn("dialRotate", (ev: DialRotate<T>) => {
			const action = actionStore.getActionById(ev.context);
			if (action?.isDial()) {
				listener(new ActionEvent(action, ev));
			}
		});
	}

	/**
	 * Occurs when the user releases a pressed dial (Stream Deck +).
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onDialUp<T extends JsonObject = JsonObject>(listener: (ev: DialUpEvent<T>) => void): IDisposable {
		return connection.disposableOn("dialUp", (ev: DialUp<T>) => {
			const action = actionStore.getActionById(ev.context);
			if (action?.isDial()) {
				listener(new ActionEvent(action, ev));
			}
		});
	}

	/**
	 * Occurs when the resources were updated within the property inspector.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onDidReceiveResources<T extends JsonObject = JsonObject>(
		listener: (ev: DidReceiveResourcesEvent<T>) => void,
	): IDisposable {
		return connection.disposableOn("didReceiveResources", (ev: DidReceiveResources<T>) => {
			// When the id is defined, the resources were requested, so we don't propagate the event.
			if (ev.id !== undefined) {
				return;
			}

			const action = actionStore.getActionById(ev.context);
			if (action) {
				listener(new ActionEvent(action, ev));
			}
		});
	}

	/**
	 * Occurs when the user presses a action down.
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onKeyDown<T extends JsonObject = JsonObject>(listener: (ev: KeyDownEvent<T>) => void): IDisposable {
		return connection.disposableOn("keyDown", (ev: KeyDown<T>) => {
			const action = actionStore.getActionById(ev.context);
			if (action?.isKey()) {
				listener(new ActionEvent(action, ev));
			}
		});
	}

	/**
	 * Occurs when the user releases a pressed action.
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onKeyUp<T extends JsonObject = JsonObject>(listener: (ev: KeyUpEvent<T>) => void): IDisposable {
		return connection.disposableOn("keyUp", (ev: KeyUp<T>) => {
			const action = actionStore.getActionById(ev.context);
			if (action?.isKey()) {
				listener(new ActionEvent(action, ev));
			}
		});
	}

	/**
	 * Occurs when the user updates an action's title settings in the Stream Deck application. See also {@link Action.setTitle}.
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onTitleParametersDidChange<T extends JsonObject = JsonObject>(
		listener: (ev: TitleParametersDidChangeEvent<T>) => void,
	): IDisposable {
		return connection.disposableOn("titleParametersDidChange", (ev: TitleParametersDidChange<T>) => {
			const action = actionStore.getActionById(ev.context);
			if (action) {
				listener(new ActionEvent(action, ev));
			}
		});
	}

	/**
	 * Occurs when the user taps the touchscreen (Stream Deck +).
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onTouchTap<T extends JsonObject = JsonObject>(listener: (ev: TouchTapEvent<T>) => void): IDisposable {
		return connection.disposableOn("touchTap", (ev: TouchTap<T>) => {
			const action = actionStore.getActionById(ev.context);
			if (action?.isDial()) {
				listener(new ActionEvent(action, ev));
			}
		});
	}

	/**
	 * Occurs when an action appears on the Stream Deck due to the user navigating to another page, profile, folder, etc. This also occurs during startup if the action is on the "front
	 * page". An action refers to _all_ types of actions, e.g. keys, dials,
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onWillAppear<T extends JsonObject = JsonObject>(listener: (ev: WillAppearEvent<T>) => void): IDisposable {
		return connection.disposableOn("willAppear", (ev: WillAppear<T>) => {
			const action = actionStore.getActionById(ev.context);
			if (action) {
				listener(new ActionEvent(action, ev));
			}
		});
	}

	/**
	 * Occurs when an action disappears from the Stream Deck due to the user navigating to another page, profile, folder, etc. An action refers to _all_ types of actions, e.g. keys,
	 * dials, touchscreens, pedals, etc.
	 * @template T The type of settings associated with the action.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onWillDisappear<T extends JsonObject = JsonObject>(
		listener: (ev: WillDisappearEvent<T>) => void,
	): IDisposable {
		return connection.disposableOn("willDisappear", (ev: WillDisappear<T>) =>
			listener(new ActionEvent(new ActionContext(ev), ev)),
		);
	}

	/**
	 * Registers the action with the Stream Deck, routing all events associated with the {@link SingletonAction.manifestId} to the specified {@link action}.
	 * @param action The action to register.
	 * @example
	 * ＠action({ UUID: "com.elgato.test.action" })
	 * class MyCustomAction extends SingletonAction {
	 *     export function onKeyDown(ev: KeyDownEvent) {
	 *         // Do some awesome thing.
	 *     }
	 * }
	 *
	 * streamDeck.actions.registerAction(new MyCustomAction());
	 */
	public registerAction<TAction extends SingletonAction<TSettings>, TSettings extends JsonObject = JsonObject>(
		action: TAction,
	): void {
		if (action.manifestId === undefined) {
			throw new Error("The action's manifestId cannot be undefined.");
		}

		if (manifest.value !== null && !manifest.value.Actions.some((a) => a.UUID === action.manifestId)) {
			throw new Error(`The action's manifestId was not found within the manifest: ${action.manifestId}`);
		}

		// Routes an event to the action, when the applicable listener is defined on the action.
		const { manifestId } = action;
		const route = <TEventArgs extends RoutingEvent<TSettings>>(
			fn: (listener: (ev: TEventArgs) => void) => IDisposable,
			listener: ((ev: TEventArgs) => Promise<void> | void) | undefined,
		): void => {
			const boundedListener = listener?.bind(action);
			if (boundedListener === undefined) {
				return;
			}

			fn.bind(action)(async (ev) => {
				if (ev.action.manifestId == manifestId) {
					await boundedListener(ev);
				}
			});
		};

		// Route each of the action events.
		route(this.onDialDown, action.onDialDown);
		route(this.onDialUp, action.onDialUp);
		route(this.onDialRotate, action.onDialRotate);
		route(ui.onSendToPlugin, action.onSendToPlugin);
		route(this.onDidReceiveResources, action.onDidReceiveResources);
		route(settings.onDidReceiveSettings, action.onDidReceiveSettings);
		route(this.onKeyDown, action.onKeyDown);
		route(this.onKeyUp, action.onKeyUp);
		route(ui.onDidAppear, action.onPropertyInspectorDidAppear);
		route(ui.onDidDisappear, action.onPropertyInspectorDidDisappear);
		route(this.onTitleParametersDidChange, action.onTitleParametersDidChange);
		route(this.onTouchTap, action.onTouchTap);
		route(this.onWillAppear, action.onWillAppear);
		route(this.onWillDisappear, action.onWillDisappear);
	}
}

/**
 * Service for interacting with Stream Deck actions.
 */
export const actionService = new ActionService();

export { type ActionService };

/**
 * Event associated with an {@link Action}.
 */
type RoutingEvent<T extends JsonObject> = {
	/**
	 * The {@link Action} the event is associated with.
	 */
	action: Action<T> | ActionContext;
};



================================================
FILE: src/plugin/actions/singleton-action.ts
================================================
import type { Enumerable, JsonObject, JsonValue } from "@elgato/utils";

import type { DialAction } from "../actions/dial.js";
import type { KeyAction } from "../actions/key.js";
import type {
	DialDownEvent,
	DialRotateEvent,
	DialUpEvent,
	DidReceiveResourcesEvent,
	DidReceiveSettingsEvent,
	KeyDownEvent,
	KeyUpEvent,
	PropertyInspectorDidAppearEvent,
	PropertyInspectorDidDisappearEvent,
	SendToPluginEvent,
	TitleParametersDidChangeEvent,
	TouchTapEvent,
	WillAppearEvent,
	WillDisappearEvent,
} from "../events/index.js";
import type streamDeck from "../index.js";
import type { Action } from "./action.js";
import { actionStore } from "./store.js";

/**
 * Provides the main bridge between the plugin and the Stream Deck allowing the plugin to send requests and receive events, e.g. when the user presses an action.
 * @template T The type of settings associated with the action.
 */
export class SingletonAction<T extends JsonObject = JsonObject> {
	/**
	 * The universally-unique value that identifies the action within the manifest.
	 */
	public readonly manifestId: string | undefined;

	/**
	 * Gets the visible actions with the `manifestId` that match this instance's.
	 * @returns The visible actions.
	 */
	public get actions(): Enumerable<DialAction<T> | KeyAction<T>> {
		return actionStore.filter((a) => a.manifestId === this.manifestId);
	}

	/**
	 * Occurs when the user presses a dial (Stream Deck +). See also {@link SingletonAction.onDialUp}.
	 *
	 * NB: For other action types see {@link SingletonAction.onKeyDown}.
	 * @param ev Information about the event, including the source action and contextual payload information.
	 */
	public onDialDown?(ev: DialDownEvent<T>): Promise<void> | void;

	/**
	 * Occurs when the user rotates a dial (Stream Deck +).
	 * @param ev Information about the event, including the source action and contextual payload information.
	 */
	public onDialRotate?(ev: DialRotateEvent<T>): Promise<void> | void;

	/**
	 * Occurs when the user releases a pressed dial (Stream Deck +). See also {@link SingletonAction.onDialDown}.
	 *
	 * NB: For other action types see {@link SingletonAction.onKeyUp}.
	 * @param ev Information about the event, including the source action and contextual payload information.
	 */
	public onDialUp?(ev: DialUpEvent<T>): Promise<void> | void;

	/**
	 * Occurs when the resources were updated within the property inspector.
	 * @param listener Function to be invoked when the event occurs.
	 */
	public onDidReceiveResources?(ev: DidReceiveResourcesEvent<T>): Promise<void> | void;

	/**
	 * Occurs when the settings associated with an action instance are requested using {@link Action.getSettings}, or when the the settings were updated by the property inspector.
	 * @param ev Information about the event, including the source action and contextual payload information.
	 */
	public onDidReceiveSettings?(ev: DidReceiveSettingsEvent<T>): Promise<void> | void;

	/**
	 * Occurs when the user presses a action down. See also {@link SingletonAction.onKeyUp}.
	 *
	 * NB: For dials / touchscreens see {@link SingletonAction.onDialDown}.
	 * @param ev Information about the event, including the source action and contextual payload information.
	 */
	public onKeyDown?(ev: KeyDownEvent<T>): Promise<void> | void;

	/**
	 * Occurs when the user releases a pressed action. See also {@link SingletonAction.onKeyDown}.
	 *
	 * NB: For dials / touchscreens see {@link SingletonAction.onDialUp}.
	 * @param ev Information about the event, including the source action and contextual payload information.
	 */
	public onKeyUp?(ev: KeyUpEvent<T>): Promise<void> | void;

	/**
	 * Occurs when the property inspector associated with the action becomes visible, i.e. the user selected an action in the Stream Deck application. See also {@link streamDeck.ui.onDidAppear}.
	 * @param ev Information about the event, including the source action.
	 */
	public onPropertyInspectorDidAppear?(ev: PropertyInspectorDidAppearEvent<T>): Promise<void> | void;

	/**
	 * Occurs when the property inspector associated with the action becomes invisible, i.e. the user unselected the action in the Stream Deck application. See also {@link streamDeck.ui.onDidDisappear}.
	 * @param ev Information about the event, including the source action.
	 */
	public onPropertyInspectorDidDisappear?(ev: PropertyInspectorDidDisappearEvent<T>): Promise<void> | void;

	/**
	 * Occurs when a message was sent to the plugin _from_ the property inspector. The plugin can also send messages _to_ the property inspector using {@link Action.sendToPropertyInspector}.
	 * @param ev Information about the event, including the source action and contextual payload information.
	 */
	public onSendToPlugin?(ev: SendToPluginEvent<JsonValue, T>): Promise<void> | void;

	/**
	 * Occurs when the user updates an action's title settings in the Stream Deck application. See also {@link Action.setTitle}.
	 * @param ev Information about the event, including the source action and contextual payload information.
	 */
	public onTitleParametersDidChange?(ev: TitleParametersDidChangeEvent<T>): Promise<void> | void;

	/**
	 * Occurs when the user taps the touchscreen (Stream Deck +).
	 * @param ev Information about the event, including the source action and contextual payload information.
	 */
	public onTouchTap?(ev: TouchTapEvent<T>): Promise<void> | void;

	/**
	 * Occurs when an action appears on the Stream Deck due to the user navigating to another page, profile, folder, etc. This also occurs during startup if the action is on the "front
	 * page". An action refers to _all_ types of actions, e.g. keys, dials,
	 * @param ev Information about the event, including the source action and contextual payload information.
	 */
	public onWillAppear?(ev: WillAppearEvent<T>): Promise<void> | void;

	/**
	 * Occurs when an action disappears from the Stream Deck due to the user navigating to another page, profile, folder, etc. An action refers to _all_ types of actions, e.g. keys,
	 * dials, touchscreens, pedals, etc.
	 * @param ev Information about the event, including the source action and contextual payload information.
	 */
	public onWillDisappear?(ev: WillDisappearEvent<T>): Promise<void> | void;
}



================================================
FILE: src/plugin/actions/store.ts
================================================
import { Enumerable } from "@elgato/utils";

import type { DialAction } from "./dial.js";
import type { KeyAction } from "./key.js";

const __items = new Map<string, DialAction | KeyAction>();

/**
 * Provides a read-only store of Stream Deck devices.
 */
export class ReadOnlyActionStore extends Enumerable<DialAction | KeyAction> {
	/**
	 * Initializes a new instance of the {@link ReadOnlyActionStore}.
	 */
	constructor() {
		super(__items);
	}

	/**
	 * Gets the action with the specified identifier.
	 * @param id Identifier of action to search for.
	 * @returns The action, when present; otherwise `undefined`.
	 */
	public getActionById(id: string): DialAction | KeyAction | undefined {
		return __items.get(id);
	}
}

/**
 * Provides a store of Stream Deck actions.
 */
class ActionStore extends ReadOnlyActionStore {
	/**
	 * Deletes the action from the store.
	 * @param id The action's identifier.
	 */
	public delete(id: string): void {
		__items.delete(id);
	}

	/**
	 * Adds the action to the store.
	 * @param action The action.
	 */
	public set(action: DialAction | KeyAction): void {
		__items.set(action.id, action);
	}
}

/**
 * Singleton instance of the action store.
 */
export const actionStore = new ActionStore();



================================================
FILE: src/plugin/actions/__mocks__/store.ts
================================================
import { vi } from "vitest";

const { ReadOnlyActionStore } = await vi.importActual<typeof import("../store.js")>("../store");
const { KeyAction } = await vi.importActual<typeof import("../key.js")>("../key");
const { DialAction } = await vi.importActual<typeof import("../dial.js")>("../dial");

export const actionStore = {
	set: vi.fn(),
	delete: vi.fn(),
	getActionById: vi.fn().mockImplementation((id: string) => {
		if (id === "dial123") {
			return new DialAction({
				action: "com.elgato.test.dial",
				context: id,
				device: "device123",
				event: "willAppear",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 1,
						row: 2,
					},
					isInMultiAction: false,
					resources: {},
					settings: {},
				},
			});
		}

		return new KeyAction({
			action: "com.elgato.test.key",
			context: id,
			device: "device123",
			event: "willAppear",
			payload: {
				controller: "Keypad",
				coordinates: {
					column: 1,
					row: 2,
				},
				isInMultiAction: false,
				resources: {},
				settings: {},
			},
		});
	}),
};

export { ReadOnlyActionStore };



================================================
FILE: src/plugin/actions/__tests__/action.test.ts
================================================
import { beforeAll, describe, expect, it, test, vi } from "vitest";

import type { Settings } from "../../../api/__mocks__/events.js";
import { DeviceType, type GetSettings, type SetSettings, type ShowAlert, type WillAppear } from "../../../api/index.js";
import type { JsonObject } from "../../../common/json.js";
import { connection } from "../../connection.js";
import { Device } from "../../devices/device.js";
import { deviceStore } from "../../devices/store.js";
import { Action } from "../action.js";
import { DialAction } from "../dial.js";

vi.mock("../../devices/store.js");
vi.mock("../../logging/index.js");
vi.mock("../../manifest.js");
vi.mock("../../connection.js");

describe("Action", () => {
	// Mock source.
	const source: WillAppear<JsonObject> = {
		action: "com.test.action.one",
		context: "action123",
		device: "device123",
		event: "willAppear",
		payload: {
			controller: "Keypad",
			coordinates: {
				column: 1,
				row: 2,
			},
			isInMultiAction: false,
			resources: {},
			settings: {},
		},
	};

	// Mock device.
	const device = new Device(
		"device123",
		{
			name: "Device 1",
			size: {
				columns: 5,
				rows: 3,
			},
			type: DeviceType.StreamDeck,
		},
		true,
	);

	beforeAll(() => vi.spyOn(deviceStore, "getDeviceById").mockReturnValue(device));

	/**
	 * Asserts the constructor of {@link Action} sets the properties from the source.
	 */
	it("constructor sets properties from source", () => {
		// Arrange, act.
		const action = new Action(source);

		// Assert.
		expect(action).toBeInstanceOf(Action);
		expect(action.controllerType).toBe("Keypad");
		expect(action.device).toBe(device);
		expect(action.id).toBe(source.context);
		expect(action.manifestId).toBe(source.action);
		expect(deviceStore.getDeviceById).toHaveBeenCalledTimes(1);
		expect(deviceStore.getDeviceById).toHaveBeenLastCalledWith(source.device);
	});

	/**
	 * Asserts {@link Action.getSettings} requests the settings from the connection.
	 */
	it("getSettings", async () => {
		// Arrange.
		const action = new Action(source);

		// Array, act (Command).
		const settings = action.getSettings();

		// Assert (Command).
		expect(connection.send).toHaveBeenCalledTimes(1);
		expect(connection.send).toHaveBeenLastCalledWith<[GetSettings]>({
			event: "getSettings",
			context: action.id,
			id: expect.any(String),
		});

		await expect(Promise.race([settings, false])).resolves.toBe(false);

		// Act (Event).
		connection.emit("didReceiveSettings", {
			action: "com.other.test.one",
			context: "__other__", // Other action.
			event: "didReceiveSettings",
			device: "device123",
			payload: {
				controller: "Keypad",
				coordinates: {
					column: 0,
					row: 0,
				},
				isInMultiAction: false,
				resources: {},
				settings: {
					name: "Other",
				},
			},
		});

		connection.emit("didReceiveSettings", {
			action: action.manifestId,
			context: action.id, // Correct action.
			event: "didReceiveSettings",
			device: "device123",
			payload: {
				controller: "Keypad",
				coordinates: {
					column: 1,
					row: 3,
				},
				isInMultiAction: false,
				resources: {},
				settings: {
					name: "Elgato",
				},
			},
		});

		await settings;

		// Assert (Event).
		await expect(await settings).toEqual<Settings>({
			name: "Elgato",
		});
	});

	/**
	 * Asserts type-checking when the controller is "Keypad".
	 */
	test("keypad type assertion", () => {
		const action = new Action({
			...source,
			payload: {
				...source.payload,
				controller: "Keypad",
			},
		});

		expect(action.isKey()).toBe(true);
		expect(action.isDial()).toBe(false);
	});

	/**
	 * Asserts type-checking when the controller is "Encoder".
	 */
	test("encoder type assertion", () => {
		const action = new DialAction({
			...source,
			payload: {
				...source.payload,
				controller: "Encoder",
			},
		} as WillAppear<JsonObject>);

		expect(action.isDial()).toBe(true);
		expect(action.isKey()).toBe(false);
	});

	describe("sending", () => {
		let action!: Action;
		beforeAll(() => (action = new Action(source)));

		/**
		 * Asserts {@link Action.setSettings} forwards the command to the {@link connection}.
		 */
		it("setSettings", async () => {
			// Arrange, act.
			await action.setSettings({
				name: "Elgato",
			});

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(1);
			expect(connection.send).toHaveBeenCalledWith<[SetSettings]>({
				context: action.id,
				event: "setSettings",
				payload: {
					name: "Elgato",
				},
			});
		});

		/**
		 * Asserts {@link Action.showAlert} forwards the command to the {@link connection}.
		 */
		it("showAlert", async () => {
			// Arrange, act.
			await action.showAlert();

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(1);
			expect(connection.send).toHaveBeenCalledWith<[ShowAlert]>({
				context: action.id,
				event: "showAlert",
			});
		});
	});
});



================================================
FILE: src/plugin/actions/__tests__/decorators.test.ts
================================================
import { describe, expect, it } from "vitest";

import { action } from "../decorators.js";
import { SingletonAction } from "../singleton-action.js";

describe("action decorator", () => {
	it("sets the manifestId on untyped action", () => {
		// Arrange.
		@action({ UUID: "com.elgato.test.sample" })
		class SampleAction extends SingletonAction {
			/** @inheritdoc */
			public onWillAppear(): void {
				/* do something cool */
			}
		}

		// Act.
		const sample = new SampleAction();

		// Assert.
		expect(sample.manifestId).toBe("com.elgato.test.sample");
	});

	it("sets the manifestId on typed action", () => {
		// Arrange.
		@action({ UUID: "com.elgato.test.sample" })
		class SampleAction extends SingletonAction<Settings> {
			/** @inheritdoc */
			public onWillAppear(): void {
				/* do something cool */
			}
		}

		// Act.
		const sample = new SampleAction();

		// Assert.
		expect(sample.manifestId).toBe("com.elgato.test.sample");
	});
});

/**
 * Mock settings.
 */
type Settings = {
	name: string;
};



================================================
FILE: src/plugin/actions/__tests__/dial.test.ts
================================================
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
	DeviceType,
	type SetFeedback,
	type SetFeedbackLayout,
	type SetImage,
	type SetTriggerDescription,
	type WillAppear,
} from "../../../api/index.js";
import type { JsonObject } from "../../../common/json.js";
import { connection } from "../../connection.js";
import { Device } from "../../devices/device.js";
import { deviceStore } from "../../devices/store.js";
import { Action } from "../action.js";
import { DialAction } from "../dial.js";

vi.mock("../../devices/store.js");
vi.mock("../../logging/index.js");
vi.mock("../../manifest.js");
vi.mock("../../connection.js");

describe("DialAction", () => {
	// Mock source.
	const source: WillAppear<JsonObject> = {
		action: "com.test.action.one",
		context: "action123",
		device: "device123",
		event: "willAppear",
		payload: {
			controller: "Encoder",
			coordinates: {
				column: 1,
				row: 2,
			},
			isInMultiAction: false,
			resources: {},
			settings: {},
		},
	};

	// Mock device.
	const device = new Device(
		"device123",
		{
			name: "Device 1",
			size: {
				columns: 5,
				rows: 3,
			},
			type: DeviceType.StreamDeck,
		},
		true,
	);

	beforeAll(() => vi.spyOn(deviceStore, "getDeviceById").mockReturnValue(device));

	/**
	 * Asserts the constructor of {@link DialAction} sets the properties from the source.
	 */
	it("constructor sets properties from source", () => {
		// Arrange, act.
		const action = new DialAction(source);

		// Assert.
		expect(action).toBeInstanceOf(Action);
		expect(action.coordinates).not.toBeUndefined();
		expect(action.coordinates?.column).toBe(1);
		expect(action.coordinates?.row).toBe(2);
		expect(action.device).toBe(device);
		expect(action.id).toBe(source.context);
		expect(action.manifestId).toBe(source.action);
		expect(deviceStore.getDeviceById).toHaveBeenCalledTimes(1);
		expect(deviceStore.getDeviceById).toHaveBeenLastCalledWith(source.device);
	});

	/**
	 * Asserts the constructor of {@link DialAction} throws when the event is for a keypad.
	 */
	it("throws for non encoder", () => {
		// Arrange.
		const keypadSource: WillAppear<JsonObject> = {
			...source,
			payload: {
				...source.payload,
				controller: "Keypad",
			},
		};

		// Act, assert.
		expect(() => new DialAction(keypadSource)).toThrow();
	});

	/**
	 * Asserts {@link DialAction.toJSON} includes properties.
	 */
	it("JSON has properties", () => {
		// Array.
		const action = new DialAction({
			action: "action1",
			context: "com.test.action.one",
			device: "dev1",
			event: "willAppear",
			payload: {
				controller: "Encoder",
				resources: {},
				settings: {},
				isInMultiAction: false,
				coordinates: {
					column: 1,
					row: 2,
				},
			},
		});

		// Act.
		const jsonStr = JSON.stringify(action);
		const jsonObj: DialAction = JSON.parse(jsonStr);

		// Assert.
		expect(jsonObj.controllerType).toBe(action.controllerType);
		expect(jsonObj.coordinates).toStrictEqual(action.coordinates);
		expect(jsonObj.device).toStrictEqual({ id: action.device.id });
		expect(jsonObj.id).toBe(action.id);
		expect(jsonObj.manifestId).toBe(action.manifestId);
	});

	describe("sending", () => {
		let action!: DialAction;
		beforeAll(() => (action = new DialAction(source)));

		/**
		 * Asserts {@link DialAction.setFeedback} forwards the command to the {@link connection}.
		 */
		it("setFeedback", async () => {
			// Arrange, act.
			await action.setFeedback({
				bar: 50,
				title: "Hello world",
			});

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(1);
			expect(connection.send).toHaveBeenCalledWith<[SetFeedback]>({
				context: action.id,
				event: "setFeedback",
				payload: {
					bar: 50,
					title: "Hello world",
				},
			});
		});

		/**
		 * Asserts {@link DialAction.setFeedbackLayout} forwards the command to the {@link connection}.
		 */
		it("Sends setFeedbackLayout", async () => {
			// Arrange, act.
			await action.setFeedbackLayout("CustomLayout.json");

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(1);
			expect(connection.send).toHaveBeenCalledWith<[SetFeedbackLayout]>({
				context: action.id,
				event: "setFeedbackLayout",
				payload: {
					layout: "CustomLayout.json",
				},
			});
		});

		/**
		 * Asserts {@link DialAction.setImage} forwards the command to the {@link connection}.
		 */
		it("setImage", async () => {
			// Arrange, act
			await action.setImage();
			await action.setImage("./imgs/test.png");

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(2);
			expect(connection.send).toHaveBeenNthCalledWith<[SetImage]>(1, {
				context: action.id,
				event: "setImage",
				payload: {
					image: undefined,
					state: undefined,
					target: undefined,
				},
			});

			expect(connection.send).toHaveBeenNthCalledWith<[SetImage]>(2, {
				context: action.id,
				event: "setImage",
				payload: {
					image: "./imgs/test.png",
				},
			});
		});

		/**
		 * Asserts {@link DialAction.setTitle} forwards the command to the {@link connection}.
		 */
		it("setTitle", async () => {
			// Arrange, act.
			await action.setTitle("Hello world");

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(1);
			expect(connection.send).toHaveBeenCalledWith<[SetFeedback]>({
				context: action.id,
				event: "setFeedback",
				payload: {
					title: "Hello world",
				},
			});
		});

		/**
		 * Asserts {@link DialAction.setTriggerDescription} forwards the command to the {@link connection}.
		 */
		it("setTriggerDescription", async () => {
			// Arrange, act.
			await action.setTriggerDescription();
			await action.setTriggerDescription({
				longTouch: "Long-touch",
				push: "Push",
				rotate: "Rotate",
				touch: "Touch",
			});

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(2);
			expect(connection.send).toHaveBeenNthCalledWith<[SetTriggerDescription]>(1, {
				event: "setTriggerDescription",
				context: action.id,
				payload: {},
			});

			expect(connection.send).toHaveBeenNthCalledWith<[SetTriggerDescription]>(2, {
				event: "setTriggerDescription",
				context: action.id,
				payload: {
					longTouch: "Long-touch",
					push: "Push",
					rotate: "Rotate",
					touch: "Touch",
				},
			});
		});
	});
});



================================================
FILE: src/plugin/actions/__tests__/key.test.ts
================================================
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
	DeviceType,
	type SetImage,
	type SetState,
	type SetTitle,
	type ShowOk,
	Target,
	type WillAppear,
} from "../../../api/index.js";
import type { JsonObject } from "../../../common/json.js";
import { connection } from "../../connection.js";
import { Device } from "../../devices/device.js";
import { deviceStore } from "../../devices/store.js";
import { Action } from "../action.js";
import { KeyAction } from "../key.js";

vi.mock("../../devices/store.js");
vi.mock("../../logging/index.js");
vi.mock("../../manifest.js");
vi.mock("../../connection.js");

describe("KeyAction", () => {
	// Mock source.
	const source: WillAppear<JsonObject> = {
		action: "com.test.action.one",
		context: "action123",
		device: "device123",
		event: "willAppear",
		payload: {
			controller: "Keypad",
			coordinates: {
				column: 1,
				row: 2,
			},
			isInMultiAction: false,
			resources: {},
			settings: {},
		},
	};

	// Mock device.
	const device = new Device(
		"dev1",
		{
			name: "Device 1",
			size: {
				columns: 5,
				rows: 3,
			},
			type: DeviceType.StreamDeck,
		},
		true,
	);

	beforeAll(() => vi.spyOn(deviceStore, "getDeviceById").mockReturnValue(device));

	/**
	 * Asserts the constructor of {@link KeyAction} sets the context.
	 */
	it("constructor sets context", () => {
		// Arrange, act.
		const action = new KeyAction(source);

		// Assert.
		expect(action).toBeInstanceOf(Action);
		expect(action.coordinates).not.toBeUndefined();
		expect(action.coordinates?.column).toBe(1);
		expect(action.coordinates?.row).toBe(2);
		expect(action.device).toBe(device);
		expect(action.id).toBe(source.context);
		expect(action.manifestId).toBe(source.action);
		expect(deviceStore.getDeviceById).toHaveBeenCalledTimes(1);
		expect(deviceStore.getDeviceById).toHaveBeenLastCalledWith(source.device);
	});

	/**
	 * Asserts the constructor of {@link KeyAction} throws when the event is for a keypad.
	 */
	it("throws for non keypad", () => {
		// Arrange.
		const encoderSource: WillAppear<JsonObject> = {
			action: "com.test.action.one",
			context: "action1",
			device: "dev1",
			event: "willAppear",
			payload: {
				controller: "Encoder",
				coordinates: {
					column: 1,
					row: 2,
				},
				isInMultiAction: false,
				resources: {},
				settings: {},
			},
		};

		// Act, assert.
		expect(() => new KeyAction(encoderSource)).toThrow();
	});

	/**
	 * Asserts the coordinates are undefined when the {@link KeyAction} is in a multi-action.
	 */
	it("does not have coordinates when multi-action", () => {
		// Arrange, act.
		const action = new KeyAction({
			action: "action1",
			context: "com.test.action.one",
			device: "dev1",
			event: "willAppear",
			payload: {
				controller: "Keypad",
				isInMultiAction: true,
				resources: {},
				settings: {},
			},
		});

		// Assert.
		expect(action.coordinates).toBeUndefined();
	});

	/**
	 * Asserts {@link KeyAction.toJSON} includes properties.
	 */
	it("JSON has properties", () => {
		// Array.
		const action = new KeyAction({
			action: "action1",
			context: "com.test.action.one",
			device: "dev1",
			event: "willAppear",
			payload: {
				controller: "Keypad",
				coordinates: {
					column: 1,
					row: 2,
				},
				isInMultiAction: false,
				resources: {},
				settings: {},
			},
		});

		// Act.
		const jsonStr = JSON.stringify(action);
		const jsonObj: KeyAction = JSON.parse(jsonStr);

		// Assert.
		expect(jsonObj.controllerType).toBe(action.controllerType);
		expect(jsonObj.coordinates).toStrictEqual(action.coordinates);
		expect(jsonObj.device).toStrictEqual({ id: action.device.id });
		expect(jsonObj.id).toBe(action.id);
		expect(jsonObj.isInMultiAction).toBe(action.isInMultiAction());
		expect(jsonObj.manifestId).toBe(action.manifestId);
	});

	describe("sending", () => {
		let action!: KeyAction;
		beforeAll(() => (action = new KeyAction(source)));

		/**
		 * Asserts {@link KeyAction.setImage} forwards the command to the {@link connection}.
		 */
		it("setImage", async () => {
			// Arrange, act
			await action.setImage();
			await action.setImage("./imgs/test.png", {
				state: 1,
				target: Target.Hardware,
			});

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(2);
			expect(connection.send).toHaveBeenNthCalledWith<[SetImage]>(1, {
				context: action.id,
				event: "setImage",
				payload: {
					image: undefined,
					state: undefined,
					target: undefined,
				},
			});

			expect(connection.send).toHaveBeenNthCalledWith<[SetImage]>(2, {
				context: action.id,
				event: "setImage",
				payload: {
					image: "./imgs/test.png",
					state: 1,
					target: Target.Hardware,
				},
			});
		});

		/**
		 * Asserts {@link KeyAction.setState} forwards the command to the {@link connection}.
		 */
		it("setState", async () => {
			// Arrange, act.
			await action.setState(1);

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(1);
			expect(connection.send).toHaveBeenCalledWith<[SetState]>({
				context: action.id,
				event: "setState",
				payload: {
					state: 1,
				},
			});
		});

		/**
		 * Asserts {@link KeyAction.setTitle} forwards the command to the {@link connection}.
		 */
		it("setTitle", async () => {
			// Arrange, act.
			await action.setTitle("Hello world");
			await action.setTitle("This is a test", { state: 1, target: Target.Software });

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(2);
			expect(connection.send).toHaveBeenNthCalledWith<[SetTitle]>(1, {
				event: "setTitle",
				context: action.id,
				payload: {
					title: "Hello world",
				},
			});

			expect(connection.send).toHaveBeenNthCalledWith<[SetTitle]>(2, {
				event: "setTitle",
				context: action.id,
				payload: {
					state: 1,
					target: Target.Software,
					title: "This is a test",
				},
			});
		});

		/**
		 * Asserts {@link KeyAction.showOk} forwards the command to the {@link connection}.
		 */
		it("showOk", async () => {
			// Arrange, act
			await action.showOk();

			// Assert.
			expect(connection.send).toHaveBeenCalledTimes(1);
			expect(connection.send).toHaveBeenCalledWith<[ShowOk]>({
				context: action.id,
				event: "showOk",
			});
		});
	});
});



================================================
FILE: src/plugin/actions/__tests__/service.test.ts
================================================
import { beforeAll, describe, expect, it, vi } from "vitest";

import type { Settings } from "../../../api/__mocks__/events.js";
import {
	DeviceType,
	type DialDown,
	type DialRotate,
	type DialUp,
	type DidReceivePropertyInspectorMessage,
	type DidReceiveSettings,
	type KeyDown,
	type KeyUp,
	type PropertyInspectorDidAppear,
	type PropertyInspectorDidDisappear,
	type TitleParametersDidChange,
	type TouchTap,
	type WillAppear,
	type WillDisappear,
} from "../../../api/index.js";
import type { Enumerable } from "../../../common/enumerable.js";
import type { JsonObject } from "../../../common/json.js";
import { connection } from "../../connection.js";
import { Device } from "../../devices/device.js";
import { deviceStore } from "../../devices/store.js";
import {
	type DialDownEvent,
	type DialRotateEvent,
	type DialUpEvent,
	type DidReceiveSettingsEvent,
	type KeyDownEvent,
	type KeyUpEvent,
	type PropertyInspectorDidAppearEvent,
	type PropertyInspectorDidDisappearEvent,
	type SendToPluginEvent,
	type TitleParametersDidChangeEvent,
	type TouchTapEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "../../events/index.js";
import type { UIController } from "../../ui.js";
import { ActionContext } from "../context.js";
import { DialAction } from "../dial.js";
import { KeyAction } from "../key.js";
import { actionService, type ActionService } from "../service.js";
import { SingletonAction } from "../singleton-action.js";
import { actionStore } from "../store.js";

vi.mock("../connection.js");
vi.mock("../store.js");
vi.mock("../../logging/index.js");
vi.mock("../../manifest.js");

describe("actions", () => {
	// Add a mock device.
	beforeAll(() => {
		deviceStore.set(
			new Device(
				"device123",
				{
					name: "Device One",
					size: {
						columns: 5,
						rows: 3,
					},
					type: DeviceType.StreamDeckXL,
				},
				true,
			),
		);
	});

	describe("event emitters", () => {
		/**
		 * Asserts {@link ActionService.onDialDown} is invoked when `dialDown` is emitted.
		 */
		it("receives onDialDown", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: "com.elgato.test.dial",
				context: "dial123",
				device: "device123",
				event: "dialDown",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies DialDown<Settings>;

			// Act (emit).
			const disposable = actionService.onDialDown(listener);
			connection.emit("dialDown", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[DialDownEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as DialAction,
				payload: ev.payload,
				type: "dialDown",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});

		/**
		 * Asserts {@link ActionService.onDialRotate} is invoked when `dialRotate` is emitted.
		 */
		it("receives onDialRotate", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: "com.elgato.test.dial",
				context: "dial123",
				device: "device123",
				event: "dialRotate",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					pressed: false,
					resources: {},
					settings: {
						name: "Hello world",
					},
					ticks: 1,
				},
			} satisfies DialRotate<Settings>;

			// Act (emit).
			const disposable = actionService.onDialRotate(listener);
			connection.emit("dialRotate", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[DialRotateEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as DialAction,
				payload: ev.payload,
				type: "dialRotate",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});

		/**
		 * Asserts {@link ActionService.onDialUp} is invoked when `dialUp` is emitted.
		 */
		it("receives onDialUp", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: "com.elgato.test.dial",
				context: "dial123",
				device: "device123",
				event: "dialUp",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies DialUp<Settings>;

			// Act (emit).
			const disposable = actionService.onDialUp(listener);
			connection.emit("dialUp", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[DialUpEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as DialAction,
				payload: ev.payload,
				type: "dialUp",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});

		/**
		 * Asserts {@link ActionService.onKeyDown} is invoked when `keyDown` is emitted.
		 */
		it("receives onKeyDown", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: "com.elgato.test.key",
				context: "key123",
				device: "device123",
				event: "keyDown",
				payload: {
					controller: "Keypad",
					coordinates: {
						column: 2,
						row: 0,
					},
					isInMultiAction: false,
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies KeyDown<Settings>;

			// Act (emit).
			const disposable = actionService.onKeyDown(listener);
			connection.emit("keyDown", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[KeyDownEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				payload: ev.payload,
				type: "keyDown",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});

		/**
		 * Asserts {@link ActionService.onKeyUp} is invoked when `keyUp` is emitted.
		 */
		it("receives onKeyUp", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: "com.elgato.test.key",
				context: "key123",
				device: "device123",
				event: "keyUp",
				payload: {
					controller: "Keypad",
					coordinates: {
						column: 2,
						row: 0,
					},
					isInMultiAction: false,
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies KeyUp<Settings>;

			// Act (emit).
			const disposable = actionService.onKeyUp(listener);
			connection.emit("keyUp", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[KeyUpEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				payload: ev.payload,
				type: "keyUp",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});

		/**
		 * Asserts {@link ActionService.onTitleParametersDidChange} is invoked when `titleParametersDidChange` is emitted.
		 */
		it("receives onTitleParametersDidChange", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: "com.elgato.test.key",
				context: "key123",
				device: "device123",
				event: "titleParametersDidChange",
				payload: {
					controller: "Keypad",
					coordinates: {
						column: 2,
						row: 0,
					},
					resources: {},
					settings: {
						name: "Hello world",
					},
					title: "Title goes here...",
					titleParameters: {
						fontFamily: "Arial",
						fontSize: 13,
						fontStyle: "Bold",
						fontUnderline: false,
						showTitle: true,
						titleAlignment: "bottom",
						titleColor: "white",
					},
				},
			} satisfies TitleParametersDidChange<Settings>;

			// Act (emit).
			const disposable = actionService.onTitleParametersDidChange(listener);
			connection.emit("titleParametersDidChange", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[TitleParametersDidChangeEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				payload: ev.payload,
				type: "titleParametersDidChange",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});

		/**
		 * Asserts {@link ActionService.onTouchTap} is invoked when `touchTap` is emitted.
		 */
		it("receives onTouchTap", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: "com.elgato.test.dial",
				context: "dial123",
				device: "device123",
				event: "touchTap",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					resources: {},
					settings: {
						name: "Hello world",
					},
					hold: false,
					tapPos: [13, 13],
				},
			} satisfies TouchTap<Settings>;

			// Act (emit).
			const disposable = actionService.onTouchTap(listener);
			connection.emit("touchTap", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[TouchTapEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as DialAction,
				payload: ev.payload,
				type: "touchTap",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});

		/**
		 * Asserts {@link ActionService.onWillAppear} is invoked when `willAppear` is emitted.
		 */
		it("receives onWillAppear", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: "com.elgato.test.key",
				context: "key123",
				device: "device123",
				event: "willAppear",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					isInMultiAction: false,
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies WillAppear<Settings>;

			// Act (emit).
			const disposable = actionService.onWillAppear(listener);
			connection.emit("willAppear", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[WillAppearEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				payload: ev.payload,
				type: "willAppear",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});

		/**
		 * Asserts {@link ActionService.onWillDisappear} is invoked when `willDisappear` is emitted.
		 */
		it("receives onWillDisappear", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: "com.elgato.test.key",
				context: "context123",
				device: "device123",
				event: "willDisappear",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					isInMultiAction: false,
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies WillDisappear<Settings>;

			// Act (emit).
			const disposable = actionService.onWillDisappear(listener);
			connection.emit("willDisappear", ev);

			// Assert (emit).
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[WillDisappearEvent<Settings>]>({
				action: new ActionContext(ev),
				payload: ev.payload,
				type: "willDisappear",
			});

			// Act (dispose).
			disposable.dispose();
			connection.emit(ev.event, ev as any);

			// Assert(dispose).
			expect(listener).toHaveBeenCalledTimes(1);
		});
	});

	describe("registering an action", () => {
		const keyManifestId = "com.elgato.test.key";
		const dialManifestId = "com.elgato.test.dial";
		const actions = vi.fn() as unknown as Enumerable<DialAction<JsonObject> | KeyAction<JsonObject>>;

		/**
		 * Asserts {@link ActionService.registerAction} validates the manifest identifier is not undefined.
		 */
		it("validates the manifestId is not undefined", () => {
			// Arrange.
			const action: SingletonAction = {
				manifestId: undefined,
				actions,
			};

			// Act, assert.
			expect(() => actionService.registerAction(action)).toThrow("The action's manifestId cannot be undefined.");
		});

		/**
		 * Asserts {@link ActionService.registerAction} validates the manifest identifier exists within the manifest.
		 */
		it("validates when action does not exist in manifest", () => {
			// Arrange.
			const action: SingletonAction = {
				actions,
				manifestId: "com.elgato.action-service.__one",
			};

			// Act, assert.
			expect(() => actionService.registerAction(action)).toThrow("com.elgato.action-service.__one");
		});

		/**
		 * Asserts {@link ActionService.registerAction} ignores undefined handlers.
		 */
		it("ignore undefined handlers", () => {
			// Arrange.
			const spyOnAddListener = vi.spyOn(connection, "addListener");
			const spyOnDisposableOn = vi.spyOn(connection, "disposableOn");
			const spyOnOn = vi.spyOn(connection, "on");
			const spyOnOnce = vi.spyOn(connection, "once");
			const spyOnPrependListener = vi.spyOn(connection, "prependListener");
			const spyOnPrependOnceListener = vi.spyOn(connection, "prependOnceListener");

			// Act.
			actionService.registerAction({
				actions,
				manifestId: keyManifestId,
			});

			// Assert.
			expect(spyOnAddListener).not.toHaveBeenCalled();
			expect(spyOnDisposableOn).not.toHaveBeenCalled();
			expect(spyOnOn).not.toHaveBeenCalled();
			expect(spyOnOnce).not.toHaveBeenCalled();
			expect(spyOnPrependListener).not.toHaveBeenCalled();
			expect(spyOnPrependOnceListener).not.toHaveBeenCalled();
		});

		/**
		 * Asserts {@link ActionService.onDialDown} is routed to the action when `dialDown` is emitted.
		 */
		it("routes onDialDown", () => {
			// Arrange.
			const listener = vi.fn();

			const ev = {
				action: dialManifestId,
				context: "dial123",
				device: "device123",
				event: "dialDown",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies DialDown<Settings>;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onDialDown: listener,
			});

			connection.emit("dialDown", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[DialDownEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as DialAction,
				payload: ev.payload,
				type: "dialDown",
			});
		});

		/**
		 * Asserts {@link ActionService.onDialRotate} is routed to the action when `dialRotate` is emitted.
		 */
		it("routes onDialRotate", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: dialManifestId,
				context: "dial123",
				device: "device123",
				event: "dialRotate",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					pressed: false,
					resources: {},
					settings: {
						name: "Hello world",
					},
					ticks: 1,
				},
			} satisfies DialRotate<Settings>;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onDialRotate: listener,
			});

			connection.emit("dialRotate", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[DialRotateEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as DialAction,
				payload: ev.payload,
				type: "dialRotate",
			});
		});

		/**
		 * Asserts {@link ActionService.onDialUp} is routed to the action when `dialUp` is emitted.
		 */
		it("routes onDialUp", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: dialManifestId,
				context: "dial123",
				device: "device123",
				event: "dialUp",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies DialUp<Settings>;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onDialUp: listener,
			});

			connection.emit("dialUp", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[DialUpEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as DialAction,
				payload: ev.payload,
				type: "dialUp",
			});
		});

		/**
		 * Asserts {@link UIController.sendToPlugin} is routed to the action when `sendToPlugin` is emitted.
		 */
		it("routes sendToPlugin", () => {
			// Arrange
			const listener = vi.fn();
			const ev = {
				action: keyManifestId,
				context: "key123",
				event: "sendToPlugin",
				payload: {
					name: "Hello world",
				},
			} satisfies DidReceivePropertyInspectorMessage<Settings>;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onSendToPlugin: listener,
			});

			connection.emit("sendToPlugin", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[SendToPluginEvent<Settings, Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				payload: {
					name: "Hello world",
				},
				type: "sendToPlugin",
			});
		});

		/**
		 * Asserts {@link ActionService.onDidReceiveSettings} is routed to the action when `didReceiveGlobalSettings` is emitted.
		 */
		it("routes onDidReceiveGlobalSettings", () => {
			// Arrange
			const listener = vi.fn();
			const ev = {
				action: keyManifestId,
				context: "key123",
				device: "device123",
				event: "didReceiveSettings",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					isInMultiAction: false,
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies DidReceiveSettings<Settings>;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onDidReceiveSettings: listener,
			});

			connection.emit("didReceiveSettings", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[DidReceiveSettingsEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				payload: ev.payload,
				type: "didReceiveSettings",
			});
		});

		/**
		 * Asserts {@link ActionService.onKeyDown} is routed to the action when `keyDown` is emitted.
		 */
		it("routes onKeyDown", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: keyManifestId,
				context: "key123",
				device: "device123",
				event: "keyDown",
				payload: {
					controller: "Keypad",
					coordinates: {
						column: 2,
						row: 0,
					},
					isInMultiAction: false,
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies KeyDown<Settings>;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onKeyDown: listener,
			});

			connection.emit("keyDown", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[KeyDownEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				payload: ev.payload,
				type: "keyDown",
			});
		});

		/**
		 * Asserts {@link ActionService.onKeyUp} is routed to the action when `keyUp` is emitted.
		 */
		it("routes onKeyUp", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: keyManifestId,
				context: "key123",
				device: "device123",
				event: "keyUp",
				payload: {
					controller: "Keypad",
					coordinates: {
						column: 2,
						row: 0,
					},
					isInMultiAction: false,
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies KeyUp<Settings>;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onKeyUp: listener,
			});

			connection.emit("keyUp", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[KeyUpEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				payload: ev.payload,
				type: "keyUp",
			});
		});

		/**
		 * Asserts {@link UIController.onPropertyInspectorDidAppear} is routed to the action when `propertyInspectorDidAppear` is emitted.
		 */
		it("routes onPropertyInspectorDidAppear", () => {
			// Arrange
			const listener = vi.fn();
			const ev = {
				action: keyManifestId,
				context: "key123",
				device: "device123",
				event: "propertyInspectorDidAppear",
			} satisfies PropertyInspectorDidAppear;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onPropertyInspectorDidAppear: listener,
			});

			connection.emit("propertyInspectorDidAppear", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[PropertyInspectorDidAppearEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				type: "propertyInspectorDidAppear",
			});
		});

		/**
		 * Asserts {@link UIController.onPropertyInspectorDidDisappear} is routed to the action when `propertyInspectorDidDisappear` is emitted.
		 */
		it("routes onPropertyInspectorDidDisappear", () => {
			// Arrange
			const listener = vi.fn();
			const ev = {
				action: keyManifestId,
				context: "key123",
				device: "device123",
				event: "propertyInspectorDidDisappear",
			} satisfies PropertyInspectorDidDisappear;

			// Act (emit).
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onPropertyInspectorDidDisappear: listener,
			});

			connection.emit("propertyInspectorDidDisappear", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[PropertyInspectorDidDisappearEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				type: "propertyInspectorDidDisappear",
			});
		});

		/**
		 * Asserts {@link ActionService.onTitleParametersDidChange} is routed to the action when `titleParametersDidChange` is emitted.
		 */
		it("routes onTitleParametersDidChange", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: keyManifestId,
				context: "key123",
				device: "device123",
				event: "titleParametersDidChange",
				payload: {
					controller: "Keypad",
					coordinates: {
						column: 2,
						row: 0,
					},
					resources: {},
					settings: {
						name: "Hello world",
					},
					title: "Title goes here...",
					titleParameters: {
						fontFamily: "Arial",
						fontSize: 13,
						fontStyle: "Bold",
						fontUnderline: false,
						showTitle: true,
						titleAlignment: "bottom",
						titleColor: "white",
					},
				},
			} satisfies TitleParametersDidChange<Settings>;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onTitleParametersDidChange: listener,
			});

			connection.emit("titleParametersDidChange", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[TitleParametersDidChangeEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				payload: ev.payload,
				type: "titleParametersDidChange",
			});
		});

		/**
		 * Asserts {@link ActionService.onTouchTap} is routed to the action when `touchTap` is emitted.
		 */
		it("routes onTouchTap", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: dialManifestId,
				context: "dial123",
				device: "device123",
				event: "touchTap",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					resources: {},
					settings: {
						name: "Hello world",
					},
					hold: false,
					tapPos: [13, 13],
				},
			} satisfies TouchTap<Settings>;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onTouchTap: listener,
			});

			connection.emit("touchTap", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[TouchTapEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as DialAction,
				payload: ev.payload,
				type: "touchTap",
			});
		});

		/**
		 * Asserts {@link ActionService.onWillAppear} is routed to the action when `willAppear` is emitted.
		 */
		it("routes onWillAppear", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: keyManifestId,
				context: "key123",
				device: "device123",
				event: "willAppear",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					isInMultiAction: false,
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies WillAppear<Settings>;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onWillAppear: listener,
			});

			connection.emit("willAppear", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[WillAppearEvent<Settings>]>({
				action: actionStore.getActionById(ev.context) as KeyAction,
				payload: ev.payload,
				type: "willAppear",
			});
		});

		/**
		 * Asserts {@link ActionService.onWillDisappear} is routed to the action when `willDisappear` is emitted.
		 */
		it("routes onWillDisappear", () => {
			// Arrange.
			const listener = vi.fn();
			const ev = {
				action: keyManifestId,
				context: "key123",
				device: "device123",
				event: "willDisappear",
				payload: {
					controller: "Encoder",
					coordinates: {
						column: 2,
						row: 0,
					},
					isInMultiAction: false,
					resources: {},
					settings: {
						name: "Hello world",
					},
				},
			} satisfies WillDisappear<Settings>;

			// Act.
			actionService.registerAction({
				actions,
				manifestId: ev.action,
				onWillDisappear: listener,
			});

			connection.emit("willDisappear", ev);

			// Assert.
			expect(listener).toHaveBeenCalledTimes(1);
			expect(listener).toHaveBeenCalledWith<[WillDisappearEvent<Settings>]>({
				action: new ActionContext(ev),
				payload: ev.payload,
				type: "willDisappear",
			});
		});
	});
});



================================================
FILE: src/plugin/common/utils.ts
================================================
import path from "node:path";

let __isDebugMode: boolean | undefined = undefined;

/**
 * Determines whether the current plugin is running in a debug environment; this is determined by the command-line arguments supplied to the plugin by Stream. Specifically, the result
 * is `true` when  either `--inspect`, `--inspect-brk` or `--inspect-port` are present as part of the processes' arguments.
 * @returns `true` when the plugin is running in debug mode; otherwise `false`.
 */
export function isDebugMode(): boolean {
	if (__isDebugMode === undefined) {
		__isDebugMode = process.execArgv.some((arg) => {
			const name = arg.split("=")[0];
			return name === "--inspect" || name === "--inspect-brk" || name === "--inspect-port";
		});
	}

	return __isDebugMode;
}

/**
 * Gets the plugin's unique-identifier from the current working directory.
 * @returns The plugin's unique-identifier.
 */
export function getPluginUUID(): string {
	const name = path.basename(process.cwd());
	const suffixIndex = name.lastIndexOf(".sdPlugin");

	return suffixIndex < 0 ? name : name.substring(0, suffixIndex);
}

/**
 * Helper type used by `StrictUnion` to extract keys of type `T`. Credit {@link https://stackoverflow.com/a/65805753/259656}.
 * @template T Type whose keys are being extracted.
 */
type UnionKeys<T> = T extends T ? keyof T : never;

/**
 * Defines a type that implements a constructor that accepts an array of `any` parameters; utilized for mixins.
 */
export type Constructor<T> = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	new (...args: any[]): T;
};

/**
 * Constructs a union type of `number` for the given `TLength`. The union type is indexed from zero. Credit {@link https://stackoverflow.com/a/39495173}
 * @template TLength Length of the union.
 * @template TAcc Accumulated types.
 */
export type Enumerate<TLength extends number, TAcc extends number[] = []> = TAcc["length"] extends TLength
	? TAcc[number]
	: Enumerate<TLength, [...TAcc, TAcc["length"]]>;

/**
 * Unpacks the type; when the type is an array, the underlying the type is inferred.
 */
export type Unpack<T> = T extends (infer U)[] ? U : T;

/**
 * Reduces excess properties amongst the union type `TUnion`. Credit {@link https://stackoverflow.com/a/65805753/259656}.
 * @template TUnion Union type being converted to a strict type.
 * @template TStrict Reference type used to remove excess properties from the inferred type.
 */
export type StrictUnion<TUnion, TStrict = TUnion> = TStrict extends unknown
	? Partial<Record<Exclude<UnionKeys<TUnion>, keyof TStrict>, never>> & TStrict
	: never;



================================================
FILE: src/plugin/common/version.ts
================================================
/**
 * Provides information for a version, as parsed from a string denoted as a collection of numbers separated by a period, for example `1.45.2`, `4.0.2.13098`. Parsing is opinionated
 * and strings should strictly conform to the format `{major}[.{minor}[.{patch}[.{build}]]]`; version numbers that form the version are optional, and when `undefined` will default to
 * 0, for example the `minor`, `patch`, or `build` number may be omitted.
 *
 * NB: This implementation should be considered fit-for-purpose, and should be used sparing.
 */
export class Version {
	/**
	 * Build version number.
	 */
	public readonly build: number;

	/**
	 * Major version number.
	 */
	public readonly major: number;

	/**
	 * Minor version number.
	 */
	public readonly minor: number;

	/**
	 * Patch version number.
	 */
	public readonly patch: number;

	/**
	 * Initializes a new instance of the {@link Version} class.
	 * @param value Value to parse the version from.
	 */
	constructor(value: string) {
		const result = value.match(/^(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?(?:\.(0|[1-9]\d*))?(?:\.(0|[1-9]\d*))?$/);
		if (result === null) {
			throw new Error(`Invalid format; expected "{major}[.{minor}[.{patch}[.{build}]]]" but was "${value}"`);
		}

		[, this.major, this.minor, this.patch, this.build] = [...result.map<number>((value) => parseInt(value) || 0)];
	}

	/**
	 * Compares this instance to the {@link other} {@link Version}.
	 * @param other The {@link Version} to compare to.
	 * @returns `-1` when this instance is less than the {@link other}, `1` when this instance is greater than {@link other}, otherwise `0`.
	 */
	public compareTo(other: VersionInfo): number {
		const segments = ({ major, minor, build, patch }: VersionInfo): number[] => [major, minor, build, patch];

		const thisSegments = segments(this);
		const otherSegments = segments(other);

		for (let i = 0; i < 4; i++) {
			if (thisSegments[i] < otherSegments[i]) {
				return -1;
			} else if (thisSegments[i] > otherSegments[i]) {
				return 1;
			}
		}

		return 0;
	}

	/** @inheritdoc */
	public toString(): string {
		return `${this.major}.${this.minor}`;
	}
}

/**
 * Numerical version values associated with a {@link Version}.
 */
type VersionInfo = Pick<Version, "build" | "major" | "minor" | "patch">;



================================================
FILE: src/plugin/common/__tests__/utils.test.ts
================================================
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { isDebugMode } from "../utils.js";
import { getPluginUUID } from "../utils.js";

/**
 * Asserts {@link getPluginUUID} is correctly parsed from the current working directory.
 */
describe("getPluginUUID", () => {
	const cases = [
		{
			name: "Parses with .sdPlugin suffix",
			cwd: path.join("tests", "com.elgato.test.sdPlugin"),
			expected: "com.elgato.test",
		},
		{
			name: "Parses without .sdPlugin suffix",
			cwd: path.join("tests", "com.elgato.test"),
			expected: "com.elgato.test",
		},
	];

	it.each(cases)("$name", async ({ cwd, expected }) => {
		// Arrange, act.
		vi.spyOn(process, "cwd").mockReturnValue(cwd);
		const pluginUUID = getPluginUUID();

		// Assert.
		expect(pluginUUID).toBe(expected);
	});
});

/**
 * Asserts {@link isDebugMode} is correctly determined by the process arguments.
 */
describe("isDebugMode", () => {
	let origArgs: string[] = [];
	beforeEach(() => (origArgs = process.execArgv));
	afterEach(() => {
		process.execArgv = origArgs;
		vi.resetModules();
	});

	const cases = [
		{
			args: [],
			expected: false,
		},
		{
			args: ["--no-addons", "--enable-source-maps"],
			expected: false,
		},
		{
			args: ["--inspect=127.0.0.1:1234", "--no-addons", "--enable-source-maps"],
			expected: true,
		},
		{
			args: ["--no-addons", "--enable-source-maps", "--inspect=127.0.0.1:1234"],
			expected: true,
		},
		{
			args: ["--no-addons", "--inspect=127.0.0.1:1234", "--enable-source-maps"],
			expected: true,
		},
		{
			args: ["--inspect"],
			expected: true,
		},
		{
			args: ["--inspect=12345"],
			expected: true,
		},
		{
			args: ["--inspect=127.0.0.1:1234"],
			expected: true,
		},
		{
			args: ["--inspect-brk"],
			expected: true,
		},
		{
			args: ["--inspect-brk=127.0.0.1:1234"],
			expected: true,
		},
		{
			args: ["--inspect-port=1234"],
			expected: true,
		},
		{
			args: ["--inspect-port=127.0.0.1:1234"],
			expected: true,
		},
	];

	it.each(cases)("$args returns $expected", async ({ args, expected }) => {
		// Arrange.
		const { isDebugMode } = await import("../utils.js");
		process.execArgv = args;

		// Act, assert.
		expect(isDebugMode()).toBe(expected);
	});

	it("Caches result", async () => {
		// Arrange.
		const { isDebugMode } = await import("../utils.js");
		process.execArgv = ["--inspect", "127.0.0.1"];

		// Act, assert.
		expect(isDebugMode()).toBe(true);

		// Re-arrange, act, assert.
		process.execArgv = [];
		expect(isDebugMode()).toBe(true);
	});
});



================================================
FILE: src/plugin/common/__tests__/version.test.ts
================================================
import { describe, expect, it } from "vitest";

import { Version } from "../version.js";

/**
 * Asserts string values are correctly parsed to {@link Version}.
 */
describe("serialization", () => {
	/**
	 * Asserts valid version strings.
	 */
	describe("valid", () => {
		const cases = [
			{
				name: "major",
				value: "1",
				expected: [1, 0, 0, 0],
			},
			{
				name: "minor",
				value: "0.2",
				expected: [0, 2, 0, 0],
			},
			{
				name: "patch",
				value: "0.0.3",
				expected: [0, 0, 3, 0],
			},
			{
				name: "build",
				value: "0.0.0.789",
				expected: [0, 0, 0, 789],
			},
			{
				name: "major, minor",
				value: "1.2",
				expected: [1, 2, 0, 0],
			},
			{
				name: "major, patch",
				value: "1.0.13",
				expected: [1, 0, 13, 0],
			},
			{
				name: "major, build",
				value: "1.0.0.99",
				expected: [1, 0, 0, 99],
			},
			{
				name: "major, minor, patch",
				value: "1.2.3",
				expected: [1, 2, 3, 0],
			},
			{
				name: "major, minor, build",
				value: "1.2.0.4",
				expected: [1, 2, 0, 4],
			},
			{
				name: "major, patch, build",
				value: "1.0.3.4",
				expected: [1, 0, 3, 4],
			},
			{
				name: "major, minor, patch, build",
				value: "1.2.3.456",
				expected: [1, 2, 3, 456],
			},
		];

		it.each(cases)("parses $name", ({ value, expected }) => {
			// Arrange, act.
			const version = new Version(value);

			// Assert.
			expect(version.major).toBe(expected[0]);
			expect(version.minor).toBe(expected[1]);
			expect(version.patch).toBe(expected[2]);
			expect(version.build).toBe(expected[3]);
		});

		it.each(cases)("stringifies $name", ({ value }) => {
			// Arrange, act, assert.
			const version = new Version(value);
			expect(`${version}`).toBe(`${version.major}.${version.minor}`);
		});
	});

	/**
	 * Asserts invalid version strings.
	 */
	describe("invalid", () => {
		const cases = [
			{
				name: "empty",
				value: "",
			},
			{
				name: "double period",
				value: "1..2",
			},
			{
				name: "zero before number",
				value: "1.02",
			},
			{
				name: "alphabetical",
				value: "abc",
			},
			{
				name: "tag name",
				value: "1.2.3-beta.1",
			},
		];

		it.each(cases)("$name", ({ value }) => {
			// Arrange, act, assert.
			expect(() => new Version(value)).toThrow(
				`Invalid format; expected "{major}[.{minor}[.{patch}[.{build}]]]" but was "${value}"`,
			);
		});
	});
});

/**
 * Asserts the comparison of two {@link Version}.
 */
describe("comparison", () => {
	const testCases = [
		{
			name: "same (1)",
			x: "1.1.1.1",
			y: "1.1.1.1",
			expected: 0,
		},
		{
			name: "same (2)",
			x: "1.2.3.4",
			y: "1.2.3.4",
			expected: 0,
		},
		{
			name: "major version (lesser)",
			x: "1.0.0.0",
			y: "2.0.0.0",
			expected: -1,
		},
		{
			name: "major version (greater)",
			x: "2.0.0.0",
			y: "1.0.0.0",
			expected: 1,
		},
		{
			name: "minor version (lesser)",
			x: "0.1.0.0",
			y: "0.2.0.0",
			expected: -1,
		},
		{
			name: "minor version (greater)",
			x: "0.2.0.0",
			y: "0.1.0.0",
			expected: 1,
		},
		{
			name: "patch version (lesser)",
			x: "0.0.1.0",
			y: "0.0.2.0",
			expected: -1,
		},
		{
			name: "patch version (greater)",
			x: "0.0.2.0",
			y: "0.0.1.0",
			expected: 1,
		},
		{
			name: "build version (lesser)",
			x: "0.0.0.1",
			y: "0.0.0.2",
			expected: -1,
		},
		{
			name: "build version (greater)",
			x: "0.0.0.2",
			y: "0.0.0.1",
			expected: 1,
		},
	];

	/**
	 * Asserts {@link Version.compareTo}.
	 */
	it.each(testCases)("$name", ({ x, y, expected }) => {
		// Arrange.
		const versionX = new Version(x);
		const versionY = new Version(y);

		// Act, assert.
		expect(versionX.compareTo(versionY)).toBe(expected);
	});
});



================================================
FILE: src/plugin/devices/device.ts
================================================
import type { DeviceInfo, DeviceType, Size } from "../../api/index.js";
import type { DialAction } from "../actions/dial.js";
import type { KeyAction } from "../actions/key.js";
import { actionStore } from "../actions/store.js";
import { connection } from "../connection.js";

/**
 * Provides information about a device.
 */
export class Device {
	/**
	 * Private backing field for {@link Device.isConnected}.
	 */
	#isConnected: boolean = false;

	/**
	 * Private backing field for the device's information.
	 */
	#info: DeviceInfo;

	/**
	 * Unique identifier of the device.
	 */
	public readonly id: string;

	/**
	 * Initializes a new instance of the {@link Device} class.
	 * @param id Device identifier.
	 * @param info Information about the device.
	 * @param isConnected Determines whether the device is connected.
	 */
	constructor(id: string, info: DeviceInfo, isConnected: boolean) {
		this.id = id;
		this.#info = info;
		this.#isConnected = isConnected;

		// Set connected.
		connection.prependListener("deviceDidConnect", (ev) => {
			if (ev.device === this.id) {
				this.#info = ev.deviceInfo;
				this.#isConnected = true;
			}
		});

		// Track changes.
		connection.prependListener("deviceDidChange", (ev) => {
			if (ev.device === this.id) {
				this.#info = ev.deviceInfo;
			}
		});

		// Set disconnected.
		connection.prependListener("deviceDidDisconnect", (ev) => {
			if (ev.device === this.id) {
				this.#isConnected = false;
			}
		});
	}

	/**
	 * Actions currently visible on the device.
	 * @returns Collection of visible actions.
	 */
	public get actions(): IterableIterator<DialAction | KeyAction> {
		return actionStore.filter((a) => a.device.id === this.id);
	}

	/**
	 * Determines whether the device is currently connected.
	 * @returns `true` when the device is connected; otherwise `false`.
	 */
	public get isConnected(): boolean {
		return this.#isConnected;
	}

	/**
	 * Name of the device, as specified by the user in the Stream Deck application.
	 * @returns Name of the device.
	 */
	public get name(): string {
		return this.#info.name;
	}

	/**
	 * Number of action slots, excluding dials / touchscreens, available to the device.
	 * @returns Size of the device.
	 */
	public get size(): Size {
		return this.#info.size;
	}

	/**
	 * Type of the device that was connected, e.g. Stream Deck +, Stream Deck Pedal, etc. See {@link DeviceType}.
	 * @returns Type of the device.
	 */
	public get type(): DeviceType {
		return this.#info.type;
	}
}



================================================
FILE: src/plugin/devices/index.ts
================================================
export type { Device } from "./device.js";
export type { DeviceService } from "./service.js";



================================================
FILE: src/plugin/devices/service.ts
================================================
import type { IDisposable } from "@elgato/utils";

import { connection } from "../connection.js";
import { DeviceEvent } from "../events/device-event.js";
import type { DeviceDidChangeEvent, DeviceDidConnectEvent, DeviceDidDisconnectEvent } from "../events/index.js";
import { requiresVersion } from "../validation.js";
import { Device } from "./device.js";
import { deviceStore, ReadOnlyDeviceStore } from "./store.js";

/**
 * Provides functions, and information, for interacting with Stream Deck actions.
 */
class DeviceService extends ReadOnlyDeviceStore {
	/**
	 * Initializes a new instance of the {@link DeviceService}.
	 */
	constructor() {
		super();

		// Add the devices from registration parameters.
		connection.once("connected", (info) => {
			info.devices.forEach((dev) => deviceStore.set(new Device(dev.id, dev, false)));
		});

		// Add new devices that were connected.
		connection.on("deviceDidConnect", ({ device: id, deviceInfo }) => {
			if (!deviceStore.getDeviceById(id)) {
				deviceStore.set(new Device(id, deviceInfo, true));
			}
		});

		// Add new devices that were changed (Virtual Stream Deck event race).
		connection.on("deviceDidChange", ({ device: id, deviceInfo }) => {
			if (!deviceStore.getDeviceById(id)) {
				deviceStore.set(new Device(id, deviceInfo, false));
			}
		});
	}

	/**
	 * Occurs when a Stream Deck device changed, for example its name or size.
	 *
	 * Available from Stream Deck 7.0.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onDeviceDidChange(listener: (ev: DeviceDidChangeEvent) => void): IDisposable {
		requiresVersion(7.0, connection.version, "onDeviceDidChange");
		return connection.disposableOn("deviceDidChange", (ev) =>
			listener(new DeviceEvent(ev, this.getDeviceById(ev.device)!)),
		);
	}

	/**
	 * Occurs when a Stream Deck device is connected. See also {@link DeviceService.onDeviceDidConnect}.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onDeviceDidConnect(listener: (ev: DeviceDidConnectEvent) => void): IDisposable {
		return connection.disposableOn("deviceDidConnect", (ev) =>
			listener(new DeviceEvent(ev, this.getDeviceById(ev.device)!)),
		);
	}

	/**
	 * Occurs when a Stream Deck device is disconnected. See also {@link DeviceService.onDeviceDidDisconnect}.
	 * @param listener Function to be invoked when the event occurs.
	 * @returns A disposable that, when disposed, removes the listener.
	 */
	public onDeviceDidDisconnect(listener: (ev: DeviceDidDisconnectEvent) => void): IDisposable {
		return connection.disposableOn("deviceDidDisconnect", (ev) =>
			listener(new DeviceEvent(ev, this.getDeviceById(ev.device)!)),
		);
	}
}

/**
 * Provides functions, and information, for interacting with Stream Deck actions.
 */
export const deviceService = new DeviceService();

export { type DeviceService };



================================================
FILE: src/plugin/devices/store.ts
================================================
import { Enumerable } from "@elgato/utils";

import type { Device } from "./device.js";

const __items = new Map<string, Device>();

/**
 * Provides a read-only store of Stream Deck devices.
 */
export class ReadOnlyDeviceStore extends Enumerable<Device> {
	/**
	 * Initializes a new instance of the {@link ReadOnlyDeviceStore}.
	 */
	constructor() {
		super(__items);
	}

	/**
	 * Gets the Stream Deck {@link Device} associated with the specified {@link deviceId}.
	 * @param deviceId Identifier of the Stream Deck device.
	 * @returns The Stream Deck device information; otherwise `undefined` if a device with the {@link deviceId} does not exist.
	 */
	public getDeviceById(deviceId: string): Device | undefined {
		return __items.get(deviceId);
	}
}

/**
 * Provides a store of Stream Deck devices.
 */
class DeviceStore extends ReadOnlyDeviceStore {
	/**
	 * Adds the device to the store.
	 * @param device The device.
	 */
	public set(device: Device): void {
		__items.set(device.id, device);
	}
}

/**
 * Singleton instance of the device store.
 */
export const deviceStore = new DeviceStore();



================================================
FILE: src/plugin/devices/__tests__/service.test.ts
================================================
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	type DeviceDidChange,
	type DeviceDidConnect,
	type DeviceDidDisconnect,
	DeviceType,
} from "../../../api/index.js";
import { type connection as Connection } from "../../connection.js";
import type { DeviceDidChangeEvent, DeviceDidConnectEvent, DeviceDidDisconnectEvent } from "../../index.js";
import { Device } from "../device.js";
import type { DeviceService } from "../service.js";

vi.mock("../../actions/store.js", () => ({})); // Override default mock.
vi.mock("../../connection.js");
vi.mock("../../logging/index.js");
vi.mock("../../manifest.js");

describe("devices", () => {
	let connection!: typeof Connection;
	let deviceService!: DeviceService;

	beforeEach(async () => {
		vi.resetModules();
		({ connection } = await import("../../connection.js"));
		({ deviceService } = await import("../service.js"));
	});

	/**
	 * Asserts {@link DeviceService} can iterate over each device, and apply the specified callback function using {@link DeviceService.forEach}.
	 */
	it("applies callback with forEach", () => {
		// Arrange.
		const ev = {
			event: "deviceDidConnect",
			device: "devices.test.ts.1",
			deviceInfo: {
				name: "Device 1",
				size: { columns: 8, rows: 4 },
				type: DeviceType.StreamDeckXL,
			},
		} satisfies DeviceDidConnect;

		connection.emit("connected", connection.registrationParameters.info);
		connection.emit("deviceDidConnect", ev);

		const listener = vi.fn();

		// Act.
		deviceService.forEach(listener);

		// Assert.
		expect(listener).toHaveBeenCalledTimes(2);
		expect(listener).toHaveBeenNthCalledWith<[Device]>(
			1,
			new Device(
				connection.registrationParameters.info.devices[0].id,
				connection.registrationParameters.info.devices[0],
				false,
			),
		);
		expect(listener).toHaveBeenNthCalledWith<[Device]>(2, new Device(ev.device, ev.deviceInfo, true));
	});

	/**
	 * Asserts {@link DeviceService.count} returns the count of devices.
	 */
	it("counts devices", () => {
		// Arrange.
		connection.emit("connected", connection.registrationParameters.info);

		// Act, assert: registration parameters are included.
		expect(deviceService.length).toBe(1);

		// Act, assert: count increments with new devices.
		const ev = {
			event: "deviceDidConnect",
			device: "devices.test.ts.1",
			deviceInfo: {
				name: "Device 1",
				size: { columns: 8, rows: 4 },
				type: DeviceType.StreamDeckXL,
			},
		} satisfies DeviceDidConnect;
		connection.emit("deviceDidConnect", ev);

		expect(deviceService.length).toBe(2);

		// Act, assert: count remains 2 when device disconnected
		connection.emit("deviceDidDisconnect", {
			device: ev.device,
			event: "deviceDidDisconnect",
		});

		expect(deviceService.length).toBe(2);
	});

	/**
	 * Asserts {@link DeviceService} tracks devices supplied by Stream Deck as part of the registration parameters.
	 */
	it("adds devices from registration info", () => {
		// Arrange.
		connection.emit("connected", connection.registrationParameters.info);

		// Assert.
		expect(deviceService.length).toBe(1);

		const [device] = deviceService;
		expect(device.id).toBe(connection.registrationParameters.info.devices[0].id);
		expect(device.isConnected).toBeFalsy();
		expect(device.name).toBe(connection.registrationParameters.info.devices[0].name);
		expect(device.size).toEqual(connection.registrationParameters.info.devices[0].size);
		expect(device.type).toBe(connection.registrationParameters.info.devices[0].type);
	});

	/**
	 * Asserts {@link DeviceService} adds devices when they connect.
	 */
	it("adds device on deviceDidConnect", () => {
		// Act.
		connection.emit("deviceDidConnect", {
			event: "deviceDidConnect",
			device: "__NEW_DEV__",
			deviceInfo: {
				name: "New Device",
				size: {
					columns: 8,
					rows: 8,
				},
				type: DeviceType.StreamDeckMobile,
			},
		});

		// Assert.
		expect(deviceService.length).toBe(1);

		const [device] = deviceService;
		expect(device.id).toBe("__NEW_DEV__");
		expect(device.isConnected).toBeTruthy();
		expect(device.name).toBe("New Device");
		expect(device.size?.columns).toBe(8);
		expect(device.size?.rows).toBe(8);
		expect(device.type).toBe(DeviceType.StreamDeckMobile);
	});

	/**
	 * Asserts {@link DeviceService} adds devices when they change (if they are unknown).
	 */
	it("adds device on deviceDidChange if they are unknown", () => {
		// Act.
		connection.emit("deviceDidChange", {
			event: "deviceDidChange",
			device: "vsd",
			deviceInfo: {
				name: "Virtual Stream Deck",
				size: {
					columns: 8,
					rows: 8,
				},
				type: DeviceType.StreamDeckMobile,
			},
		});

		// Assert.
		expect(deviceService.length).toBe(1);

		const [device] = deviceService;
		expect(device.id).toBe("vsd");
		expect(device.isConnected).toBe(false);
		expect(device.name).toBe("Virtual Stream Deck");
		expect(device.size?.columns).toBe(8);
		expect(device.size?.rows).toBe(8);
		expect(device.type).toBe(DeviceType.StreamDeckMobile);
	});

	describe("getDeviceById", () => {
		/**
		 * Asserts selecting a known device using {@link DeviceService.getDeviceById}.
		 */
		it("known identifier", () => {
			// Arrange.
			connection.emit("deviceDidConnect", {
				event: "deviceDidConnect",
				device: "devices.test.ts.1",
				deviceInfo: {
					name: "New Device",
					size: {
						columns: 8,
						rows: 8,
					},
					type: DeviceType.StreamDeckMobile,
				},
			});

			// Act.
			const device = deviceService.getDeviceById("devices.test.ts.1");

			// Assert.
			expect(device).not.toBeUndefined();
			expect(device!.id).toBe("devices.test.ts.1");
			expect(device!.isConnected).toBeTruthy();
			expect(device!.name).toBe("New Device");
			expect(device!.size?.columns).toBe(8);
			expect(device!.size?.rows).toBe(8);
			expect(device!.type).toBe(DeviceType.StreamDeckMobile);
		});

		/**
		 * Asserts selecting an unknown device using {@link DeviceService.getDeviceById}.
		 */
		it("unknown identifier", () => {
			// Arrange, act, assert.
			expect(deviceService.getDeviceById("__unknown")).toBeUndefined();
		});
	});

	/**
	 * Asserts {@link DeviceService} updates devices when they connect.
	 */
	it("updates device on deviceDidConnect", () => {
		// Arrange.
		connection.emit("connected", connection.registrationParameters.info);

		// Act.
		const [device] = deviceService;
		expect(device.isConnected).toBeFalsy();

		connection.emit("deviceDidConnect", {
			event: "deviceDidConnect",
			device: connection.registrationParameters.info.devices[0].id,
			deviceInfo: connection.registrationParameters.info.devices[0],
		});

		// Assert.
		expect(deviceService.length).toBe(1);

		expect(device.id).toBe(connection.registrationParameters.info.devices[0].id);
		expect(device.isConnected).toBeTruthy();
		expect(device.name).toBe(connection.registrationParameters.info.devices[0].name);
		expect(device.size).toEqual(connection.registrationParameters.info.devices[0].size);
		expect(device.type).toBe(connection.registrationParameters.info.devices[0].type);
	});

	/**
	 * Asserts {@link DeviceService} updates devices when they disconnect.
	 */
	it("updates device on deviceDidDisconnect", () => {
		// Arrange.
		connection.emit("connected", connection.registrationParameters.info);

		// Act.
		const [device] = deviceService;
		expect(device.isConnected).toBeFalsy();

		connection.emit("deviceDidConnect", {
			event: "deviceDidConnect",
			device: connection.registrationParameters.info.devices[0].id,
			deviceInfo: connection.registrationParameters.info.devices[0],
		});

		expect(device.isConnected).toBeTruthy();
		connection.emit("deviceDidDisconnect", {
			event: "deviceDidDisconnect",
			device: connection.registrationParameters.info.devices[0].id,
		});

		// Assert.
		expect(deviceService.length).toBe(1);

		expect(device.id).toBe(connection.registrationParameters.info.devices[0].id);
		expect(device.isConnected).toBeFalsy();
		expect(device.name).toBe(connection.registrationParameters.info.devices[0].name);
		expect(device.size).toEqual(connection.registrationParameters.info.devices[0].size);
		expect(device.type).toBe(connection.registrationParameters.info.devices[0].type);
	});

	/**
	 * Asserts {@link DeviceService} does not track unknown devices when they disconnect.
	 */
	it("ignores unknown devices on deviceDidDisconnect", () => {
		// Arrange.
		connection.emit("connected", connection.registrationParameters.info);

		// Act.
		const [device] = deviceService;
		expect(device.isConnected).toBeFalsy();

		connection.emit("deviceDidDisconnect", {
			event: "deviceDidDisconnect",
			device: "__UNKNOWN_DEVICE__",
		});

		// Assert.
		expect(deviceService.length).toBe(1);

		expect(device.id).toBe(connection.registrationParameters.info.devices[0].id);
		expect(device.isConnected).toBeFalsy();
		expect(device.name).toBe(connection.registrationParameters.info.devices[0].name);
		expect(device.size).toEqual(connection.registrationParameters.info.devices[0].size);
		expect(device.type).toBe(connection.registrationParameters.info.devices[0].type);
	});

	/**
	 * Asserts {@link DeviceService.onDeviceDidChange} is invoked when `deviceDidChange` is emitted.
	 */
	it("receive onDeviceDidChange", () => {
		// Arrange
		connection.emit("connected", connection.registrationParameters.info);

		const listener = vi.fn();
		const ev = {
			device: connection.registrationParameters.info.devices[0].id,
			deviceInfo: {
				name: "Test device",
				size: {
					columns: 8,
					rows: 4,
				},
				type: DeviceType.StreamDeckXL,
			},
			event: "deviceDidChange",
		} satisfies DeviceDidChange;

		// Act (emit).
		const disposable = deviceService.onDeviceDidChange(listener);
		connection.emit("deviceDidChange", ev);

		// Assert (emit).
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith<[DeviceDidChangeEvent]>({
			device: new Device(ev.device, ev.deviceInfo, true),
			type: "deviceDidChange",
		});

		// Act (dispose).
		disposable.dispose();
		connection.emit(ev.event, ev as any);

		// Assert(dispose).
		expect(listener).toHaveBeenCalledTimes(1);
	});

	/**
	 * Asserts {@link DeviceService.onDeviceDidConnect} is invoked when `deviceDidConnect` is emitted.
	 */
	it("receives onDeviceDidConnect", () => {
		// Arrange
		const listener = vi.fn();
		const ev = {
			device: "device123",
			deviceInfo: {
				name: "Test device",
				size: {
					columns: 8,
					rows: 4,
				},
				type: DeviceType.StreamDeckXL,
			},
			event: "deviceDidConnect",
		} satisfies DeviceDidConnect;

		// Act (emit).
		const disposable = deviceService.onDeviceDidConnect(listener);
		connection.emit("deviceDidConnect", ev);

		// Assert (emit).
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith<[DeviceDidConnectEvent]>({
			device: new Device(ev.device, ev.deviceInfo, true),
			type: "deviceDidConnect",
		});

		// Act (dispose).
		disposable.dispose();
		connection.emit(ev.event, ev as any);

		// Assert(dispose).
		expect(listener).toHaveBeenCalledTimes(1);
	});

	/**
	 * Asserts {@link DeviceService.onDeviceDidDisconnect} is invoked when `deviceDidDisconnect` is emitted.
	 */
	it("receives onDeviceDidDisconnect", () => {
		// Arrange
		connection.emit("connected", connection.registrationParameters.info);

		const listener = vi.fn();
		const ev = {
			device: connection.registrationParameters.info.devices[0].id,
			event: "deviceDidDisconnect",
		} satisfies DeviceDidDisconnect;

		// Act (emit).
		const disposable = deviceService.onDeviceDidDisconnect(listener);
		connection.emit("deviceDidDisconnect", ev);

		// Assert (emit).
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith<[DeviceDidDisconnectEvent]>({
			device: new Device(
				connection.registrationParameters.info.devices[0].id,
				connection.registrationParameters.info.devices[0],
				false,
			),
			type: "deviceDidDisconnect",
		});

		// Act (dispose).
		disposable.dispose();
		connection.emit(ev.event, ev as any);

		// Assert(dispose).
		expect(listener).toHaveBeenCalledTimes(1);
	});
});



================================================
FILE: src/plugin/events/action-event.ts
================================================
import type { ActionIdentifier, DeviceIdentifier, PluginEvent } from "../../api/index.js";
import { Event } from "./event.js";

/**
 * Provides information for an event relating to an action.
 */
export class ActionWithoutPayloadEvent<
	TSource extends Extract<PluginEvent, ActionIdentifier & DeviceIdentifier>,
	TAction,
> extends Event<TSource> {
	/**
	 * Initializes a new instance of the {@link ActionWithoutPayloadEvent} class.
	 * @param action Action that raised the event.
	 * @param source Source of the event, i.e. the original message from Stream Deck.
	 */
	constructor(
		public readonly action: TAction,
		source: TSource,
	) {
		super(source);
	}
}

/**
 * Provides information for an event relating to an action.
 */
export class ActionEvent<
	TSource extends Extract<PluginEvent, ActionIdentifier & DeviceIdentifier> & PayloadEvent<TSource>,
	TAction,
> extends ActionWithoutPayloadEvent<TSource, TAction> {
	/**
	 * Provides additional information about the event that occurred, e.g. how many `ticks` the dial was rotated, the current `state` of the action, etc.
	 */
	public readonly payload: ExtractPayload<TSource>;

	/**
	 * Initializes a new instance of the {@link ActionEvent} class.
	 * @param action Action that raised the event.
	 * @param source Source of the event, i.e. the original message from Stream Deck.
	 */
	constructor(action: TAction, source: TSource) {
		super(action, source);
		this.payload = source.payload;
	}
}

/**
 * Utility type for extracting the payload type from the specified `T` type.
 */
type ExtractPayload<T> = T extends {
	/**
	 * Payload supplied with the event.
	 */
	payload: infer TPayload;
}
	? TPayload extends object
		? TPayload
		: never
	: never;

/**
 * Utility type for determining the payload of an event.
 */
type PayloadEvent<T> = {
	/**
	 * Payload providing additional information for an event.
	 */
	payload: ExtractPayload<T>;
};



================================================
FILE: src/plugin/events/application-event.ts
================================================
import type { ApplicationDidLaunch, ApplicationDidTerminate } from "../../api/index.js";
import { Event } from "./event.js";

/**
 * Provides information for events relating to an application.
 */
export class ApplicationEvent<T extends ApplicationDidLaunch | ApplicationDidTerminate> extends Event<T> {
	/**
	 * Monitored application that was launched/terminated.
	 */
	public readonly application: string;

	/**
	 * Initializes a new instance of the {@link ApplicationEvent} class.
	 * @param source Source of the event, i.e. the original message from Stream Deck.
	 */
	constructor(source: T) {
		super(source);
		this.application = source.payload.application;
	}
}



================================================
FILE: src/plugin/events/deep-link-event.ts
================================================
import type { DidReceiveDeepLink } from "../../api/index.js";
import { Event } from "./event.js";

/**
 * Event information received from Stream Deck as part of a deep-link message being routed to the plugin.
 */
export class DidReceiveDeepLinkEvent extends Event<DidReceiveDeepLink> {
	/**
	 * Deep-link URL routed from Stream Deck.
	 */
	public readonly url: DeepLinkURL;

	/**
	 * Initializes a new instance of the {@link DidReceiveDeepLinkEvent} class.
	 * @param source Source of the event, i.e. the original message from Stream Deck.
	 */
	constructor(source: DidReceiveDeepLink) {
		super(source);
		this.url = new DeepLinkURL(source.payload.url);
	}
}

const PREFIX = "streamdeck://";

/**
 * Provides information associated with a URL received as part of a deep-link message, conforming to the URI syntax defined within RFC-3986 (https://datatracker.ietf.org/doc/html/rfc3986#section-3).
 */
export class DeepLinkURL {
	/**
	 * Fragment of the URL, with the number sign (#) omitted. For example, a URL of "/test#heading" would result in a {@link DeepLinkURL.fragment} of "heading".
	 */
	public readonly fragment: string;

	/**
	 * Original URL. For example, a URL of "/test?one=two#heading" would result in a {@link DeepLinkURL.href} of "/test?one=two#heading".
	 */
	public readonly href: string;

	/**
	 * Path of the URL; the full URL with the query and fragment omitted. For example, a URL of "/test?one=two#heading" would result in a {@link DeepLinkURL.path} of "/test".
	 */
	public readonly path: string;

	/**
	 * Query of the URL, with the question mark (?) omitted. For example, a URL of "/test?name=elgato&key=123" would result in a {@link DeepLinkURL.query} of "name=elgato&key=123".
	 * See also {@link DeepLinkURL.queryParameters}.
	 */
	public readonly query: string;

	/**
	 * Query string parameters parsed from the URL. See also {@link DeepLinkURL.query}.
	 */
	public readonly queryParameters: URLSearchParams;

	/**
	 * Initializes a new instance of the {@link DeepLinkURL} class.
	 * @param url URL of the deep-link, with the schema and authority omitted.
	 */
	constructor(url: string) {
		const refUrl = new URL(`${PREFIX}${url}`);

		this.fragment = refUrl.hash.substring(1);
		this.href = refUrl.href.substring(PREFIX.length);
		this.path = DeepLinkURL.parsePath(this.href);
		this.query = refUrl.search.substring(1);
		this.queryParameters = refUrl.searchParams;
	}

	/**
	 * Parses the {@link DeepLinkURL.path} from the specified {@link href}.
	 * @param href Partial URL that contains the path to parse.
	 * @returns The path of the URL.
	 */
	private static parsePath(href: string): string {
		const indexOf = (char: string): number => {
			const index = href.indexOf(char);
			return index >= 0 ? index : href.length;
		};

		return href.substring(0, Math.min(indexOf("?"), indexOf("#")));
	}
}



================================================
FILE: src/plugin/events/device-event.ts
================================================
import type { DeviceDidChange, DeviceDidConnect, DeviceDidDisconnect } from "../../api/index.js";
import { Event } from "./event.js";

/**
 * Provides information for events relating to a device.
 */
export class DeviceEvent<T extends DeviceDidChange | DeviceDidConnect | DeviceDidDisconnect, TDevice> extends Event<T> {
	/**
	 * Initializes a new instance of the {@link DeviceEvent} class.
	 * @param source Source of the event, i.e. the original message from Stream Deck.
	 * @param device Device that event is associated with.
	 */
	constructor(
		source: T,
		public readonly device: TDevice,
	) {
		super(source);
	}
}



================================================
FILE: src/plugin/events/event.ts
================================================
import type { PluginEvent } from "../../api/index.js";

/**
 * Provides information for events received from Stream Deck.
 */
export class Event<T extends PluginEvent> {
	/**
	 * Event that occurred.
	 */
	public readonly type: T["event"];

	/**
	 * Initializes a new instance of the {@link Event} class.
	 * @param source Source of the event, i.e. the original message from Stream Deck.
	 */
	constructor(source: T) {
		this.type = source.event;
	}
}



================================================
FILE: src/plugin/events/global-settings-event.ts
================================================
import type { JsonObject } from "@elgato/utils";

import type { DidReceiveGlobalSettings } from "../../api/index.js";
import { Event } from "./event.js";

/**
 * Provides event information for when the plugin received the global settings.
 */
export class DidReceiveGlobalSettingsEvent<T extends JsonObject> extends Event<DidReceiveGlobalSettings<T>> {
	/**
	 * Settings associated with the event.
	 */
	public readonly settings: T;

	/**
	 * Initializes a new instance of the {@link DidReceiveGlobalSettingsEvent} class.
	 * @param source Source of the event, i.e. the original message from Stream Deck.
	 */
	constructor(source: DidReceiveGlobalSettings<T>) {
		super(source);
		this.settings = source.payload.settings;
	}
}



================================================
FILE: src/plugin/events/index.ts
================================================
import type { JsonObject } from "@elgato/utils";

import type {
	ApplicationDidLaunch,
	ApplicationDidTerminate,
	DeviceDidChange,
	DeviceDidConnect,
	DeviceDidDisconnect,
	DialDown,
	DialRotate,
	DialUp,
	DidReceiveResources,
	DidReceiveSettings,
	KeyDown,
	KeyUp,
	PropertyInspectorDidAppear,
	PropertyInspectorDidDisappear,
	SystemDidWakeUp,
	TitleParametersDidChange,
	TouchTap,
	WillAppear,
	WillDisappear,
} from "../../api/index.js";
import type { ActionContext } from "../actions/context.js";
import type { DialAction } from "../actions/dial.js";
import type { KeyAction } from "../actions/key.js";
import type { Device } from "../devices/index.js";
import { ActionEvent, ActionWithoutPayloadEvent } from "./action-event.js";
import { ApplicationEvent } from "./application-event.js";
import { DeviceEvent } from "./device-event.js";
import { Event } from "./event.js";

export { DidReceiveDeepLinkEvent } from "./deep-link-event.js";
export { DidReceiveGlobalSettingsEvent } from "./global-settings-event.js";
export { SendToPluginEvent } from "./ui-message-event.js";

/**
 * Event information received from Stream Deck when a monitored application launches.
 */
export type ApplicationDidLaunchEvent = ApplicationEvent<ApplicationDidLaunch>;

/**
 * Event information received from Stream Deck when a monitored application terminates.
 */
export type ApplicationDidTerminateEvent = ApplicationEvent<ApplicationDidTerminate>;

/**
 * Event information received from Stream Deck when a Stream Deck device changed.
 */
export type DeviceDidChangeEvent = DeviceEvent<DeviceDidChange, Required<Device>>;

/**
 * Event information received from Stream Deck when a Stream Deck device connects.
 */
export type DeviceDidConnectEvent = DeviceEvent<DeviceDidConnect, Required<Device>>;

/**
 * Event information received from Stream Deck when a Stream Deck device disconnected.
 */
export type DeviceDidDisconnectEvent = DeviceEvent<DeviceDidDisconnect, Device>;

/**
 * Event information received from Stream Deck when a dial is pressed down.
 */
export type DialDownEvent<TSettings extends JsonObject = JsonObject> = ActionEvent<
	DialDown<TSettings>,
	DialAction<TSettings>
>;

/**
 * Event information received from Stream Deck when a dial is rotated.
 */
export type DialRotateEvent<TSettings extends JsonObject = JsonObject> = ActionEvent<
	DialRotate<TSettings>,
	DialAction<TSettings>
>;

/**
 * Event information received from Stream Deck when a pressed dial is released.
 */
export type DialUpEvent<TSettings extends JsonObject = JsonObject> = ActionEvent<
	DialUp<TSettings>,
	DialAction<TSettings>
>;

/**
 * Event information received from Stream Deck when the plugin receives settings.
 */
export type DidReceiveSettingsEvent<TSettings extends JsonObject = JsonObject> = ActionEvent<
	DidReceiveSettings<TSettings>,
	DialAction<TSettings> | KeyAction<TSettings>
>;

/**
 * Event information received from Stream Deck when the plugin receives resources.
 */
export type DidReceiveResourcesEvent<TSettings extends JsonObject = JsonObject> = ActionEvent<
	DidReceiveResources<TSettings>,
	DialAction<TSettings> | KeyAction<TSettings>
>;

/**
 * Event information received from Stream Deck when a key is pressed down.
 */
export type KeyDownEvent<TSettings extends JsonObject = JsonObject> = ActionEvent<
	KeyDown<TSettings>,
	KeyAction<TSettings>
>;

/**
 * Event information received from Stream Deck when a pressed key is release.
 */
export type KeyUpEvent<TSettings extends JsonObject = JsonObject> = ActionEvent<KeyUp<TSettings>, KeyAction<TSettings>>;

/**
 * Event information received from Stream Deck when the property inspector appears.
 */
export type PropertyInspectorDidAppearEvent<TSettings extends JsonObject = JsonObject> = ActionWithoutPayloadEvent<
	PropertyInspectorDidAppear,
	DialAction<TSettings> | KeyAction<TSettings>
>;

/**
 * Event information received from Stream Deck when the property inspector disappears.
 */
export type PropertyInspectorDidDisappearEvent<TSettings extends JsonObject = JsonObject> = ActionWithoutPayloadEvent<
	PropertyInspectorDidDisappear,
	DialAction<TSettings> | KeyAction<TSettings>
>;

/**
 * Event information received from Stream Deck when the title, or title parameters, change.
 */
export type TitleParametersDidChangeEvent<TSettings extends JsonObject = JsonObject> = ActionEvent<
	TitleParametersDidChange<TSettings>,
	DialAction<TSettings> | KeyAction<TSettings>
>;

/**
 * Event information receives from Streak Deck when the system wakes from sleep.
 */
export type SystemDidWakeUpEvent = Event<SystemDidWakeUp>;

/**
 * Event information received from Stream Deck when the touchscreen is touched.
 */
export type TouchTapEvent<TSettings extends JsonObject = JsonObject> = ActionEvent<
	TouchTap<TSettings>,
	DialAction<TSettings>
>;

/**
 * Event information received from Stream Deck when an action appears on the canvas.
 */
export type WillAppearEvent<TSettings extends JsonObject = JsonObject> = ActionEvent<
	WillAppear<TSettings>,
	DialAction<TSettings> | KeyAction<TSettings>
>;

/**
 * Event information received from Stream Deck when an action disappears from the canvas.
 */
export type WillDisappearEvent<TSettings extends JsonObject = JsonObject> = ActionEvent<
	WillDisappear<TSettings>,
	ActionContext
>;



================================================
FILE: src/plugin/events/ui-message-event.ts
================================================
import type { JsonObject, JsonValue } from "@elgato/utils";

import type { DidReceivePropertyInspectorMessage } from "../../api/index.js";
import type { Action } from "../actions/action.js";
import { Event } from "./event.js";

/**
 * Provides information for an event triggered by a message being sent to the plugin, from the property inspector.
 */
export class SendToPluginEvent<TPayload extends JsonValue, TSettings extends JsonObject> extends Event<
	DidReceivePropertyInspectorMessage<TPayload>
> {
	/**
	 * Payload sent from the property inspector.
	 */
	public payload: TPayload;

	/**
	 * Initializes a new instance of the {@link SendToPluginEvent} class.
	 * @param action Action that raised the event.
	 * @param source Source of the event, i.e. the original message from Stream Deck.
	 */
	constructor(
		public readonly action: Action<TSettings>,
		source: DidReceivePropertyInspectorMessage<TPayload>,
	) {
		super(source);
		this.payload = source.payload;
	}
}



================================================
FILE: src/plugin/events/__tests__/deep-link-event.test.ts
================================================
import { describe, expect, it } from "vitest";

import { DeepLinkURL } from "../deep-link-event.js";

describe("DeepLinkURL", () => {
	/**
	 * Asserts all {@link DeepLinkURL} properties are correct when only the path is specified.
	 */
	it("parses path", () => {
		// Arrange, act.
		const url = new DeepLinkURL("/hello/world");

		// Assert.
		expect(url.fragment).toBe("");
		expect(url.href).toBe("/hello/world");
		expect(url.path).toBe("/hello/world");
		expect(url.query).toBe("");
		expect(url.queryParameters.size).toBe(0);
	});

	/**
	 * Asserts all {@link DeepLinkURL} properties are correct when the path and query are specified.
	 */
	it("parses path, and query", () => {
		// Arrange, act.
		const url = new DeepLinkURL("/hello?foo=bar");

		// Assert.
		expect(url.fragment).toBe("");
		expect(url.href).toBe("/hello?foo=bar");
		expect(url.path).toBe("/hello");
		expect(url.query).toBe("foo=bar");
		expect(url.queryParameters.size).toBe(1);
		expect(url.queryParameters.get("foo")).toBe("bar");
	});

	/**
	 * Asserts all {@link DeepLinkURL} properties are correct when the path, query, and fragment are specified.
	 */
	it("parses path, query, and fragment", () => {
		// Arrange, act.
		const url = new DeepLinkURL("/hello?foo=bar#heading");

		// Assert.
		expect(url.fragment).toBe("heading");
		expect(url.href).toBe("/hello?foo=bar#heading");
		expect(url.path).toBe("/hello");
		expect(url.query).toBe("foo=bar");
		expect(url.queryParameters.size).toBe(1);
		expect(url.queryParameters.get("foo")).toBe("bar");
	});

	/**
	 * Asserts all {@link DeepLinkURL} properties are correct when the only the query is specified.
	 */
	it("parses query", () => {
		// Arrange, act.
		const url = new DeepLinkURL("/?foo=bar");

		// Assert.
		expect(url.fragment).toBe("");
		expect(url.href).toBe("/?foo=bar");
		expect(url.path).toBe("/");
		expect(url.query).toBe("foo=bar");
		expect(url.queryParameters.size).toBe(1);
		expect(url.queryParameters.get("foo")).toBe("bar");
	});

	/**
	 * Asserts all {@link DeepLinkURL} properties are correct when the query and fragment are specified.
	 */
	it("parses query, and fragment", () => {
		// Arrange, act.
		const url = new DeepLinkURL("/?foo=bar#heading");

		// Assert.
		expect(url.fragment).toBe("heading");
		expect(url.href).toBe("/?foo=bar#heading");
		expect(url.path).toBe("/");
		expect(url.query).toBe("foo=bar");
		expect(url.queryParameters.size).toBe(1);
		expect(url.queryParameters.get("foo")).toBe("bar");
	});

	/**
	 * Asserts all {@link DeepLinkURL} properties are correct when only the fragment is specified.
	 */
	it("parses fragment", () => {
		// Arrange, act.
		const url = new DeepLinkURL("/#heading");

		// Assert.
		expect(url.fragment).toBe("heading");
		expect(url.href).toBe("/#heading");
		expect(url.path).toBe("/");
		expect(url.query).toBe("");
		expect(url.queryParameters.size).toBe(0);
	});

	/**
	 * Asserts all {@link DeepLinkURL} properties are correct when the the fragment's number sign (#) is specified before the query's question mark (?).
	 */
	it("parses path when fragment is before query", () => {
		// Arrange, act.
		const url = new DeepLinkURL("/hello#?heading");

		// Assert.
		expect(url.fragment).toBe("?heading");
		expect(url.href).toBe("/hello#?heading");
		expect(url.path).toBe("/hello");
		expect(url.query).toBe("");
		expect(url.queryParameters.size).toBe(0);
	});
});



================================================
FILE: src/plugin/logging/error-code.ts
================================================
/**
 * Collection of error codes.
 */
export const errorCode = {
	/**
	 * Indicates the current Node.js SDK is not compatible with the SDK Version specified within the manifest.
	 */
	incompatibleSdkVersion: 652025,
};



================================================
FILE: src/plugin/logging/index.ts
================================================
import { ConsoleTarget, Logger, type LogTarget, stringFormatter } from "@elgato/utils/logging";
import { FileTarget } from "@elgato/utils/logging/file-target.js";
import path from "node:path";
import { cwd } from "node:process";

import { getPluginUUID, isDebugMode } from "../common/utils.js";

// Log all entires to a log file.
const fileTarget = new FileTarget({
	dest: path.join(cwd(), "logs"),
	fileName: getPluginUUID(),
	format: stringFormatter(),
	maxFileCount: 10,
	maxSize: 50 * 1024 * 1024,
});

// Construct the log targets.
const targets: LogTarget[] = [fileTarget];
if (isDebugMode()) {
	targets.splice(0, 0, new ConsoleTarget());
}

/**
 * Logger responsible for capturing log messages.
 */
export const logger = new Logger({
	level: isDebugMode() ? "debug" : "info",
	minimumLevel: isDebugMode() ? "trace" : "debug",
	targets,
});

process.once("uncaughtException", (err) => logger.error("Process encountered uncaught exception", err));



================================================
FILE: src/plugin/logging/__mocks__/index.ts
================================================
import { Logger, type LoggerOptions } from "@elgato/utils/logging";
import { vi } from "vitest";

const options: LoggerOptions = {
	level: "trace",
	targets: [{ write: vi.fn() }],
};

export const logger = new Logger(options);



================================================
FILE: src/plugin/logging/__tests__/index.test.ts
================================================
import { ConsoleTarget, type LoggerOptions } from "@elgato/utils/logging";
import { type FileTargetOptions } from "@elgato/utils/logging/file-target";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../common/utils.js");
vi.mock("@elgato/utils/logging");
vi.mock("@elgato/utils/logging/file-target");

describe("createLogger", () => {
	const mockedCwd = path.join("stream-deck", "tests");
	let utils: typeof import("../../common/utils.js");

	beforeEach(async () => {
		vi.spyOn(process, "cwd").mockReturnValue(mockedCwd);

		utils = await import("../../common/utils.js");
		vi.spyOn(utils, "getPluginUUID").mockReturnValue("com.elgato.test");
	});

	afterEach(() => {
		vi.resetModules();
	});

	describe("default log level", () => {
		/**
		 * Asserts the default log level in development.
		 */
		it("is DEBUG when isDebugMode() is true", async () => {
			// Arrange.
			vi.spyOn(utils, "isDebugMode").mockReturnValue(true);
			const spyOnFileTarget = vi.spyOn(await import("@elgato/utils/logging/file-target"), "FileTarget");
			const { Logger } = await import("@elgato/utils/logging");

			// Act.
			await import("../index.js");

			// Assert.
			expect(spyOnFileTarget).toHaveBeenCalledTimes(1);
			expect(Logger).toHaveBeenCalledWith<[LoggerOptions]>({
				level: "debug",
				minimumLevel: "trace",
				targets: [expect.any(ConsoleTarget), spyOnFileTarget.mock.instances[0]],
			});
		});

		/**
		 * Asserts the default log level in production.
		 */
		it("is INFO when isDebugMode() is false", async () => {
			// Arrange.
			vi.spyOn(utils, "isDebugMode").mockReturnValue(false);
			const spyOnFileTarget = vi.spyOn(await import("@elgato/utils/logging/file-target"), "FileTarget");
			const { Logger } = await import("@elgato/utils/logging");

			// Act.
			await import("../index.js");

			// Assert.
			expect(Logger).toHaveBeenCalledWith<[LoggerOptions]>({
				level: "info",
				minimumLevel: "debug",
				targets: [spyOnFileTarget.mock.instances[0]],
			});
		});
	});

	/**
	 * Asserts the file target is initialized based on the cwd, and the plugin's UUID.
	 */
	it("initializes the file target from the cwd", async () => {
		// Arrange.
		vi.spyOn(utils, "isDebugMode").mockReturnValue(false);
		const { FileTarget } = await import("@elgato/utils/logging/file-target");
		const { stringFormatter } = await import("@elgato/utils/logging");

		// Act.
		await import("../index.js");

		// Assert.
		expect(FileTarget).toHaveBeenLastCalledWith<[FileTargetOptions]>({
			dest: path.join(mockedCwd, "logs"),
			fileName: "com.elgato.test",
			format: stringFormatter(),
			maxFileCount: 10,
			maxSize: 50 * 1024 * 1024,
		});
	});

	/**
	 * Asserts the default logger listens for uncaught exceptions.
	 */
	it("logs when an uncaught exception is thrown", async () => {
		// Arrange.
		const spyOnProcessOnce = vi.spyOn(process, "once");
		const { logger } = await import("../index.js");
		const spyOnLogger = vi.spyOn(logger, "error");

		// Act.
		const err = new Error("Hello world");
		spyOnProcessOnce.mock.calls[0][1](err);

		// Assert.
		expect(spyOnProcessOnce).toHaveBeenCalledTimes(1);
		expect(spyOnProcessOnce).toHaveBeenCalledWith("uncaughtException", expect.any(Function));
		expect(spyOnLogger).toHaveBeenCalledTimes(1);
		expect(spyOnLogger).toHaveBeenCalledWith<[string, Error]>("Process encountered uncaught exception", err);
	});
});



================================================
FILE: tests/utils.ts
================================================
/**
 * Utility type for asserting {@template T} is `true`; used to test types.
 */
export type Expect<T extends true> = T;

/**
 * Utility type for prettifying a intersection / union type to a flat structure.
 */
export type Prettify<T> = { [k in keyof T]: T[k] extends object ? Prettify<T[k]> : T[k] } & {};

/**
 * Utility type that returns `true` when {@template T} and {@template U} are equal.
 */
export type TypesAreEqual<T, U> =
	(<G>() => G extends Prettify<T> ? 1 : 2) extends <G>() => G extends Prettify<U> ? 1 : 2 ? true : false;



================================================
FILE: tests/__setup__/global.ts
================================================
/**
 * Provides global setup for Jest, ensuring the timezone is standardized to UTC.
 */
export default function (): void {
	process.env.TZ = "UTC";
}



================================================
FILE: tests/__setup__/ws.ts
================================================
import { Server, WebSocket } from "mock-socket";
import { vi } from "vitest";

// Mock the `ws` module globally
vi.mock("ws", () => {
	return {
		default: WebSocket,
		WebSocket,
		Server,
	};
});



================================================
FILE: .github/workflows/build.yml
================================================
# yaml-language-server: $schema=https://json.schemastore.org/github-workflow.json
name: Build

on:
  push:
    branches:
      - "main"
      - "releases/*"
    paths-ignore:
      - "assets/**"
      - "**.md"

  pull_request:
    branches:
      - "main"
      - "releases/*"
    paths-ignore:
      - "assets/**"
      - "**.md"

defaults:
  run:
    shell: bash

jobs:
  Build:
    strategy:
      matrix:
        node_version: ["20.19.5", "24.9.0"]
        os: ["macos-latest", "windows-latest"]

    runs-on: ${{ matrix.os }}
    timeout-minutes: 10

    steps:
      - name: "📥 Checkout"
        uses: actions/checkout@v4

      - name: "🗃️ Setup Node"
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node_version }}

      - name: "📐 Install dependencies"
        run: npm ci

      - name: "🏗️ Build"
        run: npm run build

      - name: "🖌️ Lint"
        run: npm run lint

      - name: "🧪 Test"
        run: npm run test



================================================
FILE: .github/workflows/close-stale-issues.yml
================================================
# yaml-language-server: $schema=https://json.schemastore.org/github-workflow.json
name: "Close stale issues"

on:
  schedule:
    - cron: "30 1 * * *"

jobs:
  Stale:
    runs-on: "ubuntu-latest"

    permissions:
      issues: write

    steps:
      - name: "🏷️ Close stale issues"
        uses: actions/stale@v9
        with:
          close-issue-message: "This issue was closed because it has been inactive for one week since being marked as stale."
          stale-issue-label: "stale"
          # Never mark PRs as stale
          days-before-pr-stale: -1
          days-before-pr-close: -1



================================================
FILE: .github/workflows/release.yml
================================================
# yaml-language-server: $schema=https://json.schemastore.org/github-workflow.json
name: Release

on:
  push:
    tags:
      - "*"

defaults:
  run:
    shell: bash

jobs:
  Release:
    runs-on: "windows-latest"
    timeout-minutes: 10

    permissions:
      contents: read
      id-token: write

    steps:
      - name: "📥 Checkout"
        uses: actions/checkout@v4

      - name: "🗃️ Setup Node"
        uses: actions/setup-node@v4
        with:
          node-version: "20.19.5"
          registry-url: "https://registry.npmjs.org"

      - name: "📐 Install dependencies"
        run: npm ci

      - name: "🏗️ Build"
        run: npm run build

      - name: "🖌️ Lint"
        run: npm run lint

      - name: "🧪 Test"
        run: npm run test

      - name: "📖 Retrieve package information"
        uses: geekyeggo/npm-pkg@v1
        id: pkg

      - name: "📤 Publish"
        run: npm publish --provenance --access public --tag ${{ steps.pkg.outputs.version-tag }}
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  Documentation:
    runs-on: "ubuntu-latest"
    needs: [Release]

    steps:
      - name: "📄 Deploy documentation"
        run: curl --silent --output /dev/null -X POST "${{ secrets.DOCS_DEPLOY_HOOK }}"


