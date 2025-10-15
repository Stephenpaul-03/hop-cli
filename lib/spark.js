import inquirer from "inquirer";
import fs from "fs";
import os from "os";
import path from "path";
import chalk from "chalk";

export default async function spark() {
  const cwd = process.cwd();
  const desktopPath = path.join(os.homedir(), "Desktop");
  const platform = os.platform();
  const folderName = path.basename(cwd);

  console.log(chalk.cyan.bold(`\nCurrent folder: ${chalk.white(cwd)}\n`));

  const { runCommand } = await inquirer.prompt([
    {
      type: "input",
      name: "runCommand",
      message: chalk.yellow("Enter the command to run your project:"),
      default: "npm start"
    }
  ]);

  console.log(chalk.magenta("\nGenerating launcher script...\n"));

  // --- WINDOWS ---
  if (platform === "win32") {
    const scriptName = `hop-${folderName}-spark.bat`;
    const scriptPath = path.join(desktopPath, scriptName);
    const scriptContent = `
@echo off
cd /d "${cwd}"
echo Running: ${runCommand}
${runCommand}
pause
`.trimStart();

    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o666 });
    console.log(chalk.green.bold("✅ Windows Spark script created:"));
    console.log(chalk.white(`  ${scriptPath}\n`));
  }

  // --- MACOS ---
  else if (platform === "darwin") {
    const scriptName = `hop-${folderName}-spark.command`;
    const scriptPath = path.join(desktopPath, scriptName);
    const scriptContent = `
#!/bin/bash
cd "${cwd}"
echo "Running: ${runCommand}"
${runCommand}
`.trimStart();

    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
    console.log(chalk.green.bold("✅ macOS Spark launcher created:"));
    console.log(chalk.white(`  ${scriptPath}\n`));
  }

  // --- LINUX ---
  else if (platform === "linux") {
    const scriptName = `hop-${folderName}-spark.sh`;
    const scriptPath = path.join(desktopPath, scriptName);
    const desktopFilePath = path.join(desktopPath, `hop-${folderName}-spark.desktop`);
    const scriptContent = `
#!/bin/bash
cd "${cwd}"
echo "Running: ${runCommand}"
${runCommand}
`.trimStart();

    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
    const desktopFileContent = `
[Desktop Entry]
Name=Hop Spark - ${folderName}
Exec=bash "${scriptPath}"
Type=Application
Terminal=true
`.trim();

    fs.writeFileSync(desktopFilePath, desktopFileContent);
    fs.chmodSync(desktopFilePath, 0o755);
    console.log(chalk.green.bold("✅ Linux Spark launcher created:"));
    console.log(chalk.white(`  ${desktopFilePath}\n`));
  }
}
