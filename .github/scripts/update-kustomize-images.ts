import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type Args = {
  file: string;
  imageTag: string;
  changedRepos: Set<string>;
};

function parseArgs(argv: string[]): Args {
  const fileIdx = argv.indexOf("--file");
  const tagIdx = argv.indexOf("--image-tag");
  const changedIdx = argv.indexOf("--changed-repos");

  if (fileIdx === -1 || tagIdx === -1 || changedIdx === -1) {
    throw new Error(
      "Usage: node ... update-kustomize-images.ts --file <path> --image-tag <tag> --changed-repos <comma-separated>",
    );
  }

  const file = argv[fileIdx + 1];
  const imageTag = argv[tagIdx + 1];
  const changedRaw = argv[changedIdx + 1] ?? "";
  const changedRepos = new Set(
    changedRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  if (!file) throw new Error("--file is required");
  if (!imageTag) throw new Error("--image-tag is required");

  return { file, imageTag, changedRepos };
}

function repoFromNewName(newName: string): string {
  // Docker Hub examples:
  // - 01061875164/tomcatapp -> repo = tomcatapp
  // - my.registry.local:5000/ns/app -> repo = app
  const parts = newName.split("/");
  return parts[parts.length - 1] ?? newName;
}

function stripYamlString(value: string): string {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function updateKustomizeImagesInPlace(input: string, imageTag: string, changedRepos: Set<string>) {
  const lines = input.split(/\r?\n/);

  let imagesStart = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^images:\s*$/.test(lines[i] ?? "")) {
      imagesStart = i;
      break;
    }
  }

  if (imagesStart === -1) {
    return { output: input, updated: 0 };
  }

  // Find end of images section (next top-level key).
  let imagesEnd = lines.length;
  for (let i = imagesStart + 1; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (line.trim() === "") continue;
    if (/^[A-Za-z0-9_-]+:\s*$/.test(line)) {
      imagesEnd = i;
      break;
    }
  }

  // Collect entry boundaries within images section.
  const entryStarts: number[] = [];
  for (let i = imagesStart + 1; i < imagesEnd; i += 1) {
    if (/^-\s*name:\s*/.test(lines[i] ?? "")) entryStarts.push(i);
  }
  entryStarts.push(imagesEnd); // sentinel end

  let updated = 0;
  for (let e = 0; e < entryStarts.length - 1; e += 1) {
    const start = entryStarts[e]!;
    const end = entryStarts[e + 1]!;

    let newNameLineIdx: number | null = null;
    let newTagLineIdx: number | null = null;
    let newNameValue: string | null = null;

    for (let i = start; i < end; i += 1) {
      const line = lines[i] ?? "";
      const nm = line.match(/^\s*newName:\s*(.+)\s*$/);
      if (nm) {
        newNameLineIdx = i;
        newNameValue = stripYamlString(nm[1] ?? "");
      }
      if (/^\s*newTag:\s*/.test(line)) {
        newTagLineIdx = i;
      }
    }

    if (!newNameValue) continue;
    const repo = repoFromNewName(newNameValue);
    if (changedRepos.size > 0 && !changedRepos.has(repo)) continue;

    if (newTagLineIdx !== null) {
      const line = lines[newTagLineIdx] ?? "";
      const prefix = line.replace(/(\s*newTag:\s*).*/, "$1");
      lines[newTagLineIdx] = `${prefix}${imageTag}`;
      updated += 1;
      continue;
    }

    // If missing newTag, insert it after newName line (or at end of entry).
    const insertAfter = newNameLineIdx ?? start;
    const indent = "  ";
    lines.splice(insertAfter + 1, 0, `${indent}newTag: ${imageTag}`);
    // Adjust indices because we mutated lines; safe because we don't reuse entry boundaries afterward.
    updated += 1;
    break;
  }

  return { output: lines.join("\n"), updated };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.resolve(args.file);

  const raw = fs.readFileSync(filePath, "utf8");
  const { output, updated } = updateKustomizeImagesInPlace(raw, args.imageTag, args.changedRepos);
  fs.writeFileSync(filePath, output, "utf8");

  // eslint-disable-next-line no-console
  console.log(`Updated ${updated} image tag(s) in ${args.file}`);
}

main();

