import { createBrainpart, addLinkToBrainpart } from '../server/brain-db.js';

// Helper function to add a brain part with links and parent
function addBrainPartWithLinks(title, description = '', links = [], is_part_of = null) {
  const part = createBrainpart({ title, description, is_part_of });
  for (const url of links) {
    addLinkToBrainpart(part.id, url);
  }
  return part;
}

// Add major brain divisions first
console.log('Adding major brain divisions...');

// Hindbrain (rhombencephalon)
const hindbrain = addBrainPartWithLinks(
  'Hindbrain (Rhombencephalon)',
  'Includes the medulla, pons, and cerebellum',
  ['https://en.wikipedia.org/wiki/Hindbrain']
);

// Add medulla components
console.log('Adding medulla components...');
const medulla = addBrainPartWithLinks(
  'Medulla Oblongata',
  'Lower half of the brainstem - controls autonomic functions',
  ['https://en.wikipedia.org/wiki/Medulla_oblongata']
);

[
  ['Medullary Pyramids', 'Contains motor fibers of the corticospinal tract'],
  ['Arcuate Nucleus', 'Part of the medulla involved in chemoreception'],
  ['Inferior Olivary Nucleus', 'Major input to the cerebellum for motor learning'],
  ['Rostral Ventrolateral Medulla', 'Regulates blood pressure and breathing'],
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description, [], medulla.id);
});

// Add pons components
console.log('Adding pons components...');
const pons = addBrainPartWithLinks(
  'Pons',
  'Part of the brainstem that links the medulla and cerebellum',
  ['https://en.wikipedia.org/wiki/Pons']
);

[
  ['Pontine Nuclei', 'Relay stations between cerebral cortex and cerebellum'],
  ['Locus Coeruleus', 'Main source of norepinephrine in the brain'],
  ['Superior Olivary Complex', 'First major auditory processing center'],
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description, [], pons.id);
});

// Add cerebellum components
console.log('Adding cerebellum components...');
const cerebellum = addBrainPartWithLinks(
  'Cerebellum',
  'Coordinates movement and balance',
  ['https://en.wikipedia.org/wiki/Cerebellum']
);

[
  ['Cerebellar Vermis', 'Midline region of the cerebellum'],
  ['Cerebellar Hemispheres', 'Lateral regions of the cerebellum'],
  ['Dentate Nucleus', 'Largest of the deep cerebellar nuclei'],
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description, [], cerebellum.id);
});

// Add midbrain components
console.log('Adding midbrain components...');
[
  ['Superior Colliculus', 'Visual processing and eye movements'],
  ['Inferior Colliculus', 'Auditory processing'],
  ['Substantia Nigra', 'Dopamine production and motor control'],
  ['Red Nucleus', 'Motor coordination'],
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description);
});

// Add forebrain components
console.log('Adding forebrain components...');

// Thalamus and related structures
[
  ['Thalamus', 'Major relay center for sensory and motor signals'],
  ['Hypothalamus', 'Controls homeostasis and hormone release'],
  ['Pineal Gland', 'Produces melatonin and regulates sleep cycles'],
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description);
});

// Add basal ganglia
console.log('Adding basal ganglia components...');
[
  ['Caudate Nucleus', 'Part of the striatum involved in learning and memory'],
  ['Putamen', 'Part of the striatum involved in motor control'],
  ['Globus Pallidus', 'Regulates voluntary movement'],
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description);
});

// Add limbic system
console.log('Adding limbic system components...');
[
  ['Hippocampus', 'Critical for forming new memories'],
  ['Amygdala', 'Processes emotions, particularly fear'],
  ['Cingulate Cortex', 'Involved in emotion and behavior regulation'],
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description);
});

// Add cerebral cortex regions
console.log('Adding cerebral cortex regions...');
[
  ['Frontal Lobe', 'Executive function, planning, and motor control'],
  ['Parietal Lobe', 'Sensory processing and spatial awareness'],
  ['Temporal Lobe', 'Memory, hearing, and language'],
  ['Occipital Lobe', 'Visual processing'],
].forEach(([title, description]) => {
  addBrainPartWithLinks(title, description);
});

console.log('Finished adding brain regions to database.');