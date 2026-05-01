# 🚀 Create Backup & Archiver

This is a high-performance and intelligent archiving script that runs on **Bun**
and **Deno 2.0+**. It creates organized backups by packaging folders
individually and loose files in bulk.

## ✨ Key Features

- **Dual Runtime Support:** Works with both Bun and Deno without any code
  changes.
- **Smart Packaging Order:** Processes root-level files (`subfiles`) first, then
  folders.
- **Split Archive (Volume) Intelligence:** Automatically detects `.001`
  extensions created when using the `-v` parameter.
- **Automatic Verification:** Checks data integrity with `7z t` command after
  each archiving.
- **Content Index:** Adds content list (`.txt`) next to each archive with the
  `--list` parameter.
- **Deno 2.0 Strict Mode:** Compatible with `deno check` for full type safety.

## 🛠️ Prerequisites

**7-Zip** must be installed on your system:

- **Windows:** `7z` command must be in PATH.
- **macOS/Linux:** `7zz` (or `p7zip`) must be installed.

## 🚀 Usage Guide

### Basic Command Structure

The `-o` (output) parameter is **required** for the application to run.

```bash
# Run with Bun
bun createBackup.ts -o /backup/path [options]

# Run with Deno
deno run -A createBackup.ts -o /backup/path [options]
```

### Compile as Binary

```bash
# For current operating system
deno compile -A --output createBackup createBackup.ts
# or
bun build ./createBackup.ts --compile --outfile createBackup

# For different platforms
# For Windows (.exe)
deno compile -A --target x86_64-pc-windows-msvc --output createBackup createBackup.ts
# or
bun build ./createBackup.ts --compile --target=bun-windows-x64-static --outfile createBackup.exe

# For Linux
deno compile -A --target x86_64-unknown-linux-gnu --output createBackup createBackup.ts
```

## ⚙️ Parameters

| Option          | Description                                                | Default | Example                  |
| :-------------- | :--------------------------------------------------------- | :------ | :----------------------- |
| **`-o`**        | **(Required)** Target folder where archives will be saved. | -       | `-o ./backups`           |
| **`-mx[0-9]`**  | Compression level (0: Store, 9: Maximum).                  | `-mx5`  | `-mx9`                   |
| **`-v[size]`**  | Splits archive into parts of specified size.               | -       | `-v50m`                  |
| **`--list`**    | Reports archive contents to a `.txt` file.                 | Off     | `--list`                 |
| **`--exclude`** | Excludes a specific file/folder from the archive.          | -       | `--exclude node_modules` |
