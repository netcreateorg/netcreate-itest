# Build Tools

General purpose build utilities for creating standalone Node.js scripts.

## Usage

```bash
cd _tools
./dist-script <script.js> [--copy]
```

Creates a bundled version in `dist/` with all dependencies included. Use `--copy` to also place the bundle alongside the original script.

## Example

```bash
# Build any standalone script
./dist-script my-utility.js --copy

# Run the bundled version
./my-utility-dist.js [args...]
# or
node my-utility-dist.js [args...]
```

The bundled script can be distributed to other developers working on different branches without requiring dependency management.
