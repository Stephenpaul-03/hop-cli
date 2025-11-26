import inquirer from "inquirer";
import chalk from "chalk";

import { createLauncher } from "./core/createLauncher.js";
import { deleteLaunchers } from "./core/deleteLaunchers.js";
import { runLauncher } from "./core/runLauncher.js";
import { showRecent } from "./utils/recentStore.js";

function printHelp() {
  console.log(`
Usage:
  hop ignite                 Show main menu
  hop ignite <name>          Run launcher
  hop ignite <name> --direct Skip security warning
  hop ignite --quick         Create launcher using sensible defaults (interactive reduced)
  hop ignite --dry           Generate script and show preview without saving
  hop ignite recent          Show recently used projects
  hop ignite rename <old> <new>  Rename a launcher
  hop ignite delete          Delete launcher(s) via menu
  hop ignite help            Show this help
`);
}

export default async function ignite(projectName, flags = []) {
  if (projectName === "help" || flags.includes("--help") || flags.includes("-h")) {
    printHelp();
    return;
  }
  const quick = flags.includes("--quick");
  const dry = flags.includes("--dry");

  if (projectName === "rename") {
    const [oldName, newName] = flags;
    if (!oldName || !newName) {
      console.log(chalk.red("rename requires two arguments: oldName newName"));
      return;
    }
    const { renameLauncher } = await import("./core/renameLauncher.js");
    await renameLauncher(oldName, newName);
    return;
  }

  if (projectName === "recent") {
    await showRecent();
    return;
  }

  if (projectName === "delete") {
    await deleteLaunchers();
    return;
  }

  if (projectName && !projectName.startsWith("-")) {
    return runLauncher(projectName, flags);
  }

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
    await createLauncher({ quick, dry });
  } else {
    await deleteLaunchers();
  }
}
