import inquirer from "inquirer";
import fs from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import chalk from "chalk";

// Get the hop config directory
const hopConfigDir = path.join(os.homedir(), ".hop-cli", "launchers");

// Ensure hop config directory exists
if (!fs.existsSync(hopConfigDir)) {
  fs.mkdirSync(hopConfigDir, { recursive: true });
}

// Get Desktop path with fallback to current directory
function getDesktopPath() {
  const desktopPath = path.join(os.homedir(), "Desktop");
  if (fs.existsSync(desktopPath)) {
    return desktopPath;
  }
  console.log(chalk.yellow("⚠️  Desktop folder not found, using current directory"));
  return process.cwd();
}

const desktopPath = getDesktopPath();

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

function writeScriptFiles(scriptName, scriptContent, configData) {
  const hopScriptPath = path.join(hopConfigDir, scriptName);
  const desktopScriptPath = path.join(desktopPath, scriptName);
  const configPath = path.join(hopConfigDir, `${path.parse(scriptName).name}.json`);
  
  try {
    // Write config
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    
    // Write scripts
    fs.writeFileSync(hopScriptPath, scriptContent, { mode: 0o755 });
    fs.writeFileSync(desktopScriptPath, scriptContent, { mode: 0o755 });
    
    return { hopScriptPath, desktopScriptPath };
  } catch (err) {
    console.log(chalk.red(`\n❌ Error writing files: ${err.message}\n`));
    throw err;
  }
}

