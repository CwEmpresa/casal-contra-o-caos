export class Sounds{
 constructor(){this.enabled=localStorage.getItem('chaos-sound')!=='off';this.ctx=null;}
 unlock(){if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)this.ctx=new AC();}this.ctx?.resume();}
 toggle(){this.enabled=!this.enabled;localStorage.setItem('chaos-sound',this.enabled?'on':'off');this.unlock();return this.enabled;}
 play(type){if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
 const notes={hint:[392,587,784],pickup:[520,660],deposit:[660,880],success:[660,880,1100],error:[180,130],event:[400,300,500],win:[523,659,784,1046],lose:[330,294,220],tick:[700],start:[440,660],click:[450]}[type]||[450];
 notes.forEach((freq,i)=>{const osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),at=this.ctx.currentTime+i*.1;osc.type=type==='error'?'triangle':'sine';osc.frequency.value=freq;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.065,at+.01);gain.gain.exponentialRampToValueAtTime(.001,at+.16);osc.connect(gain);gain.connect(this.ctx.destination);osc.start(at);osc.stop(at+.18);});
 }
}
