import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import YAML from "yaml";

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

function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.resolve(args.file);

  const raw = fs.readFileSync(filePath, "utf8");
  const doc = YAML.parse(raw) as {
    images?: Array<{ name?: string; newName?: string; newTag?: string }>;
  };

  const images = doc.images ?? [];

  let updated = 0;
  for (const img of images) {
    const newName = (img.newName ?? "").trim();
    if (!newName) continue;

    const repo = repoFromNewName(newName);
    if (args.changedRepos.size > 0 && !args.changedRepos.has(repo)) continue;

    img.newTag = args.imageTag;
    updated += 1;
  }

  const out = YAML.stringify(doc);
  fs.writeFileSync(filePath, out, "utf8");

  // eslint-disable-next-line no-console
  console.log(`Updated ${updated} image tag(s) in ${args.file}`);
}

main();

