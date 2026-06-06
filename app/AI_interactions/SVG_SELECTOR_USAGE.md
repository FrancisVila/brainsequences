# SVG Selector Modal - Usage Example

## Overview
The `SvgSelectorModal` component allows users in edit mode to select which SVG image to use in a step or a sequence. It displays all SVG files from the `app/images/atlasSvg` folder with:
- Transformed title (underscores to spaces, capitalized)
- Reduced-size SVG preview
- Optional markdown description (if a corresponding .md file exists)

## Components Created

### 1. SvgSelectorModal Component
Location: `app/components/SvgSelectorModal.tsx`

Uses Vite's `import.meta.glob` to dynamically load SVG and markdown files at build time.
No API endpoint needed - files are bundled with the application.

## Usage Example

```tsx
import { useState } from 'react';
import SvgSelectorModal from '~/components/SvgSelectorModal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSvg, setSelectedSvg] = useState<string>('');

  const handleSelectSvg = (svgFilename: string) => {
    setSelectedSvg(svgFilename);
    console.log('Selected SVG:', svgFilename);
    // Save to your step or sequence here
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Select Atlas Image
      </button>
      
      {selectedSvg && (
        <div>
          Current selection: {selectedSvg}
          <img src={`/images/atlasSvg/${selectedSvg}`} alt="Selected atlas" />
        </div>
      )}

      <SvgSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectSvg}
        currentSelection={selectedSvg}
      />
    </div>
  );
}
```

## Props

- `isOpen` (boolean): Controls modal visibility
- `onClose` (() => void): Callback when modal is closed
- `onSelect` ((svgFilename: string) => void): Callback when an SVG is selected
- `currentSelection` (string, optional): Currently selected SVG filename (highlights in UI)

## Features

- **Dynamic file loading**: Automatically discovers all SVG files in the atlasSvg folder
- **Markdown support**: Displays formatted content from accompanying .md files
- **Visual preview**: Shows reduced-size version of each SVG
- **Hover effects**: Interactive UI with visual feedback
- **Current selection highlight**: Shows the currently selected SVG with distinct styling
- **Responsive layout**: Adapts to different screen sizes

## File Structure in atlasSvg Folder

```
app/images/atlasSvg/
├── slices_view.svg
├── slices_view.md          (optional)
├── XYZ_view.svg
└── XYZ_view.md             (optional)
```

## Markdown Rendering

The component supports basic Markdown formatting:
- `# Heading 1`
- `## Heading 2`
- `### Heading 3`
- `> Blockquote`
- Regular paragraphs

## How It Works

The component uses Vite's `import.meta.glob` to dynamically import all SVG and markdown files from the `app/images/atlasSvg` folder at build time:

```typescript
const atlasSvgModules = import.meta.glob('../images/atlasSvg/*.svg', { query: '?url', import: 'default', eager: true });
const atlasMdModules = import.meta.glob('../images/atlasSvg/*.md', { query: '?raw', import: 'default', eager: true });
```

This approach:
- Works seamlessly with Vite's build system
- No server-side API needed
- Files are bundled and optimized automatically
- Synchronous access to file list and content
