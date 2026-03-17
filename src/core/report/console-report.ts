import chalk from "chalk";
import type { CompareEnvSetsResult } from "../env/compare-envs.js";

interface ConsoleReportInput {
    projectRoot: string;
    usedVars: string[];
    envVars: string[];
    envExampleVars: string[];
    comparison: CompareEnvSetsResult;
}

export function printConsoleReport(input: ConsoleReportInput): void {
    console.log(chalk.bold("EnvGuardian Report"));
    console.log("");

    printStat("Project", input.projectRoot);
    printStat("Variables detected in code", String(input.usedVars.length));
    printStat("Variables defined in .env", String(input.envVars.length));
    printStat(
        "Variables defined in .env.example",
        String(input.envExampleVars.length),
    );

    console.log("");

    printSection("✖ Missing in .env", input.comparison.missingInEnv, "red");
    printSection(
        "✖ Missing in .env.example",
        input.comparison.missingInEnvExample,
        "yellow",
    );
    printSection("ℹ Unused in .env", input.comparison.unusedInEnv, "blue");
    printSection(
        "ℹ Unused in .env.example",
        input.comparison.unusedInEnvExample,
        "magenta",
    );
}

function printStat(label: string, value: string): void {
    console.log(`${chalk.gray(label + ":")} ${chalk.white(value)}`);
}

function printSection(
    title: string,
    values: string[],
    color: "red" | "yellow" | "blue" | "magenta",
): void {
    const paint = chalk[color];

    console.log(paint.bold(title));

    if (values.length === 0) {
        console.log(chalk.gray("  - none"));
    } else {
        for (const value of values) {
            console.log(`  - ${value}`);
        }
    }

    console.log("");
}