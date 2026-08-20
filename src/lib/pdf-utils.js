export async function extractTextFromPdf(buffer) {
  const pdfNamespace = await import('pdf-parse');
  const pdfFunc = pdfNamespace.default || pdfNamespace;
  const data = await pdfFunc(buffer);
  return data.text;
}