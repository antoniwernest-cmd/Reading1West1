# Mountain biking Story

An illustrated reading activity set at Camp Big Bear, with Pre-A, Pre-AA, A, AA and AAA levels. Four story chapters include draggable cloze words, reading questions and matching. A mountain-bike diagram completes the assessment. The activity adapts to Chromebook and tablet screens. Wide landscape screens show the editable story and notebook together; the Full screen control expands the view when supported by the browser.

## Upload to GitHub and publish

1. Create or open your GitHub repository.
2. Upload **the contents of this folder** to the repository root. `index.html`, the JavaScript files, CSS files and `assets/` must sit together at the top level. Keep every filename and its capitalization exactly as supplied. Include the dotfiles `.nojekyll` and `.gitignore`.
3. Commit the uploaded files to your publishing branch, normally `main`.
4. In the repository, open **Settings > Pages**. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose your branch and **/(root)**, then **Save**. GitHub Pages shows the site link once deployment finishes.

These steps follow the [official GitHub Pages publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

No build command, package installation or server application is required. All site links and image paths are relative, so the activity can run under a GitHub repository subpath.

## Included files

- `index.html`: website entry point.
- `content.js`: five levels of story text, word banks and questions.
- `app.js`: screens, progress and assessment flow.
- `cloze.js`, `reading-answers.js`, `reading-gate.js`, `drag-contact.js`: answer placement and completion rules.
- `bike.js`: mountain-bike diagram and movable labels.
- `reading-tools.js`: current-page text, reading support and teacher voice controls.
- `screen-tools.js`: the wide workspace and Full screen / Exit controls.
- `reporting.js`, `shared.js`, `result-template.js`: parent reports and Excel/CSV/JSON exports.
- `style.css`, `november.css`, `responsive.css`: appearance and screen-size layouts.
- `assets/`: the cover and four optimized story illustrations.
- `.nojekyll`: tells GitHub Pages to serve the static files directly.
- `Teacher-Guide.txt`: classroom instructions and teacher access.
- [Teacher story map](teacher/Teacher-Story-Map.pdf): printable start-to-finish teacher reference.

## Classroom use

Open the published website and choose a reading level and Camper ID. Every story blank, question pad, matching pad and bike label must be filled before the page can lock. Valid choices can be incorrect. Voice starts disabled and can be enabled by the teacher. Saved attempts stay in the browser on that device. See the teacher guide for the results and reset controls.

## Editing

Edit `content.js` to revise the story or questions, and the CSS files to revise the design. The root HTML loads these separate source files directly. Upload all changed files when updating the repository.
