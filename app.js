// app.js — MyAiTeacher PWA v5 (Pages-ready)
import { MODULES } from './lessons.js';
import { QUIZZES } from './quizzes.js';
import { PROMPTS } from './prompts.js';
import { RESOURCES } from './resources.js';
import { VIDEOS } from './videos.js';
import { FUTURE } from './future.js';

const $ = (sel)=>document.querySelector(sel);
const $$ = (sel)=>Array.from(document.querySelectorAll(sel));

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = $('#installBtn');
  btn.style.display = 'inline-flex';
  btn.onclick = async () => {
    btn.style.display = 'none';
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  };
});

// Online/offline indicator
function updateOnline(){
  const dot = $('#online-indicator');
  dot.style.background = navigator.onLine ? 'var(--ok)' : 'var(--warn)';
}
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);

// Service worker (stale-while-revalidate in sw.js)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}

const KEYS = {
  progress:'mat_progress',
  notes:'mat_notes',
  quiz:'mat_quiz_scores',
  feedUrl:'mat_feed_url'
};

function load(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch{ return fallback; } }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

// Mutable data stores
let MODULES_MUT = JSON.parse(JSON.stringify(MODULES));
let QUIZZES_MUT = JSON.parse(JSON.stringify(QUIZZES));
let RESOURCES_MUT = JSON.parse(JSON.stringify(RESOURCES));

function mergeFeed(feed){
  let added = 0;
  if(feed.modules && Array.isArray(feed.modules)){
    feed.modules.forEach(m=>{
      const exists = MODULES_MUT.find(x=>x.id===m.id);
      if(!exists){ MODULES_MUT.push(m); added++; }
    });
  }
  if(feed.resources && typeof feed.resources==='object'){
    for(const [k,list] of Object.entries(feed.resources)){
      if(!RESOURCES_MUT[k]) RESOURCES_MUT[k]=[];
      RESOURCES_MUT[k].push(...list);
    }
  }
  return added;
}

async function autoLoadFeed(){
  try{
    const res = await fetch('./updates/feed.json', {cache:'no-store'});
    if(res.ok){
      const feed = await res.json();
      const added = mergeFeed(feed);
      console.log('Auto feed merged. Modules added:', added);
    }
  }catch(e){ console.log('No feed loaded', e); }
}

function setupTabs(){
  const tabs = $$('#tabs button[data-tab]');
  tabs.forEach(btn=>{
    btn.addEventListener('click',()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.getAttribute('data-tab');
      $$('.tab').forEach(div=>div.style.display = (div.id===t)?'block':'none');
    });
  });
  tabs[0].click();
  updateOnline();
}

function renderStats(){
  const p = load(KEYS.progress,{});
  const completed = Object.values(p).filter(Boolean).length;
  $('#stat-progress').textContent = `${completed} modules complete`;
}

function renderCurriculum(){
  const container = $('#modules');
  container.innerHTML = '';
  const p = load(KEYS.progress,{});
  MODULES_MUT.forEach(m=>{
    const done = !!p[m.id];
    const c = document.createElement('section');
    c.className = 'card';
    c.innerHTML = `
      <div class="card-header">
        <div>
          <div class="badge">${m.phase}</div>
          <h3>${m.title}</h3>
        </div>
        <div class="actions">
          <a href="#" class="btn small" data-quiz="${m.id}">Take Quiz</a>
          <label class="toggle">
            <input type="checkbox" ${done?'checked':''} data-mod="${m.id}"><span>Complete</span>
          </label>
        </div>
      </div>
      <div class="card-body">
        <h4>Goals</h4>
        <ul>${(m.goals||[]).map(g=>`<li>${g}</li>`).join('')}</ul>
        <h4>Readings</h4>
        <ul>${(m.readings||[]).map(r=>`<li><a target="_blank" rel="noopener" href="${r.url||'#'}">${r.title||'Link'}</a></li>`).join('')}</ul>
        <h4>Assignments</h4>
        <ol>${(m.assignments||[]).map(a=>`<li>${a}</li>`).join('')}</ol>
        <div class="notes">
          <label><span>Your Notes</span>
            <textarea rows="4" data-notes="${m.id}" placeholder="Jot down insights, citations, and to-dos..."></textarea>
          </label>
        </div>
      </div>`;
    container.appendChild(c);
  });
  $$('#modules input[type="checkbox"]').forEach(cb=>{
    cb.addEventListener('change',e=>{
      const pr = load(KEYS.progress,{});
      const id = e.target.getAttribute('data-mod');
      pr[id] = e.target.checked;
      save(KEYS.progress, pr);
      renderStats();
    });
  });
  const notes = load(KEYS.notes,{});
  $$('#modules textarea[data-notes]').forEach(ta=>{
    const id = ta.getAttribute('data-notes');
    ta.value = notes[id] || '';
    ta.addEventListener('input',e=>{
      const n = load(KEYS.notes,{});
      n[id] = e.target.value;
      save(KEYS.notes, n);
    });
  });
  $$('#modules a[data-quiz]').forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      openQuiz(a.getAttribute('data-quiz'));
    });
  });
}

