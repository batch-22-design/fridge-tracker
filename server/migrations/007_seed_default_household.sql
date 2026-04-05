INSERT INTO households (id, name) VALUES (1, 'Home')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence so future inserts start after 1
SELECT setval('households_id_seq', 1, true);
