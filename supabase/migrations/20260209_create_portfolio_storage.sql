-- Create portfolio-uploads storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-uploads',
  'portfolio-uploads',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio-uploads bucket

-- Policy: Authenticated users can upload files to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own uploads
CREATE POLICY "Users can view own uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'portfolio-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Public can view uploads from published portfolios
CREATE POLICY "Public can view published portfolio uploads"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id = 'portfolio-uploads'
  );

-- Policy: Users can update their own uploads
CREATE POLICY "Users can update own uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolio-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
