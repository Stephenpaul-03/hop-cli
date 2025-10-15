import fs from "fs";
import os from "os";
import path from "path";
import chalk from "chalk";

export default async function peek() {
  const cwd = process.cwd();
  const desktopPath = path.join(os.homedir(), "Desktop");
  const platform = os.platform();
  const folderName = path.basename(cwd);

  console.log(chalk.cyan.bold(`\nCreating folder opener for:`));
  console.log(chalk.white(`  ${cwd}\n`));

  // --- WINDOWS ---
  if (platform === "win32") {
    const scriptName = `hop-${folderName}-peek.bat`;
    const scriptPath = path.join(desktopPath, scriptName);
    const scriptContent = `
@echo off
cd /d "${cwd}"
start .
`.trimStart();

    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o666 });
    console.log(chalk.green.bold("✅ Windows Peek script created:"));
    console.log(chalk.white(`  ${scriptPath}\n`));
  }

  // --- MACOS ---
  else if (platform === "darwin") {
    const scriptName = `hop-${folderName}-peek.command`;
    const scriptPath = path.join(desktopPath, scriptName);
    const scriptContent = `
#!/bin/bash
cd "${cwd}"
open "${cwd}"
`.trimStart();

    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
    console.log(chalk.green.bold("✅ macOS Peek launcher created:"));
    console.log(chalk.white(`  ${scriptPath}\n`));
  }

  // --- LINUX ---
  else if (platform === "linux") {
    const scriptName = `hop-${folderName}-peek.sh`;
    const scriptPath = path.join(desktopPath, scriptName);
    const desktopFilePath = path.join(desktopPath, `hop-${folderName}-peek.desktop`);
    const scriptContent = `
#!/bin/bash
cd "${cwd}"
xdg-open "${cwd}"
`.trimStart();

    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
    const desktopFileContent = `
[Desktop Entry]
Name=Hop Peek - ${folderName}
Exec=bash "${scriptPath}"
Type=Application
Terminal=false
`.trim();

    fs.writeFileSync(desktopFilePath, desktopFileContent);
    fs.chmodSync(desktopFilePath, 0o755);
    console.log(chalk.green.bold("✅ Linux Peek launcher created:"));
    console.log(chalk.white(`  ${desktopFilePath}\n`));
  }
}
