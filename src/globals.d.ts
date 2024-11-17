/*
 * Cord, a Discord client based on Vencord
 * Copyright (c) 2024 Cord contributors
 * Code based on Vencord.
 * Copyright (c) 2022 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

declare global {
    export var IS_DEV: boolean;
    export var IS_VESKTOP: boolean; // TODO
    export var VERSION: string;

    export var VencordNative: typeof import("./VencordNative").default;
    export var Vencord: typeof import("./Vencord");
    export var VencordStyles: Map<string, {
        name: string;
        source: string;
        classNames: Record<string, string>;
        dom: HTMLStyleElement | null;
    }>;
    export var appSettings: {
        set(setting: string, v: any): void;
    };
    export var DiscordNative: any;
    export var Vesktop: any;
    export var VesktopNative: any;

    interface Window {
        webpackChunkdiscord_app: {
            push(chunk: any): any;
            pop(): any;
        };
        [k: string]: any;
    }
}

export { };