function renderPrompts(){
  const grid = $('#prompts');
  grid.innerHTML = '';
  PROMPTS.forEach(p=>{
    const card = document.createElement('section');
    card.className = 'panel';
    card.innerHTML = `<h3>${p.title}</h3><p><code>${p.content}</code></p>`;
    grid.appendChild(card);
  });
}

function renderResources(){
  const container = $('#resources');
  container.innerHTML = '';
  Object.entries(RESOURCES_MUT).forEach(([k,links])=>{
    const card = document.createElement('section');
    card.className = 'card';
    card.innerHTML = `<div class="card-header"><h3>${k}</h3></div>` +
      `<div class="card-body"><ul>${(links||[]).map(l=>`<li><a target="_blank" rel="noopener" href="${l.url}">${l.title}</a></li>`).join('')}</ul></div>`;
    container.appendChild(card);
  });
}

function renderVideos(){
  const container = $('#videos');
  container.innerHTML = '';
  VIDEOS.forEach(v=>{
    const card = document.createElement('section');
    card.className = 'card';
    card.innerHTML = `<div class="card-header"><h3>${v.title}</h3></div>` +
      `<div class="card-body"><div class="video-wrap"><iframe width="100%" height="360" src="${v.embed}" frameborder="0" allowfullscreen></iframe></div></div>`;
    container.appendChild(card);
  });
}

// Future Radar
function renderFuture(){
  const s = $('#future-signals');
  const b = $('#future-bets');
  const a = $('#future-assumptions');
  s.innerHTML = FUTURE.signals.map(x=>`<li>${x}</li>`).join('');
  b.innerHTML = FUTURE.bets.map(x=>`<li>${x}</li>`).join('');
  a.innerHTML = FUTURE.assumptions.map(x=>`<li>${x}</li>`).join('');
}

// Update Center
async function fetchAndMergeFeed(url){
  const log = $('#feedLog');
  try{
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok){ log.textContent = 'HTTP '+res.status+' — could not fetch feed.'; return; }
    const feed = await res.json();
    const before = MODULES_MUT.length;
    const added = mergeFeed(feed);
    renderCurriculum(); renderResources();
    const after = MODULES_MUT.length;
    log.textContent = `Merged ${added} new module(s). Total modules: ${after}.`;
  }catch(e){
    log.textContent = 'Error: ' + e.message;
  }
}
function setupUpdates(){
  $('#fetchFeed').addEventListener('click', ()=>{
    const url = $('#feedUrl').value.trim();
    if(!url){ $('#feedLog').textContent = 'Enter a feed URL first.'; return; }
    save(KEYS.feedUrl, url);
    fetchAndMergeFeed(url);
  });
  $('#importFeed').addEventListener('click', async ()=>{
    const f = $('#feedFile').files[0];
    const log = $('#feedLog');
    if(!f){ log.textContent = 'Pick a JSON file first.'; return; }
    try{
      const txt = await f.text();
      const feed = JSON.parse(txt);
      const added = mergeFeed(feed);
      renderCurriculum(); renderResources();
      log.textContent = `Imported ${added} new module(s) from file.`;
    }catch(e){ log.textContent = 'Import failed: ' + e.message; }
  });
  const saved = load(KEYS.feedUrl, '');
  if(saved) $('#feedUrl').value = saved;
}

