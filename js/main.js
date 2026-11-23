(() => {
  const $ = id => document.getElementById(id);
  const dog = $("dogCharacter");
  const img = $("dogFrame");
  const shadow = $("dogShadow");
  const speech = $("speech");
  const subtitle = $("subtitle");
  const hint = $("behaviorHint");
  const roomProp = $("roomProp");
  const carryBadge = $("carryBadge");
  const muteBtn = $("muteBtn");
  const volumeSlider = $("volumeSlider");
  const soundBtn = $("soundBtn");
  const audioInput = $("audioInput");
  const fallbackAudio = $("dogAudio");

  const STORAGE_KEY_V04 = "mld-v04";
  const STORAGE_KEY_V03 = "mld-v03";
  const AUDIO_PREF_KEY = "mld-v04-audio";

  const frames = {
    walk: Array.from({ length: 4 }, (_, i) => `assets/dog/walk/frame-${i}.png`),
    run: Array.from({ length: 4 }, (_, i) => `assets/dog/run/frame-${i}.png`),
    carryItem: Array.from({ length: 4 }, (_, i) => `assets/dog/walk/frame-${i}.png`)
  };

  const staticPose = {
    idle: "idle",
    bark: "bark",
    baying: "bark",
    whining: "crouch",
    pet: "happy",
    happy: "happy",
    sleep: "sleep",
    sit: "sit",
    headTilt: "sit",
    sniff: "crouch",
    stretch: "crouch",
    mischief: "crouch",
    play: "play",
    chaseToy: "play"
  };

  const audioCatalog = {
    bark: [
      "assets/audio/bark-1.mp3",
      "assets/audio/bark-2.mp3",
      "assets/audio/bark-3.mp3"
    ],
    baying: [
      "assets/audio/baying-1.mp3",
      "assets/audio/baying-2.mp3",
      "assets/audio/baying-3.mp3",
      "assets/audio/baying-4.mp3"
    ],
    whining: [
      "assets/audio/whining-1.mp3",
      "assets/audio/whining-2.mp3",
      "assets/audio/whining-3.mp3"
    ]
  };

  const vocalMeta = {
    bark: {
      bubbles: ["汪！汪！", "Arf! Arf!", "汪呜！"],
      subtitles: [
        "它精神抖擞地发出清脆的叫声！",
        "它抬头连叫了两声，耳朵跟着抖动。"
      ],
      hint: "它正兴奋地吠叫"
    },
    baying: {
      bubbles: ["WOO-wer~!", "嗷呜——！", "Wooo-wer!"],
      subtitles: [
        "它抬起头，发出标志性的比格猎犬“wer-wer”嚎叫！",
        "它拉长脖子，响亮地嚎叫了一声！"
      ],
      hint: "它正在猎犬式嚎叫"
    },
    whining: {
      bubbles: ["呜呜……", "嘤嘤~", "呜~"],
      subtitles: [
        "它轻轻呜咽起来，水汪汪地看着你。",
        "它发出软绵绵的撒娇哼唧声。"
      ],
      hint: "它正在轻轻呜咽撒娇"
    }
  };

  function loadState() {
    const rawV4 = localStorage.getItem(STORAGE_KEY_V04);
    if (rawV4) {
      try { return JSON.parse(rawV4); } catch (_) {}
    }
    const rawV3 = localStorage.getItem(STORAGE_KEY_V03);
    if (rawV3) {
      try { return JSON.parse(rawV3); } catch (_) {}
    }
    return { mood: 82, hunger: 35, energy: 88, bond: 35 };
  }

  function loadAudioPref() {
    try {
      const saved = JSON.parse(localStorage.getItem(AUDIO_PREF_KEY) || "{}");
      return {
        muted: Boolean(saved.muted),
        volume: typeof saved.volume === "number" ? Math.max(0, Math.min(1, saved.volume)) : 0.85
      };
    } catch (_) {
      return { muted: false, volume: 0.85 };
    }
  }

  const state = loadState();
  const audioPref = loadAudioPref();

  let mode = "idle";
  let frame = 0;
  let lastFrameTs = 0;
  let x = 50;
  let actionToken = 0;
  let actionTimer = null;
  let moveTimer = null;
  let speechTimer = null;
  let propTimer = null;
  let isVocalizing = false;
  let smoothedAmp = 0;

  // Audio Engine state (Web Audio API + HTMLAudioElement fallback)
  let audioCtx = null;
  let gainNode = null;
  let analyserNode = null;
  let analyserData = null;
  let audioUnlocked = false;
  let activeSource = null;
  let activeFallback = null;
  let customAudioUrl = "";
  const bufferCache = new Map();
  const lastClipIndex = { bark: -1, baying: -1, whining: -1 };

  function clamp(n) {
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickClip(type) {
    const list = audioCatalog[type] || audioCatalog.bark;
    if (list.length === 1) return list[0];
    let idx = Math.floor(Math.random() * list.length);
    if (idx === lastClipIndex[type]) {
      idx = (idx + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length;
    }
    lastClipIndex[type] = idx;
    return list[idx];
  }

  function saveAudioPref() {
    localStorage.setItem(AUDIO_PREF_KEY, JSON.stringify(audioPref));
  }

  function syncAudioUI() {
    muteBtn.textContent = audioPref.muted || audioPref.volume === 0 ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-pressed", String(audioPref.muted));
    muteBtn.classList.toggle("is-muted", audioPref.muted || audioPref.volume === 0);
    volumeSlider.value = Math.round(audioPref.volume * 100);
    if (gainNode && audioCtx) {
      gainNode.gain.setTargetAtTime(audioPref.muted ? 0 : audioPref.volume, audioCtx.currentTime, 0.02);
    }
    if (fallbackAudio) {
      fallbackAudio.volume = audioPref.muted ? 0 : audioPref.volume;
    }
  }

  function ensureAudioContext() {
    if (audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      audioCtx = new Ctx();
      gainNode = audioCtx.createGain();
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserData = new Uint8Array(analyserNode.frequencyBinCount);
      gainNode.gain.value = audioPref.muted ? 0 : audioPref.volume;
      analyserNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      return audioCtx;
    } catch (_) {
      return null;
    }
  }

  async function decodeClip(url) {
    if (bufferCache.has(url)) return bufferCache.get(url);
    const ctx = ensureAudioContext();
    if (!ctx) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      bufferCache.set(url, buf);
      return buf;
    } catch (_) {
      return null;
    }
  }

  function preloadAllAudio() {
    if (!ensureAudioContext()) return;
    const all = [...audioCatalog.bark, ...audioCatalog.baying, ...audioCatalog.whining];
    all.forEach(url => { decodeClip(url); });
  }

  function unlockAudio() {
    const ctx = ensureAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    audioUnlocked = true;
    preloadAllAudio();
  }

  ["pointerdown", "touchstart", "keydown"].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { once: true, passive: true });
  });

  function stopCurrentAudio() {
    if (activeSource) {
      try {
        activeSource.onended = null;
        activeSource.stop();
        activeSource.disconnect();
      } catch (_) {}
      activeSource = null;
    }
    if (activeFallback) {
      try {
        activeFallback.onended = null;
        activeFallback.pause();
        activeFallback.currentTime = 0;
      } catch (_) {}
      activeFallback = null;
    }
    isVocalizing = false;
    smoothedAmp = 0;
    dog.style.setProperty("--mouth-open", "0");
    dog.style.setProperty("--voice-pulse", "0");
  }

  function render() {
    for (const [key, label, bar] of [
      ["mood", "moodText", "moodBar"],
      ["hunger", "hungerText", "hungerBar"],
      ["energy", "energyText", "energyBar"]
    ]) {
      $(label).textContent =
        key === "mood"
          ? state[key] > 65 ? "开心" : state[key] > 35 ? "平静" : "无聊"
          : key === "hunger"
          ? state[key] < 30 ? "饱腹" : state[key] < 65 ? "适中" : "饿了"
          : state[key] > 65 ? "充沛" : state[key] > 30 ? "一般" : "疲惫";
      $(bar).style.width = state[key] + "%";
    }
    $("bondText").textContent = state.bond;
    $("bondBar").style.width = state.bond + "%";
    localStorage.setItem(STORAGE_KEY_V04, JSON.stringify(state));
  }

  function clearMotionTimers() {
    clearTimeout(actionTimer);
    clearTimeout(moveTimer);
    actionTimer = null;
    moveTimer = null;
  }

  function hideProps() {
    clearTimeout(propTimer);
    roomProp.classList.remove("show");
    carryBadge.classList.remove("show");
    carryBadge.textContent = "";
  }

  function setMode(next, duration = 0, onDone = null) {
    const token = ++actionToken;
    clearTimeout(actionTimer);
    mode = next;
    frame = 0;
    lastFrameTs = 0;
    dog.className = "dog-character " + next + (dog.dataset.direction === "left" ? " face-left" : "");
    const seq = frames[next];
    if (seq) {
      img.src = seq[0];
    } else {
      img.src = `assets/dog/${staticPose[next] || "idle"}.png`;
    }
    if (duration > 0) {
      actionTimer = setTimeout(() => {
        if (token !== actionToken) return;
        if (onDone) onDone();
        else setMode("idle");
      }, duration);
    }
    return token;
  }

  function say(text, bubble = "", bubbleMs = 1900) {
    subtitle.textContent = text;
    clearTimeout(speechTimer);
    if (bubble) {
      speech.textContent = bubble;
      speech.classList.add("show");
      speechTimer = setTimeout(() => speech.classList.remove("show"), bubbleMs);
    } else {
      speech.classList.remove("show");
    }
  }

  function moveTo(target, speed = "walk", onArrive = null) {
    clearMotionTimers();
    hideProps();
    const nextX = Math.max(24, Math.min(78, target));
    dog.dataset.direction = nextX < x ? "left" : "right";
    x = nextX;
    dog.style.left = x + "%";
    shadow.style.left = x + "%";
    const token = setMode(speed);
    if (speed === "run") hint.textContent = "它兴奋地跑起来了";
    else if (speed === "carryItem") hint.textContent = "它偷偷叼着战利品溜达";
    else hint.textContent = "它正在客厅里走动";

    const travelMs = speed === "run" ? 1350 : 2100;
    moveTimer = setTimeout(() => {
      if (token !== actionToken) return;
      if (onArrive) onArrive();
      else setMode("idle");
    }, travelMs);
  }

  async function vocalize(type = "random", { userGesture = false, customSubtitle = "", customHint = "" } = {}) {
    if (userGesture) unlockAudio();
    const chosenType = type === "random" ? pickRandom(["bark", "baying", "whining"]) : type;
    const meta = vocalMeta[chosenType] || vocalMeta.bark;
    const bubble = pickRandom(meta.bubbles);
    const subText = customSubtitle || pickRandom(meta.subtitles);

    stopCurrentAudio();
    clearMotionTimers();
    hideProps();

    const clipUrl = customAudioUrl || pickClip(chosenType);
    const token = setMode(chosenType, 2600, () => {
      isVocalizing = false;
      setMode("idle");
    });

    say(subText, bubble, 2000);
    hint.textContent = customHint || meta.hint;
    isVocalizing = true;

    const finishVocal = () => {
      if (token !== actionToken) return;
      isVocalizing = false;
      smoothedAmp = 0;
      dog.style.setProperty("--mouth-open", "0");
      dog.style.setProperty("--voice-pulse", "0");
      clearTimeout(actionTimer);
      setMode("idle");
    };

    if (audioPref.muted || audioPref.volume === 0) {
      // Muted: run clean timed mouth sync without audio output
      clearTimeout(actionTimer);
      actionTimer = setTimeout(finishVocal, chosenType === "baying" ? 1250 : 950);
      return;
    }

    if (!userGesture && !audioUnlocked) {
      // Respect Android Chrome autoplay policy before first user gesture
      clearTimeout(actionTimer);
      actionTimer = setTimeout(finishVocal, 1050);
      return;
    }

    // Prefer Web Audio API for built-in clips (real-time AnalyserNode mouth sync)
    if (!customAudioUrl && ensureAudioContext()) {
      if (audioCtx.state === "suspended") {
        try { await audioCtx.resume(); } catch (_) {}
      }
      const buf = await decodeClip(clipUrl);
      if (buf && token === actionToken) {
        try {
          const src = audioCtx.createBufferSource();
          src.buffer = buf;
          src.connect(analyserNode);
          src.onended = finishVocal;
          activeSource = src;
          clearTimeout(actionTimer);
          actionTimer = setTimeout(finishVocal, Math.ceil(buf.duration * 1000) + 180);
          src.start(0);
          return;
        } catch (_) {}
      }
    }

    // HTMLAudioElement fallback (also used for custom uploaded audio files)
    try {
      fallbackAudio.src = clipUrl;
      fallbackAudio.volume = audioPref.muted ? 0 : audioPref.volume;
      fallbackAudio.currentTime = 0;
      fallbackAudio.onended = finishVocal;
      activeFallback = fallbackAudio;
      const p = fallbackAudio.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          if (fallbackAudio.duration && isFinite(fallbackAudio.duration)) {
            clearTimeout(actionTimer);
            actionTimer = setTimeout(finishVocal, Math.ceil(fallbackAudio.duration * 1000) + 180);
          }
        }).catch(() => {
          clearTimeout(actionTimer);
          actionTimer = setTimeout(finishVocal, 1000);
        });
      }
    } catch (_) {
      clearTimeout(actionTimer);
      actionTimer = setTimeout(finishVocal, 1000);
    }
  }

  function updateMouthSync(ts) {
    if (!isVocalizing) return;
    let targetAmp = 0;
    if (activeSource && analyserNode && analyserData && !audioPref.muted) {
      analyserNode.getByteTimeDomainData(analyserData);
      let sum = 0;
      for (let i = 0; i < analyserData.length; i++) {
        const v = (analyserData[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / analyserData.length);
      targetAmp = Math.min(1, rms * 4.2);
    } else {
      // Natural rhythmic fallback envelope when muted or HTMLAudioElement is active
      const t = ts * 0.015;
      targetAmp = 0.35 + 0.55 * Math.abs(Math.sin(t)) * (0.65 + 0.35 * Math.sin(t * 0.37));
    }
    smoothedAmp = smoothedAmp * 0.55 + targetAmp * 0.45;
    dog.style.setProperty("--mouth-open", smoothedAmp.toFixed(3));
    dog.style.setProperty("--voice-pulse", (smoothedAmp * 0.9).toFixed(3));
  }

  function loop(ts) {
    const frameInterval = mode === "run" ? 110 : mode === "carryItem" ? 145 : 135;
    if (ts - lastFrameTs >= frameInterval) {
      lastFrameTs = ts;
      if (frames[mode]) {
        frame = (frame + 1) % frames[mode].length;
        img.src = frames[mode][frame];
      }
    }
    updateMouthSync(ts);
    requestAnimationFrame(loop);
  }

  // Expressive behaviors (Section IV)
  function doSniff() {
    stopCurrentAudio();
    hideProps();
    setMode("sniff", 2300);
    hint.textContent = "它正低头认真嗅闻地毯……";
    say("它把鼻子贴近地毯，仔细闻着什么味道。");
  }

  function doHeadTilt() {
    stopCurrentAudio();
    hideProps();
    setMode("headTilt", 2100);
    hint.textContent = "它歪着头观察四周";
    say("它坐下来歪着小脑袋，好奇地看着你。", "？");
  }

  function doStretch() {
    stopCurrentAudio();
    hideProps();
    setMode("stretch", 2200);
    hint.textContent = "它伸了个大大的懒腰";
    say("它前爪往前一伸，舒舒服服地伸了个懒腰～");
  }

  function doChaseToy() {
    stopCurrentAudio();
    const toyX = x > 54 ? 32 : 68;
    roomProp.textContent = "🎾";
    roomProp.style.left = toyX + "%";
    roomProp.classList.add("show");
    say("网球滚过去了，它飞扑着追了上去！");
    moveTo(toyX, "run", () => {
      setMode("chaseToy", 1300, () => {
        hideProps();
        if (Math.random() < 0.65) vocalize("bark", { userGesture: false });
        else setMode("idle");
      });
      hint.textContent = "它扑住玩具兴奋地玩耍！";
    });
  }

  function doCarryItem() {
    stopCurrentAudio();
    hideProps();
    const items = [
      { icon: "🧦", name: "沙发边的袜子" },
      { icon: "🧸", name: "小熊玩偶" },
      { icon: "🦴", name: "藏起来的磨牙骨" }
    ];
    const item = pickRandom(items);
    const dest = x > 50 ? 28 : 74;
    carryBadge.textContent = item.icon;
    carryBadge.classList.add("show");
    say(`它偷偷叼走了${item.name}，正准备藏起来！`, "嘿嘿~");
    moveTo(dest, "carryItem", () => {
      carryBadge.classList.remove("show");
      setMode("sit", 1200);
      hint.textContent = "它把小物件藏到角落里";
    });
  }

  function doMischief() {
    stopCurrentAudio();
    hideProps();
    say("比格犬精力爆发，开始在地毯上调皮捣蛋啦！", "嗷呜！");
    setMode("mischief", 1400, () => {
      const dashTarget = x > 50 ? 30 : 72;
      moveTo(dashTarget, "run", () => {
        vocalize(Math.random() < 0.5 ? "baying" : "bark", { userGesture: false });
      });
    });
    hint.textContent = "它突然调皮地刨起地毯！";
  }

  const replies = {
    pet: "它舒服地靠近你，开心地摆动着小尾巴。",
    feed: "它埋头吃起狗粮，还满足地舔舔嘴。",
    play: "它兴奋地追着玩具跑了起来！",
    rest: "它打了个哈欠，趴下来安心休息。",
    call: "它竖起耳朵，飞快地跑向你！"
  };

  function act(a) {
    unlockAudio();
    stopCurrentAudio();
    hideProps();
    say(replies[a]);

    if (a === "pet") {
      state.bond = clamp(state.bond + 3);
      state.mood = clamp(state.mood + 7);
      if (Math.random() < 0.4) {
        setMode("pet", 900, () => {
          vocalize(Math.random() < 0.6 ? "whining" : "bark", {
            userGesture: true,
            customSubtitle: "它被摸得开心极了，轻轻叫了一声回应你！",
            customHint: "它正撒娇回应你的抚摸"
          });
        });
      } else {
        setMode("pet", 1300);
        hint.textContent = "它正享受你的抚摸";
      }
    } else if (a === "feed") {
      state.hunger = clamp(state.hunger - 28);
      state.mood = clamp(state.mood + 5);
      setMode("happy", 1400);
      hint.textContent = "它正在津津有味地吃东西";
    } else if (a === "play") {
      state.energy = clamp(state.energy - 12);
      state.mood = clamp(state.mood + 12);
      state.bond = clamp(state.bond + 2);
      const toyX = x > 55 ? 36 : 67;
      roomProp.textContent = "🎾";
      roomProp.style.left = toyX + "%";
      roomProp.classList.add("show");
      moveTo(toyX, "run", () => {
        setMode("chaseToy", 1100, () => {
          hideProps();
          vocalize("bark", {
            userGesture: true,
            customSubtitle: "它接住球后兴奋地汪了一声！"
          });
        });
      });
    } else if (a === "rest") {
      state.energy = clamp(state.energy + 18);
      setMode("sleep", 3500);
      hint.textContent = "它正趴在客厅里打盹";
    } else if (a === "call") {
      state.bond = clamp(state.bond + 2);
      moveTo(50, "run", () => {
        const vType = Math.random() < 0.6 ? "baying" : "bark";
        vocalize(vType, {
          userGesture: true,
          customSubtitle: "它跑到你面前，仰起头响亮地回应你的呼唤！"
        });
      });
    }
    render();
  }

  document.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => act(btn.dataset.action));
  });

  dog.addEventListener("click", () => act("pet"));

  muteBtn.addEventListener("click", () => {
    unlockAudio();
    audioPref.muted = !audioPref.muted;
    if (audioPref.muted) stopCurrentAudio();
    saveAudioPref();
    syncAudioUI();
    say(audioPref.muted ? "已静音，比格犬现在会安静活动。" : "已开启真实比格犬叫声。");
  });

  volumeSlider.addEventListener("input", e => {
    unlockAudio();
    audioPref.volume = Math.max(0, Math.min(1, Number(e.target.value) / 100));
    if (audioPref.volume > 0 && audioPref.muted) audioPref.muted = false;
    saveAudioPref();
    syncAudioUI();
  });

  $("resetBtn").addEventListener("click", () => {
    unlockAudio();
    stopCurrentAudio();
    clearMotionTimers();
    hideProps();
    Object.assign(state, { mood: 82, hunger: 35, energy: 88, bond: 35 });
    customAudioUrl = "";
    soundBtn.classList.remove("is-custom");
    render();
    setMode("idle");
    hint.textContent = "它正在客厅里活动";
    say("状态已重置，已恢复内置真实比格犬叫声。");
  });

  soundBtn.addEventListener("click", () => {
    unlockAudio();
    audioInput.click();
  });

  audioInput.addEventListener("change", e => {
    const f = e.target.files[0];
    if (f) {
      if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
      customAudioUrl = URL.createObjectURL(f);
      soundBtn.classList.add("is-custom");
      say("已载入你选择的自定义音频，呼唤它听听看！");
    }
  });

  function wander() {
    const busyModes = ["sleep", "pet", "happy", "bark", "baying", "whining", "chaseToy", "carryItem", "mischief", "run"];
    if (busyModes.includes(mode)) return;

    const r = Math.random();
    if (r < 0.16) {
      setMode("idle");
      hint.textContent = "它停下来观察四周";
    } else if (r < 0.34) {
      moveTo(x + (Math.random() > 0.5 ? 14 : -14), "walk");
    } else if (r < 0.48) {
      doSniff();
    } else if (r < 0.60) {
      doHeadTilt();
    } else if (r < 0.70) {
      doStretch();
    } else if (r < 0.80) {
      const needWhine = state.hunger > 65 || state.energy < 30;
      vocalize(needWhine ? "whining" : "random", { userGesture: false });
    } else if (r < 0.88) {
      doChaseToy();
    } else if (r < 0.94) {
      doCarryItem();
    } else {
      doMischief();
    }
  }

  // Expose lightweight debug hook for automated verification without polluting global namespace
  window.__mldDebug = {
    getState: () => ({ ...state, mode, x, audioUnlocked, muted: audioPref.muted, volume: audioPref.volume }),
    triggerVocal: type => vocalize(type, { userGesture: true }),
    triggerBehavior: name => {
      const map = { sniff: doSniff, headTilt: doHeadTilt, stretch: doStretch, chaseToy: doChaseToy, carryItem: doCarryItem, mischief: doMischief };
      if (map[name]) map[name]();
    }
  };

  render();
  syncAudioUI();
  setMode("walk");
  requestAnimationFrame(loop);
  setTimeout(() => {
    if (mode === "walk") setMode("idle");
  }, 900);
  setInterval(wander, 5200);
  setInterval(() => {
    state.hunger = clamp(state.hunger + 1);
    state.energy = clamp(state.energy - 0.4);
    if (state.hunger > 70) state.mood = clamp(state.mood - 1);
    render();
  }, 45000);
})();