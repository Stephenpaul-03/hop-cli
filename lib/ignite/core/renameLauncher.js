import fs from "fs";
import path from "path";
import chalk from "chalk";
import { hopConfigDir, desktopPath } from "../utils/paths.js";

export async function renameLauncher(oldName, newName) {
  const platform = process.platform;
  const ext = platform === "win32" ? ".bat" : platform === "darwin" ? ".command" : ".sh";

  const oldScript = path.join(hopConfigDir, `ignite-${oldName}${ext}`);
  const oldConfig = path.join(hopConfigDir, `ignite-${oldName}.json`);
  const oldDesktop = path.join(desktopPath, `ignite-${oldName}${ext}`);

  if (!fs.existsSync(oldScript) && !fs.existsSync(oldConfig)) {
    console.log(chalk.red(`Launcher "${oldName}" not found.`));
    return;
  }

  const newScript = path.join(hopConfigDir, `ignite-${newName}${ext}`);
  const newConfig = path.join(hopConfigDir, `ignite-${newName}.json`);
  const newDesktop = path.join(desktopPath, `ignite-${newName}${ext}`);

  if (fs.existsSync(newScript) || fs.existsSync(newConfig)) {
    console.log(chalk.red(`A launcher with the name "${newName}" already exists. Aborting.`));
    return;
  }

  if (fs.existsSync(oldScript)) fs.renameSync(oldScript, newScript);
  if (fs.existsSync(oldConfig)) {
    const raw = fs.readFileSync(oldConfig, "utf-8");
    const json = JSON.parse(raw);
    json.name = newName;
    fs.writeFileSync(newConfig, JSON.stringify(json, null, 2));
    fs.unlinkSync(oldConfig);
  }
  if (fs.existsSync(oldDesktop)) fs.renameSync(oldDesktop, newDesktop);

  console.log(chalk.green(`Renamed launcher "${oldName}" -> "${newName}"`));
}
