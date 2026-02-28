// Setup brain regions and update brainpart relationships
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Step 1: Parent brain regions to create
const parentRegions = [
  'Frontal lobe',
  'Parietal lobe',
  'Temporal lobe',
  'Occipital lobe',
  'Limbic system',
  'Endocrine system',
  'Senses',
  'Brain stem'
];

// Step 2: Mapping of brainparts to their parent regions
// This will be populated as we discover brainparts
const brainpartToRegion = {
  // Frontal lobe - motor control, planning, speech, reasoning
  'Motor area': 'Frontal lobe',
  'Motor_area': 'Frontal lobe',
  'Motor Hip': 'Frontal lobe',
  'Motor Larynx': 'Frontal lobe',
  'Motor Fingers': 'Frontal lobe',
  'Motor Face': 'Frontal lobe',
  'Motor Ankle': 'Frontal lobe',
  'Motor Thumb': 'Frontal lobe',
  'Motor Brow': 'Frontal lobe',
  'Motor Neck': 'Frontal lobe',
  'Motor Knee': 'Frontal lobe',
  'Motor Lips': 'Frontal lobe',
  'Motor Trunk': 'Frontal lobe',
  'Motor Shoulder': 'Frontal lobe',
  'Motor Wrist': 'Frontal lobe',
  'Motor Tongue': 'Frontal lobe',
  'Motor Toes': 'Frontal lobe',
  'Prefrontal cortex': 'Frontal lobe',
  'Premotor cortex': 'Frontal lobe',
  'Supplementary motor area': 'Frontal lobe',
  'Frontal eye fields': 'Frontal lobe',
  'Broca\'s area': 'Frontal lobe',
  'Precentral_gyrus': 'Frontal lobe',
  'Inferior_frontal_gyrus': 'Frontal lobe',
  'Middle_frontal_gyrus': 'Frontal lobe',
  'Frontal_pole': 'Frontal lobe',
  'Orbitofrontal_Cortex': 'Frontal lobe',
  'Ventrolateral_Prefrontal_Cortex': 'Frontal lobe',
  'Ventromedial_Prefrontal_Cortex': 'Frontal lobe',
  'Precentral_sulcus': 'Frontal lobe',
  
  // Parietal lobe - sensory processing, spatial awareness
  'Sensory area': 'Parietal lobe',
  'Sensory Area': 'Parietal lobe',
  'Sensory Mouth': 'Parietal lobe',
  'Sensory Eye': 'Parietal lobe',
  'Sensory Fingers': 'Parietal lobe',
  'Sensory Foot': 'Parietal lobe',
  'Sensory Head': 'Parietal lobe',
  'Sensory Leg': 'Parietal lobe',
  'Sensory Genitalia': 'Parietal lobe',
  'Sensory Neck': 'Parietal lobe',
  'Sensory Lips': 'Parietal lobe',
  'Sensory Thumb': 'Parietal lobe',
  'Touch': 'Parietal lobe',
  'Central Sulcus': 'Parietal lobe',
  'Somatosensory cortex': 'Parietal lobe',
  'Primary somatosensory cortex': 'Parietal lobe',
  'Posterior parietal cortex': 'Parietal lobe',
  'Sensory_Cortex': 'Parietal lobe',
  'Primary_Somatosensory_Cortex': 'Parietal lobe',
  'Secondary_Somatosensory_Cortex': 'Parietal lobe',
  'Postcentral_gyrus': 'Parietal lobe',
  'Posterior_Parietal_Cortex': 'Parietal lobe',
  'Parietal_Lobe': 'Parietal lobe',
  'Inferior_parietal_lobule': 'Parietal lobe',
  'Superior_parietal_lobule': 'Parietal lobe',
  'Angular_gyrus': 'Parietal lobe',
  'Supramarginal_gyrus': 'Parietal lobe',
  'Precuneus': 'Parietal lobe',
  'Paracentral_lobule': 'Parietal lobe',
  'Somatosensory_system': 'Parietal lobe',
  
  // Temporal lobe - auditory processing, memory, language comprehension
  'Temporal Pole': 'Temporal lobe',
  'Auditory cortex': 'Temporal lobe',
  'Primary auditory cortex': 'Temporal lobe',
  'Wernicke\'s area': 'Temporal lobe',
  'Inferior temporal cortex': 'Temporal lobe',
  'Medial temporal lobe': 'Temporal lobe',
  'Primary_Auditory_Cortex': 'Temporal lobe',
  'Secondary_Auditory_Cortex': 'Temporal lobe',
  'Temporal_Lobe': 'Temporal lobe',
  'Superior_temporal_gyrus': 'Temporal lobe',
  'Middle_temporal_gyrus': 'Temporal lobe',
  'Inferior_temporal_gyrus': 'Temporal lobe',
  'Fusiform_Gyrus': 'Temporal lobe',
  'Entorhinal_Cortex': 'Temporal lobe',
  'Perirhinal_Cortex': 'Temporal lobe',
  'Hearing': 'Temporal lobe',
  
  // Occipital lobe - visual processing
  'Visual cortex': 'Occipital lobe',
  'Primary visual cortex': 'Occipital lobe',
  'V1': 'Occipital lobe',
  'V2': 'Occipital lobe',
  'V3': 'Occipital lobe',
  'V4': 'Occipital lobe',
  'V5': 'Occipital lobe',
  'Primary_Visual_Cortex': 'Occipital lobe',
  'Secondary_Visual_Cortex': 'Occipital lobe',
  'Occipital_Lobe': 'Occipital lobe',
  'Cuneus': 'Occipital lobe',
  'Sight': 'Occipital lobe',
  'Parieto-occipital_sulcus': 'Occipital lobe',
  
  // Limbic system - emotions, memory, motivation
  'Hippocampus': 'Limbic system',
  'Amygdala': 'Limbic system',
  'Cingulate cortex': 'Limbic system',
  'Anterior cingulate cortex': 'Limbic system',
  'Posterior cingulate cortex': 'Limbic system',
  'Fornix': 'Limbic system',
  'Mammillary body': 'Limbic system',
  'Parahippocampal gyrus': 'Limbic system',
  'Cingulate_Cortex': 'Limbic system',
  'Cingulate_gyrus': 'Limbic system',
  'Cingulate_sulcus': 'Limbic system',
  'Insula': 'Limbic system',
  'Claustrum': 'Limbic system',
  'Nucleus accumbens': 'Limbic system',
  'Thalamus': 'Limbic system',
  'Paraterminal_gyrus': 'Limbic system',
  'Septum_pellucidum': 'Limbic system',
  'Lamina_terminalis': 'Limbic system',
  'Interthalamic_adhesion': 'Limbic system',
  'Ventral_Anterior_Nucleus': 'Limbic system',
  'Ventral_Lateral_Nucleus': 'Limbic system',
  'Ventral_Posterior_Nucleus': 'Limbic system',
  'Lateral_Dorsal_Nucleus': 'Limbic system',
  'Medial_Dorsal_Nucleus': 'Limbic system',
  'Centromedian_Nucleus': 'Limbic system',
  'Pulvinar': 'Limbic system',
  'Lateral_Geniculate_Body': 'Limbic system',
  'Medial_Geniculate_Body': 'Limbic system',
  
  // Endocrine system - hormones
  'Hypothalamus': 'Endocrine system',
  'Pituitary gland': 'Endocrine system',
  'Pituitary': 'Endocrine system',
  'Pineal gland': 'Endocrine system',
  'Pineal': 'Endocrine system',
  'Pituitary_gland': 'Endocrine system',
  'Pineal_gland': 'Endocrine system',
  'Hypothalamic_sulcus': 'Endocrine system',
  'Tuber_cinereum_hamartoma': 'Endocrine system',
  'Optic_recess': 'Endocrine system',
  'Adrenal_gland': 'Endocrine system',
  'Thyroid': 'Endocrine system',
  'Thymus': 'Endocrine system',
  'Pancreas': 'Endocrine system',
  
  // Senses - sensory organs and processing
  'Olfactory bulb': 'Senses',
  'Olfactory': 'Senses',
  'Optic nerve': 'Senses',
  'Optic chiasm': 'Senses',
  'Optic_chiasm': 'Senses',
  'Smell': 'Senses',
  'Taste': 'Senses',
  
  // Brain stem - basic life functions
  'Midbrain': 'Brain stem',
  'Pons': 'Brain stem',
  'Medulla': 'Brain stem',
  'Medulla oblongata': 'Brain stem',
  'Reticular formation': 'Brain stem',
  'Substantia nigra': 'Brain stem',
  'Red nucleus': 'Brain stem',
  'Periaqueductal gray': 'Brain stem',
  'Cerebellum': 'Brain stem',
  'Brainstem': 'Brain stem',
  'Stem': 'Brain stem',
  'Medulla_Oblongata': 'Brain stem',
  'Substantia_Nigra': 'Brain stem',
  'Red_Nucleus': 'Brain stem',
  'Locus_Coeruleus': 'Brain stem',
  'Ventral_tegmental_area': 'Brain stem',
  'Hindbrain_(Rhombencephalon)': 'Brain stem',
  'Cerebellar_Hemispheres': 'Brain stem',
  'Cerebellar_Vermis': 'Brain stem',
  'Superior_Colliculus': 'Brain stem',
  'Inferior_Colliculus': 'Brain stem',
  'Pontine_Nuclei': 'Brain stem',
  'Superior_Olivary_Complex': 'Brain stem',
  'Inferior_Olivary_Nucleus': 'Brain stem',
  'Gracile_Nucleus': 'Brain stem',
  'Solitary_Nucleus': 'Brain stem',
  'Motor_Nucleus_for_Trigeminal_Nerve': 'Brain stem',
  'Facial_Nerve_Nucleus': 'Brain stem',
  'Hypoglossal_Nucleus': 'Brain stem',
  'Nucleus_Ambiguus': 'Brain stem',
  'Inferior_Salivatory_Nucleus': 'Brain stem',
  'Gigantocellular_Reticular_Nucleus': 'Brain stem',
  'Paramedian_Reticular_Nucleus': 'Brain stem',
  'Parvocellular_Reticular_Nucleus': 'Brain stem',
  'Tegmental_Pontine_Reticular_Nucleus': 'Brain stem',
  'Lateral_Parabrachial_Nucleus': 'Brain stem',
  'Medial_Parabrachial_Nucleus': 'Brain stem',
  'Subparabrachial_Nucleus': 'Brain stem',
  'Laterodorsal_Tegmental_Nucleus': 'Brain stem',
  'Pedunculopontine_Nucleus': 'Brain stem',
  'Nucleus_Incertus': 'Brain stem',
  'Pontine_Micturition_Center': 'Brain stem',
  'Pre-Bötzinger_Complex': 'Brain stem',
  'Retrotrapezoid_Nucleus': 'Brain stem',
  'Rostral_Ventrolateral_Medulla': 'Brain stem',
  'Medullary_Pyramids': 'Brain stem',
  
  // Subcortical structures that could be in limbic or other
  'Thalamus': 'Limbic system',
  'Basal ganglia': 'Frontal lobe',
  'Caudate nucleus': 'Frontal lobe',
  'Putamen': 'Frontal lobe',
  'Globus pallidus': 'Frontal lobe',
  'Striatum': 'Frontal lobe',
  'Nucleus accumbens': 'Limbic system',
  'Caudate_Nucleus': 'Frontal lobe',
  'Globus_Pallidus': 'Frontal lobe',
  
  // Cerebellum - could be separate but let's put in brain stem for coordination
  'Cerebellum': 'Brain stem',
  
  // White matter tracts and capsules - no clear parent, these connect regions
  'Corpus_callosum': null,  // Connecting structure
  'Internal_Capsule': null,
  'External_Capsule': null,
  'Extreme_Capsule': null,
  'Centrum_Semiovale': null,
  
  // Ventricles and CSF spaces - not brain parts per se
  '4th_ventricle': null,
  'Cerebral_aqueduct': null,
  'Choroid_plexus': null,
  'Sulcus_of_corpus_callosum': null,
  
  // Non-brain body parts that shouldn't be in brain regions
  'Kidney': null,
  'Muscle': null,
  
  // General references that are already covered by parent regions
  'Cerebrum': null,  // Too general, encompasses multiple lobes
};

