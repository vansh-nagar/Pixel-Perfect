// Integration test with a synthetic capture stream; no screen-sharing permission needed.
// Run against bun dev: node scripts/test-local-recorder.mjs
import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true});
try {
 const page = await browser.newPage();
 await page.addInitScript(() => {
  Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {value: async () => {
   const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
   const ctx=canvas.getContext('2d'); let i=0;
   const timer=setInterval(()=>{ctx.fillStyle=`hsl(${i++%360} 60% 50%)`;ctx.fillRect(0,0,1280,720)},30);
   const stream=canvas.captureStream(30);const track=stream.getVideoTracks()[0];
   track.getSettings=()=>({displaySurface:'browser',width:1280,height:720,frameRate:30});
   track.addEventListener('ended',()=>clearInterval(timer));return stream;
  }});
 });
 await page.goto('http://localhost:3000/playground');
 await page.getByRole('button',{name:'Open local recorder',exact:true}).click();
 const pending=page.waitForEvent('popup');
 await page.getByRole('button',{name:'Open recording controls',exact:true}).click();
 const popup=await pending;
 await popup.getByRole('button',{name:'Start recording',exact:true}).click();
 await popup.getByRole('button',{name:'Stop recording',exact:true}).waitFor();
 if(await page.getByRole('button',{name:'Open local recorder',exact:true}).count()) throw new Error('Launcher visible during capture');
 await popup.getByRole('button',{name:'Pause',exact:true}).click();
 await popup.getByRole('button',{name:'Resume',exact:true}).click();
 await page.waitForTimeout(1100);
 await popup.getByRole('button',{name:'Stop recording',exact:true}).click();
 await popup.getByRole('link',{name:/Download MP4|Download WEBM/}).waitFor();
 console.log('PASS: popup start, hidden launcher, pause/resume, stop, encoded video download');
 await popup.close();
 await page.getByRole('button',{name:'Open local recorder',exact:true}).waitFor();
 await page.goto('http://localhost:3000/blocks');
 await page.getByRole('button',{name:'Open local recorder',exact:true}).waitFor();
 console.log('PASS: recorder available outside playground');
} finally {await browser.close();}
