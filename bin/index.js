#!/usr/bin/env node
const [, , command, ...args] = process.argv;

async function main() {
  switch (command) {
    case "ignite": {
      const { default: ignite } = await import("../lib/ignite/index.js");
      await ignite(args[0], args.slice(1)); 
      break;
    }
    default:
      console.log(`Unknown command: ${command}`);
      console.log("Available command: ignite");
  }
}

main().catch((err) => console.error(err));
