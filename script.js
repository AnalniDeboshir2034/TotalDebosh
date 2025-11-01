// script.js — функционал рандомайзера
(() => {
  // Utilities
  const $  = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const randInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;

  // Tabs
  const tabs = $$('.tab-btn');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    $$('.panel').forEach(p=>p.classList.add('hidden'));
    const id = t.id.replace('tab-','');
    $(`#${id}`).classList.remove('hidden');
  }));

  // Numbers
  const numMin = $('#num-min'), numMax = $('#num-max'), numCount = $('#num-count'), numUnique = $('#num-unique');
  const numRes = $('#number-result'), genNumBtn = $('#gen-number'), copyNumBtn = $('#copy-number');

  function genNumbers(){
    let a = parseInt(numMin.value||0,10);
    let b = parseInt(numMax.value||100,10);
    if(a>b){[a,b]=[b,a]}
    const cnt = Math.max(1, Math.min(50, parseInt(numCount.value||1,10)));
    const unique = numUnique.checked;
    const out = [];
    const tried = new Set();
    const range = b - a + 1;
    for(let i=0;i<cnt;i++){
      if(unique && out.length>=range) break;
      let v;
      let attempts = 0;
      do { v = randInt(a,b); attempts++; } while(unique && out.includes(v) && attempts<1000);
      out.push(v);
    }
    numRes.textContent = out.join(', ');
    saveHistory('numbers', out);
  }
  genNumBtn.addEventListener('click', genNumbers);
  copyNumBtn.addEventListener('click', () => {
    navigator.clipboard?.writeText(numRes.textContent||'').then(()=>flash('Скопировано'));
  });

  // List picker
  const listArea = $('#list-items'), pickListBtn = $('#pick-list'), shuffleListBtn = $('#shuffle-list'), listRes = $('#list-result'), saveListBtn = $('#save-list');
  pickListBtn.addEventListener('click', () => {
    const items = listArea.value.split('\n').map(s=>s.trim()).filter(Boolean);
    if(items.length===0){ listRes.textContent='Список пуст'; return; }
    const pick = items[randInt(0, items.length-1)];
    listRes.textContent = pick;
    saveHistory('list', pick);
  });
  shuffleListBtn.addEventListener('click', () => {
    const items = listArea.value.split('\n').map(s=>s.trim()).filter(Boolean);
    for(let i=items.length-1;i>0;i--){ const j=randInt(0,i); [items[i],items[j]]=[items[j],items[i]]; }
    listArea.value = items.join('\n');
    flash('Перемешано');
  });
  saveListBtn.addEventListener('click', () => {
    localStorage.setItem('randomizer.savedList', listArea.value);
    flash('Сохранено в LocalStorage');
  });

  // Color generator
  const colorRes = $('#color-result'), genColorBtn = $('#gen-color'), colorFmt = $('#color-format'), colorCount = $('#color-count'), copyColorBtn = $('#copy-color');
  function randHex(){ return '#'+Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0'); }
  function randRgb(){ return `rgb(${randInt(0,255)}, ${randInt(0,255)}, ${randInt(0,255)})`; }
  function randHsl(){ return `hsl(${randInt(0,359)} ${randInt(40,90)}% ${randInt(30,70)}%)`; }
  genColorBtn.addEventListener('click', () => {
    colorRes.innerHTML = '';
    const n = Math.max(1, Math.min(20, parseInt(colorCount.value||1,10)));
    const fmt = colorFmt.value;
    const vals = [];
    for(let i=0;i<n;i++){
      let v = fmt === 'hex' ? randHex() : fmt === 'rgb' ? randRgb() : randHsl();
      vals.push(v);
      const sw = document.createElement('div');
      sw.className='swatch';
      sw.style.background = v;
      sw.title = v;
      sw.textContent = v;
      sw.addEventListener('click', () => {
        navigator.clipboard?.writeText(v);
        flash('Цвет скопирован');
      });
      colorRes.appendChild(sw);
    }
    saveHistory('color', vals);
  });
  copyColorBtn.addEventListener('click', () => {
    const txt = Array.from(colorRes.querySelectorAll('.swatch')).map(s=>s.title).join(', ');
    navigator.clipboard?.writeText(txt).then(()=>flash('Скопировано'));
  });

  // Dice
  const diceType = $('#dice-type'), diceCount = $('#dice-count'), rollDiceBtn = $('#roll-dice'), diceRes = $('#dice-result');
  $('#advantage').addEventListener('click', () => rollWithAdv(true));
  $('#disadvantage').addEventListener('click', () => rollWithAdv(false));
  function rollWithAdv(isAdv){
    const sides = parseInt(diceType.value,10);
    if(sides!==20){ flash('Advantage/Disadvantage применимо только к d20'); return; }
    const a = randInt(1,20), b = randInt(1,20);
    const pick = isAdv ? Math.max(a,b) : Math.min(a,b);
    diceRes.textContent = `Броски: ${a}, ${b} → ${pick}`;
    saveHistory('dice', {type: 'd20', rolls:[a,b], result: pick});
  }
  rollDiceBtn.addEventListener('click', () => {
    const sides = Math.max(2, parseInt(diceType.value,10));
    const n = Math.max(1, Math.min(10, parseInt(diceCount.value,10)));
    const rolls = [];
    for(let i=0;i<n;i++) rolls.push(randInt(1,sides));
    diceRes.textContent = rolls.join(', ') + (n>1 ? ` — сумма: ${rolls.reduce((a,b)=>a+b,0)}` : '');
    saveHistory('dice', {type: 'd'+sides, rolls});
  });

  // Names with elimination
  const namesArea = $('#names-list'), elimMode = $('#elim-mode'), pickNameBtn = $('#pick-name'), resetNamesBtn = $('#reset-names'), nameRes = $('#name-result');
  let eliminated = new Set(JSON.parse(localStorage.getItem('randomizer.eliminated')||'[]'));
  function pickName(){
    const arr = namesArea.value.split('\n').map(s=>s.trim()).filter(Boolean);
    const available = arr.filter(x=>!eliminated.has(x));
    if(available.length===0){ nameRes.textContent='Нет доступных имён'; return; }
    const pick = available[randInt(0, available.length-1)];
    nameRes.textContent = pick;
    if(elimMode.checked){ eliminated.add(pick); localStorage.setItem('randomizer.eliminated', JSON.stringify(Array.from(eliminated))); flash('Имя исключено'); }
    saveHistory('names', pick);
  }
  pickNameBtn.addEventListener('click', pickName);
  resetNamesBtn.addEventListener('click', () => { eliminated.clear(); localStorage.removeItem('randomizer.eliminated'); flash('Исключения сброшены'); });

  // History / storage
  function saveHistory(kind, value){
    const key = 'randomizer.history';
    const hist = JSON.parse(localStorage.getItem(key)||'[]');
    hist.unshift({t: Date.now(), kind, value});
    localStorage.setItem(key, JSON.stringify(hist.slice(0,200)));
  }

  // Flash helper
  function flash(text){
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position='fixed'; el.style.right='20px'; el.style.bottom='20px';
    el.style.background='linear-gradient(90deg,var(--accent),#06b6d4)';
    el.style.color='#08132a'; el.style.padding='10px 14px'; el.style.borderRadius='10px';
    document.body.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.addEventListener('transitionend', ()=>el.remove()); }, 1200);
  }

  // Readme dialog
  const readme = $('#readme-dialog');
  $('#open-readme').addEventListener('click', ()=>readme.showModal());
  $('#close-readme').addEventListener('click', ()=>readme.close());

  // Download zip (fetches server copy that we will provide separately)
  $('#download-zip').addEventListener('click', ()=> {
    // The zip is provided alongside files by the environment; link handled below in README.
    flash('Архив генерируется и доступен в скачиваемых файлах.');
    // Try to link to ZIP file path
    const a = document.createElement('a');
    a.href = 'randomizer_site.zip';
    a.download = 'randomizer_site.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  // Init: load saved list
  const savedList = localStorage.getItem('randomizer.savedList');
  if(savedList) listArea.value = savedList;

  // Accessibility: focus on first input
  numMin.focus();

  // On load, generate a sample color for visual
  setTimeout(()=>{ genColorBtn.click(); }, 250);

})();
