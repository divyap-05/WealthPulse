import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 6;
const MAX_TEXT_BYTES = 12000;

const keepDocumentEnding = (value, maxBytes = MAX_TEXT_BYTES) => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  if (bytes.length <= maxBytes) return value;

  const marker = '\n[Middle of document omitted; ending follows]\n';
  const contentBudget = maxBytes - encoder.encode(marker).length;
  const firstPart = Math.floor(contentBudget * 0.65);
  const lastPart = contentBudget - firstPart;
  const decoder = new TextDecoder();
  return `${decoder.decode(bytes.slice(0, firstPart)).trimEnd()}${marker}${decoder.decode(bytes.slice(-lastPart)).trimStart()}`;
};

export const sanitizeDocumentText = (value) => {
  const text = String(value || '')
    .replace(/\b(?:account|a\/c)\s*(?:no\.?|number|#)?\s*[:=-]?\s*[0-9x*][0-9x* \t-]{5,24}/gi, '[REDACTED ACCOUNT]')
    .replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/gi, '[REDACTED IFSC]')
    .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[REDACTED ID]')
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/gi, '[REDACTED ID]')
    .replace(/\b(?:\d[ -]?){13,19}\b/g, '[REDACTED CARD]')
    .replace(/\b(?:\+?91[ -]?)?[6-9]\d{9}\b/g, '[REDACTED PHONE]')
    .replace(/\b[\w.+-]{1,64}@[\w.-]{2,}\.[A-Z]{2,}\b/gi, '[REDACTED EMAIL]')
    .replace(/\b[\w.-]{2,}@[\w.-]{2,}\b/gi, '[REDACTED UPI]')
    .replace(/\b(?:billing|shipping|home|office|customer)?\s*address\s*[:=-]?[^\r\n]*/gi, '[REDACTED ADDRESS]')
    .replace(/\b(?:customer name|account holder|card holder|cardholder|name)\s*[:=-]\s*[^\r\n]*/gi, '[REDACTED NAME]')
    .replace(/\b(?:transaction|reference|ref)\s*(?:id|no\.?|number|#)\s*[:=-]?\s*[A-Z0-9-]{6,}\b/gi, '[REDACTED REFERENCE]')
    .replace(/\n{3,}/g, '\n\n');

  return keepDocumentEnding(text).trim();
};

const readSignature = async (file) => new Uint8Array(await file.slice(0, 16).arrayBuffer());

const getFileKind = async (file) => {
  if (file.size > MAX_FILE_BYTES) throw new Error('Choose a file smaller than 10 MB.');
  const bytes = await readSignature(file);
  const signature = String.fromCharCode(...bytes);
  if (signature.startsWith('%PDF-')) return 'pdf';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image';
  if (signature.startsWith('\x89PNG\r\n\x1a\n')) return 'image';
  if (signature.startsWith('RIFF') && signature.slice(8, 12) === 'WEBP') return 'image';
  throw new Error('Upload a valid PDF, PNG, JPEG, or WebP file.');
};

const recognizeImage = async (image, onProgress) => {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') onProgress?.(message.progress);
    },
  });
  try {
    const result = await worker.recognize(image);
    return result.data.text || '';
  } finally {
    await worker.terminate();
  }
};

export const extractDocumentText = async (file, onProgress) => {
  const kind = await getFileKind(file);
  if (kind === 'image') {
    const text = await recognizeImage(file, onProgress);
    return sanitizeDocumentText(text);
  }

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  if (pdf.numPages > MAX_PDF_PAGES) {
    await pdf.destroy();
    throw new Error(`This scanner supports PDFs with up to ${MAX_PDF_PAGES} pages. Split the document and scan a smaller part.`);
  }

  const pages = [];
  let worker = null;
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      let pageText = content.items.map((item) => item.str || '').join(' ').trim();
      if (pageText.length < 20) {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        if (!worker) {
          const { createWorker } = await import('tesseract.js');
          worker = await createWorker('eng', 1, {
            logger: (message) => {
              if (message.status === 'recognizing text') onProgress?.(message.progress);
            },
          });
        }
        pageText = (await worker.recognize(canvas)).data.text || '';
        canvas.width = 0;
        canvas.height = 0;
      }
      pages.push(pageText);
      page.cleanup();
      onProgress?.(pageNumber / pdf.numPages);
    }
  } finally {
    if (worker) await worker.terminate();
    await pdf.destroy();
  }

  return sanitizeDocumentText(pages.join('\n'));
};
