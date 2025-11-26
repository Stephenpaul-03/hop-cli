import fs from "fs";
import os from "os";
import path from "path";
import chalk from "chalk";

export const hopConfigDir = path.join(os.homedir(), ".hop-cli", "launchers");

if (!fs.existsSync(hopConfigDir)) {
  fs.mkdirSync(hopConfigDir, { recursive: true });
}

export function getDesktopPath() {
  const desktopPath = path.join(os.homedir(), "Desktop");
  if (fs.existsSync(desktopPath)) {
    return desktopPath;
  }

  console.log(chalk.yellow("Desktop folder not found, using current directory"));
  return process.cwd();
}

export const desktopPath = getDesktopPath();
