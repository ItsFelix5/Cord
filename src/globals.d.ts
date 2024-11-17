/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

declare global {
    export var IS_DEV: boolean;
    export var IS_VESKTOP: boolean; //TODO
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
