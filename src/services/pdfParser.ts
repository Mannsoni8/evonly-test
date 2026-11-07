import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
try {
  // Use Vite's URL resolution for the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();
} catch {
  // Fallback to cdnjs worker if module resolution fails
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ExtractedPDFContent {
  text: string;
  numPages: number;
}

/**
 * Extracts raw textual content and metadata from a local PDF File.
 */
export async function extractTextFromPDF(file: File): Promise<ExtractedPDFContent> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageString = content.items
      .map((item: unknown) => {
        if (item && typeof item === 'object' && 'str' in item) {
          return (item as { str: string }).str;
        }
        return '';
      })
      .join(' ');

    if (pageString.trim()) {
      pageTexts.push(pageString.trim());
    }
  }

  const text = pageTexts.join('\n\n');
  return { text, numPages };
}
