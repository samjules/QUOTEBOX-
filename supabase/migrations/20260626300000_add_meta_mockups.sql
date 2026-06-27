CREATE TABLE IF NOT EXISTS meta_mockups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT 'Untitled Mockup',
  page_name text NOT NULL DEFAULT 'Your Business',
  page_avatar_url text,
  ad_image_url text,
  ad_body text NOT NULL DEFAULT 'Fill out our quick form and get your price in seconds.',
  cta_label text NOT NULL DEFAULT 'Get Quote',
  target_form_slug text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
