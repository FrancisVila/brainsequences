In HighlightedImage.tsx, add a parameter named view that can take 3 values, sketch, bitmap, or all (default value: sketch).
If view is sketch, set the group sketch_backgrounds to style display:inline and bitmap_backgrounds to display:none. Establish a link with tim_taylor.css.
If view is bitmap, set the group sketch_backgrounds to style display:none and bitmap_backgrounds to display:inline. Establish a link with tim_taylor.css.
If view is all, , set the group sketch_backgrounds to style display:none and bitmap_backgrounds to display:inline. Establish a link with tim_taylor_all.css.