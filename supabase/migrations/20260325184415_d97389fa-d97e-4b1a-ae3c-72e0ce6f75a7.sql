
-- WP3: Add new lead statuses
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'contact_geprobeerd';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'geen_gehoor';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'voicemail';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'terugbellen';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'gesproken';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'afspraak_gepland';
