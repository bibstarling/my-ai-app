import { generateAICompletionMultimodal, generateAICompletion } from './ai-provider';

/**
 * Extract text from a PDF file using Claude Vision API
 * Since pdf-parse has ESM compatibility issues, we use Claude to extract text from PDF
 */
export async function extractTextFromPDF(fileBuffer: Buffer, userId: string): Promise<string> {
  try {
    // Convert PDF to base64 and use Claude's PDF reading capability
    const base64Data = fileBuffer.toString('base64');
    
    const response = await generateAICompletionMultimodal(
      userId,
      'pdf_extraction',
      [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64Data,
          },
        },
        {
          type: 'text',
          text: 'Please extract all text content from this PDF document. Return only the extracted text, without any additional formatting or commentary.',
        },
      ],
      4096
    );

    const text = response.content;
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text found in PDF. The PDF might be empty or contain only images.');
    }
    
    return text.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF. Please ensure it contains selectable text or readable content.');
  }
}

/**
 * Analyze an image using Claude Vision API
 */
export async function analyzeImage(
  imageData: string,
  mimeType: string,
  userId: string
): Promise<{ extractedText: string; analysis: any }> {
  try {
    // Remove data URL prefix if present
    const base64Match = imageData.match(/^data:([^;]+);base64,(.+)$/);
    const base64Data = base64Match?.[2] || imageData;
    
    const response = await generateAICompletionMultimodal(
      userId,
      'image_analysis',
      [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: base64Data,
          },
        },
        {
          type: 'text',
          text: `Please analyze this image for a professional portfolio. Extract:
1. Any visible text
2. What the image shows (is it a project screenshot, certificate, diagram, etc.?)
3. Any relevant details that would be useful for a portfolio (technologies visible, accomplishments, etc.)

Respond in JSON format:
{
  "text": "extracted text if any",
  "type": "screenshot|certificate|diagram|photo|other",
  "description": "what this image shows",
  "relevantDetails": ["detail1", "detail2"],
  "suggestedUse": "how this could be used in portfolio"
}`
        }
      ],
      2048
    );

    const responseText = response.content;

    // Try to parse JSON response
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = { rawResponse: responseText };
      }
    } catch {
      analysis = { rawResponse: responseText };
    }

    return {
      extractedText: analysis.text || '',
      analysis,
    };
  } catch (error) {
    console.error('Error analyzing image with Claude:', error);
    return {
      extractedText: '',
      analysis: { error: 'Failed to analyze image' },
    };
  }
}

/**
 * Analyze a PDF using Claude
 */
export async function analyzePDF(
  extractedText: string,
  userId: string
): Promise<{ analysis: any }> {
  try {
    const response = await generateAICompletion(
      userId,
      'pdf_analysis',
      'You are analyzing PDF content for a professional portfolio.',
      [
        {
          role: 'user',
          content: `I'm building a professional portfolio. Please analyze this PDF content and extract relevant information:

${extractedText.substring(0, 10000)}

Please respond in JSON format:
{
  "type": "resume|certificate|document|other",
  "extractedInfo": {
    "experiences": [],
    "skills": [],
    "education": [],
    "projects": [],
    "achievements": []
  },
  "suggestedUse": "how this could be used in portfolio"
}`
        }
      ],
      2048
    );

    const responseText = response.content;

    // Try to parse JSON response
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = { rawResponse: responseText };
      }
    } catch {
      analysis = { rawResponse: responseText };
    }

    return { analysis };
  } catch (error) {
    console.error('Error analyzing PDF with Claude:', error);
    return {
      analysis: { error: 'Failed to analyze PDF' },
    };
  }
}

/**
 * Determine file type from MIME type
 */
export function getFileType(mimeType: string): 'image' | 'pdf' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'document';
}

/**
 * Validate file size (max 10MB)
 */
export function validateFileSize(size: number): boolean {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  return size <= MAX_SIZE;
}

/**
 * Validate file type
 */
export function validateFileType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'text/markdown',
  ];
  
  return allowedTypes.includes(mimeType);
}
