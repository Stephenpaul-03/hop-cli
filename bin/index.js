#!/usr/bin/env node
import { fileURLToPath } from "url";
import path from "path";

const [,, command, ...args] = process.argv;

async function main() {
  switch (command) {
    case "peek": {
      const { default: peek } = await import("../lib/peek.js");
      await peek(args);
      break;
    }
    case "spark": {
      const { default: spark } = await import("../lib/spark.js");
      await spark(args);
      break;
    }
    case "ignite":{
      const { default: ignite} = await import("../lib/ignite.js");
      await ignite(args)
      break;
    }
    default:
      console.log(`Unknown command: ${command}`);
      console.log("Available commands: spark, ignite");
  }
}

main().catch(err => console.error(err));
