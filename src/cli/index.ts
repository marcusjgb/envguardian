#!/usr/bin/env node

import { Command } from "commander";
import { runCheckCommand } from "../commands/check.js";

const program = new Command();

program
    .name("envguardian")
    .description("Catch missing and inconsistent environment variables before deploy.")
    .version("0.1.0-alpha");

program
    .command("check")
    .description("Scan the project and compare used env vars against .env files")
    .option("--cwd <path>", "Project directory to scan", process.cwd())
    .option("--debug", "Enable debug logs", false)
    .option("--json", "Print the report as JSON", false)
    .action(
        async (options: { cwd: string; debug: boolean; json: boolean }) => {
            try {
                const exitCode = await runCheckCommand({
                    cwd: options.cwd,
                    debug: options.debug,
                    json: options.json,
                });

                process.exit(exitCode);
            } catch (error) {
                console.error("Unexpected error while running EnvGuardian.");
                console.error(error);
                process.exit(1);
            }
        },
    );

program.parse();