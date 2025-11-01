import { createBrainpart, addLinkToBrainpart } from '../server/brain-db.js';
import { db } from '../server/db.js';

// Helper function to add a brain part with links
function addBrainPartWithLinks(title, description = '', links = [], is_part_of = null) {
  const part = createBrainpart({ title, description, is_part_of });
  for (const url of links) {
    addLinkToBrainpart(part.id, url);
  }
  return part;
}

// Helper function to get a brain part ID by title
function getBrainPartIdByTitle(title) {
  return db.prepare('SELECT id FROM brainparts WHERE title = ?').get(title)?.id;
}

console.log('Adding additional brain regions...');

// Additional Medulla Components
console.log('Adding additional medulla components...');
const medulla_id = getBrainPartIdByTitle('Medulla Oblongata');
[
  ['Caudal Ventrolateral Medulla', 'Part of medulla involved in cardiovascular control'],
  ['Solitary Nucleus', 'Processes taste information and visceral sensation'],
  ['Pre-Bötzinger Complex', 'Generator of respiratory rhythm'],
  ['Bötzinger Complex', 'Involved in respiratory control'],
  ['Retrotrapezoid Nucleus', 'Central chemoreceptor for CO2/pH'],
  ['Paramedian Reticular Nucleus', 'Involved in eye movement control'],
  ['Gigantocellular Reticular Nucleus', 'Involved in motor control'],
  ['Cuneate Nucleus', 'Relay for upper body sensory information'],
  ['Gracile Nucleus', 'Relay for lower body sensory information'],
  ['Inferior Salivatory Nucleus', 'Controls salivary glands'],
  ['Nucleus Ambiguus', 'Controls swallowing and vocalization'],
  ['Dorsal Nucleus of Vagus Nerve', 'Parasympathetic control of viscera'],
  ['Hypoglossal Nucleus', 'Controls tongue movements']
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description, [], medulla_id);
});

// Additional Pons Components
console.log('Adding additional pons components...');
const pons_id = getBrainPartIdByTitle('Pons');
[
  ['Motor Nucleus for Trigeminal Nerve', 'Controls jaw muscles'],
  ['Abducens Nucleus', 'Controls lateral eye movement'],
  ['Facial Nerve Nucleus', 'Controls facial expressions'],
  ['Pontine Micturition Center', 'Controls urination'],
  ['Pedunculopontine Nucleus', 'Involved in arousal and locomotion'],
  ['Laterodorsal Tegmental Nucleus', 'Cholinergic center involved in sleep/wake'],
  ['Tegmental Pontine Reticular Nucleus', 'Involved in REM sleep'],
  ['Nucleus Incertus', 'Stress response and spatial memory'],
  ['Medial Parabrachial Nucleus', 'Taste and visceral sensation'],
  ['Lateral Parabrachial Nucleus', 'Pain and temperature processing'],
  ['Subparabrachial Nucleus', 'Respiratory control'],
  ['Parvocellular Reticular Nucleus', 'Orofacial motor control']
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description, [], pons_id);
});

// Additional Cerebral Cortex Regions
console.log('Adding additional cerebral cortex regions...');

const frontal_id = getBrainPartIdByTitle('Frontal Lobe');
const parietal_id = getBrainPartIdByTitle('Parietal Lobe');
const temporal_id = getBrainPartIdByTitle('Temporal Lobe');
const occipital_id = getBrainPartIdByTitle('Occipital Lobe');

// Frontal lobe components
[
  ['Orbitofrontal Cortex', 'Decision making and expectation'],
  ['Dorsolateral Prefrontal Cortex', 'Executive function and working memory'],
  ['Ventrolateral Prefrontal Cortex', 'Language production and cognitive control'],
  ['Dorsomedial Prefrontal Cortex', 'Social cognition and self-referential processing'],
  ['Ventromedial Prefrontal Cortex', 'Emotion regulation and decision making'],
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description, [], frontal_id);
});

// Parietal lobe components
[
  ['Primary Somatosensory Cortex', 'Processing touch, temperature, and pain'],
  ['Secondary Somatosensory Cortex', 'Higher-order somatosensory processing'],
  ['Posterior Parietal Cortex', 'Spatial awareness and attention'],
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description, [], parietal_id);
});

// Occipital lobe components
[
  ['Primary Visual Cortex', 'Basic visual processing'],
  ['Secondary Visual Cortex', 'Higher-order visual processing'],
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description, [], occipital_id);
});

// Temporal lobe components
[
  ['Primary Auditory Cortex', 'Basic sound processing'],
  ['Secondary Auditory Cortex', 'Higher-order auditory processing'],
  ['Entorhinal Cortex', 'Interface between hippocampus and neocortex'],
  ['Perirhinal Cortex', 'Object recognition and memory'],
  ['Fusiform Gyrus', 'Face and object recognition']
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description, [], temporal_id);
});

// Additional Thalamic Nuclei
console.log('Adding additional thalamic nuclei...');
const thalamus_id = getBrainPartIdByTitle('Thalamus');
[
  ['Anterior Nuclear Group', 'Memory and emotion'],
  ['Anteroventral Nucleus', 'Part of the limbic system'],
  ['Anterodorsal Nucleus', 'Head direction cells'],
  ['Medial Dorsal Nucleus', 'Executive function and emotion'],
  ['Centromedian Nucleus', 'Arousal and attention'],
  ['Lateral Dorsal Nucleus', 'Spatial memory'],
  ['Pulvinar', 'Higher-order visual processing'],
  ['Ventral Anterior Nucleus', 'Motor control'],
  ['Ventral Lateral Nucleus', 'Motor coordination'],
  ['Ventral Posterior Nucleus', 'Sensory relay'],
  ['Medial Geniculate Body', 'Auditory relay'],
  ['Lateral Geniculate Body', 'Visual relay']
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description, [], thalamus_id);
});

// Additional White Matter Structures
console.log('Adding white matter structures...');
[
  ['Centrum Semiovale', 'Large white matter region in cerebrum'],
  ['Corona Radiata', 'White matter fibers to/from cortex'],
  ['Internal Capsule', 'Major white matter pathway'],
  ['External Capsule', 'White matter between claustrum and putamen'],
  ['Extreme Capsule', 'White matter lateral to claustrum']
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description);
});

console.log('Finished adding additional brain regions to database.');