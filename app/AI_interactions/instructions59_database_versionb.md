
- Add an atlasSvgFile column (string) to both 'steps' and 'sequences' tables of the turso databases.
- Set all the atlasSvgFile parameters of the existing rows of the 'sequence' table to the value 'tim_taylor.svg'. Do not set any value for the 'steps' table.
- Add an atlasSvgFile parameter to the SequenceViewer.tsx and AtlasImage.tsx object
- In SequenceViewer.tsx line 7, replace the line
        import atlasSvg from '~/images/tim_taylor.svg';
    with code to fetch the value of atlasSvg in folder '~/images/atlasSvg/{atlasSvgFile}/' fetching the atlasSvgFile parameter of the sequence table from the database
- In the calls to the <AtlasImage> component in SequenceViewer.tsx (lines 882 and 1167), if the sequence being published has a atlasSvgFile parameter, specify the value of that parameter to the call. If not, specify the value of the atlasSvgFile parameter of the step.
- add the request for the user to specify the atlasSvgFile parameter to the sequences/edit.tsx and sequences/new.tsx pages of sequences, and also in the {editMode ? ( line 854) of SequenceViewer.tsx. Let the user choose from a list of the files in the 'app/images/atlasSvg' folder.
