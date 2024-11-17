/*
 * Cord, a Discord client based on Vencord
 * Copyright (c) 2024 Cord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin, { StartAt } from "@utils/types";

export default definePlugin({
    name: "CustomTitlebar",
    authors: [Devs.Felix],
    description: "Use the default discord titlebar instead of the systems one.",
    enabledByDefault: true,
    startAt: StartAt.DOMContentLoaded,
    start() {
        if (!this.win) this.win = window.__TAURI__.window.getCurrentWindow();
        this.win.setDecorations(false);
    },
    patches: [
        {
            find: ".wordmarkWindows",
            predicate: () => navigator.platform.startsWith("Win"),
            replacement: [
                {
                    match: /case \i\.\i\.WINDOWS:/,
                    replace: 'case "WEB":'
                },
                {
                    match: /\i\.\i\.minimize\b/,
                    replace: "$self.win.minimize"
                },
                {
                    match: /\i\.\i\.maximize\b/,
                    replace: "$self.win.toggleMaximize"
                },
                {
                    match: /\i\.\i\.close\b/,
                    replace: "$self.win.close"
                }
            ]
        },
        {
            find: "platform-web",
            replacement: {
                match: /(?<=" platform-overlay"\):)\i/,
                replace: "$self.getPlatformClass()"
            }
        }
    ],
    getPlatformClass() {
        if (navigator.platform.startsWith("Win")) return "platform-win";
        if (navigator.platform.startsWith("Mac")) return "platform-osx";
        return "platform-web";
    }
});
