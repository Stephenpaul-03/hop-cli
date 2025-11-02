#!/usr/bin/env node
import { fileURLToPath } from "url";
import path from "path";

const [, , command, ...args] = process.argv;

async function main() {
  switch (command) {
    case "ignite": {
      const { default: ignite } = await import("../lib/ignite.js");
      await ignite(args[0], args.slice(1)); // Pass remaining args as flags
      break;
    }
    default:
      console.log(`Unknown command: ${command}`);
      console.log("Available commands: spark, ignite");
  }
}

main().catch((err) => console.error(err));
