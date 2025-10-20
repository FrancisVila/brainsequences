On the model of the Notes database table, create the following tables:
sequences:
* id: integer (mandatory)
* title: string (mandatory)
* description: string (not mandatory)
* steps: list of steps (not mandatory)

steps:
* id: integer (mandatory)
* title: string (mandatory)
* description: string (not mandatory)
* brainparts: list of brainparts (not mandatory)
* arrows: list of arrows (not mandatory)

brainparts:
* id: integer (mandatory)
* title: string (mandatory)
* description: string (not mandatory)
* moreInfoLinks: list of urls (not mandatory)

arrows:
* id: integer (mandatory)
* description: string (not mandatory)
* from: brainpart
* to: brainpart