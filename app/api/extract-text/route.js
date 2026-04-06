import { NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Must use multipart/form-data with a "file" field.' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No valid file uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    if (file.type === 'application/pdf') {
      const pdfNamespace = await import('pdf-parse');
      const PDFParse = pdfNamespace.PDFParse || pdfNamespace.default?.PDFParse;
      
      if (!PDFParse) {
         const pdfFunc = pdfNamespace.default || pdfNamespace;
         const data = await pdfFunc(buffer);
         extractedText = data.text;
      } else {
         const parser = new PDFParse({ data: buffer });
         const data = await parser.getText();
         extractedText = data.text;
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      file.type === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF or Word document.' }, { status: 400 });
    }

    return NextResponse.json({ text: extractedText });
  } catch (err) {
    console.error('File extraction error:', err);
    return NextResponse.json({ error: err.message || 'File extraction failed.' }, { status: 500 });
  }
}
