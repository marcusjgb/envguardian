import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";

export interface LoadedEnvFiles {
    env: string[];
    envExample: string[];
}

export interface LoadEnvFilesOptions {
    debug?: boolean;
}

export async function loadEnvFiles(
    projectRoot: string,
    envFiles: string[],
    options: LoadEnvFilesOptions = {},
): Promise<LoadedEnvFiles> {
    const debug = options.debug ?? false;

    const result: LoadedEnvFiles = {
        env: [],
        envExample: [],
    };

    for (const fileName of envFiles) {
        const fullPath = path.join(projectRoot, fileName);

        try {
            const raw = await fs.readFile(fullPath, "utf-8");
            const parsed = dotenv.parse(raw);
            const keys = Object.keys(parsed).sort((a, b) => a.localeCompare(b));

            if (debug) {
                console.log(`[debug] loaded ${fileName}: ${keys.length} variables`);
            }

            if (fileName === ".env") {
                result.env = keys;
            }

            if (fileName === ".env.example") {
                result.envExample = keys;
            }
        } catch {
            if (debug) {
                console.log(`[debug] could not load ${fileName} at ${fullPath}`);
            }
        }
    }

    return result;
}