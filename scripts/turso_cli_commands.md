source /home/francis/.bashrc
If you already have an account, please login with turso auth login.
Visit the following URL to login:
https://api.turso.tech?redirect=false

turso config set token "eyJhbGciOiJSUzI1NiIsImNhdCI6ImNsX0I3ZDRQRDIyMkFBQSIsImtpZCI6Imluc18yYzA4R3ZNeEhYMlNCc3l0d2padm95cEdJeDUiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE3NzkwMzQwMTYsImlhdCI6MTc3ODQyOTIxNiwiaXNzIjoiaHR0cHM6Ly9jbGVyay50dXJzby50ZWNoIiwianRpIjoiZjlmYzI3MmY4N2YxZmFlZjA3MjIiLCJuYmYiOjE3Nzg0MjkyMTEsInN1YiI6InVzZXJfMzhuaTBsSUliMGJGUjBNUWF4NE1rQk5UR2szIn0.ALgSE2oeDtv0zEzIm1avi_L7xh53Vl87zEGX2aexsjW4omFoX0ma7blAASJWLhDEOwALtSDqdjP10rd1739keQ4yln2tDkgfdb2-yC-AnqfN2b8gqsKlZfX8PE3s1O4buCy4ZknO0qkZ82DCBKpky6DqqXPCpUyQpGspg1RGJihWTSt6i0ps_moEs72yAxLHQ3FQCDvE59A5uSQiX8QYFlhtN_2CL-cpqupypjW7-Kns2PPbbmyduDRK-xsLgxk4Hg_GncX38exchllFtjh2b0LvYtqePDltpVg7HXFrBMMPjIfudxBdTOWpg4RT1GFhLLTG5BXEnIBm5xAwcFo0IQ"

# Select rows created after a specific date
turso db shell brainsequences "SELECT * FROM brainparts WHERE created_at > '2024-05-01'"

# Update rows created after a certain date
turso db shell brainsequences "UPDATE brainparts SET visible = 1 WHERE created_at > '2024-05-01'"

turso db shell brainsequences "UPDATE brainparts SET is_part_of = 604 WHERE created_at > '2026-05-10 10:30:00'"

# Delete rows created after a certain timestamp
turso db shell brainsequences "DELETE FROM brainparts WHERE created_at > '2024-05-01 10:30:00'"

# Count rows created after a date
turso db shell brainsequences "SELECT COUNT(*) FROM brainparts WHERE created_at > '2024-05-01'"


Create rows 

# Basic insert with title and visible
turso db shell brainsequences "INSERT INTO brainparts (title, visible) VALUES ('Hippocampus', 1)"

# Insert with title, visible, and version
turso db shell brainsequences "INSERT INTO brainparts (title, visible, version) VALUES ('Amygdala', 1, 2)"

# Insert with title, visible, version, and folder
turso db shell brainsequences "INSERT INTO brainparts (title, visible, version, folder) VALUES ('Temporal Lobe', 1, 2, 0)"

turso db shell brainsequences "INSERT INTO brainparts (title, visible, version, folder) VALUES ('Temporal Lobe', 1, 2, 0)"

# Insert multiple rows at once
turso db shell brainsequences "INSERT INTO brainparts (title, visible, version) VALUES ('Occipital Lobe', 1, 2), ('Parietal Lobe', 1, 2), ('Frontal Lobe', 1, 2)"

# Insert and return the created row
turso db shell brainsequences "INSERT INTO brainparts (title, visible, version) VALUES ('Cerebellum', 1, 2) RETURNING *"

# Insert only if it doesn't exist (with SELECT to check first)
turso db shell brainsequences "INSERT INTO brainparts (title, visible, version) SELECT 'Thalamus', 1, 2 WHERE NOT EXISTS (SELECT 1 FROM brainparts WHERE title = 'Thalamus' AND version = 2)"


Duplicate

# Duplicate a row by id (creates new row with new id)
turso db shell brainsequences "INSERT INTO brainparts (title, visible, version, folder) SELECT title, visible, version, folder FROM brainparts WHERE id = 123"

# Duplicate a row and change version from 1 to 2
turso db shell brainsequences "INSERT INTO brainparts (title, visible, version, folder) SELECT title, visible, 2, folder FROM brainparts WHERE title = 'Angular Gyrus' AND version = 1"

# Duplicate a row and modify the title
turso db shell brainsequences "INSERT INTO brainparts (title, visible, version, folder) SELECT title || ' (Copy)', visible, version, folder FROM brainparts WHERE id = 123"

turso db shell brainsequences "INSERT INTO brainparts (title, visible, version, folder, is_part_of) SELECT 'Tailarach Gyrus', visible, version, folder, is_part_of FROM brainparts WHERE id = 490"
(id=604)

# Duplicate all rows matching a condition with version 2
turso db shell brainsequences "INSERT INTO brainparts (title, visible, version, folder) SELECT title, visible, 2, folder FROM brainparts WHERE version = 1 AND title IN ('Hippocampus', 'Amygdala', 'Thalamus')"

# Duplicate and return the new row(s)
turso db shell brainsequences "INSERT INTO brainparts (title, visible, version, folder) SELECT title, visible, 2, folder FROM brainparts WHERE id = 123 RETURNING *"

# Duplicate only if it doesn't already exist in version 2
turso db shell brainsequences "INSERT INTO brainparts (title, visible, version, folder) SELECT title, visible, 2, folder FROM brainparts WHERE title = 'Angular Gyrus' AND version = 1 AND NOT EXISTS (SELECT 1 FROM brainparts WHERE title = 'Angular Gyrus' AND version = 2)"