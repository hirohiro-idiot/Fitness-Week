(function walkingTimer(){
'use strict';
const style=document.createElement('style');
style.textContent=`#walkPanel{display:flex;align-items:center;gap:12px;justify-content:space-between;padding:14px 17px;margin:12px 0;border-radius:18px;background:linear-gradient(125deg,#19332e,#18262a);border:1px solid #a8eb4930}#walkPanel[hidden]{display:none!important}#walkPanel strong{display:block;font-size:16px}#walkPanel small{display:block}#walkPanel button,#walkLaunch{white-space:normal}#walkPanel button{background:#b9ef43;color:#1b2a15;border:0}#walkLaunch{color:white;background:#ffffff16;border:1px solid #ffffff30}#walkDialog{width:min(480px,calc(100% - 20px));max-height:calc(100% - 20px);overflow:auto;padding:22px;border:1px solid #a8eb4930;border-radius:25px;background:radial-gradient(ellipse at top,#28483c,#141b22 65%);color:var(--text)}#walkDialog::backdrop{background:#080c15dd}#walkDialog .wt-ring{--progress:0%;width:min(235px,70vw);aspect-ratio:1;border-radius:50%;padding:9px;margin:20px auto;background:conic-gradient(#b9ef43 var(--progress),#ffffff18 0);display:grid;place-items:center}#walkDialog .wt-inner{background:#1c2929;width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center}#walkDialog #wtClock{font-size:clamp(31px,9vw,52px);font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.05em}#walkDialog .wt-actions{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}#walkDialog .wt-actions button{flex:1 1 110px;min-height:48px}#walkDialog .wt-primary{background:#b9ef43;color:#192715;border:0}#walkDialog .wt-caption{font-size:12px;color:var(--muted)}`;
document.head.append(style);
const panel=document.createElement('section');panel.id='walkPanel';panel.hidden=true;panel.innerHTML='<div><strong id="wtPanelTitle">歩行タイマー</strong><small id="wtPanelInfo"></small></div><button id="wtOpen">開く</button>';
$('fwHero').after(panel);
const launch=document.createElement('button');launch.id='walkLaunch';launch.textContent='歩行タイマー';$('fwActions').append(launch);
const dlg=document.createElement('dialog');dlg.id='walkDialog';document.body.append(dlg);
let interval=null;
const D=id=>dlg.querySelector('#'+id);
function current(){const w=state.walkTimer;return w&&typeof w==='object'&&/^\d{4}-\d\d-\d\d$/.test(w.date)&&Number.isFinite(w.ms)&&w.ms>=0&&(w.since===null||Number.isFinite(w.since))?w:null}
function elapsed(w){return w?Math.max(0,w.ms+(w.since===null?0:Date.now()-w.since)):0}
function fmt(ms){const s=Math.floor(ms/1000);return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(x=>String(x).padStart(2,'0')).join(':')}
function persist(){save();return $('storageWarning').classList.contains('hidden')}
function refreshPanel(){const w=current(),isToday=selected===dateKey(new Date());launch.hidden=!isToday&&!w;launch.style.display=launch.hidden?'none':'';panel.hidden=!w;panel.style.display=w?'':'none';if(w){$('wtPanelTitle').textContent=w.since===null?'歩行タイマー · 一時停止':'歩行タイマー · 計測中';$('wtPanelInfo').textContent=fmt(elapsed(w))+' · '+w.date+' の記録';launch.textContent='計測中の歩行を開く'}else launch.textContent='歩行タイマー'}
function update(){refreshPanel();if(!dlg.open)return;const w=current(),ms=elapsed(w),date=w?.date||dateKey(new Date()),target=plan(date).minutes,existing=Number(log(date).walk)||0;D('wtClock').textContent=fmt(ms);D('wtStatus').textContent=!w?'開始できます':w.since===null?'一時停止中':'計測中';D('wtRing').style.setProperty('--progress',Math.min(100,(existing+ms/60000)/target*100)+'%');D('wtTotal').textContent='記録済み '+existing+'分 ＋ 今回 '+(ms/60000).toFixed(1)+'分';}
function draw(){const w=current(),date=w?.date||dateKey(new Date()),p=plan(date);dlg.innerHTML='<div class="row between"><span class="tag">WALK / ACTIVITY</span><button id="wtClose">閉じる</button></div><h2>歩行・有酸素タイマー</h2><p class="wt-caption">'+esc(date)+' の記録 · '+(p.type==='walk'?'今日の目安 '+p.minutes+'分':'軽い散歩などの実績を記録できます')+'</p><div class="wt-ring" id="wtRing"><div class="wt-inner"><small id="wtStatus"></small><div id="wtClock"></div><small>経過時間</small></div></div><p id="wtTotal" style="text-align:center"></p><div class="wt-actions">'+(!w?'<button class="wt-primary" id="wtStart">計測開始</button>':(w.since===null?'<button class="wt-primary" id="wtResume">再開</button>':'<button id="wtPause">一時停止</button>')+'<button class="wt-primary" id="wtFinish">終了・記録</button><button id="wtDiscard">破棄</button>')+'</div><p class="wt-caption">音声を再生しないので、音楽アプリを使用できます。画面ロックやアプリ切替中も時刻差で計測。休憩は一時停止し、終了時に実際の運動時間を確認してください。日付をまたぐ場合は開始日の記録に加算します。</p>';update()}
function open(){if(!dlg.showModal){alert('このブラウザでは歩行タイマーに未対応です。手動入力を利用してください。');return}if($('coachDialog')?.open)return;if(!current()&&selected!==dateKey(new Date())){alert('今日の日付を選択してください。');return}if(!dlg.open)dlg.showModal();draw()}
function finish(){const w=current();if(!w)return;const mins=Math.round(elapsed(w)/6000)/10;const raw=prompt('実際に歩いた時間（分）を確認してください。現在の記録へ加算します。',String(mins));if(raw===null)return;if(raw.trim()===''||!Number.isFinite(Number(raw))||Number(raw)<0||Number(raw)>1440){alert('0〜1440分の範囲で入力してください。');return}const n=Math.round(Number(raw)*10)/10,old=state.logs[w.date],existing=Number(old?.walk)||0;if(existing+n>1440){alert('合計が1440分を超えます。実績を確認してください。');return}if(!confirm(w.date+' の歩行・有酸素運動に '+n+'分を加算しますか？（合計 '+Math.round((existing+n)*10)/10+'分）'))return;const l=old||(state.logs[w.date]=empty());const previous=l.walk;l.walk=Math.round((existing+n)*10)/10;delete state.walkTimer;if(!persist()){l.walk=previous;if(!old)delete state.logs[w.date];state.walkTimer=w;alert('保存できませんでした。タイマーを維持します。');return}dlg.close();render();refreshPanel()}
launch.onclick=open;$('wtOpen').onclick=open;
dlg.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const w=current();switch(b.id){
case 'wtClose':dlg.close();break;
case 'wtStart':if(w)break;state.walkTimer={date:dateKey(new Date()),ms:0,since:Date.now()};if(!persist())alert('端末への保存ができません。画面を閉じると記録が失われる可能性があります。');draw();break;
case 'wtPause':if(w&&w.since!==null){w.ms=elapsed(w);w.since=null;persist();draw()}break;
case 'wtResume':if(w&&w.since===null){w.since=Date.now();persist();draw()}break;
case 'wtFinish':finish();break;
case 'wtDiscard':if(w&&confirm('今回の計測を記録せず破棄しますか？')){delete state.walkTimer;if(!persist()){state.walkTimer=w;alert('保存できませんでした。');return}draw()}break;
}});
$('coachLaunch')?.addEventListener('click',ev=>{if(current()){ev.stopImmediatePropagation();alert('歩行タイマーを終了・記録してから筋トレを開始してください。')}},true);
const oldRender=render;render=function(){oldRender();refreshPanel()};
const oldHeadline=headline;headline=function(){oldHeadline();refreshPanel()};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});
window.addEventListener('pageshow',update);
window.addEventListener('storage',ev=>{if(ev.key===key&&ev.newValue){try{const next=validate(JSON.parse(ev.newValue));state=next;render();if(dlg.open)draw()}catch(_){}}});
interval=setInterval(update,1000);refreshPanel();
})();