async function createLauncher() {
  const cwd = process.cwd();
  const folderName = path.basename(cwd);
  const platform = os.platform();
  
  console.log(chalk.cyan.bold(`\n🚀 Creating launcher for: ${chalk.white(folderName)}\n`));
  
  // Step 1: Feature selection
  const { features } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "features",
      message: chalk.yellow("Select features for your launcher:"),
      choices: [
        { name: "Open Folder", value: "folder", checked: true },
        { name: "Run Execution Command", value: "command", checked: true },
        { name: "Open Code Editor", value: "editor", checked: true },
        { name: "Open Browser", value: "browser", checked: false }
      ]
    }
  ]);
  
  const config = {
    folder: features.includes("folder"),
    command: null,
    editor: null,
    browser: null,
    browserUrls: [],
    browserDelay: 3
  };
  
  // Step 2: Handle Execution Command
  if (features.includes("command")) {
    const { executionCommand } = await inquirer.prompt([
      {
        type: "input",
        name: "executionCommand",
        message: chalk.yellow("Enter execution command:"),
        default: "npm run dev",
        validate: (input) => input.trim() ? true : "Command cannot be empty"
      }
    ]);
    config.command = executionCommand;
  }
  
  // Step 3: Handle Code Editor
  if (features.includes("editor")) {
    const { editorCommand } = await inquirer.prompt([
      {
        type: "input",
        name: "editorCommand",
        message: chalk.yellow("Enter code editor command (e.g., code, cursor, subl):"),
        default: "code",
        validate: (input) => input.trim() ? true : "Command cannot be empty"
      }
    ]);
    config.editor = editorCommand;
  }
  
  // Step 4: Handle Browser
  if (features.includes("browser")) {
    if (config.command) {
      // Ask for port
      const { port } = await inquirer.prompt([
        {
          type: "input",
          name: "port",
          message: chalk.yellow("Enter port number:"),
          default: "3000",
          validate: (input) => {
            const num = parseInt(input);
            return (num > 0 && num < 65536) ? true : "Enter a valid port (1-65535)";
          }
        }
      ]);
      
      const localIp = getLocalIp();
      
      const { urlType } = await inquirer.prompt([
        {
          type: "list",
          name: "urlType",
          message: chalk.yellow("Which URL to open?"),
          choices: [
            { name: `Localhost (http://localhost:${port})`, value: "localhost" },
            { name: `Network (http://${localIp}:${port})`, value: "network" },
            { name: "Custom URL", value: "custom" }
          ]
        }
      ]);
      
      if (urlType === "localhost") {
        config.browserUrls.push(`http://localhost:${port}`);
      } else if (urlType === "network") {
        config.browserUrls.push(`http://${localIp}:${port}`);
      } else {
        const { customUrl } = await inquirer.prompt([
          {
            type: "input",
            name: "customUrl",
            message: "Enter URL:",
            default: `http://localhost:${port}`
          }
        ]);
        config.browserUrls.push(customUrl);
      }
      
      // Ask for delay configuration
      const { configureDelay } = await inquirer.prompt([
        {
          type: "confirm",
          name: "configureDelay",
          message: "Configure browser open delay?",
          default: false
        }
      ]);
      
      if (configureDelay) {
        const { delay } = await inquirer.prompt([
          {
            type: "number",
            name: "delay",
            message: "Delay in seconds before opening browser:",
            default: 3,
            validate: (val) => val >= 0 && val <= 60 || "Enter a value between 0-60"
          }
        ]);
        config.browserDelay = delay;
      }
      
      // Ask for additional URLs
      const { moreUrls } = await inquirer.prompt([
        {
          type: "confirm",
          name: "moreUrls",
          message: "Open additional URLs?",
          default: false
        }
      ]);
      
      if (moreUrls) {
        let addingUrls = true;
        while (addingUrls) {
          const { additionalUrl } = await inquirer.prompt([
            {
              type: "input",
              name: "additionalUrl",
              message: "Enter URL (or leave empty to finish):"
            }
          ]);
          
          if (additionalUrl.trim()) {
            config.browserUrls.push(additionalUrl.trim());
          } else {
            addingUrls = false;
          }
        }
      }
    } else {
      // No execution command, just ask for URLs
      let addingUrls = true;
      while (addingUrls) {
        const { url } = await inquirer.prompt([
          {
            type: "input",
            name: "url",
            message: config.browserUrls.length === 0 
              ? "Enter URL to open:" 
              : "Enter another URL (or leave empty to finish):",
            default: config.browserUrls.length === 0 ? "https://google.com" : ""
          }
        ]);
        
        if (url.trim()) {
          config.browserUrls.push(url.trim());
        } else if (config.browserUrls.length > 0) {
          addingUrls = false;
        }
      }
    }
    
    // Ask for browser command
    const { browserCommand } = await inquirer.prompt([
      {
        type: "input",
        name: "browserCommand",
        message: chalk.yellow("Enter browser command:"),
        default: platform === "win32" ? "start chrome" : (platform === "darwin" ? "open -a 'Google Chrome'" : "google-chrome"),
        validate: (input) => input.trim() ? true : "Command cannot be empty"
      }
    ]);
    config.browser = browserCommand;
  }
  
  // Generate script content based on platform
  let scriptContent = "";
  let scriptExt = "";
  
  if (platform === "win32") {
    scriptExt = ".bat";
    scriptContent = "@echo off\n";
    scriptContent += `cd /d "${cwd}"\n`;
    
    if (config.folder) {
      scriptContent += `start "" "${cwd}"\n`;
    }
    
    if (config.editor) {
      scriptContent += `start "" /B ${config.editor} "${cwd}"\n`;
    }
    
    if (config.browser && config.browserUrls.length > 0) {
      // Create a separate batch file for browser opening
      const browserScriptContent = `@echo off\ntimeout /t ${config.browserDelay} /nobreak >nul\n` +
        config.browserUrls.map((url, i) => 
          (i > 0 ? `timeout /t 2 /nobreak >nul\n` : '') + 
          `start "" /B ${config.browser} "${url}"\n`
        ).join('') +
        `exit\n`;
      
      const browserScriptName = `ignite-${folderName}-browser.bat`;
      const browserScriptPath = path.join(hopConfigDir, browserScriptName);
      fs.writeFileSync(browserScriptPath, browserScriptContent, { mode: 0o755 });
      
      // Launch the browser script in background
      scriptContent += `start "" /B cmd /c "${browserScriptPath}"\n`;
    }
    
    // Run command in NEW interactive terminal (closes on success, stays open on error, allows Ctrl+C)
    if (config.command) {
      scriptContent += `start "" cmd /c "cd /d "${cwd}" && ${config.command} || pause"\n`;
    }
    
    scriptContent += `exit\n`;
  } else {
    scriptExt = platform === "darwin" ? ".command" : ".sh";
    scriptContent = "#!/bin/bash\n";
    scriptContent += `cd "${cwd}"\n`;
    
    if (config.folder) {
      scriptContent += platform === "darwin" 
        ? `open "${cwd}"\n` 
        : `xdg-open "${cwd}" &\n`;
    }
    
    if (config.editor) {
      scriptContent += `${config.editor} "${cwd}" &\n`;
    }
    
    if (config.browser && config.browserUrls.length > 0) {
      scriptContent += `(sleep ${config.browserDelay}`;
      config.browserUrls.forEach((url, i) => {
        if (i > 0) scriptContent += ` && sleep 2`;
        scriptContent += ` && ${config.browser} "${url}"`;
      });
      scriptContent += `) &\n`;
    }
    
    // Run command in NEW interactive terminal (closes on success, stays open on error, allows Ctrl+C)
    if (config.command) {
      if (platform === "darwin") {
        // macOS: Open new Terminal window with error handling
        scriptContent += `osascript -e 'tell application "Terminal" to do script "cd \\"${cwd}\\" && ${config.command} || (echo \\\"\\\\n❌ Command failed. Press any key to close...\\\" && read -n 1)"'\n`;
      } else {
        // Linux: Try common terminal emulators with error handling
        scriptContent += `if command -v gnome-terminal >/dev/null 2>&1; then\n`;
        scriptContent += `  gnome-terminal -- bash -c "cd \\"${cwd}\\" && ${config.command} || (echo -e '\\\\n❌ Command failed. Press any key to close...' && read -n 1)"\n`;
        scriptContent += `elif command -v xterm >/dev/null 2>&1; then\n`;
        scriptContent += `  xterm -e bash -c "cd \\"${cwd}\\" && ${config.command} || (echo -e '\\\\n❌ Command failed. Press any key to close...' && read -n 1)" &\n`;
        scriptContent += `elif command -v konsole >/dev/null 2>&1; then\n`;
        scriptContent += `  konsole -e bash -c "cd \\"${cwd}\\" && ${config.command} || (echo -e '\\\\n❌ Command failed. Press any key to close...' && read -n 1)" &\n`;
        scriptContent += `else\n`;
        scriptContent += `  x-terminal-emulator -e bash -c "cd \\"${cwd}\\" && ${config.command} || (echo -e '\\\\n❌ Command failed. Press any key to close...' && read -n 1)" &\n`;
        scriptContent += `fi\n`;
      }
    }
    
    scriptContent += `exit 0\n`;
  }
  
  // Save files
  const scriptName = `ignite-${folderName}${scriptExt}`;
  const configData = {
    name: folderName,
    path: cwd,
    config,
    createdAt: new Date().toISOString()
  };
  
  const { hopScriptPath, desktopScriptPath } = writeScriptFiles(scriptName, scriptContent, configData);
  
  console.log(chalk.green.bold("\n✨ Launcher created successfully!\n"));
  console.log(chalk.white("📍 Locations:"));
  console.log(chalk.gray(`   ${hopScriptPath}`));
  console.log(chalk.gray(`   ${desktopScriptPath}`));
  console.log(chalk.white(`\n🚀 Run with: ${chalk.cyan(`hop ignite ${folderName}`)}`));
}

