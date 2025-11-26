import { spawnSync } from "child_process";

export function commandExists(cmd) {
  if (!cmd) return false;

  if (process.platform === "win32") {
    const check = spawnSync("where", [cmd], {
      windowsHide: true,
      stdio: "ignore",
      shell: false
    });
    return check.status === 0;
  }

  const check = spawnSync("which", [cmd], {
    stdio: "ignore",
    shell: false
  });

  return check.status === 0;
}