// Quizzes
function openQuiz(modId){
  const quiz = QUIZZES_MUT[modId] || QUIZZES[modId] || [];
  const dlg = $('#quiz-modal');
  const body = $('#quiz-body');
  const title = $('#quiz-title');
  const sc = load(KEYS.quiz,{});
  let i=0, correct=0;
  title.textContent = (MODULES_MUT.find(m=>m.id===modId)?.title) || 'Quiz';
  function renderQ(){
    if(i>=quiz.length){
      const pct = quiz.length? Math.round((correct/quiz.length)*100) : 0;
      sc[modId] = {correct, total: quiz.length, pct, date: new Date().toISOString()};
      localStorage.setItem(KEYS.quiz, JSON.stringify(sc));
      body.innerHTML = `<p>Score: <strong>${correct}/${quiz.length}</strong> (${pct}%)</p><p class="subtle">Review any missed explanations, then close.</p>`;
      $('#quiz-next').style.display='none'; return;
    }
    const q = quiz[i];
    body.innerHTML = `<p><strong>Q${i+1}.</strong> ${q.q}</p><ul class="mc">${q.choices.map((c,idx)=>`<li><label><input type="radio" name="mc" value="${idx}"> ${c}</label></li>`).join('')}</ul><div id="explain" class="subtle" style="display:none"></div>`;
    $$('#quiz-body input[name="mc"]').forEach(inp=>{
      inp.addEventListener('change',e=>{
        const chosen = parseInt(e.target.value,10);
        const right = chosen===q.answer;
        if(right) correct++;
        const ex = $('#explain'); ex.style.display='block';
        ex.textContent = (right?'✅ Correct. ':'❌ Not quite. ') + (q.explain||'');
      });
    });
  }
  $('#quiz-next').onclick = ()=>{ i++; renderQ(); };
  $('#quiz-close').onclick = ()=>{ dlg.close(); $('#quiz-next').style.display='inline-block'; };
  dlg.showModal(); renderQ();
}

function renderQuizStats(){
  const scores = load(KEYS.quiz,{});
  const container = $('#quiz-stats');
  container.innerHTML='';
  const entries = Object.entries(scores);
  if(!entries.length){ container.innerHTML = '<p>No quiz attempts yet.</p>'; return; }
  entries.forEach(([id,s])=>{
    const m = MODULES_MUT.find(x=>x.id===id);
    const card = document.createElement('section');
    card.className='card';
    card.innerHTML = `<div class="card-header"><h3>${m?.title||id}</h3></div><div class="card-body"><p><strong>Score:</strong> ${s.correct}/${s.total} (${s.pct}%)</p><p class="subtle">${new Date(s.date).toLocaleString()}</p></div>`;
    container.appendChild(card);
  });
}

// Labs — simple JS runner
function setupLabs(){
  const code = $('#code');
  const out = $('#output');
  const run = $('#run');
  const reset = $('#reset');
  const defaultCode = code.value;
  function captureConsole(frameWin){
    const logs = [];
    frameWin.console.log = (...args)=>{ logs.push(args.map(a=>typeof a==='object'? JSON.stringify(a): String(a)).join(' ')); };
    return logs;
  }
  run.addEventListener('click',()=>{
    out.textContent = '';
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts';
    document.body.appendChild(iframe);
    const frameWin = iframe.contentWindow;
    const logs = captureConsole(frameWin);
    const script = frameWin.document.createElement('script');
    script.textContent = code.value;
    frameWin.document.body.appendChild(script);
    setTimeout(()=>{
      out.textContent = logs.join('\n') || '(no console output)';
      iframe.remove();
    },120);
  });
  reset.addEventListener('click',()=> code.value = defaultCode);
}

// TinyNN — minimal dense network for demos
function setupTinyNN(){
  const file = $('#model-file');
  const input = $('#model-input');
  const out = $('#model-out');
  let model = null;

  function relu(v){ return v.map(x=>Math.max(0,x)); }
  function softmax(v){
    const m = Math.max(...v);
    const ex = v.map(x=>Math.exp(x-m));
    const s = ex.reduce((a,b)=>a+b,0);
    return ex.map(x=>x/s);
  }
  function matmul(W, x){ // W: out x in, x: in
    const outSize = W.length, inSize = W[0].length, y = new Array(outSize).fill(0);
    for(let i=0;i<outSize;i++){ let s=0; for(let j=0;j<inSize;j++){ s += W[i][j]*x[j]; } y[i]=s; }
    return y;
  }
  function addBias(v,b){ return v.map((val,i)=>val + (b?.[i]||0)); }

  function forward(x){
    let v = x.slice();
    for(const layer of model.layers){
      if(layer.type==='dense'){ v = addBias(matmul(layer.W, v), layer.b); }
      else if(layer.type==='relu'){ v = relu(v); }
      else if(layer.type==='softmax'){ v = softmax(v); }
    }
    return v;
  }

  file.addEventListener('change',async (e)=>{
    const f = e.target.files[0]; if(!f) return;
    const txt = await f.text();
    model = JSON.parse(txt);
    out.textContent = 'Model loaded ✅';
  });
  $('#model-run').addEventListener('click',()=>{
    if(!model){ out.textContent = 'Load a model JSON first.'; return; }
    const x = input.value.split(',').map(s=>parseFloat(s.trim())).filter(n=>!isNaN(n));
    if(!x.length){ out.textContent='Please provide numeric input vector.'; return; }
    try{ const y = forward(x); out.textContent = 'Output: ' + JSON.stringify(y); }
    catch(err){ out.textContent = 'Error: '+ err.message; }
  });
}

