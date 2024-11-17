/* eslint-disable simple-header/header */

/**
 * discord-intl
 *
 * @copyright 2024 Discord, Inc.
 * @link https://github.com/discord/discord-intl
 * @license MIT
 */

const BASE64_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
const IS_BIG_ENDIAN = (() => {
    const array = new Uint8Array(4);
    const view = new Uint32Array(array.buffer);
    return !((view[0] = 1) & array[0]);
})();

const PRIME64_1 = 11400714785074694791n;
const PRIME64_2 = 14029467366897019727n;
const PRIME64_3 = 1609587929392839161n;
const PRIME64_4 = 9650029242287828579n;
const PRIME64_5 = 2870177450012600261n;

const encoder = new TextEncoder();

const bitsToBigInt = (a00, a16, a32, a48) => (
    (BigInt(a00)) |
    (BigInt(a16) << 16n) |
    (BigInt(a32) << 32n) |
    (BigInt(a48) << 48n)
);

const memoryToBigInt = (memory, offset) => (
    (BigInt(memory[offset])) |
    (BigInt(memory[offset + 1]) << 8n) |
    (BigInt(memory[offset + 2]) << 16n) |
    (BigInt(memory[offset + 3]) << 24n) |
    (BigInt(memory[offset + 4]) << 32n) |
    (BigInt(memory[offset + 5]) << 40n) |
    (BigInt(memory[offset + 6]) << 48n) |
    (BigInt(memory[offset + 7]) << 56n)
);

const rotl = (v: bigint, rot) => (((v << rot) & 18446744073709551615n) | (v >> (64n - rot)));
const trunc = v => BigInt.asUintN(64, v);

/**
 * Returns a consistent, short hash of the given key by first processing it through a hash digest,
 * then encoding the first few bytes to base64.
 *
 * This function is specifically written to mirror the native backend hashing function used by
 * `@discord/intl-loader-core`, to be able to hash names at runtime.
 */
