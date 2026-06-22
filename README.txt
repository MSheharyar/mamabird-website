THREE BABY BIRDIES — Frontend Prototype
========================================
Developer Reference for Tachhattan
Prepared by Muhammad Sheharyar Ghori · June 2026

HOW TO RUN
----------
Just open index.html in any browser. No server needed.
All pages link to each other via relative paths.

FILE STRUCTURE
--------------
index.html        Homepage (hero, book, about, chatbot CTA, testimonials, newsletter)
about.html        About the author & family story
book.html         Dedicated book page (excerpt, meta, buy options)
blog.html         Blog listing (6 sample posts)
chatbot.html      Chirpy's Classroom — FULLY INTERACTIVE demo (works without backend)
login.html        Sign In / Register (tabbed, with role selector)
contact.html      Contact form with reason selector
pricing.html      4-tier pricing page with FAQ
css/main.css      ALL design tokens, shared components, nav, footer
js/main.js        Shared JS (nav scroll, mobile menu, active link detection)
assets/           Drop real images here (book cover, author photos)

DESIGN TOKENS (in css/main.css :root)
--------------------------------------
--sky:         #6EB4D4   Primary brand color
--yellow:      #F5C200   Sunshine / highlight
--red:         #CC2929   CTA buttons / accents
--brown:       #9B6B35   Earth / nest tones
--green:       #4A8B3F   Format tags / success states
--cream:       #FDF8F0   Page background
--dark:        #2C1810   Primary text
--font-display: Quicksand (headings)
--font-body:    Nunito (body text)

IMAGES TO REPLACE
-----------------
All placeholder emoji (🐦 author photo, book cover SVG) need real assets from Iris.
- Author photo: goes in .author-photo-box (replace the 🐦 emoji with an <img> tag)
- Book cover:   SVG illustration on hero can be replaced with <img src="assets/cover.jpg">
- Book display: Same on book.html hero section
- Blog thumbs:  Replace the big emoji in .blog-thumb with actual images

CHATBOT PAGE
------------
chatbot.html has a FULLY WORKING JavaScript demo of the chat interface.
- Character switching (Chirpy / Mama Bird) works
- Subject switching works and loads different opening messages
- Chirpy responds to user input with scripted educational responses
- Typing indicator animation works
- This is NOT connected to the FastAPI backend — it's pure frontend simulation
- When backend is ready, replace the sendMsg() JS logic with a fetch() to /api/chat

LOGIN PAGE
----------
Login and Register tabs both work (pure JS toggle).
Role selector (Parent / Teacher) works.
No actual authentication — wire up to POST /auth/signup and POST /auth/login.

SOCIAL MEDIA LINKS
------------------
All social icons in footer have href="#" — replace with real URLs:
Facebook, Instagram, Pinterest, YouTube for Iris Scarfone / Three Baby Birdies.

WORDPRESS EMBEDDING (for Tachhattan)
--------------------------------------
When embedding as WordPress plugin:
- Wrap the entire widget in Shadow DOM to prevent Iris theme CSS conflicts
- Prefix all CSS classes with .mb- if Shadow DOM isn't used
- The chatbot widget CSS is self-contained in chatbot.html's <style> block

KNOWN PLACEHOLDERS (to resolve before launch)
----------------------------------------------
[ ] Author photo (iris-photo.jpg, frank-photo.jpg, ronald-photo.jpg)
[ ] Real book cover image (cover.jpg)
[ ] Social media profile URLs
[ ] Newsletter form endpoint (Mailchimp / ConvertKit)
[ ] Contact form endpoint
[ ] Privacy Policy page content
[ ] Terms of Service page content
[ ] Blog post full content pages

