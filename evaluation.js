(function evaluationUpgrade(){
'use strict';
const st=document.createElement('style');st.textContent=`#content .ev-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}#content .ev-card{background:#222630;border:1px solid #ffffff09;border-radius:15px;padding:14px;min-width:0}#content .ev-card strong{font-size:23px;display:block;line-height:1.35;overflow-wrap:anywhere}#content .ev-status{display:inline-block;font-size:11px;font-weight:700;color:#a6b4c9;margin-bottom:6px}#content .ev-status.good{color:#b9ef43}#content .ev-status.care{color:#ffd39b}#content .ev-status.info{color:#91b9ff}#content .ev-card p{font-size:13px;margin:6px 0 0;color:var(--muted)}#content .ev-row{padding:13px 0;border-bottom:1px solid var(--line)}#content .ev-row:last-child{border-bottom:0}#content .ev-row h3{margin:0 0 4px;font-size:15px}#content .ev-row p{margin:6px 0;font-size:13px}#content .ev-row .muted{font-size:12px}#content .ev-top{background:linear-gradient(125deg,#173776,#192337);border-color:#6f9cff33}#content .ev-top button{margin-top:5px}#content .ev-actions{display:grid;gap:8px;margin:12px 0}#content .ev-actions div{background:#ffffff08;border-radius:12px;padding:11px 13px;font-size:14px}#content .ev-actions b{color:#b9ef43;margin-right:8px}#content .ev-jump{width:100%;margin:4px 0 14px;min-height:49px}#content .ev-track{height:6px;background:#353c48;border-radius:8px;overflow:hidden;margin:9px 0}#content .ev-track i{display:block;background:#6f9cff;height:100%;border-radius:8px}#content .ev-table{overflow:auto}#content .ev-table table{min-width:450px}#content .ev-meals{display:grid;gap:6px}#content .ev-meals div{display:flex;justify-content:space-between;gap:8px;padding:8px 10px;background:#ffffff06;border-radius:8px;font-size:13px}@media(max-width:350px){#content .ev-grid{grid-template-columns:1fr}}`;document.head.append(st);
const n=x=>typeof x==='number'&&Number.isFinite(x),round=x=>Math.round(x*10)/10;
const actual=x=>x&&n(x.sets)&&x.sets>0&&n(x.reps)&&x.reps>0;
const fmt=(x,suffix='')=>n(x)?round(x)+suffix:'未入力';
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const unique=a=>[...new Set(a)];
const escText=esc;
const badge=(v,c='info')=>`<span class="ev-status ${c}">${escText(v)}</span>`;
const card=(title,value,detail,status='記録分',kind='info',ratio=null)=>`<div class="ev-card">${badge(status,kind)}<small>${escText(title)}</small><strong>${escText(value)}</strong>${ratio===null?'':`<div class="ev-track"><i style="width:${Math.min(100,Math.max(0,ratio*100))}%"></i></div>`}<p>${escText(detail)}</p></div>`;
const row=(title,status,kind,detail,advice)=>`<div class="ev-row">${badge(status,kind)}<h3>${escText(title)}</h3><p class="muted">${escText(detail)}</p><p>${escText(advice)}</p></div>`;
const box=(heading,body,caption='')=>`<section><h2>${escText(heading)}</h2>${caption?`<p class="muted">${escText(caption)}</p>`:''}${body}</section>`;
const actionList=a=>`<div class="ev-actions">${unique(a).slice(0,5).map((x,i)=>`<div><b>${i+1}.</b>${escText(x)}</div>`).join('')}</div>`;
function prior(d,id){const day=Object.keys(state.logs).filter(k=>k<d&&actual(log(k).ex[id])).sort().pop();return day?{day,x:log(day).ex[id]}:null}
function recovery(d){const l=log(d),y=log(dateKey(shift(parseDate(d),-1))),sleep=n(l.sleep),risk=l.fatigue==='pain'||l.fatigue==='tired'||sleep&&l.sleep<6;
 let status=l.fatigue==='pain'?'運動中止':risk?'回復優先':!sleep?'睡眠未入力':'睡眠記録あり';
 let advice=l.fatigue==='pain'?'痛み・体調不良がある場合は筋トレを中止。胸痛、強い息苦しさ、めまいなどは運動を中止し、症状に応じて医療機関へ。':risk?'強い疲労や短い睡眠がある日は休養、または無理のない軽い活動に変更。':sleep?'睡眠時間だけでは回復を断定できません。眠気・筋肉痛・フォームも確認。':'睡眠時間を入力すると回復の判断がしやすくなります。';
 if(y.fatigue==='pain'&&l.fatigue!=='pain')advice+=' 前日に痛みの記録があるため、症状が残っていないか確認。';
 return {risk,status,advice,sleep};
}
function exerciseRows(d){const l=log(d),p=plan(d),rec=recovery(d);return ex.map(e=>{
 const x=l.ex[e.id],past=prior(d,e.id),unit=e.id==='plank'?'秒':'回',desc=actual(x)?`${x.sets}セット × 平均${x.reps}${unit} / ${e.id==='plank'?'自重':fmt(x.kg,'kg（片手）')} / RIR ${fmt(x.rir)}`:'セット数と回数・秒数が未確定';
 let status='未評価',kind='info',a='実績が入れば評価します。空欄を0回とは扱いません。',comparison='';
 if(actual(x)){
  const rir=n(x.rir),full=x.sets>=p.sets;
  if(rec.risk){status='回復優先';kind='care';a='負荷を増やさず、休養または軽い動作を優先。'}
  else if(rir&&x.rir<=1){status='負荷が高め';kind='care';a='次回は回数・重量を抑えて余力2〜3回程度を残す。'}
  else if(x.reps<e.range[0]){status='回数が目安未満';kind='care';a='フォームを崩さず、必要なら重量を軽くする。無理に回数を増やさない。'}
  else if(!full){status='実施済み・セット途中';a='記録したセットは評価済み。残りは体調と予定に合わせて。'}
  else if(!rir){status='予定量を記録・余力不明';a='RIRを入力すると負荷の妥当性を判断できます。'}
  else if(x.reps>=e.range[1]&&x.rir>=3&&past&&n(past.x.kg)&&n(x.kg)&&past.x.kg===x.kg&&past.x.reps>=e.range[1]&&past.x.sets>=plan(past.day).sets&&n(past.x.rir)&&past.x.rir>=3){status='段階的な調整候補';kind='good';a=e.id==='plank'?'姿勢に余裕がある場合のみ5秒程度延長。':'同じ重量で余裕が続いています。フォームが安定していれば回数・動作速度・重量のうち一つだけを小さく調整。'}
  else{status='予定量を記録';kind='good';a='次回もフォーム・余力を確認。同じ条件で継続して変化を見ましょう。'}
  if(e.id==='raise'&&n(x.kg)&&x.kg>2)a+=' サイドレイズは重さより反動のないフォームを優先し、必要なら軽いボトルなどに変更。';
  if(past){const y=past.x;comparison=`前回 ${past.day.slice(5)}：${y.sets}セット × ${y.reps}${unit}、${fmt(y.kg,'kg')}、RIR ${fmt(y.rir)}。`;if(n(y.kg)&&n(x.kg)&&y.kg===x.kg)comparison+=` 同重量で平均${unit}の差 ${x.reps-y.reps>=0?'+':''}${round(x.reps-y.reps)}。フォーム・テンポが同じ場合の参考。`;else comparison+=' 重量が異なる、または不明なため単純比較しません。'}
 }
 return row(e.name,status,kind,desc+`（予定 ${p.sets}セット・${e.range.join('〜')}${unit}）`,a+(comparison?' '+comparison:''))
 }).join('')}
function nutrition(d){const l=log(d),s=sums(l),goal=state.settings.protein,energy=state.settings.energy,has=l.foods.length>0,missing=Math.max(0,goal-s.p),main=[0,1,3],logged=main.filter(i=>l.foods.some(f=>f.meal===i)),actions=[];
 let pa=!has?'食事の記録を追加すると、入力済みの摂取量から評価します。':s.p>=goal?'記録分の概算でタンパク質の目安に到達。通常の食事を続け、無理に追加する必要はありません。':l.done&&!s.pu?'完了記録の概算は目安未満。次の普段の食事で主菜・大豆食品・乳製品などを取り入れる。':'現時点の記録では目安まで約'+round(missing)+'g。未記録・今後の食事を含まない差なので、不足とは断定しません。';
 if(s.pu)pa+=' P不明の食品が'+s.pu+'品あります。';
 if(has&&s.p<goal)actions.push(l.done?'次の普段の食事でタンパク質を含む主菜を選ぶ。':'残りの通常の食事に肉・魚・卵・豆類などの主菜を組み合わせる。');
 if(!has)actions.push('食事を1品でも登録する。');
 const meals=mealNames.map((name,i)=>{const fs=l.foods.filter(f=>f.meal===i),t=sums({foods:fs});return `<div><span>${escText(name)} · ${fs.length}品</span><span>${fs.length?Math.round(t.k)+'kcal'+(t.ku?'＋?':'')+' / P '+round(t.p)+'g'+(t.pu?'＋?':''):'未記録'}</span></div>`}).join('');
 const knownMeals=main.map(i=>sums({foods:l.foods.filter(f=>f.meal===i)})).filter((t,i)=>l.foods.some(f=>f.meal===main[i])&&!t.pu);
 const distribution=knownMeals.length<2?'主な食事が2回以上記録されると、食事ごとのタンパク質の配分を比較できます。':Math.max(...knownMeals.map(t=>t.p))-Math.min(...knownMeals.map(t=>t.p))>=20?'記録された主な食事の間でPの差が20g以上あります。少ない食事にも主菜を取り入れると分散しやすくなります（20gはアプリの表示用目安）。':'記録された主な食事のP量の差は20g未満。食事の完成度や必要量までは判断できません。';
 let ea=!has?'未評価。':s.ku?'kcal不明の食品あり。総摂取量は判定できません。':!energy?'エネルギー参考値は設定されていません。':!l.done?'現時点の記録量です。残りの食事を制限する根拠にしません。':s.k<energy*.75?'参考値に比べ記録量が少なめ。記録漏れを確認し、空腹・疲労があれば主食や主菜を十分に。':'参考値との比較に留めます。維持カロリーや体脂肪の変化はこの記録だけでは不明です。';
 if(l.done&&has&&!s.ku&&energy&&s.k<energy*.75)actions.push('記録漏れを確認し、食事を抜かず十分に食べる。');
 const coverage='主な食事 '+logged.length+'/3区分に記録あり。空欄は欠食とは限りません。';
 const body=`<div class="ev-grid">${card('タンパク質（記録分）',has?round(s.p)+'g'+(s.pu?'＋?':''):'—','目安 '+goal+'g',!has?'未記録':s.p>=goal?'記録上の目安到達':l.done&&!s.pu?'目安未満（概算）':'途中集計',s.p>=goal?'good':'info',has?s.p/goal:null)}${card('エネルギー（記録分）',has?Math.round(s.k)+'kcal'+(s.ku?'＋?':''):'—',energy?'参考 '+energy+'kcal（維持量未確定）':'参考値なし',!has?'未記録':'概算・参考','info')}</div>${row('タンパク質の総量',!has?'未評価':'記録に基づく','info',coverage,pa)}${row('エネルギー',!has?'未評価':'参考値','info','食材・料理の概算値を集計',ea)}<h3>食事ごとの内訳</h3><div class="ev-meals">${meals}</div><p class="muted">${escText(distribution)}</p><p class="note">主食・主菜・副菜をそろえ、野菜・果物・油脂も確保しましょう。現行データはPとkcalのみなので、脂質・炭水化物・食物繊維・ビタミン・塩分は定量評価しません。</p>`;
 return {body,actions};
}
function weekly(ds){const ls=ds.map(d=>log(d)),now=dateKey(new Date()),eligible=ds.filter(d=>d<=now),done=ls.filter(l=>l.done),valid=ls.filter(l=>l.done&&l.foods.length&&!sums(l).pu),partial=ls.filter(l=>!l.done&&l.foods.length),sleep=ls.filter(l=>n(l.sleep)).map(l=>l.sleep),walk=ls.filter(l=>n(l.walk)),planned=ds.filter(d=>plan(d).type==='strength').length,exDays=ls.filter(trained).length,anyDays=ls.filter(l=>ex.some(e=>actual(l.ex[e.id]))).length;
 return {ls,eligible,done,valid,partial,sleep,walk,planned,exDays,anyDays,pavg:avg(valid.map(l=>sums(l).p)),walkSum:walk.reduce((a,l)=>a+l.walk,0),fatigue:ls.filter(l=>l.fatigue==='tired'||l.fatigue==='pain').length}
}
function adviceDaily(d){const l=log(d),p=plan(d),rec=recovery(d),nut=nutrition(d),a=[];if(rec.risk)a.push(rec.advice);else if(!rec.sleep)a.push('睡眠時間を入力し、疲労・痛みも確認する。');const actualN=ex.filter(e=>actual(l.ex[e.id])).length;
 if(p.type==='strength'&&!rec.risk){if(actualN===0)a.push(l.done?'次の予定日から再開。未実施分の埋め合わせは不要。':'実施したセットだけ入力。これから行う場合はコーチを利用する。');else if(ex.some(e=>actual(l.ex[e.id])&&n(l.ex[e.id].rir)&&l.ex[e.id].rir<=1))a.push('余力1回以下の種目は次回の負荷を抑える。');else a.push('記録済みの種目を確認。フォームと余力を優先する。')}
 if(p.type==='walk'&&!rec.risk&&(!n(l.walk)||l.walk<p.minutes))a.push(l.done?'次の予定日に無理なく歩行を再開。':'予定と体調に合わせて歩行。未記録ならタイマーを活用。');
 if(p.type==='rest')a.push('休養は計画の一部。筋トレを追加して埋め合わせる必要はありません。');
 a.push(...nut.actions);return a;
}
reviewView=function(){const d=selected,l=log(d),p=plan(d),rec=recovery(d),nut=nutrition(d),actualN=ex.filter(e=>actual(l.ex[e.id])).length,sets=actualSets(l),q=qualified(l,p),w=weekly(dates()),actions=adviceDaily(d);
 const planText={strength:'筋トレ',walk:'歩行',rest:'休養'}[p.type];const planned=p.type==='strength'?`${q}/${ex.length}種目`:p.type==='walk'?`${fmt(l.walk,'分')} / ${p.minutes}分`:'休養日';
 let walkAdvice=!n(l.walk)?'歩行時間は未記録。活動がなかったとは判断しません。':p.type==='walk'&&l.walk>=p.minutes?'記録時間は今日の歩行目安に到達。強度・歩数は未測定です。':p.type==='walk'?'現時点の記録時間を表示。無理な埋め合わせは不要です。':'予定外の軽い散歩も実績として扱います。疲れがあれば休みましょう。';
 return `<section class="ev-top"><div class="tag">DAILY REVIEW / ${esc(d)}</div><h2>${l.done?'記録完了時の評価':'現時点の途中評価'}</h2><p>${l.done?'完了の印は入力終了の目印です。':'空欄があっても評価できます。'} 未入力は欠測として扱い、記録済みの情報だけから判断します。</p><div class="ev-grid">${card('今日の予定',planText,planned,'計画','info')}${card('筋トレ実績',actualN?sets+'セット':'—',actualN+'/6種目に有効な記録',actualN?'記録あり':'未記録','info')}</div><h3>次にやること</h3>${actionList(actions)}<button class="primary" data-go="log">記録を追加・修正</button></section>${box('回復・コンディション',`<div class="ev-grid">${card('睡眠',fmt(l.sleep,'時間'),rec.sleep?'時間のみ・睡眠の質は不明':'睡眠時間を入力',rec.status,rec.risk?'care':'info')}${card('疲労・痛み',l.fatigue==='pain'?'痛み・不調':l.fatigue==='tired'?'強い疲労':'通常／未確認','通常は初期値の場合もあります',rec.risk?'注意':'自己申告','info')}</div><p class="note">${esc(rec.advice)}</p>`)}${box('筋トレ・負荷分析',exerciseRows(d),'RIR（余力）は自己申告。予定は目安であり、未達や空欄を罰点にしません。')}${box('歩行・有酸素',card('歩行の記録',fmt(l.walk,'分'),p.type==='walk'?'今日の目安 '+p.minutes+'分':'歩行予定日以外も記録可能',n(l.walk)?'記録あり':'未記録','info',p.type==='walk'&&n(l.walk)?l.walk/p.minutes:null)+`<p>${esc(walkAdvice)}</p>`)}${box('栄養・食事バランス',nut.body)}${box('週間の現在地',`<div class="ev-grid">${card('全身筋トレ',w.exDays+'/'+w.planned+'回','4種目以上記録した日を暫定集計','記録分','info')}${card('歩行合計',w.walk.length?round(w.walkSum)+'分':'—',w.walk.length+'日の入力','記録分','info')}${card('平均P',w.pavg===null?'—':round(w.pavg)+'g',w.valid.length+'完了日（途中の食事記録 '+w.partial.length+'日）','完了記録のみ','info')}${card('平均睡眠',w.sleep.length?round(avg(w.sleep))+'時間':'—',w.sleep.length+'日の入力','記録分','info')}</div><button data-go="week">詳しい週間レビュー</button>`)}${box('評価の根拠と限界','<p>健康な成人向けの一般的な目安と、アプリの設定・記録を使用したルールベースの評価です。筋力・筋肥大・体脂肪・回復状態そのものを測定した結果ではありません。</p><p><a href="https://kennet.mhlw.go.jp/information/information/exercise/s-00-005.html" target="_blank" rel="noopener">厚生労働省：筋力トレーニング</a> ／ <a href="https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/suimin/index.html" target="_blank" rel="noopener">睡眠ガイド</a> ／ <a href="https://pubmed.ncbi.nlm.nih.gov/28698222/" target="_blank" rel="noopener">タンパク質と筋トレ（Morton et al.）</a></p>')}`;
};
weekView=function(){const ds=dates(),w=weekly(ds),prev=weekly(ds.map(d=>dateKey(shift(parseDate(d),-7)))),p=plan(ds[0]),a=[];
 if(w.fatigue)a.push('疲労・痛みの記録があるため、次週は負荷を増やす前に回復を確認。');
 if(w.exDays>=w.planned)a.push('記録上の全身筋トレ回数は予定の目安に到達。追加の追い込みは不要。');else a.push('筋トレの記録は'+w.exDays+'回。週途中・未記録の日を未実施とは断定しない。次の予定日に無理なく継続。');
 if(w.valid.length<3)a.push('完了かつP不明なしの食事記録が3日未満。平均は参考値にとどめる。');else if(w.pavg<state.settings.protein)a.push('完了記録日の平均Pが目安未満。通常の食事に主菜を取り入れる。');else a.push('完了記録日の平均Pは目安に到達。');
 if(w.sleep.length&&w.sleep.some(x=>x<6))a.push('6時間未満の睡眠記録あり。睡眠と回復を優先。');
 if(w.done.length<w.eligible.length)a.push('終了した日にも未完了記録があります。欠測を0とせず評価します。');
 const table=`<div class="ev-table"><table><thead><tr><th>日</th><th>筋トレ</th><th>歩行</th><th>P(g)</th><th>睡眠</th><th>状態</th></tr></thead><tbody>${ds.map((d,i)=>{const l=w.ls[i],s=sums(l);return `<tr><td><button data-day="${d}">${names[i]} ${d.slice(-2)}</button></td><td>${actualSets(l)||'—'}</td><td>${fmt(l.walk,'分')}</td><td>${l.foods.length?round(s.p)+(s.pu?'＋?':''):'—'}</td><td>${fmt(l.sleep,'h')}</td><td>${l.done?'完了':d>dateKey(new Date())?'予定':'途中・未記録'}</td></tr>`}).join('')}</tbody></table></div>`;
 const compare=(label,x,y,countX,countY,unit)=>row(label,countX>=3&&countY>=3?'記録日の比較':'比較保留','info',`今週 ${countX}日 / 前週 ${countY}日`,countX>=3&&countY>=3?`今週 ${round(x)}${unit}、前週 ${round(y)}${unit}。記録された日の比較であり、欠測日や食事量の変化を推定しません。`:'両週3日以上の対象記録が揃うと比較します。');
 return `<section class="ev-top"><div class="tag">WEEKLY REVIEW</div><h2>週間レビュー・途中経過</h2><p>週途中でも表示します。完了 ${w.done.length}日 / 現時点まで ${w.eligible.length}日。未入力・未来の日は0として平均しません。</p><div class="ev-grid">${card('全身筋トレ',w.exDays+'/'+w.planned+'回','1種目以上記録 '+w.anyDays+'日','記録分')}${card('歩行・有酸素',w.walk.length?round(w.walkSum)+'分':'—','予定目安 '+p.minutes*3+'分 / 記録 '+w.walk.length+'日','記録分')}${card('平均タンパク質',w.pavg===null?'—':round(w.pavg)+'g',w.valid.length+'完了日・P不明なし','対象日のみ')}${card('平均睡眠',w.sleep.length?round(avg(w.sleep))+'h':'—',w.sleep.length+'日 / 6時間未満 '+w.sleep.filter(x=>x<6).length+'日','対象日のみ')}</div><h3>次の行動</h3>${actionList(a)}</section>${box('日別記録',table,'筋トレは記録済みセット数。未来・未入力を未達にしません。')}${box('前週との比較',compare('タンパク質平均',w.pavg,prev.pavg,w.valid.length,prev.valid.length,'g')+compare('睡眠平均',avg(w.sleep),avg(prev.sleep),w.sleep.length,prev.sleep.length,'h')+row('筋トレ頻度','記録された回数','info',`今週 ${w.exDays}回 / 前週 ${prev.exDays}回`,'全身6種目中4種目以上の実績がある日を暫定集計。週途中の比較や未記録に注意。'))}${box('次週に向けて','<p>開始週から計算した予定を基本に、疲労や痛みがあれば慣らし期のセット数に戻すか休養してください。記録不足を理由に追加運動や食事制限を行いません。</p>')}`;
};
const originalRender=render;render=function(){originalRender();if(tab==='log'){const root=$('content');const quick=document.createElement('button');quick.className='primary ev-jump';quick.dataset.go='review';quick.textContent='現時点の評価を見る（未入力でもOK）';root.insertBefore(quick,root.children[1]||null)}};
render();
})();
