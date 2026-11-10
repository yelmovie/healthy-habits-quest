import test from 'node:test';
import assert from 'node:assert/strict';
import {createNarrationPlayer, type VoiceAudio} from '../src/narration';
function setup(){let enabled=true;const audios:Fake[]=[];const quiet:boolean[]=[];
 class Fake implements VoiceAudio {onended:(()=>void)|null=null;onerror:(()=>void)|null=null;currentTime=0;paused=false; resolve!:()=>void; reject!:(e:Error)=>void;play(){return new Promise<void>((res,rej)=>{this.resolve=res;this.reject=rej;});}pause(){this.paused=true;}}
 const player=createNarrationPlayer({enabled:()=>enabled,create:()=>{const a=new Fake();audios.push(a);return a;},quiet:v=>quiet.push(v)});
 return {player,audios,quiet,disable:()=>{enabled=false;player.sync();}};
}
test('new line stops previous audio and stale play completion cannot restore it',async()=>{const s=setup();const a=s.player.play('a');const b=s.player.play('b');assert.equal(s.audios[0].paused,true);s.audios[0].resolve();await a;assert.equal(s.player.active,'b');s.audios[1].resolve();await b;s.audios[1].onended!();assert.equal(s.player.active,null);assert.equal(s.quiet.at(-1),false);});
test('sound disabled cancels pending playback and prevents new audio',async()=>{const s=setup();const a=s.player.play('a');s.disable();s.audios[0].resolve();await a;await s.player.play('b');assert.equal(s.audios.length,1);assert.equal(s.player.active,null);assert.equal(s.audios[0].paused,true);});
test('blocked autoplay fails softly and releases quiet mode',async()=>{const s=setup();const a=s.player.play('a');s.audios[0].reject(new Error('NotAllowedError'));assert.equal(await a,false);assert.equal(s.player.active,null);assert.equal(s.quiet.at(-1),false);});
test('navigation or closing stop cancels pending playback',async()=>{const s=setup();const a=s.player.play('a');s.player.stop();s.audios[0].resolve();assert.equal(await a,false);assert.equal(s.audios[0].paused,true);assert.equal(s.player.active,null);});
test('only ended calls the next-line callback; stop and decode errors do not',async()=>{
 let completed=0;const audios:VoiceAudio[]=[];
 const player=createNarrationPlayer({enabled:()=>true,quiet:()=>{},finished:()=>{completed++;},create:()=>{const a:VoiceAudio={currentTime:0,onended:null,onerror:null,play:async()=>{},pause:()=>{}};audios.push(a);return a;}});
 await player.play('first');audios[0].onended!(new Event('ended'));assert.equal(completed,1);
 await player.play('second');audios[1].onerror!(new Event('error'));assert.equal(completed,1);
 await player.play('third');player.stop();assert.equal(completed,1);
});
