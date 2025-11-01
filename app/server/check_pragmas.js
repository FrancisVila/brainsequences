import { db } from './db.js';

const info = db.prepare("PRAGMA table_info('brainparts')").all();
console.log(JSON.stringify(info, null, 2));
