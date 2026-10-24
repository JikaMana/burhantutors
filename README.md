# Burhan Tutors Bootcamp site

    index.html
    css/style.css
    js/main.js
    images/logo.png   <- replace the placeholder with your real logo (same filename)

The logo is referenced as /images/logo.png (root-absolute), so run it through a
local server rather than double-clicking index.html:

    python3 -m http.server 8000     # open http://localhost:8000
    npx serve .

## Deploy
- Netlify: drag this folder onto app.netlify.com/drop (no build step).
- Vercel: `npx vercel --prod` in this folder.
- GitHub Pages: if served from a sub-path (user.github.io/repo/), change /images/logo.png to images/logo.png.

## Easy edits
- Seats left: "3 seats left", "6 seats left" in index.html
- Prices: "25,000", "20,000" in index.html
- WhatsApp / phone: 2348165689362 in js/main.js and index.html
- Colors: :root variables at the top of css/style.css
# burhantutors