export function runtimeHashMessageKey(key: string): string {
    // xxHash64 implementation based on @intrnl/xxhash64
    //
    // Licensed under MIT License
    //
    // Copyright 2019-2020, Yann Collet <github.com/Cyan4973>
    // Copyright 2016, Pierre Curto <github.com/pierrec>
    // Copyright 2019, Daniel Lo Nigro <github.com/Daniel15>
    // Copyright 2021, intrnl <github.com/intrnl>
    let seed = BigInt.asUintN(32, BigInt(0));
    let v1 = trunc(seed + PRIME64_1 + PRIME64_2);
    let v2 = trunc(seed + PRIME64_2);
    let v3 = seed;
    let v4 = trunc(seed - PRIME64_1);
    let len1 = 0;
    let memsize = 0;
    let input = encoder.encode(key);

    let p = 0;
    let len = input.length;
    let bEnd = p + len;

    len1 += len;

    let memory;
    if (memsize === 0) memory = new Uint8Array(32);

    if (memsize + len < 32) {
        memory.set(input.subarray(0, len), memsize);
        memsize += len;
    } else {
        if (memsize > 0) {
            memory.set(input.subarray(0, 32 - memsize), memsize);

            let p64 = 0;
            let other;

            other = memoryToBigInt(memory, p64);
            v1 = trunc(rotl(trunc(v1 + other * PRIME64_2), 31n) * PRIME64_1);

            p64 += 8
            other = memoryToBigInt(memory, p64)
            v2 = trunc(rotl(trunc(v2 + other * PRIME64_2), 31n) * PRIME64_1);

            p64 += 8
            other = memoryToBigInt(memory, p64)
            v3 = trunc(rotl(trunc(v3 + other * PRIME64_2), 31n) * PRIME64_1);

            p64 += 8
            other = memoryToBigInt(memory, p64)
            v4 = trunc(rotl(trunc(v4 + other * PRIME64_2), 31n) * PRIME64_1);

            p += 32 - memsize;
            memsize = 0;
        }

        if (p <= bEnd - 32) {
            const limit = bEnd - 32;

            do {
                let other;

                other = memoryToBigInt(input, p)
                v1 = trunc(rotl(trunc(v1 + other * PRIME64_2), 31n) * PRIME64_1);
                p += 8

                other = memoryToBigInt(input, p)
                v2 = trunc(rotl(trunc(v2 + other * PRIME64_2), 31n) * PRIME64_1);
                p += 8

                other = memoryToBigInt(input, p)
                v3 = trunc(rotl(trunc(v3 + other * PRIME64_2), 31n) * PRIME64_1);
                p += 8

                other = memoryToBigInt(input, p)
                v4 = trunc(rotl(trunc(v4 + other * PRIME64_2), 31n) * PRIME64_1);
                p += 8
            } while (p <= limit)
        }

        if (p < bEnd) {
            memory.set(input.subarray(p, bEnd), memsize);
            memsize = bEnd - p;
        }
    }

    let p1 = 0;
    let h64 = 0n;
    let h = 0n;
    let u = 0n;

    if (len1 >= 32) {
        h64 = rotl(v1, 1n) + rotl(v2, 7n) + rotl(v3, 12n) + rotl(v4, 18n);

        h64 = trunc(h64 ^ (rotl(trunc(v1 * PRIME64_2), 31n) * PRIME64_1));
        h64 = trunc(h64 * PRIME64_1 + PRIME64_4);

        h64 = trunc(h64 ^ (rotl(trunc(v2 * PRIME64_2), 31n) * PRIME64_1));
        h64 = trunc(h64 * PRIME64_1 + PRIME64_4);

        h64 = trunc(h64 ^ (rotl(trunc(v3 * PRIME64_2), 31n) * PRIME64_1));
        h64 = trunc(h64 * PRIME64_1 + PRIME64_4);

        h64 = trunc(h64 ^ (rotl(trunc(v4 * PRIME64_2), 31n) * PRIME64_1));
        h64 = trunc(h64 * PRIME64_1 + PRIME64_4);
    }
    else h64 = trunc(seed + PRIME64_5);

    h64 += BigInt(len1);

    while (p1 <= memsize - 8) {
        u = memoryToBigInt(memory, p1);
        u = trunc(rotl(trunc(u * PRIME64_2), 31n) * PRIME64_1);

        h64 = trunc((rotl(h64 ^ u, 27n) * PRIME64_1) + PRIME64_4);
        p1 += 8;
    }

    if (p1 + 4 <= memsize) {
        u = bitsToBigInt((memory[p1 + 1] << 8) | memory[p1], (memory[p1 + 3] << 8) | memory[p1 + 2], 0, 0);
        h64 = trunc((rotl(h64 ^ trunc((u * PRIME64_1)), 23n) * PRIME64_2) + PRIME64_3);
        p1 += 4;
    }

    while (p1 < memsize) {
        u = bitsToBigInt(memory[p1++], 0, 0, 0);
        h64 = trunc(rotl(h64 ^ trunc(u * PRIME64_5), 11n) * PRIME64_1);
    }

    h = trunc(h64 >> 33n);
    h64 = trunc((h64 ^ h) * PRIME64_2);

    h = trunc(h64 >> 29n);
    h64 = trunc((h64 ^ h) * PRIME64_3);

    h = trunc(h64 >> 32n);
    h64 = trunc(h64 ^ h);

    const array: number[] = [];
    const byteCount = Math.ceil(Math.floor(Math.log2(Number(h64)) + 1) / 8);
    for (let i = 0; i < byteCount; i++) array.unshift(Number((h64 >> BigInt(8 * i)) & BigInt(255)));

    let bytes = new Uint8Array(array);
    // The native `hashToMessageKey` always works in Big/Network Endian bytes, so this array
    // needs to be converted to the same endianness to get the same base64 result.
    if (IS_BIG_ENDIAN) bytes = bytes.reverse();
    return [
        BASE64_TABLE[bytes[0] >> 2],
        BASE64_TABLE[((bytes[0] & 0x03) << 4) | (bytes[1] >> 4)],
        BASE64_TABLE[((bytes[1] & 0x0f) << 2) | (bytes[2] >> 6)],
        BASE64_TABLE[bytes[2] & 0x3f],
        BASE64_TABLE[bytes[3] >> 2],
        BASE64_TABLE[((bytes[3] & 0x03) << 4) | (bytes[3] >> 4)],
    ].join("");
}
