import fs from "fs";
import path from "path";
import chalk from "chalk";
import { hopConfigDir, desktopPath } from "./paths.js";

export function writeScriptFiles(scriptName, scriptContent, configData) {
  const hopScriptPath = path.join(hopConfigDir, scriptName);
  const desktopScriptPath = path.join(desktopPath, scriptName);
  const configPath = path.join(
    hopConfigDir,
    `${path.parse(scriptName).name}.json`
  );

  try {
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    fs.writeFileSync(hopScriptPath, scriptContent, { mode: 0o755 });
    fs.writeFileSync(desktopScriptPath, scriptContent, { mode: 0o755 });

    return { hopScriptPath, desktopScriptPath };
  } catch (err) {
    console.log(chalk.red(`Error writing files: ${err.message}`));
    throw err;
  }
}
