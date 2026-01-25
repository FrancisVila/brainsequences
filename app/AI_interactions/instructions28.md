In the edit section of the SequenceViewer.tsx file, under the <AtlasImage> component, add the list of step_link attributes having the same step_id as the id of the step.
Each step_link is on one line, represented by 
  - 4 integer selectors, varying between 0 and 100 , that are linked to the x1, y1, x2, y2 attributes of the step_link 
  - One combo box for the stroke width. with values 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1 (default 0.5)
  - One combo box for the curvature, with values -0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5 (default 0.3)
Under the list of step_links, add a button to add a new step_link to the step