async function deleteLaunchers() {
  const files = fs.readdirSync(hopConfigDir);
  const configs = files
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try {
        const config = JSON.parse(fs.readFileSync(path.join(hopConfigDir, f), "utf-8"));
        return {
          name: config.name,
          path: config.path,
          created: new Date(config.createdAt).toLocaleString(),
          exists: fs.existsSync(config.path)
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  
  if (configs.length === 0) {
    console.log(chalk.yellow("\n⚠️  No launchers found.\n"));
    return;
  }
  
  const { launchersToDelete } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "launchersToDelete",
      message: chalk.yellow("Select launchers to delete:"),
      choices: configs.map(c => ({
        name: `${c.name} ${!c.exists ? chalk.red("(path missing)") : ""} - ${c.path} - Created: ${c.created}`,
        value: c.name
      }))
    }
  ]);
  
  if (launchersToDelete.length === 0) {
    console.log(chalk.gray("\nNo launchers selected.\n"));
    return;
  }
  
  const platform = os.platform();
  const scriptExt = platform === "win32" ? ".bat" : (platform === "darwin" ? ".command" : ".sh");
  
  launchersToDelete.forEach(name => {
    const scriptName = `ignite-${name}${scriptExt}`;
    const configName = `ignite-${name}.json`;
    const browserScriptName = `ignite-${name}-browser.bat`;
    
    const hopScriptPath = path.join(hopConfigDir, scriptName);
    const hopConfigPath = path.join(hopConfigDir, configName);
    const hopBrowserScriptPath = path.join(hopConfigDir, browserScriptName);
    
    if (fs.existsSync(hopScriptPath)) fs.unlinkSync(hopScriptPath);
    if (fs.existsSync(hopConfigPath)) fs.unlinkSync(hopConfigPath);
    if (fs.existsSync(hopBrowserScriptPath)) fs.unlinkSync(hopBrowserScriptPath);
    
    const desktopScriptPath = path.join(desktopPath, scriptName);
    if (fs.existsSync(desktopScriptPath)) fs.unlinkSync(desktopScriptPath);
    
    console.log(chalk.green(`✓ Deleted: ${name}`));
  });
  
  console.log(chalk.green.bold(`\n✨ Deleted ${launchersToDelete.length} launcher(s)\n`));
}

