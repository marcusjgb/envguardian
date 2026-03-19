import { Command } from "commander";
import { runCheckCommand } from "../commands/check.js";
import { initCommand } from "../commands/init.js";
import { syncCommand } from "../commands/sync.js";

const program = new Command();

program
    .name("envguardian")
    .description("Catch missing and inconsistent environment variables before deploy.")
    .version("0.1.0-alpha");

// CHECK
program
    .command("check")
    .description("Scan the project and compare used env vars against .env files")
    .option("--cwd <path>", "Project directory to scan", process.cwd())
    .option("--debug", "Enable debug logs", false)
    .option("--json", "Print the report as JSON", false)
    .action(async (options) => {
        try {
            const exitCode = await runCheckCommand(options);
            process.exit(exitCode);
        } catch (error) {
            console.error("Unexpected error while running EnvGuardian.");
            console.error(error);
            process.exit(1);
        }
    });

// INIT 👇
program
    .command("init")
    .description("Initialize EnvGuardian configuration")
    .action(async () => {
        try {
            await initCommand();
        } catch (error) {
            console.error("Unexpected error while running EnvGuardian init.");
            console.error(error);
            process.exit(1);
        }
    });

program
    .command("sync")
    .description("Sync .env variables into .env.example")
    .action(async () => {
        try {
            await syncCommand();
        } catch (error) {
            console.error("Unexpected error while running EnvGuardian sync.");
            console.error(error);
            process.exit(1);
        }
    });

program.parse();