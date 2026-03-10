import { all } from '../app/server/db.js';

const rows = all('SELECT * FROM brainparts WHERE title LIKE "%amygdala%" COLLATE NOCASE');
console.log('Amygdala rows:', JSON.stringify(rows, null, 2));
