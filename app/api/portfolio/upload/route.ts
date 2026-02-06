import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import {
  getFileType,
  validateFileSize,
  validateFileType,
  extractTextFromPDF,
  analyzeImage,
  analyzePDF,
} from '@/lib/file-processor';

/**
 * POST /api/portfolio/upload
 * Upload a file to the portfolio (image, PDF, or document)
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const portfolioId = formData.get('portfolioId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!validateFileType(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRole();

    // Verify portfolio ownership
    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('id, clerk_id')
      .eq('id', portfolioId)
      .eq('clerk_id', userId)
      .maybeSingle();

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique file name
    const fileId = crypto.randomUUID();
    const fileExtension = file.name.split('.').pop() || 'bin';
    const fileName = `${fileId}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('portfolio-uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('portfolio-uploads')
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Process file based on type
    const fileType = getFileType(file.type);
    let extractedText = '';
    let aiAnalysis: any = {};

    if (fileType === 'image') {
      // Convert buffer to base64
      const base64Data = buffer.toString('base64');
      const imageDataUrl = `data:${file.type};base64,${base64Data}`;
      
      // Analyze image with Claude Vision
      const { extractedText: text, analysis } = await analyzeImage(
        imageDataUrl,
        file.type
      );
      extractedText = text;
      aiAnalysis = analysis;
    } else if (fileType === 'pdf') {
      // Extract text from PDF
      try {
        extractedText = await extractTextFromPDF(buffer);
        
        // Analyze PDF content
        const { analysis } = await analyzePDF(extractedText);
        aiAnalysis = analysis;
      } catch (error) {
        console.error('Error processing PDF:', error);
        aiAnalysis = { error: 'Failed to process PDF' };
      }
    } else if (fileType === 'document') {
      // For text documents, read as string
      extractedText = buffer.toString('utf-8');
    }

    // Save file metadata to database
    const { data: uploadRecord, error: dbError } = await supabase
      .from('portfolio_uploads')
      .insert({
        portfolio_id: portfolioId,
        clerk_id: userId,
        file_type: fileType,
        file_name: file.name,
        file_path: filePath,
        file_url: fileUrl,
        file_size: file.size,
        extracted_text: extractedText,
        ai_analysis: aiAnalysis,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving upload to database:', dbError);
      
      // Try to clean up uploaded file
      await supabase.storage
        .from('portfolio-uploads')
        .remove([filePath]);
      
      return NextResponse.json(
        { error: 'Failed to save upload metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      upload: {
        id: uploadRecord.id,
        fileName: file.name,
        fileType,
        fileUrl,
        fileSize: file.size,
        extractedText,
        aiAnalysis,
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

/**
 * DELETE /api/portfolio/upload?id=xyz
 * Delete an uploaded file
 */
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('id');

    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRole();

    // Get upload record
    const { data: upload } = await supabase
      .from('portfolio_uploads')
      .select('id, clerk_id, file_path')
      .eq('id', uploadId)
      .eq('clerk_id', userId)
      .maybeSingle();

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload not found or access denied' },
        { status: 404 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase
      .storage
      .from('portfolio-uploads')
      .remove([upload.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue anyway to delete database record
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('portfolio_uploads')
      .delete()
      .eq('id', uploadId);

    if (dbError) {
      console.error('Error deleting upload from database:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete upload' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/portfolio/upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
