
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-pdfs', 'lesson-pdfs', true);

CREATE POLICY "Lesson PDFs are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-pdfs');