export default async function ignite(projectName, flags = []) {
  const directRun = flags.includes("--direct");
  
  // If projectName is provided, try to run that launcher
  if (projectName) {
    const platform = os.platform();
    const scriptExt = platform === "win32" ? ".bat" : (platform === "darwin" ? ".command" : ".sh");
    const scriptPath = path.join(hopConfigDir, `ignite-${projectName}${scriptExt}`);
    const configPath = path.join(hopConfigDir, `ignite-${projectName}.json`);
    
    if (fs.existsSync(scriptPath)) {
      // Check if project path still exists
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
          
          if (!fs.existsSync(config.path)) {
            console.log(chalk.yellow(`\n⚠️  Project path no longer exists: ${config.path}`));
            const { deleteLauncher } = await inquirer.prompt([
              {
                type: "confirm",
                name: "deleteLauncher",
                message: "Would you like to delete this launcher?",
                default: true
              }
            ]);
            
            if (deleteLauncher) {
              fs.unlinkSync(scriptPath);
              fs.unlinkSync(configPath);
              const desktopScriptPath = path.join(desktopPath, `ignite-${projectName}${scriptExt}`);
              if (fs.existsSync(desktopScriptPath)) fs.unlinkSync(desktopScriptPath);
              console.log(chalk.green("\n✓ Launcher deleted\n"));
            }
            return;
          }
        } catch (err) {
          console.log(chalk.red(`\n❌ Error reading config: ${err.message}\n`));
          return;
        }
      }
      
      // Show warning unless --direct flag is used
      if (!directRun) {
        console.log(chalk.yellow.bold("\n⚠️  SECURITY WARNING"));
        console.log(chalk.white("You are about to run a launcher script."));
        console.log(chalk.white("Only run this if YOU created this launcher."));
        console.log(chalk.red("Running untrusted scripts can harm your system.\n"));
        
        const { confirmRun } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirmRun",
            message: "Do you want to continue?",
            default: false
          }
        ]);
        
        if (!confirmRun) {
          console.log(chalk.gray("\nLauncher not executed.\n"));
          console.log(chalk.gray(`Tip: Use ${chalk.cyan(`hop ignite ${projectName} --direct`)} to skip this warning.\n`));
          return;
        }
      }
      
      console.log(chalk.cyan(`\n🚀 Launching ${projectName}...\n`));
      
      // Use spawn with detached process
      if (platform === "win32") {
        spawn("cmd", ["/c", scriptPath], {
          detached: true,
          stdio: "ignore",
          shell: true
        }).unref();
      } else {
        spawn("/bin/bash", [scriptPath], {
          detached: true,
          stdio: "ignore"
        }).unref();
      }
      return;
    } else {
      console.log(chalk.red(`\n❌ Launcher "${projectName}" not found.\n`));
      console.log(chalk.gray("Run 'hop ignite' to create a new launcher.\n"));
      return;
    }
  }
  
  // Main menu
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: chalk.cyan.bold("What would you like to do?"),
      choices: [
        { name: "Create Launcher Script", value: "create" },
        { name: "Delete Launcher Script", value: "delete" }
      ]
    }
  ]);
  
  if (action === "create") {
    await createLauncher();
  } else {
    await deleteLaunchers();
  }
}