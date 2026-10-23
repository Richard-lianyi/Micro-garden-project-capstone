'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const port = process.env.ARDUINO_PORT || 'COM5';
if (!/^COM\d+$/i.test(port)) throw new Error('Invalid COM port');
let connected = false, error = 'Waiting for Arduino', lastSample = null, lastAt = 0;
function parse(line) {
  if (!line.startsWith('DATA,')) return null;
  const data = Object.fromEntries(line.slice(5).split(',').map(part => part.split('=')));
  const soil = (data.SOIL_RAW || '').split('|').map(Number);
  const number = value => value === 'null' ? null : Number(value);
  if (soil.length !== 4 || soil.some(v => !Number.isFinite(v) || v < 0 || v > 1023)) return null;
  for (const key of ['TEMP_C','HUM_PCT','LIGHT_RAW','PUMP','LIGHT','SETTLING','WATER_LOCK','AUTO_LIGHT_ENABLED']) {
    if (!(key in data) || (data[key] !== 'null' && !Number.isFinite(Number(data[key])))) return null;
  }
  return {soil, temperature:number(data.TEMP_C), humidity:number(data.HUM_PCT), light:number(data.LIGHT_RAW), pump:data.PUMP==='1', lightOn:data.LIGHT==='1', settling:data.SETTLING==='1', locked:data.WATER_LOCK==='1', mode:data.LIGHT_MODE, autoLight:data.AUTO_LIGHT_ENABLED==='1'};
}
function start() {
  const child = spawn('powershell.exe', ['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'serial-reader.ps1'),'-PortName',port], {windowsHide:true});
  let buffer = '';
  child.stdout.on('data', chunk => {
    buffer += chunk.toString();
    let end;
    while ((end=buffer.indexOf('\n'))>=0) {
      const line=buffer.slice(0,end).trim(); buffer=buffer.slice(end+1);
      if(line==='STATUS,CONNECTED') { connected=true; error='Waiting for telemetry'; lastAt=0; }
      else if(line.startsWith('STATUS,ERROR,')) { connected=false; error=line.slice(13); console.error(error); }
      const sample=parse(line);
      if(sample) { lastSample=sample; lastAt=Date.now(); error=''; }
    }
    if(buffer.length>16384) buffer='';
  });
  child.stderr.on('data',chunk=>{error=chunk.toString().slice(0,500); console.error(error);});
  child.on('error',err=>{connected=false;error=err.message;});
  child.on('exit',()=>{connected=false;error='Serial reader stopped. Restart the server.';});
  const server=http.createServer((req,res)=>{
    res.setHeader('Cache-Control','no-store');
    if(req.method!=='GET') {res.writeHead(405);return res.end();}
    if(req.url==='/api/status') {
      res.setHeader('Content-Type','application/json');
      return res.end(JSON.stringify({port,connected,fresh:connected&&lastAt>0&&Date.now()-lastAt<5000,error,lastAt,sample:lastSample}));
    }
    const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js'};
    const file=files[req.url];
    if(!file) {res.writeHead(404);return res.end();}
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');
    fs.readFile(path.join(__dirname,'dashboard',file),(err,data)=>{if(err){res.writeHead(500);res.end('Unable to read dashboard');}else res.end(data);});
  });
  server.on('error',err=>{console.error(err.message);child.kill();process.exitCode=1;});
  server.listen(3000,'127.0.0.1',()=>console.log(`Dashboard: http://127.0.0.1:3000 | ${port} at 9600 baud`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{child.kill();server.close();});
}
module.exports={parse};
if(require.main===module)start();
