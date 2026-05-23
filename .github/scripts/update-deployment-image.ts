import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type Args = {
  file: string;
  imageRef: string;
  imageTag: string;
};

function parseArgs(argv: string[]): Args {
  const fileIdx = argv.indexOf("--file");
  const refIdx = argv.indexOf("--image-ref");
  const tagIdx = argv.indexOf("--image-tag");

  if (fileIdx === -1 || refIdx === -1 || tagIdx === -1) {
    throw new Error(
      "Usage: node ... update-deployment-image.ts --file <path> --image-ref <registry/repo> --image-tag <tag>",
    );
  }

  const file = argv[fileIdx + 1];
  const imageRef = argv[refIdx + 1];
  const imageTag = argv[tagIdx + 1];

  if (!file) throw new Error("--file is required");
  if (!imageRef) throw new Error("--image-ref is required");
  if (!imageTag) throw new Error("--image-tag is required");

  return { file, imageRef, imageTag };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateDeploymentImageInPlace(input: string, imageRef: string, imageTag: string) {
  const pattern = new RegExp(
    `^(\\s*image:\\s*)${escapeRegExp(imageRef)}:[^\\s#]+(.*)$`,
    "m",
  );
  const nextImage = `${imageRef}:${imageTag}`;

  let updated = 0;
  const output = input.replace(pattern, (line, prefix: string, suffix: string) => {
    updated += 1;
    return `${prefix}${nextImage}${suffix}`;
  });

  return { output, updated };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.resolve(args.file);

  const raw = fs.readFileSync(filePath, "utf8");
  const { output, updated } = updateDeploymentImageInPlace(raw, args.imageRef, args.imageTag);

  if (updated === 0) {
    throw new Error(`No image line matching ${args.imageRef}: found in ${args.file}`);
  }

  fs.writeFileSync(filePath, output, "utf8");
  // eslint-disable-next-line no-console
  console.log(`Updated image in ${args.file} -> ${args.imageRef}:${args.imageTag}`);
}

main();
