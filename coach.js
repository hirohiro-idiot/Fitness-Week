(function trainingCoach(){
'use strict';
const tempos={
 squat:[['下ろす',2],['静止',1],['立ち上がる',1]],
 press:[['下ろす',2],['押し上げる',1]],
 row:[['引き上げる',1],['ゆっくり戻す',2]],
 rdl:[['お尻を引く',3],['立ち上がる',1]],
 raise:[['横に上げる',1],['ゆっくり下ろす',2]]
};
const style=document.createElement('style');
style.textContent=`#coachDialog{width:min(620px,calc(100% - 20px));max-height:calc(100% - 20px);overflow:auto;padding:20px;border:1px solid #435568;border-radius:20px;color:var(--text);background:var(--bg);box-shadow:0 18px 80px #0008}#coachDialog::backdrop{background:#080c15e8}#coachDialog h2{margin:0}#coachDialog .coach-center{text-align:center;padding:16px 0}#coachDialog .coach-count{font-size:clamp(48px,12vw,88px);font-weight:700;line-height:1.15;font-variant-numeric:tabular-nums;color:var(--accent)}#coachDialog .coach-phase{font-size:clamp(22px,5vw,36px);font-weight:700}#coachDialog .coach-bar{height:10px;background:var(--line);border-radius:20px;overflow:hidden;margin:12px 0}#coachDialog .coach-bar>div{height:100%;background:var(--accent);transition:width .12s linear}#coachDialog button{min-height:46px}#coachDialog .coach-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#coachDialog .coach-action{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}#coachDialog .coach-action button{flex:1 1 120px}#coachLaunch{width:100%;margin:8px 0 16px;font-weight:700;border-color:var(--accent);color:var(--accent)}#coachDialog .coach-small{font-size:13px;color:var(--muted)}@media(max-width:400px){#coachDialog{padding:13px}}`;
document.head.append(style);
const launch=document.createElement('button');launch.id='coachLaunch';launch.textContent='▶ トレーニングコーチを開く';$('content').before(launch);
const dlg=document.createElement('dialog');dlg.id='coachDialog';document.body.append(dlg);
let session=null,timer=null,ctx=null,wake=null,voice=false,sound=false,lastTick=0,closing=false;
const C=id=>dlg.querySelector('#'+id);
const fmt=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
function beep(hz=660){if(!sound||!ctx)return;try{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=hz;g.gain.setValueAtTime(.07,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.13);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.14)}catch(_){}}
function audioReady(){if(!sound)return;try{if(navigator.audioSession)navigator.audioSession.type='ambient';}catch(_){}try{const A=window.AudioContext||window.webkitAudioContext;if(A&&!ctx)ctx=new A();if(ctx?.state==='suspended')ctx.resume().catch(()=>{})}catch(_){}}
function say(t){if(!voice||!('speechSynthesis'in window))return;try{if(navigator.audioSession)navigator.audioSession.type='ambient';}catch(_){}try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=1.25;speechSynthesis.speak(u)}catch(_){}}
function cue(t,hz){beep(hz);say(t)}
async function keepAwake(){try{if(navigator.wakeLock&&dlg.open&&!document.hidden&&!wake){const w=await navigator.wakeLock.request('screen');if(!dlg.open){await w.release();return}wake=w;w.addEventListener('release',()=>{if(wake===w)wake=null})}}catch(_){}}
function stopClock(){if(timer!==null)clearInterval(timer);timer=null;try{if(voice&&'speechSynthesis'in window)speechSynthesis.cancel()}catch(_){}}
function setMode(mode){stopClock();session.mode=mode;session.paused=false;draw()}
function item(){return session.queue[session.i]}
function exercise(){return item()?.e}
function baseWeight(e){return e.load==='body'?0:e.load==='light'?1:state.settings.db}
function validOld(a){return !a||((a.sets===''||a.sets===0)&&(a.reps===''||a.reps===0))||(Number.isInteger(a.sets)&&a.sets>0&&a.sets<=10&&typeof a.reps==='number'&&a.reps>0)}
function buildQueue(date){const p=plan(date),l=log(date),q=[];for(const e of ex){const a=l.ex[e.id];if(!validOld(a))continue;const n=Number(a?.sets)||0;for(let j=n+1;j<=p.sets;j++)q.push({e,set:j,total:p.sets})}return q}
function previous(e){const k=Object.keys(state.logs).filter(d=>d<session.date&&Number(log(d).ex[e.id]?.sets)>0).sort().pop();if(!k)return '前回記録なし';const a=log(k).ex[e.id];return '前回 '+k+'：'+a.sets+'セット × '+a.reps+(e.id==='plank'?'秒':'回')+(a.kg===''?'':' / '+a.kg+'kg')+(a.rir===''?'':' / 余力 '+a.rir)}
function begin(){
 if(!dlg.showModal){alert('このブラウザはコーチ画面に未対応です。通常の実績入力をご利用ください。');return}
 if(dlg.open)return;
 const date=selected,l=log(date);
 if(date!==dateKey(new Date())){alert('コーチは今日の日付で利用できます。上の「今週・今日」を選択してください。');return}
 if(plan(date).type!=='strength'){alert('今日は筋トレ予定日ではありません。休養・歩行を優先してください。');return}
 if(l.fatigue==='pain'){alert('痛み・体調不良の記録があります。今日は筋トレを中止してください。');return}
 if((l.fatigue==='tired'||(l.sleep!==''&&l.sleep<6))&&!confirm('疲労または睡眠不足の記録があります。休養を優先し、無理のない軽い内容だけ行いますか？'))return;
 const queue=buildQueue(date);
 if(!queue.length){alert('予定セットは記録済み、または既存記録の修正が必要です。実績入力を確認してください。');return}
 session={date,queue,i:0,mode:'setup',confirmed:0,skipped:0,config:{},rest:90,side:0,left:null,paused:false,completed:0,warnings:ex.filter(e=>!validOld(l.ex[e.id])).map(e=>e.name)};
 audioReady();dlg.showModal();draw();keepAwake();
}
function settingsFor(e){
 if(!session.config[e.id])session.config[e.id]={reps:e.range[0],kg:baseWeight(e),speed:1};
 return session.config[e.id]
}
function header(){
 const a=item();return '<div class="row between"><span class="tag">TRAINING COACH / '+esc(session.date)+'</span><button id="cExit">終了</button></div><div class="coach-bar"><div style="width:'+Math.round((session.i/session.queue.length)*100)+'%"></div></div><p class="coach-small">進行 '+Math.min(session.i+1,session.queue.length)+' / '+session.queue.length+' セット ・ 確認保存 '+session.confirmed+' ・ スキップ '+session.skipped+'</p>'+(a?'<h2>'+esc(a.e.name)+'</h2><p>'+a.set+' / '+a.total+' セット '+(a.e.id==='row'?(session.side===1?'・右側':'・左側から'):'')+'</p>':'')
}
function options(){
 return '<p class="coach-small">音楽優先：合図音・音声ガイドを両方OFFにすると、このサイトは音を再生しません。ON時は端末によって音楽が一時停止することがあります。</p><div class="coach-action"><label><input style="width:auto" type="checkbox" id="cSound" '+(sound?'checked':'')+'> 合図音</label><label><input style="width:auto" type="checkbox" id="cVoice" '+(voice?'checked':'')+'> 音声ガイド</label></div>'
}
function draw(){
 if(!session)return;
 const m=session.mode,a=item(),e=exercise();
 let html=header();
 if(m==='setup'){
  html+='<h2>準備・ウォームアップ</h2><p>軽い足踏み、肩・股関節の動き、自重スクワットなどを5分程度。痛み・めまいがあれば中止。動作は楽に呼吸できる速度で。</p>'+(session.warnings.length?'<p class="note">不完全な既存記録のため除外：'+esc(session.warnings.join('、'))+'。実績入力から修正できます。</p>':'')+'<label>セット間の休憩（秒）<input id="cRest" type="number" min="30" max="300" step="15" value="'+session.rest+'"></label>'+options()+'<div class="coach-action"><button class="primary" id="cWarm">5分ウォームアップ開始</button><button id="cReady">準備済み・種目へ</button></div>';
 }else if(m==='ready'){
  const c=settingsFor(e);
  html+='<p class="note">'+esc(e.cue)+'</p><p class="coach-small">'+esc(previous(e))+'</p><div class="coach-options"><label>予定'+(e.id==='plank'?'秒数':'回数')+'<input type="number" id="cReps" min="1" max="'+(e.id==='plank'?120:40)+'" step="1" value="'+c.reps+'"></label><label>片手重量（kg）<input type="number" id="cKg" min="0" max="80" step="0.1" value="'+c.kg+'" '+(e.id==='plank'?'disabled':'')+'></label><label>テンポ<select id="cSpeed">'+[[.75,'速め'],[1,'標準'],[1.25,'ゆっくり'],[1.5,'さらにゆっくり']].map(([v,t])=>'<option value="'+v+'" '+(v===c.speed?'selected':'')+'>'+t+'</option>').join('')+'</select></label><label>休憩（秒）<input type="number" id="cRest" min="30" max="300" step="15" value="'+session.rest+'"></label></div><p class="coach-small">'+(e.id==='plank'?'腰が反る前に終了。':tempos[e.id].map(([t,s])=>t+' '+(s*c.speed)+'秒').join(' → '))+'</p>'+options()+'<div class="coach-action"><button class="primary" id="cStart">3・2・1 で開始</button><button id="cSkip">このセットをスキップ</button><button id="cSkipExercise">種目を終了</button></div>';
 }else if(m==='side'){
  html+='<div class="coach-center"><div class="coach-phase">右側の準備</div><p>左側の確認済み回数：'+session.left.reps+'回。姿勢を整え、必要なだけ休んでから開始。</p></div><div class="coach-action"><button class="primary" id="cRight">右側を開始</button><button id="cSkip">左右セットを中止</button></div>';
 }else if(m==='confirm'){
  const c=settingsFor(e);
  html+='<div class="coach-center"><div class="coach-phase">実績の確認</div><p>実際に行った分だけを入力してください。0は未実施です。</p></div><div class="coach-options"><label>実際の'+(e.id==='plank'?'秒数':'回数')+'<input id="cActual" type="number" min="0" max="300" step="1" value="'+session.completed+'"></label><label>実際の片手重量 kg<input id="cActualKg" type="number" min="0" max="80" step="0.1" value="'+c.kg+'" '+(e.id==='plank'||e.id==='row'&&session.side===1?'disabled':'')+'></label><label>余力 RIR（任意）<input id="cRir" type="number" min="0" max="10" step="1" placeholder="例：2"></label></div><p class="coach-small">余力2〜3回程度を目安に。タイマーだけでは実施扱いにしません。'+(e.id==='row'?' 左右とも確認して1セットとして保存。':'')+'</p><div class="coach-action"><button class="primary" id="cSave">'+(e.id==='row'&&session.side===0?'左側を確認・右側へ':'実績を確認して保存')+'</button><button id="cSkip">未実施としてスキップ</button></div>';
 }else if(m==='done'){
  html+='<div class="coach-center"><div class="coach-phase">トレーニング終了</div><div class="coach-count">'+session.confirmed+'</div><p>確認済みセットを実績へ反映しました。食事・睡眠・疲労は別途入力してください。</p></div><div class="coach-action"><button class="primary" id="cReview">評価・調整を開く</button><button id="cLog">実績入力へ</button></div>';
 }else{
  html+='<div class="coach-center"><div class="coach-small" id="cRepLabel"></div><div class="coach-count" id="cCount">—</div><div class="coach-phase" id="cPhase">—</div><div id="cRemain"></div><div class="coach-bar"><div id="cProgress"></div></div></div>'+((m==='rest'&&e)?'<p class="coach-small">次：'+esc(e.name)+' '+a.set+'セット目</p>':'')+'<div class="coach-action"><button class="primary" id="cPause">'+(session.paused?'再開':'一時停止')+'</button><button id="cEndPhase">'+(m==='work'?'ここでセット終了':m==='rest'?'休憩終了・準備へ':m==='warm'?'ウォームアップ終了':'準備に戻る')+'</button></div>';
  if(m==='rest')html+='<div class="coach-action"><button id="cExtend">休憩＋30秒</button></div>';
 }
 dlg.innerHTML=html;
 if(session.steps&&['warm','count','work','rest'].includes(m))paint();
}
function setSteps(mode,steps){stopClock();session.mode=mode;session.steps=steps;session.step=0;session.remaining=steps[0].ms;session.deadline=performance.now()+session.remaining;session.paused=false;lastTick=performance.now();draw();cueStep();timer=setInterval(tick,80)}
function cueStep(){const s=session.steps[session.step];cue(s.speech||s.label,session.mode==='count'?880:session.mode==='work'&&session.step%2===0?740:520)}
function paint(){const s=session.steps?.[session.step];if(!s||!C('cCount'))return;const left=Math.max(0,session.paused?session.remaining:session.deadline-performance.now()),seconds=Math.ceil(left/1000);C('cCount').textContent=session.mode==='work'&&exercise()?.id!=='plank'?s.rep+' / '+settingsFor(exercise()).reps:fmt(seconds);C('cPhase').textContent=session.paused?'一時停止中':s.label;C('cRepLabel').textContent=session.mode==='work'&&exercise()?.id==='row'?(session.side===0?'左側':'右側'):session.mode==='work'?'動作ガイド':session.mode==='rest'?'休憩タイマー':'準備タイマー';C('cRemain').textContent='残り '+seconds+' 秒';C('cProgress').style.width=Math.max(0,Math.min(100,left/s.ms*100))+'%'}
function pause(){if(!timer)return;session.remaining=Math.max(0,session.deadline-performance.now());session.paused=true;stopClock();draw()}
function resume(){if(!session.paused)return;audioReady();session.paused=false;session.deadline=performance.now()+session.remaining;lastTick=performance.now();draw();cueStep();timer=setInterval(tick,80);keepAwake()}
function tick(){
 if(!session||session.paused)return;
 const now=performance.now();
 if(now-lastTick>1500){session.remaining=Math.max(0,session.deadline-lastTick);session.paused=true;stopClock();draw();return}
 lastTick=now;
 if(now>=session.deadline){
  const s=session.steps[session.step];if(session.mode==='work'&&exercise()?.id!=='plank'&&s.last)session.completed=s.rep;
  session.step++;
  if(session.step>=session.steps.length){finishClock(true);return}
  session.deadline=now+session.steps[session.step].ms;session.remaining=session.steps[session.step].ms;cueStep()
 }
 paint()
}
function countdown(){session.completed=0;setSteps('count',[3,2,1].map(n=>({label:String(n),speech:String(n),ms:1000})))}
function work(){const e=exercise(),c=settingsFor(e);session.completed=0;let steps=[];if(e.id==='plank')steps=[{label:'キープ・呼吸を続ける',speech:'キープ',ms:c.reps*1000}];else for(let r=1;r<=c.reps;r++)tempos[e.id].forEach(([label,s],i)=>steps.push({label,ms:s*c.speed*1000,rep:r,last:i===tempos[e.id].length-1}));setSteps('work',steps)}
function finishClock(full){
 const m=session.mode;stopClock();
 if(m==='warm'){setMode('ready');return}
 if(m==='rest'){setMode('ready');cue('休憩終了。準備してください',900);return}
 if(m==='count'){if(full)work();else setMode(session.side===1?'side':'ready');return}
 if(m==='work'){if(exercise().id==='plank'){const s=session.steps[0];const remain=session.paused?session.remaining:Math.max(0,session.deadline-performance.now());session.completed=full?settingsFor(exercise()).reps:Math.max(0,Math.floor((s.ms-remain)/1000))}setMode('confirm');cue('セット終了',880)}
}
function readNum(id,optional=false){const n=C(id);if(!n||!n.checkValidity()||(!optional&&n.value===''))throw Error('入力値を確認してください');return n.value===''?'':Number(n.value)}
function collect(){const e=exercise(),c=settingsFor(e);c.reps=readNum('cReps');c.kg=e.id==='plank'?0:readNum('cKg');c.speed=+C('cSpeed').value;session.rest=readNum('cRest');if(e.id==='raise'&&c.kg>2&&!confirm('サイドレイズは5kgでは重い場合があります。0.5〜2kg程度の軽い器具を推奨します。この重量で無理なく実施できますか？'))throw Error('軽い重量に調整してください')}
function advance(skip=false,all=false){
 stopClock();if(skip){session.skipped++;if(all){const id=exercise().id;while(session.queue[session.i+1]?.e.id===id){session.i++;session.skipped++}}}
 session.i++;session.side=0;session.left=null;
 if(session.i>=session.queue.length){setMode('done');cue('トレーニング終了',900);return}
 if(skip)setMode('ready');else setSteps('rest',[{label:'休憩・水分補給',speech:'休憩',ms:session.rest*1000}])
}
function storeSet(){
 const e=exercise(),c=settingsFor(e),reps=readNum('cActual'),kg=e.id==='plank'?0:e.id==='row'&&session.side===1?session.left.kg:readNum('cActualKg'),rir=readNum('cRir',true);
 if(reps===0){advance(true);return}
 if(e.id==='row'&&session.side===0){session.left={reps,kg,rir};session.side=1;c.kg=kg;setMode('side');return}
 const nreps=e.id==='row'?Math.min(session.left.reps,reps):reps;
 const nr=e.id==='row'?(session.left.rir===''||rir===''?'':Math.min(session.left.rir,rir)):rir;
 const l=state.logs[session.date]||(state.logs[session.date]=empty()),old=l.ex[e.id];
 if(!validOld(old))throw Error('既存の実績が不完全です。終了して実績入力から修正してください。');
 const n=Number(old?.sets)||0;if(n>=10)throw Error('保存できるセット数の上限です。');
 l.ex[e.id]={sets:n+1,reps:Math.round(((Number(old?.reps)||0)*n+nreps)/(n+1)*10)/10,kg:n===0?kg:old.kg===kg?kg:'',rir:nr};
 save();headline();session.confirmed++;c.kg=kg;advance()
}
function closeCoach(force=false,next=''){
 if(!session)return;
 if(!force&&session.mode!=='done'&&!confirm('終了しますか？ 確認済みの実績は保存されています。未確認のセット（片側だけのローを含む）は記録されません。'))return;
 stopClock();if(ctx){const old=ctx;ctx=null;old.close().catch(()=>{})}closing=true;dlg.close();closing=false;session=null;if(wake){wake.release().catch(()=>{});wake=null}if(next)tab=next;render()
}
launch.onclick=begin;
dlg.addEventListener('cancel',ev=>{ev.preventDefault();closeCoach()});
dlg.addEventListener('close',()=>{if(!closing&&session){stopClock();session=null;if(wake){wake.release().catch(()=>{});wake=null}}});
dlg.addEventListener('change',ev=>{const id=ev.target.id;if(id==='cSound'){sound=ev.target.checked;if(sound)audioReady();else if(ctx){const old=ctx;ctx=null;old.close().catch(()=>{})}}if(id==='cVoice'){if(voice&&!ev.target.checked&&'speechSynthesis'in window)speechSynthesis.cancel();voice=ev.target.checked;}if(id==='cSpeed'&&session?.mode==='ready'){const c=settingsFor(exercise());c.speed=+ev.target.value;const p=dlg.querySelectorAll('.coach-small');const line=p[p.length-1];if(line&&exercise().id!=='plank')line.textContent=tempos[exercise().id].map(([t,s])=>t+' '+s*c.speed+'秒').join(' → ')}});
dlg.addEventListener('click',ev=>{
 const b=ev.target.closest('button');if(!b||!session)return;
 try{audioReady();switch(b.id){
 case 'cExit':closeCoach();break;
 case 'cWarm':session.rest=readNum('cRest');setSteps('warm',[{label:'ウォームアップ',ms:300000}]);break;
 case 'cReady':session.rest=readNum('cRest');setMode('ready');break;
 case 'cStart':collect();countdown();break;
 case 'cRight':countdown();break;
 case 'cPause':session.paused?resume():pause();break;
 case 'cEndPhase':finishClock(false);break;
 case 'cExtend':session.steps[0].ms+=30000;session.deadline+=30000;session.remaining+=30000;paint();break;
 case 'cSave':storeSet();break;
 case 'cSkip':if(confirm('このセットは記録せず次へ進みますか？'))advance(true);break;
 case 'cSkipExercise':if(confirm('この種目の残りセットをスキップしますか？'))advance(true,true);break;
 case 'cReview':closeCoach(true,'review');break;
 case 'cLog':closeCoach(true,'log');break;
 }}catch(e){alert(e.message)}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&session&&timer)pause();else if(!document.hidden&&session)keepAwake()});
window.addEventListener('pagehide',()=>{if(session&&timer)pause()});
})();
