import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getFileType,
  validateFileSize,
  validateFileType,
  extractTextFromPDF,
} from '@/lib/file-processor';

/**
 * POST /api/portfolio/upload
 * Process a file and return its content (no storage)
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!validateFileType(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported: images (JPG, PNG, WebP), PDF, and text documents' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process file based on type
    const fileType = getFileType(file.type);
    let content = '';
    let contentType: 'text' | 'image' = 'text';

    if (fileType === 'image') {
      // Convert image to base64 for sending to LLM
      const base64Data = buffer.toString('base64');
      content = `data:${file.type};base64,${base64Data}`;
      contentType = 'image';
    } else if (fileType === 'pdf') {
      // Extract text from PDF
      try {
        content = await extractTextFromPDF(buffer, userId);
        if (!content || content.trim().length === 0) {
          return NextResponse.json(
            { error: 'Could not extract text from PDF. The PDF might be image-based or empty.' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Error processing PDF:', error);
        return NextResponse.json(
          { error: 'Failed to process PDF file' },
          { status: 500 }
        );
      }
    } else if (fileType === 'document') {
      // For text documents, read as string
      content = buffer.toString('utf-8');
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        type: fileType,
        contentType,
        content,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('POST /api/portfolio/upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
