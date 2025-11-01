import { run, get } from './db.js';

console.log('Updating id 91 title...');
run("UPDATE brainparts SET title = ? WHERE id = ?", ['Extreme Capsule (edited)', 91]);
const row = get('SELECT * FROM brainparts WHERE id = ?', [91]);
console.log(JSON.stringify(row, null, 2));
