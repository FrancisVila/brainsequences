import { db, run, all, get } from './db.js';

// Sequences
export function createSequence({ title, description }) {
  const info = run('INSERT INTO sequences (title, description) VALUES (?, ?)', [title, description]);
  return { id: info.lastInsertRowid };
}

export function getSequence(id) {
  const sequence = get('SELECT * FROM sequences WHERE id = ?', [id]);
  if (!sequence) return null;
  
  // Get steps for this sequence
  sequence.steps = all(`
    SELECT s.*, 
      GROUP_CONCAT(DISTINCT bp.id) as brainpart_ids,
      GROUP_CONCAT(DISTINCT bp.title) as brainpart_titles
    FROM steps s
    LEFT JOIN step_brainparts sb ON s.id = sb.step_id
    LEFT JOIN brainparts bp ON sb.brainpart_id = bp.id
    WHERE s.sequence_id = ?
    GROUP BY s.id
    ORDER BY s.id
  `, [id]);

  return sequence;
}

// Steps
export function createStep({ sequence_id, title, description }) {
  const info = run(
    'INSERT INTO steps (sequence_id, title, description) VALUES (?, ?, ?)',
    [sequence_id, title, description]
  );
  return { id: info.lastInsertRowid };
}

export function addBrainpartToStep(step_id, brainpart_id) {
  run(
    'INSERT OR IGNORE INTO step_brainparts (step_id, brainpart_id) VALUES (?, ?)',
    [step_id, brainpart_id]
  );
}

// Brain Parts
export function createBrainpart({ title, description }) {
  const info = run(
    'INSERT INTO brainparts (title, description) VALUES (?, ?)',
    [title, description]
  );
  return { id: info.lastInsertRowid };
}

export function addLinkToBrainpart(brainpart_id, url) {
  run(
    'INSERT INTO brainpart_links (brainpart_id, url) VALUES (?, ?)',
    [brainpart_id, url]
  );
}

export function getBrainpart(id) {
  const brainpart = get('SELECT * FROM brainparts WHERE id = ?', [id]);
  if (!brainpart) return null;
  
  // Get links for this brain part
  brainpart.links = all(
    'SELECT url FROM brainpart_links WHERE brainpart_id = ?',
    [id]
  ).map(row => row.url);
  
  return brainpart;
}

// Arrows
export function createArrow({ description, from_brainpart_id, to_brainpart_id, step_id }) {
  const info = run(`
    INSERT INTO arrows (description, from_brainpart_id, to_brainpart_id, step_id)
    VALUES (?, ?, ?, ?)
  `, [description, from_brainpart_id, to_brainpart_id, step_id]);
  return { id: info.lastInsertRowid };
}

// Get arrows for a step
export function getStepArrows(step_id) {
  return all(`
    SELECT a.*, 
      bp1.title as from_title,
      bp2.title as to_title
    FROM arrows a
    JOIN brainparts bp1 ON a.from_brainpart_id = bp1.id
    JOIN brainparts bp2 ON a.to_brainpart_id = bp2.id
    WHERE a.step_id = ?
  `, [step_id]);
}

// Import migrations to ensure tables exist
import './migrations.js';