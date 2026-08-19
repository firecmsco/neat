import JSON5 from "json5";

/**
 * Utilities to read a Neat configuration out of whatever the user pasted:
 * plain JSON, JSON5, a TypeScript/JavaScript object literal (with `as const`,
 * `satisfies NeatConfig`, comments, trailing commas...), a `const config = {...}`
 * declaration, or even the whole snippet from the "Get the code" dialog.
 */

/** Marks every character of the source that is actual code (not a string or a comment). */
function maskCode(source: string): boolean[] {
    const isCode = new Array<boolean>(source.length).fill(true);

    let i = 0;
    while (i < source.length) {
        const char = source[i];
        const next = source[i + 1];

        // Comments
        if (char === "/" && next === "/") {
            while (i < source.length && source[i] !== "\n") {
                isCode[i] = false;
                i++;
            }
            continue;
        }
        if (char === "/" && next === "*") {
            const end = source.indexOf("*/", i + 2);
            const stop = end === -1 ? source.length : end + 2;
            for (; i < stop; i++) {
                isCode[i] = false;
            }
            continue;
        }

        // Strings and template literals: the quotes stay code, the content does not
        if (char === "\"" || char === "'" || char === "`") {
            i++;
            while (i < source.length) {
                if (source[i] === "\\") {
                    isCode[i] = false;
                    isCode[i + 1] = false;
                    i += 2;
                    continue;
                }
                if (source[i] === char) {
                    i++;
                    break;
                }
                isCode[i] = false;
                i++;
            }
            continue;
        }

        i++;
    }

    return isCode;
}

const TYPE_NAME = "(?:const\\b|\"[^\"]*\"|'[^']*'|[A-Za-z_$][\\w$]*(?:\\s*\\.\\s*[A-Za-z_$][\\w$]*)*(?:\\s*<[^<>]*>)?(?:\\s*\\[\\s*\\])*)";
const TS_ASSERTION = new RegExp(`\\b(?:as|satisfies)\\s+${TYPE_NAME}`, "g");

/**
 * Removes TypeScript-only assertions (`as const`, `satisfies NeatConfig`, ...).
 * Matches are blanked out instead of deleted so that character offsets, and
 * therefore the code mask, stay valid.
 */
function stripTypeAssertions(source: string, isCode: boolean[]): string {
    let result = source;
    let match: RegExpExecArray | null;
    TS_ASSERTION.lastIndex = 0;
    while ((match = TS_ASSERTION.exec(source)) !== null) {
        if (!isCode[match.index]) continue;
        result = result.slice(0, match.index) + " ".repeat(match[0].length) + result.slice(match.index + match[0].length);
    }
    return result;
}

/** Every outermost `{ ... }` block found in the code. */
function findObjectBlocks(source: string, isCode: boolean[]): string[] {
    const blocks: string[] = [];
    let depth = 0;
    let start = -1;

    for (let i = 0; i < source.length; i++) {
        if (!isCode[i]) continue;
        const char = source[i];
        if (char === "{") {
            if (depth === 0) start = i;
            depth++;
        } else if (char === "}") {
            if (depth === 0) continue;
            depth--;
            if (depth === 0 && start !== -1) {
                blocks.push(source.slice(start, i + 1));
                start = -1;
            }
        }
    }

    return blocks;
}

/**
 * Parses the top level entries of an object literal one by one, keeping the ones
 * that are valid values and dropping the rest. Lets us import a config that
 * contains runtime expressions, eg `yOffset: window.scrollY`.
 */
function looseParseObject(block: string): Record<string, any> | null {
    const isCode = maskCode(block);
    const result: Record<string, any> = {};

    // Walk the entries at depth 1, splitting on the commas that belong to this object
    let depth = 0;
    let entryStart = -1;
    const entries: string[] = [];

    for (let i = 0; i < block.length; i++) {
        if (!isCode[i]) continue;
        const char = block[i];
        if (char === "{" || char === "[" || char === "(") {
            depth++;
            if (depth === 1) entryStart = i + 1;
            continue;
        }
        if (char === "}" || char === "]" || char === ")") {
            depth--;
            if (depth === 0 && entryStart !== -1) {
                entries.push(block.slice(entryStart, i));
                entryStart = -1;
            }
            continue;
        }
        if (char === "," && depth === 1) {
            entries.push(block.slice(entryStart, i));
            entryStart = i + 1;
        }
    }

    for (const entry of entries) {
        const match = entry.match(/^\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$]*))\s*:\s*([\s\S]+)$/);
        if (!match) continue;
        const key = match[1] ?? match[2] ?? match[3];
        const rawValue = match[4].trim();
        try {
            result[key] = JSON5.parse(rawValue);
        } catch (e) {
            // Not a literal value (a variable, a call...), skip it and keep the default
        }
    }

    return Object.keys(result).length > 0 ? result : null;
}

/** How much a parsed object looks like the config we are after. */
function score(candidate: Record<string, any>, knownKeys: string[]): number {
    const keys = Object.keys(candidate);
    const known = keys.filter(key => knownKeys.includes(key)).length;
    return known * 100 + keys.length;
}

/**
 * Extracts a configuration object from arbitrary pasted text.
 *
 * @param input what the user pasted
 * @param knownKeys config keys, used to pick the right object when the input
 *        contains several (eg the full snippet from the "Get the code" dialog)
 * @throws if no object literal could be read
 */
export function parseConfigInput(input: string, knownKeys: string[] = []): Record<string, any> {
    const trimmed = input.trim();
    if (!trimmed) {
        throw new Error("Nothing to import");
    }

    const mask = maskCode(trimmed);
    const cleaned = stripTypeAssertions(trimmed, mask);
    const blocks = findObjectBlocks(cleaned, mask);

    if (blocks.length === 0) {
        throw new Error("No configuration object found. Paste a config object, or the code that declares it.");
    }

    let best: Record<string, any> | null = null;
    let bestScore = -1;

    const consider = (candidate: unknown) => {
        if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) return;
        const candidateScore = score(candidate as Record<string, any>, knownKeys);
        if (candidateScore > bestScore) {
            best = candidate as Record<string, any>;
            bestScore = candidateScore;
        }
    };

    for (const block of blocks) {
        try {
            consider(JSON5.parse(block));
        } catch (e) {
            // Fall back to reading the entries we can understand
            const loose = looseParseObject(block);
            if (loose) consider(loose);
        }
    }

    if (!best) {
        throw new Error("Invalid configuration: could not read an object out of the input");
    }

    return best;
}
