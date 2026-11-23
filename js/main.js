(() => {
const $ = id => document.getElementById(id);
const sprite = $("dogSprite"), dog = $("dogHitbox"), shadow = $("dogShadow");
const speech = $("speech"), subtitle = $("subtitle"), hint = $("behaviorHint");
const audio = $("dogAudio"), audioInput = $("audioInput");
const frames = {
  idle:0, walk:1, run:2, play:3, bark:4, crouch:5, sit:6, happy:7, sleep:8
};
const messages = {
  pet:["它舒服地眯起眼睛，尾巴摇个不停。","它把脑袋凑过来，想再摸摸！"],
  feed:["它埋头吃起狗粮，还舔了舔嘴巴。","吃饱啦！它开心地看着你。"],
  play:["它追着玩具跑了一圈，兴奋极了！","它摆出邀请玩耍的姿势！"],
  rest:["它找了个舒服的位置，准备休息。","它打了个哈欠，慢慢放松下来。"],
  call:["它竖起耳朵，摇着尾巴跑向你！","听到你叫它，它马上跑过来了！"]
};
let state = JSON.parse(localStorage.getItem("mld-v02") || '{"mood":82,"hunger":35,"energy":88,"bond":35}');
let actionTimer, wanderTimer, currentMode="idle", x=50;
function clamp(v){return Math.max(0,Math.min(100,v))}
function render(){
  const mood=state.mood,hunger=state.hunger,energy=state.energy,bond=state.bond;
  $("moodText").textContent=mood>65?"开心":mood>35?"平静":"无聊";
  $("hungerText").textContent=hunger<30?"饱腹":hunger<65?"适中":"饿了";
  $("energyText").textContent=energy>65?"充沛":energy>30?"一般":"疲惫";
  $("bondText").textContent=bond;
  $("moodBar").style.width=mood+"%";$("hungerBar").style.width=hunger+"%";
  $("energyBar").style.width=energy+"%";$("bondBar").style.width=bond+"%";
  localStorage.setItem("mld-v02",JSON.stringify(state));
}
function pose(mode, duration=0){
  currentMode=mode;
  sprite.src=`assets/dog/pose-${frames[mode] ?? 0}.png`;
  dog.className="dog-hitbox "+mode;
  if(duration){clearTimeout(actionTimer);actionTimer=setTimeout(()=>pose("idle"),duration)}
}
function say(text, bubble=""){
  subtitle.textContent=text;
  if(bubble){speech.textContent=bubble;speech.classList.add("show");setTimeout(()=>speech.classList.remove("show"),1900)}
}
function moveTo(percent, mode="walk", duration=1400){
  x=Math.max(25,Math.min(76,percent));
  dog.style.left=x+"%";shadow.style.left=x+"%";
  pose(mode,duration);
}
function bark(){
  pose("bark",1200);say("它突然发现了什么，发出洪亮的猎犬叫声！","WOO-wer! 汪！");
  if(audio.src){audio.currentTime=0;audio.play().catch(()=>{})}
}
function interact(type){
  const list=messages[type];say(list[Math.floor(Math.random()*list.length)]);
  if(type==="pet"){state.bond=clamp(state.bond+3);state.mood=clamp(state.mood+8);pose("happy",1300)}
  if(type==="feed"){state.hunger=clamp(state.hunger-28);state.mood=clamp(state.mood+5);pose("happy",1500)}
  if(type==="play"){state.energy=clamp(state.energy-14);state.mood=clamp(state.mood+12);state.bond=clamp(state.bond+2);moveTo(x>55?42:62,"run",1300)}
  if(type==="rest"){state.energy=clamp(state.energy+18);pose("sleep",2200)}
  if(type==="call"){state.bond=clamp(state.bond+2);moveTo(50,"run",1100)}
  if(type==="pet")say(list[Math.floor(Math.random()*list.length)]);
  render();
}
document.querySelectorAll("[data-action]").forEach(btn=>btn.addEventListener("click",()=>interact(btn.dataset.action)));
$("dogHitbox").addEventListener("click",()=>interact("pet"));
$("resetBtn").addEventListener("click",()=>{state={mood:82,hunger:35,energy:88,bond:35};render();pose("idle");say("状态已重置。")});
$("soundBtn").addEventListener("click",()=>audioInput.click());
audioInput.addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;audio.src=URL.createObjectURL(f);say("叫声音频已载入，点击呼唤或等待它叫起来。")});
function wander(){
  if(currentMode==="sleep")return;
  const r=Math.random();
  if(r<.24){pose("idle");hint.textContent="它停下来观察四周"}
  else if(r<.48){moveTo(x+(Math.random()>.5?12:-12),"walk",1500);hint.textContent="它在客厅里慢慢踱步"}
  else if(r<.65){pose("crouch",1400);hint.textContent="它闻到了有趣的气味"}
  else if(r<.79){pose("play",1200);hint.textContent="它突然兴奋起来"}
  else if(r<.9){bark();hint.textContent="它又开始大声叫了"}
  else {pose("sit",1800);hint.textContent="它坐下来等你陪它"}
}
render();pose("idle");
wanderTimer=setInterval(wander,5200);
setInterval(()=>{state.hunger=clamp(state.hunger+1);state.energy=clamp(state.energy-0.5);if(state.hunger>70)state.mood=clamp(state.mood-1);render()},45000);
})();