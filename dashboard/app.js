'use strict';
const $ = id => document.getElementById(id);
const state = {soil:[490,525,575,510], temperature:22.4, humidity:58, light:845, mode:'off', lightOn:false, pump:'idle', deadline:0, history:[]};
// Simulator boundary: replace sample() and command dispatch with a USB bridge later.
function log(message) {
  const item=document.createElement('li'), time=document.createElement('time');
  time.textContent=new Date().toLocaleTimeString('en-CA',{hour12:false});
  item.append(time,document.createTextNode(message)); $('log').prepend(item);
  while($('log').children.length>30) $('log').lastChild.remove();
}
function renderLight() {
  if(state.mode==='auto') {
    if(state.light<880) state.lightOn=true;
    else if(state.light>920) state.lightOn=false;
  } else state.lightOn=state.mode==='on';
  $('lightStatus').textContent=state.lightOn?'Light on':'Light off';
  $('lightDetail').textContent=(state.mode==='auto'?'Auto mode · Simulated thresholds 880 / 920 ADC':'Manual mode')+' · '+(state.lightOn?'Supplemental light on':'Supplemental light off');
  document.querySelectorAll('[data-mode]').forEach(button=>{
    const active=button.dataset.mode===state.mode;
    button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));
  });
}
function sample() {
  state.temperature=Math.max(18,Math.min(28,state.temperature+(Math.random()-.5)*.25));
  state.humidity=Math.max(40,Math.min(70,state.humidity+(Math.random()-.5)*1.4));
  state.light=Math.round(890+75*Math.sin(Date.now()/16000));
  state.soil=state.soil.map(v=>Math.max(0,Math.min(1023,v+(Math.random()-.45)*3)));
  $('temp').textContent=state.temperature.toFixed(1);$('hum').textContent=state.humidity.toFixed(1);$('ldr').textContent=state.light;
  $('updated').textContent='Demo updated '+new Date().toLocaleTimeString('en-CA',{hour12:false});
  state.soil.forEach((value,i)=>{
    $('soil'+i).textContent=Math.round(value);
    $('soilState'+i).textContent=value>550?'Above threshold · Dry':'At or below threshold · No watering needed';
    $('bar'+i).style.width=(value/1023*100)+'%';
  });
  state.history.push(state.temperature);if(state.history.length>60)state.history.shift();
  $('trend').setAttribute('points',state.history.map((v,i)=>`${30+i*460/59},${125-(v-18)*11}`).join(' '));
  renderLight();
}
for(let i=0;i<4;i++) {
  const card=document.createElement('div');card.className='card';
  card.innerHTML=`<div class="muted">Growing zone ${i+1} · A${i+1}</div><div class="value"><span id="soil${i}">—</span> <span class="unit">ADC</span></div><div class="muted" id="soilState${i}"></div><div class="bar"><i id="bar${i}"></i></div>`;
  $('soilCards').append(card);
}
$('water').addEventListener('click',()=>{
  if(state.pump!=='idle')return;
  state.pump='watering';state.deadline=performance.now()+2000;$('water').disabled=true;
  log('Demo: watering started for 2 seconds');renderPump();
});
function renderPump() {
  const now=performance.now();
  if(state.pump==='watering'&&now>=state.deadline) {
    state.pump='settling';state.deadline=now+30000;
    state.soil=state.soil.map(v=>Math.max(250,v-65));
    log('Demo: pump stopped; 30-second settling period started');sample();
  }
  if(state.pump==='settling'&&now>=state.deadline){state.pump='idle';log('Demo: settling complete; ready to water');}
  const remaining=Math.max(0,Math.ceil((state.deadline-now)/1000));
  $('pumpStatus').textContent=state.pump==='watering'?'Watering':state.pump==='settling'?'Settling':'Pump idle';
  $('pumpDetail').textContent=state.pump==='watering'?`Simulated pump running · ${remaining}s remaining`:state.pump==='settling'?`Simulated pump stopped · Ready in ${remaining}s`:'One shared pump supplies the growing area. Simulate a 2-second watering burst.';
  $('water').disabled=state.pump!=='idle';
}
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
  state.mode=button.dataset.mode;renderLight();log('Demo: light mode set to '+({auto:'Auto',on:'On',off:'Off'}[state.mode]));
}));
sample();log('Demo dashboard started; no hardware connected');setInterval(sample,2000);setInterval(renderPump,100);
