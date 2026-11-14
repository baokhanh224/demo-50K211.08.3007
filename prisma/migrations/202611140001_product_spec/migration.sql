BEGIN;
ALTER TABLE product ADD COLUMN expiry TEXT;
ALTER TABLE product ADD CONSTRAINT product_expiry_format CHECK (expiry IS NULL OR expiry ~ '^\d{4}-\d{2}-\d{2}$');

-- Keep supplier categories/links intact. Only product assignments outside the
-- specified catalog move to the explicit fallback category, without guessing.
LOCK TABLE category IN SHARE ROW EXCLUSIVE MODE;
SELECT setval(pg_get_serial_sequence('category','id'), GREATEST(COALESCE((SELECT MAX(id) FROM category),1),(SELECT last_value FROM category_id_seq)));
INSERT INTO category(name) VALUES ('Sữa'),('Mì ăn liền'),('Nước uống'),('Bánh mì'),('Bánh kẹo'),('Gia vị'),('Khác') ON CONFLICT(name) DO NOTHING;
UPDATE product SET category_id=(SELECT id FROM category WHERE name='Khác')
WHERE category_id IN (SELECT id FROM category WHERE name NOT IN ('Sữa','Mì ăn liền','Nước uống','Bánh mì','Bánh kẹo','Gia vị','Khác'));
COMMIT;