async function setupBrainpartRegions() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  console.log('🧠 Setting up brain regions and relationships...\n');

  // Step 1: Add parent regions
  console.log('Step 1: Adding parent brain regions...');
  const regionIds = {};
  
  for (const region of parentRegions) {
    // Check if region already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM brainparts WHERE title = ?',
      args: [region]
    });

    if (existing.rows.length > 0) {
      regionIds[region] = existing.rows[0].id;
      console.log(`⏭️  Already exists: ${region} (ID: ${regionIds[region]})`);
    } else {
      const result = await db.execute({
        sql: 'INSERT INTO brainparts (title, visible) VALUES (?, 1)',
        args: [region]
      });
      regionIds[region] = result.lastInsertRowid;
      console.log(`✅ Added: ${region} (ID: ${regionIds[region]})`);
    }
  }

  // Step 2: Get all existing brainparts
  console.log('\nStep 2: Fetching all existing brainparts...');
  const allBrainparts = await db.execute({
    sql: 'SELECT id, title, is_part_of FROM brainparts ORDER BY title'
  });

  console.log(`Found ${allBrainparts.rows.length} brainparts\n`);

  // Step 3: Update is_part_of for each brainpart
  console.log('Step 3: Updating brainpart relationships...');
  let updated = 0;
  let skipped = 0;
  let unknown = [];

  for (const brainpart of allBrainparts.rows) {
    const title = brainpart.title;
    const currentParent = brainpart.is_part_of;
    
    // Skip if this is one of our parent regions
    if (parentRegions.includes(title)) {
      console.log(`⏭️  Skipping parent region: ${title}`);
      skipped++;
      continue;
    }

    // Find the parent region for this brainpart
    const parentRegion = brainpartToRegion[title];
    
    if (parentRegion) {
      const parentId = regionIds[parentRegion];
      
      // Only update if different from current
      if (currentParent !== parentId) {
        await db.execute({
          sql: 'UPDATE brainparts SET is_part_of = ? WHERE id = ?',
          args: [parentId, brainpart.id]
        });
        console.log(`✅ Updated: ${title} → ${parentRegion}`);
        updated++;
      } else {
        console.log(`⏭️  Already set: ${title} → ${parentRegion}`);
        skipped++;
      }
    } else {
      console.log(`❓ Unknown mapping: ${title}`);
      unknown.push(title);
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Parent regions created/verified: ${parentRegions.length}`);
  console.log(`   Brainparts updated: ${updated}`);
  console.log(`   Brainparts skipped: ${skipped}`);
  console.log(`   Unknown mappings: ${unknown.length}`);
  
  if (unknown.length > 0) {
    console.log('\n❓ Brainparts without mapping:');
    unknown.forEach(title => console.log(`   - ${title}`));
  }
}

setupBrainpartRegions().catch(console.error);
