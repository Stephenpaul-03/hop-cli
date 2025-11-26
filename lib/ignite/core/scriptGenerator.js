import fs from "fs";
import path from "path";
import { hopConfigDir } from "../utils/paths.js";

export function generateScript({ config, cwd, folderName, platform }) {
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
      const browserScriptName = `ignite-${folderName}-browser.bat`;
      const browserScriptPath = path.join(hopConfigDir, browserScriptName);
      const browserScript = [
        "@echo off",
        `timeout /t ${config.browserDelay} /nobreak >nul`,
        ...config.browserUrls.map((url, i) => {
          let block = "";
          if (i > 0) block += `timeout /t 2 /nobreak >nul\n`;
          block += `start "" /B ${config.browser} "${url}"`;
          return block;
        }),
        "exit"
      ].join("\n");
      fs.writeFileSync(browserScriptPath, browserScript, { mode: 0o755 });
      scriptContent += `start "" /B cmd /c "${browserScriptPath}"\n`;
    }
    if (config.command) {
      scriptContent += `start "" cmd /c "cd /d \\"${cwd}\\" && ${config.command} || pause"\n`;
    }
    scriptContent += `exit\n`;
  }

  else {
    scriptExt = platform === "darwin" ? ".command" : ".sh";
    scriptContent = "#!/bin/bash\n";
    scriptContent += `cd "${cwd}"\n`;

    if (config.folder) {
      scriptContent +=
        platform === "darwin"
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
    if (config.command) {
      if (platform === "darwin") {
        scriptContent += `osascript -e 'tell application "Terminal" to do script "cd \\"${cwd}\\" && ${config.command} || (echo \\\"Command failed. Press any key...\\\" && read -n 1)"'\n`;
      } else {
        scriptContent += `
if command -v gnome-terminal >/dev/null 2>&1; then
  gnome-terminal -- bash -c "cd \\"${cwd}\\" && ${config.command} || (echo -e '\\nCommand failed. Press any key...' && read -n 1)"
elif command -v xterm >/dev/null 2>&1; then
  xterm -e bash -c "cd \\"${cwd}\\" && ${config.command} || (echo -e '\\nCommand failed. Press any key...' && read -n 1)" &
elif command -v konsole >/dev/null 2>&1; then
  konsole -e bash -c "cd \\"${cwd}\\" && ${config.command} || (echo -e '\\nCommand failed. Press any key...' && read -n 1)" &
else
  x-terminal-emulator -e bash -c "cd \\"${cwd}\\" && ${config.command} || (echo -e '\\nCommand failed. Press any key...' && read -n 1)" &
fi
`;
      }
    }

    scriptContent += `exit 0\n`;
  }

  return { scriptContent, scriptExt };
}
