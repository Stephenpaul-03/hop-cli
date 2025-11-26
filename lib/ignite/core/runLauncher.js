import fs from "fs";
import path from "path";
import os from "os";
import inquirer from "inquirer";
import chalk from "chalk";
import { spawn } from "child_process";

import { hopConfigDir, desktopPath } from "../utils/paths.js";
import { addRecent } from "../utils/recentStore.js";

export async function runLauncher(projectName, flags = []) {
  const directRun = flags.includes("--direct");
  const platform = os.platform();
  const scriptExt =
    platform === "win32" ? ".bat" : platform === "darwin" ? ".command" : ".sh";

  const scriptPath = path.join(
    hopConfigDir,
    `ignite-${projectName}${scriptExt}`
  );
  const configPath = path.join(hopConfigDir, `ignite-${projectName}.json`);

  if (!fs.existsSync(scriptPath)) {
    console.log(chalk.red(`\nLauncher "${projectName}" not found.\n`));
    console.log(chalk.gray("Run 'hop ignite' to create a new launcher.\n"));
    return;
  }

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (!fs.existsSync(config.path)) {
        console.log(
          chalk.yellow(`\nProject path no longer exists: ${config.path}`)
        );
        const { deleteLauncher } = await inquirer.prompt([
          {
            type: "confirm",
            name: "deleteLauncher",
            message: "Delete this launcher?",
            default: true,
          },
        ]);
        if (deleteLauncher) {
          fs.unlinkSync(scriptPath);
          fs.unlinkSync(configPath);
          const desktopScript = path.join(
            desktopPath,
            `ignite-${projectName}${scriptExt}`
          );
          if (fs.existsSync(desktopScript)) fs.unlinkSync(desktopScript);
          console.log(chalk.green("\nLauncher deleted\n"));
        }
        return;
      }
    } catch (err) {
      console.log(chalk.red(`\nError reading config: ${err.message}\n`));
      return;
    }
  }

  if (!directRun) {
    console.log(chalk.yellow.bold("\nSECURITY WARNING"));
    console.log("You are about to run a launcher script.");
    console.log("Only continue if you created this launcher.");
    console.log(chalk.red("Running untrusted scripts can harm your system.\n"));

    const { confirmRun } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmRun",
        message: "Do you want to continue?",
        default: false,
      },
    ]);

    if (!confirmRun) {
      console.log(chalk.gray("\nLauncher not executed.\n"));
      console.log(
        chalk.gray(
          `Tip: Use ${chalk.cyan(
            `hop ignite ${projectName} --direct`
          )} to skip the warning.\n`
        )
      );
      return;
    }
  }

  console.log(chalk.cyan(`\nLaunching ${projectName}...\n`));

  if (platform === "win32") {
    spawn("cmd.exe", ["/c", scriptPath], {
      detached: true,
      stdio: "ignore",
      shell: false,
    }).unref();
  } else {
    spawn("/bin/bash", [scriptPath], {
      detached: true,
      stdio: "ignore",
    }).unref();
  }

  try {
    addRecent({
      name: projectName,
      path: path.dirname(scriptPath),
      launchedAt: new Date().toISOString(),
    });
  } catch (_) {}

  console.log(chalk.green("Launcher started.\n"));
}
