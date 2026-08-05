ALTER TABLE public.blogs
  ADD COLUMN IF NOT EXISTS excerpt varchar(320),
  ADD COLUMN IF NOT EXISTS status varchar(30) NOT NULL DEFAULT 'borrador',
  ADD COLUMN IF NOT EXISTS seo_title varchar(200),
  ADD COLUMN IF NOT EXISTS seo_description varchar(320),
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by_api_key_id bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'blogs_status_check'
  ) THEN
    ALTER TABLE public.blogs
      ADD CONSTRAINT blogs_status_check
      CHECK (status IN ('borrador', 'publicado', 'programado', 'archivado'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON public.blogs(published_at);

CREATE TABLE IF NOT EXISTS public.blog_images (
  id bigserial PRIMARY KEY,
  blog_id bigint NOT NULL,
  disk varchar(50) NOT NULL DEFAULT 's3',
  s3_key varchar(255) NOT NULL,
  url varchar(500),
  alt varchar(200),
  orden bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz,
  CONSTRAINT blog_images_blog_id_fk
    FOREIGN KEY (blog_id)
    REFERENCES public.blogs(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS idx_blog_images_blog_id ON public.blog_images(blog_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_images_blog_orden_unique ON public.blog_images(blog_id, orden);
