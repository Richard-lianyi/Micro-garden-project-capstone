'use strict';
const $ = id => document.getElementById(id);
let lastAt=0;
const history=[];
function log(message){const item=document.createElement('li');item.textContent=new Date().toLocaleTimeString()+'  '+message;$('log').prepend(item);while($('log').children.length>30)$('log').lastChild.remove();}
for(let i=0;i<4;i++){
 const card=document.createElement('div');card.className='card';
 card.innerHTML=`<div class="muted">Soil sensor ${i+1} · A${i+1}</div><div class="value"><span id="soil${i}">—</span> <span class="unit">ADC</span></div><div class="muted" id="soilState${i}">Waiting for Arduino</div><div class="bar"><i id="bar${i}"></i></div>`;
 $('soilCards').append(card);
}
document.querySelectorAll('button').forEach(button=>button.disabled=true);
async function poll(){
 try{
  const response=await fetch('/api/status',{cache:'no-store'});if(!response.ok)throw new Error('Server unavailable');
  const status=await response.json();
  $('connection').textContent=status.fresh?'Live · '+status.port:status.connected?'Waiting for data':'Disconnected';
  $('connectionDetail').textContent=status.fresh?'USB telemetry · 9600 baud':status.error||'No recent Arduino data';
  $('badge').textContent=status.fresh?'● Arduino connected · '+status.port:'● Waiting for Arduino · '+status.port;
  $('updated').textContent=status.lastAt?'Last sample '+new Date(status.lastAt).toLocaleTimeString()+(status.fresh?'':' · STALE'):'Waiting for sensor data';
  if(status.fresh && status.sample && status.lastAt!==lastAt){
   const s=status.sample;lastAt=status.lastAt;
   $('temp').textContent=s.temperature===null?'Unavailable':s.temperature.toFixed(1);
   $('hum').textContent=s.humidity===null?'Unavailable':s.humidity.toFixed(1);
   $('ldr').textContent=s.light;
   s.soil.forEach((v,i)=>{$('soil'+i).textContent=v;$('soilState'+i).textContent=v>550?'Above threshold · Dry':'At or below threshold';$('bar'+i).style.width=(v/1023*100)+'%';});
   $('pumpStatus').textContent=s.locked?'Watering locked':s.pump?'Watering':s.settling?'Settling':'Pump idle';
   $('pumpDetail').textContent=s.locked?'Arduino lockout after repeated dry readings. Sensor monitoring continues.':'Arduino status · 2-second watering burst, followed by 30-second settling.';
   $('lightStatus').textContent=s.lightOn?'Light on':'Light off';
   $('lightDetail').textContent='Arduino mode: '+s.mode+' · Automatic light '+(s.autoLight?'enabled':'disabled');
   if(s.temperature!==null){history.push(s.temperature);if(history.length>60)history.shift();}
   $('trend').setAttribute('points',history.map((v,i)=>`${30+i*460/59},${125-(Math.max(0,Math.min(50,v)))*2.2}`).join(' '));
  }
 }catch(error){$('connection').textContent='Server offline';$('connectionDetail').textContent='Restart the local server';$('badge').textContent='● Disconnected';$('updated').textContent='Connection lost · displayed readings may be stale';}
 finally{setTimeout(poll,1000);}
}
log('Live sensor monitoring started. Web controls are disabled.');
if(location.protocol==='file:'){$('connection').textContent='Start local server';$('connectionDetail').textContent='Open http://127.0.0.1:3000';}else poll();