// RAG Playground (TF-IDF)
function setupRAG(){
  const files = $('#rag-files'), area = $('#rag-text'), qEl = $('#rag-query'), out = $('#rag-out');
  let docs = [];
  files.addEventListener('change', async (e)=>{
    const arr = [];
    for(const f of e.target.files){
      const t = await f.text();
      arr.push({id:f.name, text:t});
    }
    docs = docs.concat(arr);
    out.textContent = `Loaded ${docs.length} docs.`;
  });
  function tokenize(s){
    return s.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
  }
  function buildIndex(ds){
    const df = new Map(), D = ds.length;
    ds.forEach(d=>{
      const terms = new Set(tokenize(d.text));
      terms.forEach(t=> df.set(t, (df.get(t)||0)+1 ));
    });
    return {df, D};
  }
  function scoreDoc(qTokens, d, idx){
    const tf = new Map();
    tokenize(d.text).forEach(t=> tf.set(t,(tf.get(t)||0)+1));
    let s=0;
    for(const t of qTokens){
      const idf = Math.log((idx.D+1)/((idx.df.get(t)||0)+1));
      s += (tf.get(t)||0)*idf;
    }
    return s;
  }
  $('#rag-ask').addEventListener('click', ()=>{
    const text = area.value.trim();
    const local = text? [{id:'pasted', text}] : [];
    const all = local.concat(docs);
    if(!all.length){ out.textContent = 'Load or paste some text first.'; return; }
    const idx = buildIndex(all);
    const qTok = tokenize(qEl.value||'');
    const ranked = all.map(d=>({id:d.id, score:scoreDoc(qTok,d,idx), text:d.text})).sort((a,b)=>b.score-a.score).slice(0,3);
    const result = ranked.map(r=>`# ${r.id} (score ${r.score.toFixed(2)})\n` + r.text.substring(0,800) + (r.text.length>800?'…':'' )).join('\n\n---\n\n');
    out.textContent = result || 'No relevant passages found.';
  });
}

// Backup
function setupBackup(){
  const log = $('#backup-log');
  $('#exportBtn').addEventListener('click',()=>{
    const data = {
      progress: JSON.parse(localStorage.getItem('mat_progress')||'{}'),
      notes: JSON.parse(localStorage.getItem('mat_notes')||'{}'),
      quiz: JSON.parse(localStorage.getItem('mat_quiz_scores')||'{}')
    };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'my_ai_teacher_backup.json'; a.click();
    URL.revokeObjectURL(url);
    log.textContent = 'Exported backup to file.';
  });
  $('#importBtn').addEventListener('click', async()=>{
    const f = $('#importFile').files[0];
    if(!f){ log.textContent = 'Select a backup file first.'; return; }
    try{
      const txt = await f.text();
      const data = JSON.parse(txt);
      if(data.progress) localStorage.setItem('mat_progress', JSON.stringify(data.progress));
      if(data.notes) localStorage.setItem('mat_notes', JSON.stringify(data.notes));
      if(data.quiz) localStorage.setItem('mat_quiz_scores', JSON.stringify(data.quiz));
      log.textContent = 'Import successful. Reload the page to see updates.';
    }catch(e){
      log.textContent = 'Import failed: ' + e.message;
    }
  });
}

document.addEventListener('DOMContentLoaded', async()=>{
  setupTabs();
  await autoLoadFeed(); // merge /updates/feed.json on load
  renderCurriculum(); renderStats();
  renderPrompts(); renderResources(); renderVideos(); renderQuizStats(); renderFuture();
  setupUpdates(); setupLabs(); setupTinyNN(); setupLLM(); setupRAG(); setupBackup();
});
