-- AddIpAddress
ALTER TABLE session ADD COLUMN ip_address VARCHAR(45);

-- Add index for ip_address
CREATE INDEX session_website_id_created_at_ip_address_idx ON session(website_id, created_at, ip_address);