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

type AnnotationLevel = "error" | "warning" | "notice";

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

function escapeGitHubAnnotationMessage(message: string): string {
    return message
        .replace(/%/g, "%25")
        .replace(/\r/g, "%0D")
        .replace(/\n/g, "%0A");
}

function emitGitHubAnnotation(params: {
    level: AnnotationLevel;
    file: string;
    line?: number;
    col?: number;
    title?: string;
    message: string;
}): void {
    const parts: string[] = [];

    if (params.file) {
        parts.push(`file=${params.file}`);
    }

    if (params.line) {
        parts.push(`line=${params.line}`);
    }

    if (params.col) {
        parts.push(`col=${params.col}`);
    }

    if (params.title) {
        parts.push(`title=${escapeGitHubAnnotationMessage(params.title)}`);
    }

    const metadata = parts.join(",");
    const message = escapeGitHubAnnotationMessage(params.message);

    process.stdout.write(`::${params.level} ${metadata}::${message}\n`);
}

function emitGitHubAnnotations(options: {
    missingInEnv: string[];
    missingInEnvExample: string[];
    unusedInEnv: string[];
    envPath?: string;
    envExamplePath?: string;
}): void {
    const envPath = options.envPath ?? ".env";
    const envExamplePath = options.envExamplePath ?? ".env.example";
    const maxErrors = 10;
    const maxWarnings = 10;

    const errorAnnotations = [
        ...options.missingInEnv.map((variable) => ({
            file: envPath,
            message: `Missing variable: ${variable}`,
        })),
        ...options.missingInEnvExample.map((variable) => ({
            file: envExamplePath,
            message: `Missing variable: ${variable}`,
        })),
    ].slice(0, maxErrors);

    const warningAnnotations = options.unusedInEnv
        .map((variable) => ({
            file: envPath,
            message: `Unused variable: ${variable}`,
        }))
        .slice(0, maxWarnings);

    for (const annotation of errorAnnotations) {
        emitGitHubAnnotation({
            level: "error",
            file: annotation.file,
            line: 1,
            col: 1,
            title: "EnvGuardian missing variable",
            message: annotation.message,
        });
    }

    for (const annotation of warningAnnotations) {
        emitGitHubAnnotation({
            level: "warning",
            file: annotation.file,
            line: 1,
            col: 1,
            title: "EnvGuardian unused variable",
            message: annotation.message,
        });
    }

    const totalErrors =
        options.missingInEnv.length + options.missingInEnvExample.length;

    if (totalErrors > maxErrors) {
        process.stdout.write(
            `EnvGuardian: ${totalErrors - maxErrors} more missing variable(s) were not annotated due to GitHub step limits.\n`,
        );
    }

    if (options.unusedInEnv.length > maxWarnings) {
        process.stdout.write(
            `EnvGuardian: ${options.unusedInEnv.length - maxWarnings} more unused variable(s) were not annotated due to GitHub step limits.\n`,
        );
    }
}

function writeGitHubSummary(summary: string): void {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;

    if (!summaryPath) {
        return;
    }

    fs.appendFileSync(summaryPath, summary);
}

function buildGitHubSummary(options: {
    missingInEnv: string[];
    missingInEnvExample: string[];
    unusedInEnv: string[];
    unusedInEnvExample: string[];
    hasProblems: boolean;
}): string {
    const {
        missingInEnv,
        missingInEnvExample,
        unusedInEnv,
        unusedInEnvExample,
        hasProblems,
    } = options;

    let summary = "## 🛡 EnvGuardian Report\n\n";

    if (
        missingInEnv.length === 0 &&
        missingInEnvExample.length === 0 &&
        unusedInEnv.length === 0 &&
        unusedInEnvExample.length === 0
    ) {
        summary += "✔ No issues found\n\n";
        summary += hasProblems
            ? "❌ EnvGuardian check failed\n"
            : "✔ EnvGuardian check passed\n";

        return summary;
    }

    if (missingInEnv.length > 0 || missingInEnvExample.length > 0) {
        summary += "### ❌ Missing variables\n";

        missingInEnv.forEach((variable) => {
            summary += `- ${variable} (.env)\n`;
        });

        missingInEnvExample.forEach((variable) => {
            summary += `- ${variable} (.env.example)\n`;
        });

        summary += "\n";
    }

    if (unusedInEnv.length > 0 || unusedInEnvExample.length > 0) {
        summary += "### ⚠️ Unused variables\n";

        unusedInEnv.forEach((variable) => {
            summary += `- ${variable} (.env)\n`;
        });

        unusedInEnvExample.forEach((variable) => {
            summary += `- ${variable} (.env.example)\n`;
        });

        summary += "\n";
    }

    summary += hasProblems
        ? "❌ EnvGuardian check failed\n"
        : "✔ EnvGuardian check passed\n";

    return summary;
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
    const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

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
                    `\n✔ Fixed ${missingVars.length} missing variable${missingVars.length === 1 ? "" : "s"} in .env.example`,
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

    if (isGitHubActions) {
        emitGitHubAnnotations({
            missingInEnv: displayComparison.missingInEnv,
            missingInEnvExample: displayComparison.missingInEnvExample,
            unusedInEnv: displayComparison.unusedInEnv,
            envPath: ".env",
            envExamplePath: ".env.example",
        });

        writeGitHubSummary(
            buildGitHubSummary({
                missingInEnv: displayComparison.missingInEnv,
                missingInEnvExample: displayComparison.missingInEnvExample,
                unusedInEnv: displayComparison.unusedInEnv,
                unusedInEnvExample: displayComparison.unusedInEnvExample,
                hasProblems,
            }),
        );
    }

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