I want to use the siibra api to generate interactive brain diagrams, to use in this application.
I want to display brainparts in 3D, an example is provided here: https://siibra-python.readthedocs.io/en/latest/examples/05_anatomical_assignment/002_activation_maps.html#sphx-glr-examples-05-anatomical-assignment-002-activation-maps-py
I want to  put an interactive diagram side by side with the tree in BrainpartTree, so that when I click in the tree I see the corresponding diagram.

The siibra api:
* runs on python
* uses nilearn (imports plotting)
* uses nifti

Here is what you recommended last time I asked. (paragraphs preceded by > written by Claude Opus)

> 1) Python backend API: Keep your React frontend, add a Flask/FastAPI backend that uses siibra to generate visualizations. Return images (PNG/SVG) or use Plotly (works in both Python and React) for interactive plots. Your React app calls endpoints like /api/brain-map?region=v1-left.
> 
> 2) Export to web-compatible formats: siibra/nilearn can export brain meshes. Load these into Three.js or react-three-fiber in your React app for native 3D rendering.
> 
> 3) Pyodide: Run Python (including siibra) directly in the browser via WebAssembly. Complex but fully client-side.
> 
> 4) Neuroglancer: Google's web-based neuroimaging viewer. Designed for this use case and embeds well.
> 
> My recommendation: The Python backend API approach is the most practical. It keeps your existing React app intact, leverages siibra's full capabilities server-side, and delivers visualizations as images or Plotly JSON to the frontend. Clean separation of concerns.

My views on the matter: 
* Neuroglancer examples seem to be at neuron level, rather than at the level of brain areas. Also I'm not keen on using a Google solution, so let's count out 4). 
* Using solution 2) seems interesting, insofar as I'm aiming at a limited number of brainparts, maybe hundreds in the end, but in any case less than a thousand, so we could have a collection of mesh files ready for use. But would that limit us to still images? Can we get interactive images?
* for WebAssembly (3) I saw that react 19 now has a useWasm hook, maybe that makes it simpler to use?
* solution 1) would require starting a backend server, would that not add a level of complexity, and 