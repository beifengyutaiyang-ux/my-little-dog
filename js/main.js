(() => {
  const $ = id => document.getElementById(id);
  const state = { mood:82, hunger:35, energy:88, bond:35, lastAction:Date.now(), audioUrl:null };
  const dog = $('dogFrame'), thought = $('thought'), caption = $('caption'), toast = $('toast');
  const audio = $('dogAudio');
  let toastTimer, thoughtTimer;
  const saved = localStorage.getItem('mld-state');
  if (saved) { try { Object.assign(state, JSON.parse(saved)); } catch {} }
  function persist(){localStorage.setItem('mld-state',JSON.stringify({mood:state.mood,hunger:state.hunger,energy:state.energy,bond:state.bond}));$('saveState').textContent='已保存';}
  function clamp(v){return Math.max(0,Math.min(100,v));}
  function render(){
    const entries=[['mood',state.mood],['hunger',state.hunger],['energy',state.energy],['bond',state.bond]];
    entries.forEach(([k,v])=>{$(k+'Bar').style.width=v+'%';});
    $('moodText').textContent=state.mood>65?'开心':state.mood>35?'一般':'有点闷';
    $('hungerText').textContent=state.hunger>70?'不饿':state.hunger>35?'适中':'饿了';
    $('energyText').textContent=state.energy>65?'充沛':state.energy>30?'一般':'疲惫';
    $('bondText').textContent=Math.round(state.bond);
  }
  function say(text, bubble=''){caption.textContent=text;thought.textContent=bubble;thought.classList.add('show');clearTimeout(thoughtTimer);thoughtTimer=setTimeout(()=>thought.classList.remove('show'),2200);clearTimeout(toastTimer);toast.textContent=text;toastTimer=setTimeout(()=>toast.textContent='小家伙正在观察周围……',2800);}
  function animate(kind){dog.classList.remove('active','playing','resting');void dog.offsetWidth;dog.classList.add('active');if(kind)dog.classList.add(kind);setTimeout(()=>dog.classList.remove('active','playing'),650);}
  function bark(){say('汪！汪！它发现你在看它！','汪！汪！');animate();if(audio.src){audio.currentTime=0;audio.play().catch(()=>say('浏览器阻止了自动播放，请再点一次声音按钮。',''));}else{say('这是叫声触发演示；导入真实比格犬录音后即可播放。','汪！汪！');}}
  document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>{
    const action=btn.dataset.action;state.lastAction=Date.now();
    if(action==='pet'){state.mood=clamp(state.mood+9);state.bond=clamp(state.bond+3);say('它舒服地眯起眼睛，尾巴摇个不停。','呼噜……');animate();}
    if(action==='feed'){state.hunger=clamp(state.hunger+24);state.mood=clamp(state.mood+5);say('它开心地吃起狗粮，还舔了舔嘴巴。','好吃！');animate();}
    if(action==='play'){state.energy=clamp(state.energy-13);state.mood=clamp(state.mood+13);state.bond=clamp(state.bond+2);dog.classList.add('playing');say('它追着玩具跑了一圈，兴奋得不得了！','快扔给我！');animate('playing');}
    if(action==='rest'){state.energy=clamp(state.energy+20);say('它找了个舒服的位置，准备休息一会儿。','呼……');dog.classList.add('resting');}
    if(action==='call'){state.bond=clamp(state.bond+2);say('它竖起耳朵，摇着尾巴跑向你！','汪？');animate();}
    render();persist();
  }));
  $('soundSetup').addEventListener('click',()=>$('audioInput').click());
  $('audioInput').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(state.audioUrl)URL.revokeObjectURL(state.audioUrl);state.audioUrl=URL.createObjectURL(file);audio.src=state.audioUrl;say('已载入叫声：'+file.name+'。点击小狗或互动按钮试听。','声音已就绪');});
  $('resetBtn').addEventListener('click',()=>{Object.assign(state,{mood:82,hunger:35,energy:88,bond:35});render();persist();say('状态已重置，小家伙又精神起来了！','汪！');});
  dog.addEventListener('click',()=>{state.bond=clamp(state.bond+1);bark();render();persist();});
  // Autonomous life: gradual needs drift and occasional mischievous reactions.
  setInterval(()=>{state.hunger=clamp(state.hunger-0.35);state.energy=clamp(state.energy-0.12);if(state.hunger<25)state.mood=clamp(state.mood-0.25);if(state.energy<20)state.mood=clamp(state.mood-0.15);render();persist();},8000);
  setInterval(()=>{if(Math.random()<0.52){const lines=[['它低头认真地闻了闻地毯。','嗅嗅……'],['它突然抬起頭，注意到窗外的动静。','嗯？'],['它叼起玩具，偷偷看着你。','陪我玩！'],['它摇着尾巴在原地转了一圈。','嘿嘿！']];const item=lines[Math.floor(Math.random()*lines.length)];say(item[0],item[1]);}else if(Math.random()<0.5){say('它突然对着门外叫了几声！','汪！汪！');if(audio.src)audio.play().catch(()=>{});}},17000);
  render();
})();
