create a script that 
1) reads the file svg_ids.txt (or another file, specified by the user in an attribute to the launch)
2) Open the database app.db.
For each row in the svg_ids.txt file, if there is no correponding row in the brainparts table, check whether there is a correponding Wikipedia article.
1) If there is an exact match, create the brainpart row. Collect a description of the brainpart (size approx 80 characters)
2) If there is an approximate match, ask the user whether to create it, as in 2)
3) If you can find no match, do nothing and make a list of such names at the end of the script