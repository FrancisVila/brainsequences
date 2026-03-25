import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const db = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });

const vta = await db.execute("SELECT id, title, is_part_of FROM brainparts WHERE lower(replace(title, ' ', '_')) LIKE '%ventral_tegmental%'");
const limbic = await db.execute("SELECT id, title FROM brainparts WHERE lower(title) LIKE '%limbic%'");

console.log('VTA:', vta.rows);
console.log('Limbic:', limbic.rows);

if (vta.rows.length === 0) { console.error('VTA not found'); process.exit(1); }
if (limbic.rows.length === 0) { console.error('Limbic system not found'); process.exit(1); }

const vtaId = vta.rows[0].id;
const limbicId = limbic.rows[0].id;

await db.execute({ sql: 'UPDATE brainparts SET is_part_of = ? WHERE id = ?', args: [limbicId, vtaId] });
console.log(`✅ Moved brainpart id=${vtaId} ("${vta.rows[0].title}") to is_part_of=${limbicId} ("${limbic.rows[0].title}")`);
