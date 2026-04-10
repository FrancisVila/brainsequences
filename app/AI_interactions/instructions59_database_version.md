Add the notion of a version to the brainparts table of the turso database.
all items existing now take the default version 1
write a separate script that takes all the file names in the folder C:\projects\brainsequences\brainsequences-py\output\talairach_lobe_svg and creates brainparts with version 2 from those. replacing spaces and non-alphanumeric characts with underscore '_' characters
Add a second brainparts route (call it brainparts2, tab label Brain parts 2) with a tab in the main menu (Brain Sequences - Brain parts - About - Help)
Inside the <div class="brainparts-right">,
    * remove the <div style="" class="brainviewer">
    * 