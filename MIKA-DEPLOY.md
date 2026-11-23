# Mika deployment instructions — Prototype 0.4

Repository: `beifengyutaiyang-ux/my-little-dog`
Branch: `main`
GitHub Pages source: `/ (root)`

> **Note:** Keep 0.3 backup/tag before overwriting if you want an instant rollback point.

1. Upload the CONTENTS of `my-little-dog-0.4.zip` to the repository root, replacing `index.html`, `css/`, `js/`, `assets/`, `README.md`, and `MIKA-DEPLOY.md`.
2. Do not create an extra enclosing directory. Do not introduce any build step.
3. Confirm all audio assets exist in `assets/audio/`:
   - `bark-1.mp3` through `bark-3.mp3`
   - `baying-1.mp3` through `baying-4.mp3`
   - `whining-1.mp3` through `whining-3.mp3`
4. Confirm all dog animation frames (`walk/frame-0~3.png`, `run/frame-0~3.png`), action poses (`idle.png`, `bark.png`, `happy.png`, `sleep.png`, `sit.png`, `play.png`, `crouch.png`), and `assets/environment/living-room.png` exist.
5. Commit message: `Release Prototype 0.4: authentic beagle audio, vocal sync, and new behaviors`.
6. Wait for GitHub Pages deployment, then verify on Android Chrome:
   - Tap any action button or the dog to unlock audio, then trigger `呼唤` / `玩耍` / `抚摸` to hear randomized real Beagle bark/baying/whining clips.
   - Verify mouth & head/body move with audio and return to `idle` after playback.
   - Verify mute (`🔊`/`🔇`), volume slider, and custom audio import (`♫`).
   - Verify state persists across page refresh (including `mld-v03` migration).
