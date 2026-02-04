Button management in <div className='navbar-edit
* If I don't have edit rights on the sequence: don't show the navbar-edit section at all
* 'Edit sequence' : show this button if I am not in edit mode. It opens the sequence in edit mode, in the same browser tab.
* 'Show published': show this button if I am viewing the draft sequence (edit mode or not). It opens the published version of the sequence in another browser tab.
* 'Show draft': show this button if a draft exists for this sequence, and if I am viewing the published sequence. It opens the draft version in another tab.
* 'Update': show this button if I am in edit mode (button exists already)
* 'Publish': show this button if I am viewing the draft version (button exists already)
* 'Cancel': show this button if I am viewing the draft version (button exists already)
* 'Manage Collaborators': show this button if I am the creator of this sequence (button exists already)