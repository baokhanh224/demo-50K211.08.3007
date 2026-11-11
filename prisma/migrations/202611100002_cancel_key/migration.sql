ALTER TABLE invoice ADD COLUMN cancel_request_key TEXT UNIQUE;
CREATE UNIQUE INDEX category_name_lower ON category(lower(name));
