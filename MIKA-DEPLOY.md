# Mika deployment instructions — Prototype 0.2

Repository: `beifengyutaiyang-ux/my-little-dog`
Branch: `main`
Publish: GitHub Pages from `/ (root)`

1. Open the repository and update the project using the files in this package.
2. Upload the CONTENTS of this package to the repository root, not the containing folder.
3. Replace `index.html`, `css/style.css`, `js/main.js`, and the `assets/` directory.
4. Ensure these paths exist exactly:
   - `index.html`
   - `css/style.css`
   - `js/main.js`
   - `assets/environment/living-room.png`
   - `assets/dog/pose-0.png` through `assets/dog/pose-8.png`
5. Do not rewrite or redesign the code. Do not rename files or add another directory level.
6. Commit with message: `Replace static dog with 2D sprite character prototype 0.2`.
7. Wait for GitHub Pages deployment, then open:
   `https://beifengyutaiyang-ux.github.io/my-little-dog/`
8. Verify the dog is fully visible with transparent edges, the dog changes poses, can wander left/right, and all five action buttons work.
9. Report any missing asset or console error verbatim. Do not claim the audio is bundled: the sound button imports an audio file selected by the user.
