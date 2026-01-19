
create a new route named wikimedia
create a new route file named wikimedia.tsx
look inside the file wikimedia.htm
for each line in the form https://commons.wikimedia.org/wiki/File:*****.gif :
* check inside the url on the web
* inside the file on the web, find the src of the image (<img > tag) that looks like the *****.gif part . The spaces ' ' will probably be replaced by underscores '_'
* for each line where you can find the page and the image, add a line to the wikimedia.tsx file in the jsx part, looking like this:
   <p><a href="*****.gif">*****</a>: <img src="*****.gif"/></p>
* for each line where you can't find the page, add a line looking like this
    <p>*****.gif : can't find the page</p>
* for each line where you can find the page but not the image, add a line looking like this:
    <p><a href="*****.gif">*****.gif</a> : can't find the image <img src="*****.gif"/></p>