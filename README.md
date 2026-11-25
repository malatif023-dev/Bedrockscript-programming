# Bedrockscript Programming Language

A JavaScript-inspired browser scripting language with custom Bedrock-flavored commands.

## CDN
Once this file is committed to the repository's `main` branch, load the interpreter:

```html
<script src="https://cdn.jsdelivr.net/gh/malatif023-dev/Bedrockscript-programming@main/bedrockscript.js"></script>
```

Then use `Bedrockscript.run(source)` or `Bedrockscript.execute(source, outputElement)`.

## Example

```bedrockscript
set player = "Mahadi"
say "Hello!"
say player
command title "Welcome"
repeat 3 times
  say "Mining..."
end
```

## Supported in v0.1
- `say expression`
- `set name = expression`
- `command title "text"`
- `command sound "sound-name"` (prints a sound event; audio integration is a later feature)
- `command clear`
- `repeat N times ... end`
- `if expression then ... end`
- Simple JavaScript-like declarations and `console.log(...)`

This is an early interpreter prototype, not a full JavaScript engine. Do not run untrusted scripts.
