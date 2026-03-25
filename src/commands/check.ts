import path from "node:path";
import fs from "fs";
import chalk from "chalk";
import { scanProjectForEnvVars } from "../core/scanner/scan-js.js";
import { loadEnvFiles } from "../core/env/load-env-files.js";
import { compareEnvSets } from "../core/env/compare-envs.js";
import { printConsoleReport } from "../core/report/console-report.js";
import { printJsonReport } from "../core/report/json-report.js";

export interface RunCheckCommandOptions {
    cwd?: string;
    debug?: boolean;
    json?: boolean;
    fix?: boolean;
    quiet?: boolean;
    onlyMissing?: boolean;
}

export async function runCheckCommand(
    options: RunCheckCommandOptions = {},
): Promise<number> {
    const projectRoot = path.resolve(options.cwd ?? process.cwd());
    const debug = options.debug ?? false;
    const json = options.json ?? false;
    const fix = options.fix ?? false;
    const quiet = options.quiet ?? false;
    const onlyMissing = options.onlyMissing ?? false;

    const usedVars = await scanProjectForEnvVars(projectRoot, { debug });

    const envData = await loadEnvFiles(projectRoot, [".env", ".env.example"], {
        debug,
    });

    const comparison = compareEnvSets({
        usedVars,
        envVars: envData.env,
        envExampleVars: envData.envExample,
    });

    // --- FIX ---
    if (fix && comparison.missingInEnvExample.length > 0) {
        const envExamplePath = path.join(projectRoot, ".env.example");

        const content = fs.existsSync(envExamplePath)
            ? fs.readFileSync(envExamplePath, "utf-8")
            : "";

        const missingVars = comparison.missingInEnvExample;
        const linesToAppend = missingVars.map((key) => `${key}=`).join("\n");
        const needsNewLine =
            content.length > 0 && !content.endsWith("\n");

        const nextContent =
            content +
            (needsNewLine ? "\n" : "") +
            linesToAppend +
            "\n";

        fs.writeFileSync(envExamplePath, nextContent);

        if (!quiet) {
            console.log(
                chalk.green(
                    `\n✔ Fixed ${missingVars.length} missing variable${missingVars.length === 1 ? "" : "s"
                    } in .env.example`,
                ),
            );

            missingVars.forEach((key) => {
                console.log(chalk.gray(`  - ${key}`));
            });
        }
    }

    const finalComparison = fix
        ? compareEnvSets({
            usedVars,
            envVars: envData.env,
            envExampleVars: [
                ...envData.envExample,
                ...comparison.missingInEnvExample,
            ],
        })
        : comparison;

    const missingCount =
        finalComparison.missingInEnv.length +
        finalComparison.missingInEnvExample.length;

    const unusedCount =
        finalComparison.unusedInEnv.length +
        finalComparison.unusedInEnvExample.length;

    const totalIssues = missingCount + unusedCount;
    const hasProblems = missingCount > 0;

    if (json) {
        printJsonReport({
            projectRoot: path.basename(projectRoot),
            usedVars,
            envVars: envData.env,
            envExampleVars: fix
                ? [...envData.envExample, ...comparison.missingInEnvExample]
                : envData.envExample,
            comparison: finalComparison,
            hasBlockingIssues: hasProblems,
        });

        return hasProblems ? 1 : 0;
    }

    // --- QUIET ---
    if (quiet) {
        if (totalIssues === 0) {
            console.log(chalk.green("✔ EnvGuardian check passed"));
        } else {
            console.log(chalk.red("✖ EnvGuardian check failed"));
        }

        return hasProblems ? 1 : 0;
    }

    console.log(chalk.cyan.bold("EnvGuardian"));
    console.log(chalk.gray(`Scanning project: ${projectRoot}`));
    console.log("");

    // --- ONLY MISSING ---
    if (onlyMissing) {
        if (missingCount === 0) {
            console.log(chalk.green.bold("✔ No missing variables\n"));
        } else {
            console.log(chalk.red.bold("✖ Missing variables detected"));

            if (finalComparison.missingInEnv.length > 0) {
                console.log(chalk.yellow("\nMissing in .env"));
                finalComparison.missingInEnv.forEach((key) => {
                    console.log(chalk.gray(`  - ${key}`));
                });
            }

            if (finalComparison.missingInEnvExample.length > 0) {
                console.log(chalk.yellow("\nMissing in .env.example"));
                finalComparison.missingInEnvExample.forEach((key) => {
                    console.log(chalk.gray(`  - ${key}`));
                });
            }

            console.log("");
        }

        return hasProblems ? 1 : 0;
    }

    // --- DEFAULT REPORT ---
    printConsoleReport({
        projectRoot: path.basename(projectRoot),
        usedVars,
        envVars: envData.env,
        envExampleVars: fix
            ? [...envData.envExample, ...comparison.missingInEnvExample]
            : envData.envExample,
        comparison: finalComparison,
    });

    console.log("");

    if (totalIssues === 0) {
        console.log(chalk.green.bold("✔ No issues found\n"));
    } else {
        console.log(chalk.red.bold(`✖ Found ${totalIssues} issues`));

        if (missingCount > 0) {
            console.log(chalk.yellow(`  - Missing variables: ${missingCount}`));
        }

        if (!onlyMissing && unusedCount > 0) {
            console.log(chalk.blue(`  - Unused variables: ${unusedCount}`));
        }

        console.log("");
        console.log(chalk.red.bold("✖ EnvGuardian check failed\n"));
    }

    return hasProblems ? 1 : 0;
}