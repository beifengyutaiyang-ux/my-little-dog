# Mika deployment instructions — Prototype 0.3

Repository: `beifengyutaiyang-ux/my-little-dog`
Branch: `main`
GitHub Pages source: `/ (root)`

1. Upload the CONTENTS of this package to the repository root, replacing `index.html`, `css/`, `js/`, and `assets/`.
2. Do not create an extra enclosing directory. Do not rewrite the code.
3. Confirm these animation files exist:
   - `assets/dog/walk/frame-0.png` through `frame-3.png`
   - `assets/dog/run/frame-0.png` through `frame-3.png`
4. Confirm these action poses exist: `idle.png`, `bark.png`, `happy.png`, `sleep.png`, `sit.png`, `play.png`, `crouch.png`.
5. Keep `assets/environment/living-room.png`.
6. Commit message: `Add continuous beagle walk and run animation prototype 0.3`.
7. Wait for Pages deployment. On mobile Chrome test:
   - walk/run images visibly advance through frames
   - dog moves and faces its travel direction
   - tapping the dog and all five action buttons work
   - state remains after refresh
8. Report missing files or errors exactly. Do not claim authentic audio is bundled.
