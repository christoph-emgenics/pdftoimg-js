import { createWriteStream, promises as fs } from "fs";
import { dirname, join } from "path";
import { PdfToImgError } from "../shared/errors";
import yazl from "yazl";

export interface ZipEntry {
  name: string;
  bytes: Uint8Array;
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function writeFileToDir(
  dir: string,
  fileName: string,
  bytes: Uint8Array
): Promise<string> {
  await ensureDir(dir);
  const filePath = join(dir, fileName);
  await fs.writeFile(filePath, bytes);
  return filePath;
}

export async function createZipBuffer(entries: ZipEntry[]): Promise<Buffer> {
  if (entries.length === 0) {
    throw new PdfToImgError("E_ZIP", "No entries to zip.");
  }

  const zipFile = new yazl.ZipFile();
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of sorted) {
    zipFile.addBuffer(Buffer.from(entry.bytes), entry.name, {
      mtime: new Date(0),
      mode: 0o644,
    });
  }
  zipFile.end();

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    zipFile.outputStream.on("data", (chunk) => chunks.push(chunk));
    zipFile.outputStream.on("error", (err) => reject(err));
    zipFile.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export async function writeZipToFile(
  outputPath: string,
  entries: ZipEntry[]
): Promise<string> {
  await ensureDir(dirname(outputPath));
  const zipFile = new yazl.ZipFile();
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of sorted) {
    zipFile.addBuffer(Buffer.from(entry.bytes), entry.name, {
      mtime: new Date(0),
      mode: 0o644,
    });
  }
  zipFile.end();

  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(outputPath);
    zipFile.outputStream.pipe(stream);
    zipFile.outputStream.on("error", reject);
    stream.on("error", reject);
    stream.on("close", () => resolve());
  });

  return outputPath;
}
