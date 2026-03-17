import fg from "fast-glob";
import fs from "node:fs/promises";

const DEFAULT_PATTERNS = [
    /process\.env\.([A-Z0-9_]+)/g,
    /process\.env\[['"]([A-Z0-9_]+)['"]\]/g,
    /import\.meta\.env\.([A-Z0-9_]+)/g,
];

const DEFAULT_INCLUDE = [
    "src/**/*.{js,ts,jsx,tsx}",
    "app/**/*.{js,ts,jsx,tsx}",
    "pages/**/*.{js,ts,jsx,tsx}",
    "lib/**/*.{js,ts,jsx,tsx}",
];

const DEFAULT_IGNORE = [
    "node_modules/**",
    "dist/**",
    ".next/**",
    "coverage/**",
];

export interface ScanProjectOptions {
    debug?: boolean;
}

export async function scanProjectForEnvVars(
    projectRoot: string,
    options: ScanProjectOptions = {},
): Promise<string[]> {
    const debug = options.debug ?? false;

    const files = await fg(DEFAULT_INCLUDE, {
        cwd: projectRoot,
        ignore: DEFAULT_IGNORE,
        onlyFiles: true,
        absolute: true,
    });

    if (debug) {
        console.log(`[debug] Files matched for scan: ${files.length}`);
        for (const file of files) {
            console.log(`[debug] scan file: ${file}`);
        }
    }

    const found = new Set<string>();

    for (const file of files) {
        const content = await fs.readFile(file, "utf-8");

        for (const pattern of DEFAULT_PATTERNS) {
            for (const match of content.matchAll(pattern)) {
                const variableName = match[1]?.trim();
                if (variableName) {
                    found.add(variableName);

                    if (debug) {
                        console.log(`[debug] detected env var: ${variableName} in ${file}`);
                    }
                }
            }
        }
    }

    return Array.from(found).sort((a, b) => a.localeCompare(b));
}