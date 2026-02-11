I have an idea for the database structure, to manage draft sequences, published sequences, to answer questions such as:
is this a draft sequence? if it is, does it have a published version? which one? if it isn't, does it have a draft version? etc.
We could have a table draft_vs_published with 2 columns: 
* draft_sequence_id
* published_sequence_id
for example 
if draft_sequence_id=5 and published_sequence_id=0 (0 or null, which is better?), sequence with id=5 is a draft with no published version
if draft_sequence_id=0 and published_sequence_id=5, sequence with id=5 is a published sequence with no draft being edited
if draft_sequence_id=11 and published_sequence_id=5, sequence with id=5 is a published sequence. Sequence 5 is currently being edited, and the draft version sequence is id=10.
We could then remove the 'draft' and 'is_published' columns in the 'sequences' table