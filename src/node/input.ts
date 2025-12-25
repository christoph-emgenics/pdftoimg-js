import { promises as fs } from "fs";
import { parse } from "path";
import { Readable } from "stream";
import { PdfToImgError } from "../shared/errors";

export type NodeInput = string | Uint8Array | Buffer | Readable | ArrayBuffer;

export interface NodeInputData {
  data: Uint8Array;
  basename: string;
}

export async function readNodeInput(input: NodeInput): Promise<NodeInputData> {
  if (typeof input === "string") {
    const data = await fs.readFile(input);
    return { data: new Uint8Array(data), basename: parse(input).name };
  }

  if (input instanceof Readable) {
    const data = await readStream(input);
    return { data, basename: "document" };
  }

  if (input instanceof ArrayBuffer) {
    return { data: new Uint8Array(input), basename: "document" };
  }

  if (input instanceof Uint8Array) {
    return { data: input, basename: "document" };
  }

  throw new PdfToImgError("E_INPUT", "Unsupported Node input type.");
}

async function readStream(stream: Readable): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(chunk);
    }
  }
  return Buffer.concat(chunks);
}
