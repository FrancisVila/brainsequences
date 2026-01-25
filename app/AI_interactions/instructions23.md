create a script that does the following:
1) take a yaml file provided as an attribute (default value: 'sequence.yaml')
2) open the database app.db
3) compare the title of the sequence in the yaml file with the titles of the rows in the sequences table. If the title already exists, ask the user the question in this form:
    A sequence with the title <title> already exists, with steps <step1>, <step2>, <step3>.
    Do you want to:
    1 override it (default answer)
    2 keep the old one and create a new one
    3 cancel
4) create a new sequence in the sequences table, or override it
5) create or possibly override steps in the steps table, corresponding to the steps in the yaml file
6) for each step, create the step_brainpart rows in the step_brainparts table between the current step and the brainparts listed in the step_brainparts attribute of the yaml file
7) If the yaml file mentions a brainpart that does not exist in the no brainpart exists in the brainparts table, point this out to the user
