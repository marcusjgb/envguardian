import path from "node:path";
import fs from "fs";
import chalk from "chalk";
import { scanProjectForEnvVars } from "../core/scanner/scan-js.js";
import { loadEnvFiles } from "../core/env/load-env-files.js";
import { compareEnvSets } from "../core/env/compare-envs.js";
import { printConsoleReport } from "../core/report/console-report.js";
import { printJsonReport } from "../core/report/json-report.js";
import { sortEnvContent } from "../utils/sort-env.js";

export interface RunCheckCommandOptions {
    cwd?: string;
    debug?: boolean;
    json?: boolean;
    fix?: boolean;
    quiet?: boolean;
    onlyMissing?: boolean;
    ci?: boolean;
}

interface EnvGuardianConfig {
    ignore?: string[];
}

function loadConfig(projectRoot: string): EnvGuardianConfig {
    try {
        const configPath = path.join(projectRoot, ".envguardian.json");

        if (!fs.existsSync(configPath)) {
            return {};
        }

        const raw = fs.readFileSync(configPath, "utf-8");
        return JSON.parse(raw) as EnvGuardianConfig;
    } catch {
        return {};
    }
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
    const ci = options.ci ?? false;

    const config = loadConfig(projectRoot);
    const ignore = config.ignore ?? [];

    const usedVars = await scanProjectForEnvVars(projectRoot, { debug });

    const envData = await loadEnvFiles(projectRoot, [".env", ".env.example"], {
        debug,
    });

    const filteredUsedVars = usedVars.filter((v) => !ignore.includes(v));
    const filteredEnvVars = envData.env.filter((v) => !ignore.includes(v));
    const filteredEnvExampleVars = envData.envExample.filter(
        (v) => !ignore.includes(v),
    );

    const comparison = compareEnvSets({
        usedVars: filteredUsedVars,
        envVars: filteredEnvVars,
        envExampleVars: filteredEnvExampleVars,
    });

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

        const sortedContent = sortEnvContent(nextContent);
        fs.writeFileSync(envExamplePath, sortedContent);

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

    const finalEnvExampleVars = fix
        ? [...filteredEnvExampleVars, ...comparison.missingInEnvExample]
        : filteredEnvExampleVars;

    const finalComparison = fix
        ? compareEnvSets({
            usedVars: filteredUsedVars,
            envVars: filteredEnvVars,
            envExampleVars: finalEnvExampleVars,
        })
        : comparison;

    const displayComparison = ci
        ? {
            ...finalComparison,
            unusedInEnv: [],
            unusedInEnvExample: [],
        }
        : finalComparison;

    const missingCount =
        displayComparison.missingInEnv.length +
        displayComparison.missingInEnvExample.length;

    const unusedCount =
        displayComparison.unusedInEnv.length +
        displayComparison.unusedInEnvExample.length;

    const totalIssues = missingCount + unusedCount;
    const hasProblems = missingCount > 0;

    if (json) {
        printJsonReport({
            projectRoot: path.basename(projectRoot),
            usedVars: filteredUsedVars,
            envVars: filteredEnvVars,
            envExampleVars: finalEnvExampleVars,
            comparison: displayComparison,
            hasBlockingIssues: hasProblems,
        });

        return hasProblems ? 1 : 0;
    }

    if (quiet) {
        if (hasProblems) {
            console.log(chalk.red("✖ EnvGuardian check failed"));
        } else {
            console.log(chalk.green("✔ EnvGuardian check passed"));
        }

        return hasProblems ? 1 : 0;
    }

    console.log(chalk.cyan.bold("EnvGuardian"));
    console.log(chalk.gray(`Scanning project: ${projectRoot}`));
    console.log("");

    if (ignore.length > 0) {
        console.log(chalk.blue(`ℹ Ignoring ${ignore.length} variable(s)`));
        ignore.forEach((key) => {
            console.log(chalk.gray(`  - ${key}`));
        });
        console.log("");
    }

    if (ci) {
        console.log(chalk.blue("ℹ CI mode enabled"));
        console.log("");

        if (missingCount === 0) {
            console.log(chalk.green.bold("✔ No missing variables\n"));
        } else {
            console.log(chalk.red.bold("✖ Missing variables detected"));

            if (displayComparison.missingInEnv.length > 0) {
                console.log(chalk.yellow("\nMissing in .env"));
                displayComparison.missingInEnv.forEach((key) => {
                    console.log(chalk.gray(`  - ${key}`));
                });
            }

            if (displayComparison.missingInEnvExample.length > 0) {
                console.log(chalk.yellow("\nMissing in .env.example"));
                displayComparison.missingInEnvExample.forEach((key) => {
                    console.log(chalk.gray(`  - ${key}`));
                });
            }

            console.log("");
        }

        if (missingCount === 0) {
            console.log(chalk.green.bold("✔ EnvGuardian check passed\n"));
        } else {
            console.log(chalk.red.bold(`✖ Found ${missingCount} issues`));
            console.log(chalk.yellow(`  - Missing variables: ${missingCount}`));
            console.log("");
            console.log(chalk.red.bold("✖ EnvGuardian check failed\n"));
        }

        return hasProblems ? 1 : 0;
    }

    if (onlyMissing) {
        if (missingCount === 0) {
            console.log(chalk.green.bold("✔ No missing variables\n"));
        } else {
            console.log(chalk.red.bold("✖ Missing variables detected"));

            if (displayComparison.missingInEnv.length > 0) {
                console.log(chalk.yellow("\nMissing in .env"));
                displayComparison.missingInEnv.forEach((key) => {
                    console.log(chalk.gray(`  - ${key}`));
                });
            }

            if (displayComparison.missingInEnvExample.length > 0) {
                console.log(chalk.yellow("\nMissing in .env.example"));
                displayComparison.missingInEnvExample.forEach((key) => {
                    console.log(chalk.gray(`  - ${key}`));
                });
            }

            console.log("");
        }

        return hasProblems ? 1 : 0;
    }

    printConsoleReport({
        projectRoot: path.basename(projectRoot),
        usedVars: filteredUsedVars,
        envVars: filteredEnvVars,
        envExampleVars: finalEnvExampleVars,
        comparison: displayComparison,
    });

    console.log("");

    if (totalIssues === 0) {
        console.log(chalk.green.bold("✔ No issues found\n"));
    } else {
        console.log(chalk.red.bold(`✖ Found ${totalIssues} issues`));

        if (missingCount > 0) {
            console.log(chalk.yellow(`  - Missing variables: ${missingCount}`));
        }

        if (unusedCount > 0) {
            console.log(chalk.blue(`  - Unused variables: ${unusedCount}`));
        }

        console.log("");
        console.log(chalk.red.bold("✖ EnvGuardian check failed\n"));
    }

    return hasProblems ? 1 : 0;
}