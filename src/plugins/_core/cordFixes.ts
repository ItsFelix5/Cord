/*
 * Cord, a Discord client based on Vencord
 * Copyright (c) 2024 Cord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "CordFixes",
    description: "Some patches to fix some things.",
    authors: [Devs.Felix],
    required: true,
    patches: [
        {
            find: '"NotificationSettingsStore',
            replacement: {
                match: "o.isPlatformEmbedded",
                replace: "true"
            }
        },
        {
            find: "disableAppDownload",
            replacement: {
                match: "P.isPlatformEmbedded",
                replace: "true"
            }
        }
    ]
});
