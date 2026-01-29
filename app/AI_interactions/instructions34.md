I want to manage draft editing / publishing of sequences and steps.

Phase 1
* draft versions of sequences are visible only to users who created the sequence, or users invited by the creating user to work on editing it. Only published sequences are visible to all.
* Logged in users can edit draft versions of sequences without publishing on the site.
* Users who are making edits to an existing sequence should be requested to proof read before publishing changes.

Phase 2
* A user who creates a sequence can invite another user to edit on it also as a team.
* If there are changes made by another user of the team, the app reports that it is currently impossible to edit this sequence, because another user is currently editing. 
* Before opening a sequence for editing, the app checks whether the sequence or the steps it contains are currently being edited. If there are changes that are not yet published that were made by the current user, the app asks whether the user wants to continue with the existing edits or start again from scratch.

Implementation
Below is a suggestion, what do you think?
I'm thinking of creating database tables parallel to the existing 'sequences' and 'steps' tables, named 'draft_sequences' and 
'draft_steps'. 
draft_sequences is identical to sequences, except that it also has a user_id column, to identify the user that is currently editing the sequence.
I don't know whether it is better to attribute the same id to the draft_sequences table as in the sequences table, or whether to add a sequence_id column to the table, and set the id of the draft_sequences automatically.