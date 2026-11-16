/* Game Night in a Book - shared helpers. Front-end only: nothing is stored, nothing is sent anywhere. */
(function(){
"use strict";
var GN=window.GN={};
GN.$=function(s,r){return (r||document).querySelector(s)};
GN.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
GN.rnd=function(n){return Math.floor(Math.random()*n)};
GN.d6=function(){return 1+GN.rnd(6)};
GN.pick=function(a){return a[GN.rnd(a.length)]};
GN.sample=function(a,n){var b=a.slice(),o=[];while(o.length<n&&b.length)o.push(b.splice(GN.rnd(b.length),1)[0]);return o};
GN.esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
/* dieHTML(value 1-6 [, tag 'div'|'button'] [, extra classes] [, extra attributes string]) */
GN.dieHTML=function(v,tag,cls,attrs){tag=tag||'div';var h='';var f=Math.max(1,Math.min(6,v));for(var i=0;i<9;i++)h+='<i'+(PIPS[f].indexOf(i)>=0?' class="p"':'')+'></i>';
  return '<'+tag+' class="die pop '+(cls||'')+'" '+(attrs||'')+' aria-label="Die showing '+v+'">'+h+'</'+tag+'>'};
/* sounds: 'tap','good','bad','rumble','alarm'. Muted with GN.muted=true. */
GN.muted=false;var actx=null;
/* GN.roll(container [, index]) : makes the dice tumble for a moment, then land on their real face */
GN.roll=function(box,only){if(!box)return;var dice=[].slice.call(box.querySelectorAll('.die'));
  if(only!==undefined)dice=dice[only]?[dice[only]]:[];if(!dice.length)return;
  var still=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  dice.forEach(function(d,n){var real=[].map.call(d.children,function(i){return i.className});
    d.classList.add('rolling');d.style.animationDelay=(n*60)+'ms';if(still)return setTimeout(function(){d.classList.remove('rolling')},200);
    var t=setInterval(function(){var f=PIPS[1+Math.floor(Math.random()*6)];[].forEach.call(d.children,function(i,k){i.className=f.indexOf(k)>=0?'p':''})},70);
    setTimeout(function(){clearInterval(t);[].forEach.call(d.children,function(i,k){i.className=real[k]});d.classList.remove('rolling');d.classList.add('landed');
      setTimeout(function(){d.classList.remove('landed');d.style.animationDelay=''},260)},650+n*90)});
  if(!GN.muted&&!still)try{[0,90,180,270,380].forEach(function(ms){setTimeout(function(){GN.beep('tap')},ms)})}catch(e){}};
GN.beep=function(kind){if(GN.muted)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();
  var P={tap:[[520,.06]],good:[[523,.1],[784,.16]],bad:[[220,.14],[165,.22]],rumble:[[70,.5],[55,.6]],alarm:[[880,.12],[660,.12],[880,.12]]}[kind]||[[440,.08]];
  var t=actx.currentTime;P.forEach(function(n){var o=actx.createOscillator(),g=actx.createGain();o.type=kind==='rumble'?'sawtooth':'triangle';o.frequency.value=n[0];
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(kind==='rumble'?.25:.12,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+n[1]);
    o.connect(g);g.connect(actx.destination);o.start(t);o.stop(t+n[1]+.02);t+=n[1]});}catch(e){}};
/* keep the screen awake during a game (best effort) */
GN.wake=function(){try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){})}catch(e){}};
/* two-step confirm on a button: first tap arms, second tap within 3.5 s runs fn */
GN.confirmBtn=function(btn,armedLabel,fn){var armed=false,t,orig=btn.textContent;btn.addEventListener('click',function(){
  if(!armed){armed=true;btn.textContent=armedLabel;t=setTimeout(function(){armed=false;btn.textContent=orig},3500)}
  else{clearTimeout(t);armed=false;btn.textContent=orig;fn()}})};
function overlay(id){var o=GN.$('#'+id);if(!o){o=document.createElement('div');o.id=id;o.className='overlay';document.body.appendChild(o)}return o}
/* GN.howto('Title', ['step 1 html','step 2 html',...]) : guided intro, one step per screen */
GN.howto=function(title,steps,done){var o=overlay('gn-howto'),i=0;function draw(){
  o.innerHTML='<div class="card"><p class="eyebrow">How to play · '+(i+1)+' of '+steps.length+'</p><h2>'+GN.esc(title)+'</h2><p>'+steps[i]+'</p>'+
   '<button id="gn-h-next">'+(i<steps.length-1?'Next':'Got it, let\'s play')+'</button>'+(i>0?'<button class="ghost small" id="gn-h-back">Back</button>':'')+
   '<button class="ghost small" id="gn-h-skip">Skip the intro</button></div>';
  GN.$('#gn-h-next').onclick=function(){GN.beep('tap');if(i<steps.length-1){i++;draw()}else{close()}};
  if(i>0)GN.$('#gn-h-back').onclick=function(){i--;draw()};GN.$('#gn-h-skip').onclick=close}
  function close(){o.classList.remove('on');if(done)done()}
  o.classList.add('on');draw()};
