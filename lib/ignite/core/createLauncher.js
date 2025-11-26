import inquirer from "inquirer";
import fs from "fs";
import os from "os";
import path from "path";
import chalk from "chalk";

import { getLocalIp } from "../utils/ip.js";
import { writeScriptFiles } from "../utils/fileWriter.js";
import { hopConfigDir, desktopPath } from "../utils/paths.js";
import { generateScript } from "./scriptGenerator.js";

import { addRecent } from "../utils/recentStore.js";
import { commandExists } from "../utils/validation.js";
import { runLauncher } from "./runLauncher.js";

export async function createLauncher(opts = {}) {
  const { quick = false, dry = false } = opts;

  const cwd = process.cwd();
  const folderName = path.basename(cwd);
  const platform = os.platform();

  console.log(chalk.cyan.bold(`\nCreating launcher for: ${chalk.white(folderName)}`));
  console.log(chalk.cyan("Let's set up your launcher in a few steps...\n"));

  const { launcherName } = await inquirer.prompt([
    {
      type: "input",
      name: "launcherName",
      message: chalk.yellow("What should this launcher be called?"),
      default: folderName,
      validate: input => input.trim() ? true : "Launcher name cannot be empty"
    }
  ]);

  const finalName = launcherName.trim();

  const scriptExt =
    platform === "win32" ? ".bat" : platform === "darwin" ? ".command" : ".sh";

  const scriptName = `ignite-${finalName}${scriptExt}`;
  const configFilePath = path.join(hopConfigDir, `ignite-${finalName}.json`);
  const hopScriptPath = path.join(hopConfigDir, scriptName);
  const desktopScriptPath = path.join(desktopPath, scriptName);

  const alreadyExists =
    fs.existsSync(hopScriptPath) || fs.existsSync(desktopScriptPath);

  if (alreadyExists && !quick) {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: chalk.red(`A launcher named "${finalName}" already exists. Overwrite it?`),
        default: false
      }
    ]);

    if (!overwrite) {
      console.log(chalk.gray("\nAborted. Launcher not changed.\n"));
      return;
    }
  }

  let config = {
    folder: true,
    command: "npm run dev",
    editor: "code",
    browser: null,
    browserUrls: [],
    browserDelay: 3
  };

  if (!quick) {
    console.log(chalk.bold("\nStep 2: Choose what this launcher should do\n"));

    const { features } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "features",
        message: chalk.yellow("Select features:"),
        choices: [
          { name: "Open Folder", value: "folder", checked: true },
          { name: "Run Execution Command", value: "command", checked: true },
          { name: "Open Code Editor", value: "editor", checked: true },
          { name: "Open Browser", value: "browser", checked: false }
        ]
      }
    ]);

    config.folder = features.includes("folder");
    config.command = features.includes("command") ? config.command : null;
    config.editor = features.includes("editor") ? config.editor : null;
    config.browser = null; 

    if (features.includes("command")) {
      console.log(chalk.bold("\nStep 3: Execution Command\n"));

      const { executionCommand } = await inquirer.prompt([
        {
          type: "input",
          name: "executionCommand",
          message: chalk.yellow("Enter execution command:"),
          default: "npm run dev",
          validate: input => input.trim() ? true : "Command cannot be empty"
        }
      ]);

      config.command = executionCommand;
    }

    if (features.includes("editor")) {
      console.log(chalk.bold("\nStep 4: Editor Setup\n"));

      let editorOk = false;

      while (!editorOk) {
        const { editorCommand } = await inquirer.prompt([
          {
            type: "input",
            name: "editorCommand",
            message: chalk.yellow("Enter code editor command (e.g. code):"),
            default: config.editor
          }
        ]);

        config.editor = editorCommand;

        if (commandExists(editorCommand.split(" ")[0])) {
          editorOk = true;
        } else {
          console.log(chalk.red(`Editor command "${editorCommand}" not found.`));
          const { retry } = await inquirer.prompt([
            {
              type: "confirm",
              name: "retry",
              message: "Try a different editor command?",
              default: true
            }
          ]);

          if (!retry) editorOk = true;
        }
      }
    }

    if (features.includes("browser")) {
      console.log(chalk.bold("\nStep 5: Browser Setup\n"));

      const localIp = getLocalIp();

      const { browserMode } = await inquirer.prompt([
        {
          type: "list",
          name: "browserMode",
          message: chalk.yellow("How should the browser open?"),
          choices: [
            { name: "Localhost URL", value: "localhost" },
            { name: "Local network URL", value: "network" },
            { name: "Custom URL", value: "custom" },
            { name: "No browser", value: "none" }
          ]
        }
      ]);

      if (browserMode !== "none") {
        let url = null;

        if (browserMode === "localhost") {
          const { port } = await inquirer.prompt([
            {
              type: "input",
              name: "port",
              message: chalk.yellow("Enter port number:"),
              default: "3000",
              validate: v => {
                const n = parseInt(v);
                return n > 0 && n < 65536 ? true : "Enter valid port";
              }
            }
          ]);
          url = `http://localhost:${port}`;
        }

        if (browserMode === "network") {
          const { port } = await inquirer.prompt([
            {
              type: "input",
              name: "port",
              message: chalk.yellow("Enter port number:"),
              default: "3000"
            }
          ]);
          url = `http://${localIp}:${port}`;
        }

        if (browserMode === "custom") {
          const { customUrl } = await inquirer.prompt([
            {
              type: "input",
              name: "customUrl",
              message: "Enter full URL:",
              default: "https://google.com"
            }
          ]);
          url = customUrl;
        }

        config.browserUrls.push(url);

        const { delay } = await inquirer.prompt([
          {
            type: "number",
            name: "delay",
            message: "Browser delay (seconds):",
            default: 3
          }
        ]);

        config.browserDelay = delay;

        let browserOk = false;
        while (!browserOk) {
          const { browserCmd } = await inquirer.prompt([
            {
              type: "input",
              name: "browserCmd",
              message: chalk.yellow("Browser command:"),
              default:
                platform === "win32"
                  ? "start chrome"
                  : platform === "darwin"
                  ? "open -a 'Google Chrome'"
                  : "google-chrome"
            }
          ]);

          config.browser = browserCmd;

          if (commandExists(browserCmd.split(" ")[0])) {
            browserOk = true;
          } else {
            console.log(chalk.red(`Browser command "${browserCmd}" not found.`));

            const { retry } = await inquirer.prompt([
              {
                type: "confirm",
                name: "retry",
                message: "Try another browser command?",
                default: true
              }
            ]);

            if (!retry) browserOk = true;
          }
        }
      }
    }
  }

  if (!quick) {
    console.log(chalk.bold("\nFinal Summary"));
    console.log(chalk.gray("----------------------------------"));
    console.log(`Name: ${finalName}`);
    console.log(`Open Folder: ${config.folder}`);
    console.log(`Command: ${config.command || "none"}`);
    console.log(`Editor: ${config.editor || "none"}`);
    console.log(`Browser: ${config.browser || "none"}`);
    console.log(`URLs: ${config.browserUrls.join(", ") || "none"}`);
    console.log(`Delay: ${config.browserDelay}s`);
    console.log(chalk.gray("----------------------------------\n"));

    const { save } = await inquirer.prompt([
      {
        type: "confirm",
        name: "save",
        message: chalk.green("Save this launcher?"),
        default: true
      }
    ]);

    if (!save) {
      console.log(chalk.gray("\nCanceled. Launcher not saved.\n"));
      return;
    }
  }

  const { scriptContent, scriptExt: ext } = generateScript({
    config,
    cwd,
    folderName: finalName,
    platform
  });

  if (dry) {
    console.log(chalk.bold("\nDry Run — Script Preview:"));
    console.log("--------------------------------------------------");
    console.log(scriptContent);
    console.log("--------------------------------------------------");
    return;
  }

  const result = writeScriptFiles(
    `ignite-${finalName}${ext}`,
    scriptContent,
    {
      name: finalName,
      path: cwd,
      config,
      createdAt: new Date().toISOString()
    }
  );

  addRecent({ name: finalName, path: cwd, createdAt: new Date().toISOString() });

  console.log(chalk.green.bold("\n✨ Launcher created successfully!\n"));
  console.log(chalk.white(`Run with: ${chalk.cyan(`hop ignite ${finalName}`)}`));

  const { runNow } = await inquirer.prompt([
    {
      type: "confirm",
      name: "runNow",
      message: "Run this launcher now?",
      default: false
    }
  ]);

  if (runNow) {
    await runLauncher(finalName, ["--direct"]);
  }
}
