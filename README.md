# My Little Dog · Prototype 0.2

This version replaces the old framed dog photo with a transparent 2D pose set.
The dog is rendered as an independent character over a separate living-room background.

## Files
- `assets/dog/pose-0.png` to `pose-8.png`: nine transparent dog poses (idle, walk, run, play, bark, crouch, sit, happy, sleep).
- `assets/environment/living-room.png`: separate room background.
- `js/main.js`: pose switching, simple wandering, interactions, local save, optional user-supplied audio.
- `css/style.css`: responsive mobile layout and motion effects.

## Deploy
Upload the contents of this folder to the existing GitHub repository root, replacing the old `index.html`, `css/`, `js/`, and `assets/` contents. Keep the repository root structure; do not upload the outer folder itself.

## Important limitations
This is a first 2D sprite-pose prototype, not yet a full frame-by-frame skeletal animation system. It switches between nine separately illustrated transparent poses and adds motion to the character container. Real Beagle recordings are not bundled; the user can import their own audio from the sound button.
