import fs from "fs";
import path from "path";
import os from "os";
import chalk from "chalk";
import { hopConfigDir } from "./paths.js";

const RECENT_FILE = path.join(hopConfigDir, "recent.json");
const MAX_RECENT = 20;

function load() {
  try {
    if (!fs.existsSync(RECENT_FILE)) return [];
    const raw = fs.readFileSync(RECENT_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function save(list) {
  try {
    fs.writeFileSync(RECENT_FILE, JSON.stringify(list.slice(0, MAX_RECENT), null, 2));
  } catch (err) {
    console.log(chalk.red("Unable to update recent list:", err.message));
  }
}

export function addRecent(entry) {
  const list = load();
  const filtered = list.filter(i => i.path !== entry.path);
  filtered.unshift(entry);
  save(filtered);
}

export async function showRecent() {
  const list = load();
  if (list.length === 0) {
    console.log(chalk.yellow("\nNo recent projects found.\n"));
    return;
  }

  const choices = list.map((item, idx) => ({
    name: `${idx + 1}. ${item.name} - ${item.path}`,
    value: item
  }));

  const inquirer = await import("inquirer");
  const { pick } = await inquirer.prompt([
    {
      type: "list",
      name: "pick",
      message: "Select recent project to run:",
      choices
    }
  ]);

  const { runLauncher } = await import("../core/runLauncher.js");
  await runLauncher(pick.name, []);
}
