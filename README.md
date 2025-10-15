# hop-cli

A cross-platform CLI that generates instant launchers for your development projects.

With `hop`, you can open folders, run project commands, or spin up a full dev environment with a single click - all without repetitive terminal commands.

---

## Features

`hop` creates clickable launcher files on your Desktop for common developer workflows:

| Command      | Description                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `hop peek`   | Opens the current folder in the system file manager.                                                                       |
| `hop spark`  | Runs a project command (e.g., `npm start` or `yarn dev`) from the current folder.                                          |
| `hop ignite` | Opens the folder, runs a dev command, and launches a code editor (VS Code or another), giving a one-click dev environment. |

Supported platforms and launcher types:

* **Windows**: `.bat`
* **macOS**: `.command`
* **Linux**: `.sh` + optional `.desktop` for clickability

```
Note: Linux and macOS support are untested as of now.
```

---

## Installation

You can run `hop-cli` directly via `npx`, install it globally, or run it locally from the cloned repository.

### Option 1: Use NPX

```bash
npx @stephenpaul_03/hop peek
npx @stephenpaul_03/hop spark
npx @stephenpaul_03/hop ignite
```

### Option 2: Install Globally

```bash
npm install -g @stephenpaul_03/hop-cli
hop peek
hop spark
hop ignite
```

### Option 3: Local Development (Clone & Link)

1. Clone the repository:

```bash
git clone https://github.com/Stephenpaul-03/hop-cli.git
cd hop-cli
```

2. Install dependencies:

```bash
npm install
```

3. Link the package globally:

```bash
npm link
```

4. Run `hop` commands directly from anywhere:

```bash
hop peek
hop spark
hop ignite
```

5. To unlink later:

```bash
npm unlink -g hop-cli
```

---

## Usage Examples

### Peek

Quickly open your current project folder:

```bash
cd my-project
hop peek
```

### Spark

Run your project with a saved command:

```bash
cd my-project
hop spark
```

It will prompt for the command to run (default: `npm start`) and generate a clickable launcher on your Desktop.

### Ignite

Launch a full dev environment:

```bash
cd my-project
hop ignite
```

It will prompt for the dev command (default: `npm run dev`) and the code editor to use, then create a desktop launcher that opens everything in one click.

---

## Future Ideas

* `hop renew`: Edit or update existing launcher files.
* Profiles/presets for different project types.
* Auto-detection of frameworks to suggest commands.
