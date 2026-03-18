import path from "node:path";
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
}

export async function runCheckCommand(
    options: RunCheckCommandOptions = {},
): Promise<number> {
    const projectRoot = path.resolve(options.cwd ?? process.cwd());
    const debug = options.debug ?? false;
    const json = options.json ?? false;

    const usedVars = await scanProjectForEnvVars(projectRoot, { debug });

    const envData = await loadEnvFiles(projectRoot, [".env", ".env.example"], {
        debug,
    });

    const comparison = compareEnvSets({
        usedVars,
        envVars: envData.env,
        envExampleVars: envData.envExample,
    });

    const missingCount =
        comparison.missingInEnv.length +
        comparison.missingInEnvExample.length;

    const unusedCount =
        comparison.unusedInEnv.length +
        comparison.unusedInEnvExample.length;

    const totalIssues = missingCount + unusedCount;

    const hasProblems = missingCount > 0;

    if (json) {
        printJsonReport({
            projectRoot: path.basename(projectRoot),
            usedVars,
            envVars: envData.env,
            envExampleVars: envData.envExample,
            comparison,
            hasBlockingIssues: hasProblems,
        });

        return hasProblems ? 1 : 0;
    }

    console.log(chalk.cyan.bold("EnvGuardian"));
    console.log(chalk.gray(`Scanning project: ${projectRoot}`));
    console.log("");

    printConsoleReport({
        projectRoot: path.basename(projectRoot),
        usedVars,
        envVars: envData.env,
        envExampleVars: envData.envExample,
        comparison,
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