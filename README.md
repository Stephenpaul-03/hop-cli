# hop-cli

A cross-platform CLI that builds **one-click launchers** for your development projects.

With `hop ignite`, you can open your dev folder, run a command, launch your code editor, and even open browsers to local URLs - all from a single desktop shortcut.

## Features

`hop ignite` is your all-in-one launcher generator:

| Action              | Description                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **Create Launcher** | Generates a desktop shortcut that can open folders, editors, browsers, and run project commands. |
| **Run Launcher**    | Instantly starts your saved dev environment from the terminal or desktop.                        |
| **Delete Launcher** | Easily clean up or remove old launcher scripts.                                                  |

Supported platforms and launcher types:

* **Windows**: `.bat`
* **macOS**: `.command`
* **Linux**: `.sh` + optional `.desktop` for manual clickability

```
Note: macOS support is untested as of now.
```

## Installation

You can run `hop-cli` directly via `npx`, install it globally, or run it locally from the repo.

### Option 1: Use NPX (no install)

```bash
npx @stephenpaul_03/hop ignite
```

### Option 2: Install Globally

```bash
npm install -g @stephenpaul_03/hop-cli
hop ignite
```

### Option 3: Local Development

1. Clone the repo:

   ```bash
   git clone https://github.com/Stephenpaul-03/hop-cli.git
   cd hop-cli
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Link globally:

   ```bash
   npm link
   ```
4. Run anywhere:

   ```bash
   hop ignite
   ```
5. To unlink later:

   ```bash
   npm unlink -g hop-cli
   ```

## Usage

### 1. Create a Launcher

From inside your project folder:

```bash
cd my-project
hop ignite
```

You’ll be guided through a few prompts to select what your launcher does:

* Open the project folder
* Run a command (like `npm run dev`)
* Launch your editor (`code`, `cursor`, `subl`, etc.)
* Open one or more browser URLs (with delay options)

Once done, `hop` will generate:

* A script in your Desktop folder
* A copy in `~/.hop-cli/launchers`
* A JSON config to track it all

Example output:

```
✨ Launcher created successfully!

📍 Locations:
   C:\Users\<you>\Desktop\ignite-my-project.bat
   C:\Users\<you>\.hop-cli\launchers\ignite-my-project.bat

🚀 Run with: hop ignite my-project
```


### 2. Run a Launcher

Once you’ve created a launcher:

```bash
hop ignite my-project
```

By default, it’ll confirm before running (for safety).

To skip confirmation:

```bash
hop ignite my-project --direct
```

### 3. Delete Launchers

To remove one or more launchers:

```bash
hop ignite
```

Then choose **Delete Launcher Script** from the menu and pick which ones to nuke.

## Launcher Behavior

Each generated launcher can do any combo of:

* **Open the project folder**
* **Run your dev command** (in a new terminal)
* **Launch your editor**
* **Open browsers** (local, network, or custom URLs — even multiple)
* **Delay browser opening** to wait for servers to start

Every launcher is stored safely in:

```
~/.hop-cli/launchers
```

and mirrored to your Desktop for quick access.
