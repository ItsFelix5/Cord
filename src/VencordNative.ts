/*
 * Cord, a Discord client based on Vencord
 * Copyright (c) 2024 Cord contributors
 * Code based on Vencord.
 * Copyright (c) 2022 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/// <reference path="../src/modules.d.ts" />
/// <reference path="../src/globals.d.ts" />

import monacoHtmlCdn from "file://../src/main/monacoWin.html?minify";

import * as DataStore from "./api/DataStore";
import { getThemeInfo } from "./main/themes";
import { debounce } from "./utils";
import { getTheme, Theme } from "./utils/discord";
import type { Settings } from "./Vencord";

const cssListeners = new Set<(css: string) => void>();
const setCssDebounced = debounce((css: string) => VencordNative.quickCss.set(css));
const themeStore = DataStore.createStore("VencordThemes", "VencordThemeData");
// Discord deletes this so need to store in variable
const { localStorage } = window;

// probably should make this less cursed at some point
export default window.VencordNative = {
    themes: {
        uploadTheme: (fileName: string, fileData: string) => DataStore.set(fileName, fileData, themeStore),
        deleteTheme: (fileName: string) => DataStore.del(fileName, themeStore),
        getThemesList: () => DataStore.entries(themeStore).then(entries => entries.map(([name, css]) => getThemeInfo(css, name.toString()))),
        getThemeData: (fileName: string) => DataStore.get(fileName, themeStore)
    },

    quickCss: {
        get: () => DataStore.get("VencordQuickCss").then(s => s ?? ""),
        set: async (css: string) => {
            await DataStore.set("VencordQuickCss", css);
            cssListeners.forEach(l => l(css));
        },
        addChangeListener(cb) {
            cssListeners.add(cb);
        },
        async openEditor() {
            const win = open("about:blank", "VencordQuickCss", `popup,width=${Math.min(window.innerWidth, 1000)},height=${Math.min(window.innerHeight, 1000)}`);
            if (!win) {
                alert("Failed to open QuickCSS popup. Make sure to allow popups!");
                return;
            }

            win.setCss = setCssDebounced;
            win.getCurrentCss = () => VencordNative.quickCss.get();
            win.getTheme = () => (getTheme() === Theme.Light ? "vs-light" : "vs-dark");

            win.document.write(monacoHtmlCdn);
        }
    },

    settings: {
        get: () => {
            try {
                return JSON.parse(localStorage.getItem("VencordSettings") || "{}");
            } catch (e) {
                console.error("Failed to parse settings from localStorage: ", e);
                return {};
            }
        },
        set: async (s: Settings) => localStorage.setItem("VencordSettings", JSON.stringify(s))
    },

    pluginHelpers: {} as any
};
