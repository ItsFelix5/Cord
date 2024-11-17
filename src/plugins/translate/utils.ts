/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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

import { classNameFactory } from "@api/Styles";
import { showToast, Toasts } from "@webpack/common";

import { Languages } from "./languages";
import { settings } from "./settings";

export const cl = classNameFactory("vc-trans-");

interface GoogleData {
    src: string;
    sentences: {
        // 🏳️‍⚧️
        trans: string;
    }[];
}

export interface TranslationValue {
    sourceLanguage: string;
    text: string;
}

export async function translate(kind: "received" | "sent", text: string): Promise<TranslationValue> {
    try {
        const url = "https://translate.googleapis.com/translate_a/single?" + new URLSearchParams({
            // see https://stackoverflow.com/a/29537590 for more params
            // holy shidd nvidia
            client: "gtx",
            // source language
            sl: settings.store[`${kind}Input`],
            // target language
            tl: settings.store[`${kind}Output`],
            // what to return, t = translation probably
            dt: "t",
            // Send json object response instead of weird array
            dj: "1",
            source: "input",
            // query, duh
            q: text
        });

        const res = await fetch(url);
        if (!res.ok)
            throw new Error(
                `Failed to translate "${text}" (${settings.store[`${kind}Input`]} -> ${settings.store[`${kind}Output`]})`
                + `\n${res.status} ${res.statusText}`
            );

        const { src, sentences }: GoogleData = await res.json();

        return {
            sourceLanguage: Languages[src] ?? src,
            text: sentences.
                map(s => s?.trans).
                filter(Boolean).
                join("")
        };
    } catch (e) {
        const userMessage = typeof e === "string"
            ? e
            : "Something went wrong. If this issue persists, please check the console or ask for help in the support server.";

        showToast(userMessage, Toasts.Type.FAILURE);

        throw e instanceof Error
            ? e
            : new Error(userMessage);
    }
}
