import fs from "fs";
import path from "path";
import chalk from "chalk";
import dotenv from "dotenv";

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

function list(items: string[]) {
    items.forEach((item) => {
        console.log(chalk.gray(`  - ${item}`));
    });
}

export async function syncCommand() {
    console.log(chalk.cyan("\n🔄 Syncing EnvGuardian...\n"));

    const cwd = process.cwd();
    const envPath = path.join(cwd, ENV_FILE);
    const envExamplePath = path.join(cwd, ENV_EXAMPLE_FILE);

    if (!fs.existsSync(envPath)) {
        warn(".env file not found");
        console.log(chalk.yellow("\n⚠ Sync finished with warnings\n"));
        return;
    }

    success(".env file detected");

    if (!fs.existsSync(envExamplePath)) {
        fs.writeFileSync(envExamplePath, "");
        info(".env.example file not found, created empty file");
    } else {
        success(".env.example file detected");
    }

    const envContent = fs.readFileSync(envPath, "utf-8");
    const envExampleContent = fs.readFileSync(envExamplePath, "utf-8");

    const envVars = Object.keys(dotenv.parse(envContent));
    const envExampleVars = Object.keys(dotenv.parse(envExampleContent));

    const missingVars = envVars.filter((key) => !envExampleVars.includes(key));

    if (missingVars.length === 0) {
        console.log(chalk.green("\n✔ .env.example is already in sync\n"));
        console.log(chalk.green("\n🎉 Env files synchronized successfully!\n"));
        return;
    }

    const linesToAppend = missingVars.map((key) => `${key}=`).join("\n");
    const needsNewLine =
        envExampleContent.length > 0 && !envExampleContent.endsWith("\n");

    const nextContent =
        envExampleContent +
        (needsNewLine ? "\n" : "") +
        linesToAppend +
        "\n";

    fs.writeFileSync(envExamplePath, nextContent);

    success(
        `Added ${missingVars.length} missing variable${
            missingVars.length === 1 ? "" : "s"
        } to .env.example`,
    );
    list(missingVars);

    console.log(chalk.green("\n🎉 Env files synchronized successfully!\n"));
}