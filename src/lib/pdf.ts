import { marked } from 'marked';

const ATS_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
    max-width: 7.5in;
    margin: 0 auto;
    padding: 0.5in 0;
  }
  h1 { font-size: 18pt; margin-bottom: 4pt; }
  h2 { font-size: 13pt; margin-top: 16pt; margin-bottom: 6pt; border-bottom: 1px solid #ccc; padding-bottom: 3pt; }
  h3 { font-size: 11pt; margin-top: 12pt; margin-bottom: 2pt; }
  p { margin-bottom: 8pt; }
  ul, ol { margin-left: 18pt; margin-bottom: 8pt; }
  li { margin-bottom: 2pt; }
  strong { font-weight: 600; }
  em { font-style: italic; }
  hr { border: none; border-top: 1px solid #ccc; margin: 12pt 0; }
  a { color: #1a1a1a; text-decoration: none; }
  .page-break { page-break-before: always; }
`;

export function markdownToHtml(md: string): string {
  const html = marked.parse(md, { async: false }) as string;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${ATS_CSS}</style></head>
<body>${html}</body></html>`;
}

export async function markdownToPdf(md: string): Promise<Buffer> {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(markdownToHtml(md), { waitUntil: 'networkidle' });
    const pdf = await page.pdf({
      format: 'Letter',
      margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
      printBackground: false,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
