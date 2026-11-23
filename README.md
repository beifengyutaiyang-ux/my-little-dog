# My Little Dog · Prototype 0.3

Prototype 0.3 adds real frame-by-frame locomotion to the existing phone-friendly pet simulator.

## New animation assets
- `assets/dog/walk/frame-0.png` through `frame-3.png`: four-frame walk loop.
- `assets/dog/run/frame-0.png` through `frame-3.png`: four-frame run loop.
- `assets/dog/idle.png`, `bark.png`, `happy.png`, `sleep.png`, `sit.png`, `play.png`, `crouch.png`: separate transparent action poses.

## Runtime
- `requestAnimationFrame` advances walk/run frames continuously.
- The dog moves horizontally and turns to face the direction of travel.
- Static poses are used for idle, bark, sleep, sit, happy, play and crouch.
- Existing interaction buttons, status meters and localStorage persistence remain.
- Users may import their own audio recording using the sound button.

## Honest limitations
Walk and run are continuous four-frame loops. Bark is currently a dedicated static pose with a simple mouth overlay/body bob; it is not yet a multi-frame mouth-sync animation. Tail and ears are not yet independently rigged. No authentic Beagle recording is bundled.
