import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, join, normalize, resolve } from "node:path";

const isWindows = typeof process !== "undefined"
  ? process.platform === "win32"
  : (globalThis as any).Deno?.build.os === "windows";
const cmd = isWindows ? "7z" : "7zz";
const rawArgs = typeof process !== "undefined"
  ? process.argv.slice(2)
  : (globalThis as any).Deno.args;

// --- CRITICAL CHECK: Is -o parameter present? ---
const targetIndex = rawArgs.indexOf("-o");
const targetDirArgRaw = targetIndex !== -1 ? rawArgs[targetIndex + 1] : null;

function showHelp(errorMsg?: string) {
  if (errorMsg) {
    console.error(`❌ ERROR: ${errorMsg}`);
  }
  console.log(`
🚀 Create Backup Archiver - v1.0
---------------------------------------------
Usage: [runtime] script.ts -o [target_folder] [options]

Required Parameters:
  -o [path]        : Target folder where archives will be saved (REQUIRED)

Options:
  -mx[0-9]        : Compression level (Ex: -mx0)
  -v[size]        : Split archive (Ex: -v50m)
  --exclude [name]: File/folder to exclude
  --list          : Creates content list (.txt).

Example:
  bun createBackup.ts -o ../output -mx0 --list
  deno run -A createBackup.ts -o ./backups -v100m
  ./createBackup -o ../output -mx0 --list
  `);
}

// Parametre kontrolü ve çıkış
if (!targetDirArgRaw || targetDirArgRaw.startsWith("-")) {
  showHelp("Target folder not specified! (-o parameter is required)");
  process.exit(1);
}

const targetDirArg = normalize(targetDirArgRaw);

// Tip tanımlamaları eklendi: (a: string) ve (i: number)
const compressionLevel = rawArgs.find((a: string) => a.startsWith("-mx")) ||
  "-mx5";
const volumeSize = rawArgs.find((a: string) => a.startsWith("-v")) || "";
const excludeName =
  rawArgs.find((_: string, i: number) => rawArgs[i - 1] === "--exclude") || "";
const shouldList = rawArgs.includes("--list");

function runCommand(args: string[], captureOutput = false) {
  const result = spawnSync(cmd, args, {
    stdio: captureOutput ? "pipe" : "inherit",
    encoding: "utf-8",
  });
  return { success: result.status === 0, stdout: result.stdout || "" };
}

function cleanupExistingArchive(basePath: string) {
  const targets = [
    basePath,
    `${basePath}.001`,
    `${basePath}.7z`,
    `${basePath}.7z.001`,
  ];
  for (const f of targets) {
    try {
      if (existsSync(f)) unlinkSync(f);
    } catch (e) {}
  }
}

async function start() {
  const workingDir = process.cwd();
  const currentFolderName = basename(workingDir);
  const now = new Date();
  const timestamp = `${now.getFullYear()}${
    (now.getMonth() + 1).toString().padStart(2, "0")
  }${now.getDate().toString().padStart(2, "0")}_${
    now.getHours().toString().padStart(2, "0")
  }${now.getMinutes().toString().padStart(2, "0")}`;

  // Hedef klasörü oluştur
  if (!existsSync(targetDirArg)) {
    mkdirSync(targetDirArg, { recursive: true });
  }

  const items = readdirSync(workingDir);
  const filesToArchive: string[] = [];
  const foldersToArchive: string[] = [];

  const scriptPath = normalize(import.meta.url.replace(/file:\/\/\/?/, ""));
  const scriptName = basename(scriptPath);

  for (const item of items) {
    if (
      item === scriptName || item === basename(targetDirArg) ||
      item === excludeName || item.endsWith(".7z") || item.startsWith(".")
    ) continue;
    try {
      const itemStat = statSync(join(workingDir, item));
      if (itemStat.isDirectory()) foldersToArchive.push(item);
      else filesToArchive.push(item);
    } catch {
      continue;
    }
  }

  const processItem = (archiveBaseName: string, sources: string[]) => {
    const archiveOutputPath = resolve(targetDirArg, `${archiveBaseName}.7z`);
    cleanupExistingArchive(archiveOutputPath);

    console.log(`\n▶ Processing: ${archiveBaseName}`);
    const archiveArgs = [
      "a",
      archiveOutputPath,
      ...sources,
      compressionLevel,
      volumeSize,
      "-aoa",
    ].filter(Boolean);
    const { success } = runCommand(archiveArgs);

    if (success) {
      let finalPath = archiveOutputPath;
      const partOne = `${archiveOutputPath}.001`;
      if (existsSync(partOne)) finalPath = partOne;

      console.log(`🔍 Verifying (${basename(finalPath)})...`);
      runCommand(["t", finalPath]);

      if (shouldList) {
        console.log(`📄 Extracting content list...`);
        const { success: listSuccess, stdout } = runCommand(
          ["l", finalPath],
          true,
        );
        if (listSuccess) {
          writeFileSync(
            resolve(targetDirArg, `${archiveBaseName}_contents.txt`),
            stdout,
          );
          console.log(`📝 List saved.`);
        }
      }
    }
  };

  // SIRALAMA: Önce Dosyalar
  if (filesToArchive.length > 0) {
    await processItem(
      `${currentFolderName}_subfiles_${timestamp}`,
      filesToArchive.map((f) => join(workingDir, f)),
    );
  }

  // SIRALAMA: Sonra Klasörler
  for (const folder of foldersToArchive) {
    await processItem(`${folder}_${timestamp}`, [join(workingDir, folder)]);
  }

  console.log(`\n✅ Done. Outputs: ${resolve(targetDirArg)}`);
}

start();
