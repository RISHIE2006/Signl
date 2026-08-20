import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { extractTextFromPdf } from '@/lib/pdf-utils';

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
      extractedText = await extractTextFromPdf(buffer);
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
