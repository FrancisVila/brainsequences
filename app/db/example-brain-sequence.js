import { 
  createSequence, getSequence,
  createStep, addBrainpartToStep,
  createBrainpart, addLinkToBrainpart, getBrainpart,
  createArrow, getStepArrows 
} from '../server/brain-db.js';

// Example: Create a sequence showing how memory works
console.log('Creating a sequence about memory...');

// Create the main sequence
const sequence = createSequence({
  title: 'How Memory Works',
  description: 'Basic steps of memory formation and recall'
});
console.log('Created sequence:', sequence);

// Create brain parts that will be used in steps
const hippocampus = createBrainpart({
  title: 'Hippocampus',
  description: 'Crucial for forming new memories'
});
addLinkToBrainpart(hippocampus.id, 'https://en.wikipedia.org/wiki/Hippocampus');

const cortex = createBrainpart({
  title: 'Sensory Cortex',
  description: 'Processes incoming sensory information'
});
addLinkToBrainpart(cortex.id, 'https://en.wikipedia.org/wiki/Sensory_cortex');

const amygdala = createBrainpart({
  title: 'Amygdala',
  description: 'Processes emotional content of memories'
});
addLinkToBrainpart(amygdala.id, 'https://en.wikipedia.org/wiki/Amygdala');

// Create steps and associate brain parts
const step1 = createStep({
  sequence_id: sequence.id,
  title: 'Sensory Input',
  description: 'Information enters through senses'
});

// Link brain parts to the step
addBrainpartToStep(step1.id, cortex.id);

// Add arrow showing information flow
createArrow({
  description: 'Sensory signals',
  from_brainpart_id: cortex.id,
  to_brainpart_id: hippocampus.id,
  step_id: step1.id
});

const step2 = createStep({
  sequence_id: sequence.id,
  title: 'Memory Formation',
  description: 'Hippocampus processes and forms initial memory'
});

addBrainpartToStep(step2.id, hippocampus.id);
addBrainpartToStep(step2.id, amygdala.id);

// Add arrow for emotional processing
createArrow({
  description: 'Emotional content',
  from_brainpart_id: hippocampus.id,
  to_brainpart_id: amygdala.id,
  step_id: step2.id
});

// Retrieve and display the sequence with all its parts
const fullSequence = getSequence(sequence.id);
console.log('\nRetrieved full sequence:', JSON.stringify(fullSequence, null, 2));

// Show arrows for a specific step
const step1Arrows = getStepArrows(step1.id);
console.log('\nStep 1 arrows:', JSON.stringify(step1Arrows, null, 2));

const step2Arrows = getStepArrows(step2.id);
console.log('\nStep 2 arrows:', JSON.stringify(step2Arrows, null, 2));