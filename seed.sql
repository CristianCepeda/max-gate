-- MaxGate seed data for local testing
-- Run this in the Supabase SQL editor after creating the businesses table

INSERT INTO businesses (
  slug,
  name,
  logo_url,
  primary_color,
  welcome_message,
  terms_text,
  redirect_url,
  ghl_location_id,
  ghl_tag,
  faskey
) VALUES (
  'test-business',
  'Test Business',
  NULL,
  '#8C9BBA',
  'Connect to free WiFi!',
  'By connecting, you agree to receive occasional marketing communications. You can unsubscribe at any time.',
  'https://maxmarketingfirm.com',
  'test-location-id',
  'wifi-lead',
  'test-faskey-replace-in-production'
)
ON CONFLICT (slug) DO NOTHING;
