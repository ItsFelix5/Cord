/*
 * Cord, a Discord client based on Vencord
 * Copyright (c) 2024 Cord contributors
 * Code based on Vencord.
 * Copyright (c) 2022 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "VencordNative";
export * as Api from "./api";
export * as Components from "./components";
export * as Plugins from "./plugins";
export * as Util from "./utils";
export * as QuickCss from "./utils/quickCss";
export * as Webpack from "./webpack";
export { PlainSettings, Settings };

import "./utils/quickCss";
import "./webpack/patchWebpack";

import { StartAt } from "@utils/types";

import { get as dsGet } from "./api/DataStore";
import { showNotification } from "./api/Notifications";
import { PlainSettings, Settings } from "./api/Settings";
import { patches, PMLogger, startAllPlugins } from "./plugins";
import { localStorage } from "./utils/localStorage";
import { getCloudSettings, putCloudSettings } from "./utils/settingsSync";
import { onceReady } from "./webpack";
import { SettingsRouter } from "./webpack/common";

async function syncSettings() {
    // pre-check for local shared settings
    if (
        Settings.cloud.authenticated &&
        !await dsGet("Vencord_cloudSecret") // this has been enabled due to local settings share or some other bug
    ) {
        // show a notification letting them know and tell them how to fix it
        showNotification({
            title: "Cloud Integrations",
            body: "We've noticed you have cloud integrations enabled in another client! Due to limitations, you will " +
                "need to re-authenticate to continue using them. Click here to go to the settings page to do so!",
            color: "var(--yellow-360)",
            onClick: () => SettingsRouter.open("VencordCloud")
        });
        return;
    }

    if (
        Settings.cloud.settingsSync && // if it's enabled
        Settings.cloud.authenticated // if cloud integrations are enabled
    ) {
        if (localStorage.Vencord_settingsDirty) {
            await putCloudSettings();
            delete localStorage.Vencord_settingsDirty;
        } else if (await getCloudSettings(false)) { // if we synchronized something (false means no sync)
            // we show a notification here instead of allowing getCloudSettings() to show one to declutter the amount of
            // potential notifications that might occur. getCloudSettings() will always send a notification regardless if
            // there was an error to notify the user, but besides that we only want to show one notification instead of all
            // of the possible ones it has (such as when your settings are newer).
            showNotification({
                title: "Cloud Settings",
                body: "Your settings have been updated! Click here to restart to fully apply changes!",
                color: "var(--green-360)",
                onClick: location.reload
            });
        }
    }
}

async function init() {
    await onceReady;
    startAllPlugins(StartAt.WebpackReady);

    syncSettings();

    if (IS_DEV) {
        const pendingPatches = patches.filter(p => !p.all && p.predicate?.() !== false);
        if (pendingPatches.length)
            PMLogger.warn(
                "Webpack has finished initialising, but some patches haven't been applied yet.",
                "This might be expected since some Modules are lazy loaded, but please verify",
                "that all plugins are working as intended.",
                "You are seeing this warning because this is a Development build of Vencord.",
                "\nThe following patches have not been applied:",
                "\n\n" + pendingPatches.map(p => `${p.plugin}: ${p.find}`).join("\n")
            );
    }
}

// @ts-ignore
Notification = (title: string, { body, icon }: NotificationOptions = {}) => window.__TAURI__.core.invoke("notify", { title, body, icon });
Notification.requestPermission = (cb?: NotificationPermissionCallback) => (cb?.("granted"), Promise.resolve("granted"));
Object.defineProperty(Notification, "permission", { value: "granted", writable: false });

const { open } = window;
window.open = (url?: string | URL, target?: string, features?: string) => {
    if (url instanceof URL) url = url.href;
    if (url === undefined || url === "about:blank" || url.endsWith("discord.com/popout")) return open(url, target, features);
    window.__TAURI__.core.invoke("open", url);
    return null;
};

startAllPlugins(StartAt.Init);
init();

document.addEventListener("DOMContentLoaded", () => startAllPlugins(StartAt.DOMContentLoaded), { once: true });
