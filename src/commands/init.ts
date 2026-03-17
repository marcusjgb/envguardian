import fs from "fs";
import path from "path";
import chalk from "chalk";

const CONFIG_FILE = ".envguardian.json";
const ENV_FILE = ".env";
const ENV_EXAMPLE_FILE = ".env.example";

function success(msg: string) {
    console.log(chalk.green(`✔ ${msg}`));
}

function warn(msg: string) {
    console.log(chalk.yellow(`⚠ ${msg}`));
}

function info(msg: string) {
    console.log(chalk.blue(`ℹ ${msg}`));
}

export async function initCommand() {
    console.log(chalk.cyan("\n🚀 Initializing EnvGuardian...\n"));

    const cwd = process.cwd();

    const configPath = path.join(cwd, CONFIG_FILE);
    const envPath = path.join(cwd, ENV_FILE);
    const envExamplePath = path.join(cwd, ENV_EXAMPLE_FILE);

    let createdSomething = false;
    let hasWarnings = false;

    if (!fs.existsSync(configPath)) {
        const defaultConfig = {
            envFiles: [".env", ".env.example"],
            scanPaths: ["src"],
            ignore: ["node_modules"],
        };

        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        success(".envguardian.json created");
        createdSomething = true;
    } else {
        info(".envguardian.json already exists");
    }

    if (!fs.existsSync(envPath)) {
        warn(".env file not found");
        hasWarnings = true;
    } else {
        success(".env file detected");
    }

    if (!fs.existsSync(envExamplePath)) {
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, "utf-8");

            const exampleContent = envContent
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith("#"))
                .map((line) => {
                    const [key] = line.split("=");
                    return key ? `${key}=` : null;
                })
                .filter(Boolean)
                .join("\n");

            fs.writeFileSync(envExamplePath, exampleContent);

            success(".env.example generated from .env");
        } else {
            fs.writeFileSync(envExamplePath, "");
            success(".env.example created (empty - no source variables found)");
        }

        createdSomething = true;
    } else {
        info(".env.example already exists");
    }

    if (!createdSomething && !hasWarnings) {
        console.log(chalk.green("\n✔ EnvGuardian already initialized\n"));
    } else if (hasWarnings) {
        console.log(chalk.yellow("\n⚠ EnvGuardian initialized with warnings\n"));
    } else {
        console.log(chalk.green("\n🎉 EnvGuardian initialized successfully!\n"));
    }
}