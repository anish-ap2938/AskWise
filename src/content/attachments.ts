import { prepareAttachment, type Attachment } from "../shared/attachment";

export const ACCEPTED_EXTENSIONS =
  ".txt,.md,.markdown,.pdf,.json,.csv,.tsv,.log,.xml,.yaml,.yml,.html";

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

export async function readFileToAttachment(file: File): Promise<Attachment> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`"${file.name}" is too large (max 20 MB).`);
  }

  const isPdf =
    file.type === "application/pdf" || /\.pdf$/i.test(file.name);

  let rawText: string;
  if (isPdf) {
    const { extractPdfText } = await import("./pdf");
    rawText = await extractPdfText(await file.arrayBuffer());
    if (!rawText) {
      throw new Error(
        `Couldn't extract text from "${file.name}" — it may be a scanned/image-only PDF.`
      );
    }
  } else {
    rawText = await file.text();
    if (!rawText.trim()) {
      throw new Error(`"${file.name}" appears to be empty.`);
    }
  }

  return prepareAttachment(
    crypto.randomUUID(),
    file.name,
    isPdf ? "pdf" : "text",
    rawText
  );
}
