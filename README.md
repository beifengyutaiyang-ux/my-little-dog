# My Little Dog · Prototype 0.4

Prototype 0.4 upgrades the phone-friendly Beagle room simulator with **authentic extracted Beagle audio**, **audio-visual vocalization sync**, **unified state machine protection**, and **new living-room behaviors**.

## What's new in 0.4
- **Authentic Beagle audio (`assets/audio/`)**:
  - `bark-1.mp3` – `bark-3.mp3`: crisp short adult Beagle barks.
  - `baying-1.mp3` – `baying-4.mp3`: signature hound "wer-wer" baying/howls.
  - `whining-1.mp3` – `whining-3.mp3`: soft puppy whining/whimpering clips.
- **Audio Engine**:
  - Web Audio API preloading & decoding with `GainNode` volume/mute control and `AnalyserNode` real-time amplitude tracking, plus `HTMLAudioElement` fallback.
  - First-gesture audio unlock for Android Chrome / mobile WebView autoplay rules.
  - Overlap prevention, mute toggle (`🔊`/`🔇`), volume slider, and preserved custom audio import (`♫`).
- **Audio-Visual Sync & State Machine**:
  - Real-time `--mouth-open` & `--voice-pulse` sync driving mouth opening/closing, head lift, body bobbing, and ear flutter during vocalizations, restoring `idle` when audio ends.
  - Token-guarded timers prevent locomotion/action/audio conflicts.
- **New Behaviors**:
  - Sniffing (`sniff`), curious head-tilt (`headTilt`), stretching (`stretch`), chasing tennis ball (`chaseToy`), carrying mischievous items (`carryItem`), rug-digging zoomies (`mischief`), and autonomous living-room exploration.
- **Backward Compatibility**:
  - Preserves 4-frame `walk` & `run`, horizontal flip, all 5 action buttons, 4 status meters, and automatic migration from `mld-v03` `localStorage` saves.
