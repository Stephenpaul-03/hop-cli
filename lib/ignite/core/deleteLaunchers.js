import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import chalk from "chalk";

import { hopConfigDir, desktopPath } from "../utils/paths.js";

export async function deleteLaunchers() {
  const files = fs.readdirSync(hopConfigDir);

  const configs = files
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        const json = JSON.parse(
          fs.readFileSync(path.join(hopConfigDir, f), "utf-8")
        );
        const isValidLauncher =
          json &&
          typeof json.name === "string" &&
          typeof json.path === "string" &&
          typeof json.createdAt === "string" &&
          typeof json.config === "object";

        if (!isValidLauncher) return null;

        return {
          name: json.name,
          path: json.path,
          created: new Date(json.createdAt).toLocaleString(),
          exists: fs.existsSync(json.path),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (configs.length === 0) {
    console.log(chalk.yellow("\nNo launchers found.\n"));
    return;
  }

  const { launchersToDelete } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "launchersToDelete",
      message: chalk.yellow("Select launchers to delete:"),
      choices: configs.map((c) => ({
        name: `${c.name} ${!c.exists ? chalk.red("(path missing)") : ""} - ${
          c.path
        } - Created: ${c.created}`,
        value: c.name,
      })),
    },
  ]);

  if (launchersToDelete.length === 0) {
    console.log(chalk.gray("\nNo launchers selected.\n"));
    return;
  }

  const platform = process.platform;
  const scriptExt =
    platform === "win32" ? ".bat" : platform === "darwin" ? ".command" : ".sh";

  launchersToDelete.forEach((name) => {
    const scriptName = `ignite-${name}${scriptExt}`;
    const configName = `ignite-${name}.json`;
    const browserScriptName = `ignite-${name}-browser.bat`;

    const hopScriptPath = path.join(hopConfigDir, scriptName);
    const hopConfigPath = path.join(hopConfigDir, configName);
    const hopBrowserPath = path.join(hopConfigDir, browserScriptName);

    if (fs.existsSync(hopScriptPath)) fs.unlinkSync(hopScriptPath);
    if (fs.existsSync(hopConfigPath)) fs.unlinkSync(hopConfigPath);
    if (fs.existsSync(hopBrowserPath)) fs.unlinkSync(hopBrowserPath);

    const desktopScriptPath = path.join(desktopPath, scriptName);
    if (fs.existsSync(desktopScriptPath)) fs.unlinkSync(desktopScriptPath);

    console.log(chalk.green(`✓ Deleted: ${name}`));
  });

  console.log(
    chalk.green.bold(`\nDeleted ${launchersToDelete.length} launcher(s)\n`)
  );
}
