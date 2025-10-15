import inquirer from "inquirer";
import fs from "fs";
import os from "os";
import path from "path";
import { execSync } from "child_process";
import chalk from "chalk";

export default async function ignite() {
  const cwd = process.cwd();
  const desktopPath = path.join(os.homedir(), "Desktop");
  const platform = os.platform();
  const folderName = path.basename(cwd);
  
  console.log(chalk.cyan.bold(`\nCurrent folder: ${chalk.white(cwd)}\n`));
  
  // Ask user for dev command
  const { devCommand } = await inquirer.prompt([
    {
      type: "input",
      name: "devCommand",
      message: chalk.yellow("Enter the command to run your project:"),
      default: "npm run dev"
    }
  ]);
  
  // Detect available editors
  const editors = [];
  const commonEditors = [
    { name: "VS Code", cmd: "code" },
    { name: "Sublime Text", cmd: "subl" },
    { name: "Atom", cmd: "atom" },
    { name: "WebStorm", cmd: "webstorm" },
    { name: "IntelliJ IDEA", cmd: "idea" }
  ];
  
  console.log(chalk.gray("\nDetecting available editors..."));
  
  commonEditors.forEach(e => {
    try {
      execSync(`${e.cmd} --version`, { stdio: "ignore" });
      editors.push(e);
      console.log(chalk.green(`  Found: ${e.name}`));
    } catch {}
  });
  
  // Add manual option
  editors.push({ name: "Other / custom command", cmd: "" });
  
  // Ask user to pick editor
  const { editorChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "editorChoice",
      message: chalk.yellow("\nSelect an editor to open:"),
      choices: editors.map(e => e.name)
    }
  ]);
  
  let editorCommand = "";
  const selectedEditor = editors.find(e => e.name === editorChoice);
  
  if (selectedEditor) {
    editorCommand = selectedEditor.cmd || await inquirer.prompt([{
      type: "input",
      name: "customCmd",
      message: chalk.yellow("Enter the command to open your editor:"),
      default: "code"
    }]).then(res => res.customCmd);
  }
  
  // Ensure folder is added to command
  if (!editorCommand.includes(cwd)) {
    if (editorCommand.trim().endsWith(".exe") || editorCommand === "code") {
      editorCommand += ` "${cwd}"`;
    } else if (!editorCommand.includes(" ")) {
      editorCommand += ` "${cwd}"`;
    }
  }
  
  console.log(chalk.magenta("\nGenerating ignite script..."));
  
  // --- WINDOWS ---
  if (platform === "win32") {
    const scriptName = `ignite-${folderName}.bat`;
    const scriptPath = path.join(desktopPath, scriptName);
    const scriptContent = `
@echo off
cd /d "${cwd}"
start .
start cmd /k "${devCommand}"
start ${editorCommand}
`.trimStart();
    
    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o666 });
    console.log(chalk.green.bold(`\nSuccess! Windows ignite script created:`));
    console.log(chalk.white(`  ${scriptPath}\n`));
  }
  // --- MACOS ---
  else if (platform === "darwin") {
    const scriptName = `ignite-${folderName}.command`;
    const scriptPath = path.join(desktopPath, scriptName);
    const scriptContent = `
#!/bin/bash
cd "${cwd}"
open "${cwd}"
${devCommand} &
${editorCommand} &
`.trimStart();
    
    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
    console.log(chalk.green.bold(`\nSuccess! macOS ignite launcher created:`));
    console.log(chalk.white(`  ${scriptPath}\n`));
  }
  // --- LINUX ---
  else if (platform === "linux") {
    const scriptName = `ignite-${folderName}.sh`;
    const scriptPath = path.join(desktopPath, scriptName);
    const scriptContent = `
#!/bin/bash
cd "${cwd}"
xdg-open "${cwd}" &
${devCommand} &
${editorCommand} &
`.trimStart();
    
    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
    console.log(chalk.green.bold(`\nSuccess! Linux ignite script created:`));
    console.log(chalk.white(`  ${scriptPath}\n`));
  }
}