/* GN.card({game:'The Lost Temple', headline:'Legend of the Temple', rows:[{name:'Mia',score:31},...], unit:'points', note:'optional line'})
   Opens the end-of-game card: canvas image with date and ranking, optional photo, Save / Share. Nothing leaves the phone. */
GN.card=function(opt){var o=overlay('gn-card'),photo=null;
  var rows=(opt.rows||[]).slice().sort(function(a,b){return b.score-a.score});
  o.innerHTML='<div class="card"><p class="eyebrow">Winner\'s card</p><canvas class="cardcanvas" id="gn-cv" width="1080" height="1350"></canvas>'+
   '<label class="btn ghost" for="gn-photo">Add a photo (optional)</label><input id="gn-photo" type="file" accept="image/*" capture="environment" hidden>'+
   '<div class="row"><button id="gn-share">Share</button><a class="btn ghost" id="gn-save" download="game-night-card.png">Save image</a></div>'+
   '<p class="muted small">The card and the photo are made on this phone. Nothing is uploaded or kept after you close this page. If Save does nothing, press and hold the picture.</p>'+
   '<button class="ghost small" id="gn-card-close">Close</button></div>';
  var cv=GN.$('#gn-cv'),c=cv.getContext('2d');
  function draw(){var W=1080,H=1350;var st=getComputedStyle(document.body),BG=(st.getPropertyValue('--paper')||'#1b1f4b').trim(),AC=(st.getPropertyValue('--accent')||'#ffd23f').trim();c.fillStyle=AC;c.fillRect(0,0,W,H);c.fillStyle=BG;c.fillRect(30,30,W-60,H-60);
    var y=130;c.textAlign='center';c.fillStyle='#c9cdf0';c.font='700 34px Verdana,sans-serif';c.fillText((opt.game||'').toUpperCase(),W/2,y);
    y+=90;c.fillStyle=AC;c.font='800 78px Poppins,"Trebuchet MS",sans-serif';wrap(opt.headline||'We played!',W/2,y,W-160,84);y=lastY+130;
    if(photo){var ph=430,pw=W-200,r=Math.max(pw/photo.width,ph/photo.height),sw=pw/r,sh=ph/r;
      c.drawImage(photo,(photo.width-sw)/2,(photo.height-sh)/2,sw,sh,100,y,pw,ph);c.strokeStyle='#ffffff';c.lineWidth=6;c.strokeRect(100,y,pw,ph);y+=ph+90}else{y+=110}
    rows.slice(0,5).forEach(function(r,i){c.textAlign='left';c.fillStyle=i===0?AC:'#ffffff';c.font=(i===0?'800 60px':'700 48px')+' Poppins,"Trebuchet MS",sans-serif';
      c.fillText((i+1)+'. '+String(r.name).slice(0,16),130,y);c.textAlign='right';c.fillText(String(r.score),W-130,y);y+=i===0?92:76});
    if(opt.unit){c.textAlign='right';c.fillStyle='#c9cdf0';c.font='400 30px Verdana,sans-serif';c.fillText(opt.unit,W-130,y-20);y+=20}
    if(opt.note){c.textAlign='center';c.fillStyle='#ffffff';c.font='400 36px Verdana,sans-serif';wrap(opt.note,W/2,y+30,W-200,46)}
    c.textAlign='center';c.fillStyle='#c9cdf0';c.font='400 32px Verdana,sans-serif';
    c.fillText(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}),W/2,H-150);
    c.fillStyle=AC;c.font='800 40px Poppins,"Trebuchet MS",sans-serif';c.fillText('Game Night in a Book',W/2,H-90);
    try{GN.$('#gn-save').href=cv.toDataURL('image/png')}catch(e){}}
  var lastY=0;function wrap(t,x,y,maxw,lh){var words=String(t).split(' '),line='';words.forEach(function(w){var test=line?line+' '+w:w;if(c.measureText(test).width>maxw&&line){c.fillText(line,x,y);y+=lh;line=w}else line=test});c.fillText(line,x,y);lastY=y}
  GN.$('#gn-photo').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(!f)return;var im=new Image();im.onload=function(){photo=im;draw()};im.src=URL.createObjectURL(f)});
  GN.$('#gn-share').onclick=function(){cv.toBlob(function(b){try{var file=new File([b],'game-night-card.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:'Game Night in a Book'}).catch(function(){})}
    else{GN.$('#gn-share').textContent='Sharing is not available here. Use Save image.'}}catch(e){GN.$('#gn-share').textContent='Sharing is not available here. Use Save image.'}})};
  GN.$('#gn-card-close').onclick=function(){o.classList.remove('on')};
  o.classList.add('on');draw()};
/* sound toggle: any element with data-mute toggles sound */
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-mute]');if(!b)return;GN.muted=!GN.muted;b.textContent=GN.muted?'Sound: off':'Sound: on'});
})();
