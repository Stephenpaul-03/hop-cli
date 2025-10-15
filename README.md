# Starter NPX Template

This is a barebones starter template for building your own **NPX package**. It comes with a simple CLI setup you can extend with custom commands.

## Features

* Basic CLI entrypoint (`cli.js`)
* Command-based routing (`type 1`, `type 2`, `type 3`)
* Preconfigured `bin` field in `package.json` for global usage
* Ready for local testing with `npm link`

## Installation & Local Testing

Clone the repo and set it up globally:

```bash
npm install
npm link
```

This will link your CLI command (`test-command`) globally. Now you can run it anywhere:

```bash
test-command type 1
# → redirects to type 1's logic

test-command type 2
# → redirects to type 2's logic

test-command type 3
# → redirects to type 3's logic
```

If you type an unknown command, you’ll get a helpful message:

```bash
test-command random
# → Unknown command: random
# → Available commands: type 1, type 2, type 3
```

## Using via NPX

Once published to npm, you’ll be able to run it without installing:

```bash
npx starter type 1
```

## File Structure

```
.
├── cli.js          # Main CLI entrypoint
├── package.json    # Project metadata & bin mapping
└── README.md       # This file
```

## Next Steps

* Replace the placeholder logic in each command with your own.
* Add more commands and features as needed.
* Publish your package with:

```bash
npm publish
```
