in wikimedia.tsx, remove any paragraph (between <p> tag and </p>) where 
* the name of the gif contains _small
* another row with the same name, and without _small
for example: there's a line for Amygdala.gif and another for Amygdala_small.gif. In this case, remove the line for Amygdala_small.gif.