(function(){
  "use strict";
  var $ = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 时钟 / 问候 ---------- */
  var greet = $('#greet'), greetNote = $('#greetNote'),
      timeEl = $('#time'), secEl = $('#sec'), dateEl = $('#date');
  var NOTES = [
    ['夜深了','这个点还醒着，挑点轻松的看看。'],
    ['早上好','新的一天，先做最重要的一件事。'],
    ['上午好','专注时段，别让消息打断你。'],
    ['中午好','午间歇一会儿，翻翻收藏。'],
    ['下午好','来点灵感，或者换换脑子。'],
    ['傍晚好','收尾时间，把今天的事落个地。'],
    ['晚上好','今天辛苦了，去个喜欢的地方。']
  ];
  function pad(n){ return n < 10 ? '0' + n : '' + n; }
  function greetIndex(h){
    if (h < 5) return 0;
    if (h < 9) return 1;
    if (h < 12) return 2;
    if (h < 14) return 3;
    if (h < 18) return 4;
    if (h < 22) return 5;
    return 6;
  }
  function tick(){
    var now = new Date(), h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    var g = NOTES[greetIndex(h)];
    greet.textContent = g[0];
    greetNote.textContent = g[1];
    timeEl.textContent = pad(h) + ':' + pad(m);
    secEl.textContent = pad(s);
    var days = ['周日','周一','周二','周三','周四','周五','周六'];
    dateEl.textContent = now.getFullYear() + '.' + pad(now.getMonth() + 1) + '.' + pad(now.getDate()) + ' · ' + days[now.getDay()];
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- 主题 ---------- */
  var root = document.documentElement, themeBtn = $('#themeBtn');
  function syncThemeBtn(){
    themeBtn.setAttribute('aria-label', root.dataset.theme === 'dark' ? '切换浅色主题' : '切换深色主题');
  }
  syncThemeBtn();
  themeBtn.addEventListener('click', function(){
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('lyls.theme', next); } catch(e){}
    syncThemeBtn();
  });

  /* ---------- 统计与分类计数 ---------- */
  var sites = $$('.site'), cats = $$('.cat'), totalEl = $('#total');
  totalEl.textContent = String(sites.length).padStart(2, '0');
  cats.forEach(function(cat){
    var n = cat.querySelectorAll('.site').length;
    cat.dataset.count = String(n).padStart(2, '0');
    cat.querySelector('.cat-count').textContent = cat.dataset.count;
  });

  /* ---------- 搜索 ---------- */
  var q = $('#q'), meta = $('#searchMeta'), clearBtn = $('#clearBtn'), noResult = $('#noResult');
  var suggestEl = $('#suggestions'), ENGINE_KEY = 'lyls.search.engine';
  var engineBtn = $('#engineBtn'), engineLabel = $('#engineLabel'), engineMenu = $('#engineMenu');
  var goBtn = $('#goBtn');
  var WEB_ENGINES = {
    google:     { label: 'Google',     url: 'https://www.google.com/search?q=' },
    baidu:      { label: '百度',        url: 'https://www.baidu.com/s?wd=' },
    bing:       { label: 'Bing',        url: 'https://www.bing.com/search?q=' },
    duckduckgo: { label: 'DuckDuckGo',  url: 'https://duckduckgo.com/?q=' }
  };
  var CURRENT_ENGINE = (function(){
    try { return WEB_ENGINES[localStorage.getItem(ENGINE_KEY)] ? localStorage.getItem(ENGINE_KEY) : 'google'; } catch(e){ return 'google'; }
  })();
  var activeIdx = -1; // suggestions 高亮索引

  function updateEngineUI(){
    var e = WEB_ENGINES[CURRENT_ENGINE];
    engineLabel.textContent = e.label;
    $$('.engine-opt').forEach(function(opt){
      opt.classList.toggle('is-active', opt.dataset.engine === CURRENT_ENGINE);
    });
  }
  updateEngineUI();

  function highlightMatch(text, query){
    if (!query) return text;
    var idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
  }

  function showSuggestions(list, query){
    if (!list.length) { suggestEl.hidden = true; suggestEl.innerHTML = ''; activeIdx = -1; return; }
    activeIdx = 0;
    suggestEl.innerHTML = list.map(function(site, i){
      return '<li data-href="' + site.href + '" data-name="' + site.dataset.name + '" data-host="' + site.querySelector('.site-host').textContent + '" class="' + (i === 0 ? 'is-active' : '') + '" role="option" aria-selected="' + (i === 0) + '">' +
        '<span class="s-mark">' + site.dataset.mark + '</span>' +
        '<span class="s-name">' + highlightMatch(site.dataset.name, query) + '</span>' +
        '<span class="s-host">' + site.querySelector('.site-host').textContent + '</span>' +
      '</li>';
    }).join('');
    suggestEl.hidden = false;
  }

  function hideSuggestions(){ suggestEl.hidden = true; suggestEl.innerHTML = ''; activeIdx = -1; }

  function filter(){
    var raw = q.value.trim(), query = raw.toLowerCase();
    var visible = [], allHidden = true;
    sites.forEach(function(a){
      var hay = (a.dataset.keywords + ' ' + a.dataset.name + ' ' + a.textContent).toLowerCase();
      var hit = !query || hay.indexOf(query) !== -1;
      a.classList.toggle('is-hidden', !hit);
      if (hit) { visible.push(a); allHidden = false; }
    });
    cats.forEach(function(cat){
      var shown = cat.querySelectorAll('.site:not(.is-hidden)').length;
      cat.classList.toggle('is-hidden', shown === 0);
      cat.querySelector('.cat-count').textContent = query ? String(shown).padStart(2, '0') : cat.dataset.count;
    });
    noResult.hidden = !(query && allHidden);
    if (!query) {
      meta.textContent = '';
      hideSuggestions();
    } else {
      meta.textContent = visible.length
        ? '匹配 ' + visible.length + ' 个站点 · ↑↓ 选择 · Enter 打开 · Shift+Enter 全网搜索'
        : '匹配 0 个站点 · Shift+Enter 全网搜索';
      showSuggestions(visible.slice(0, 8), query);
    }
    if (raw) { clearBtn.setAttribute('data-show', ''); } else { clearBtn.removeAttribute('data-show'); }
  }

  function openActiveSite(){
    var items = suggestEl.querySelectorAll('li');
    if (items.length && activeIdx >= 0 && activeIdx < items.length) {
      var href = items[activeIdx].dataset.href;
      hideSuggestions();
      // 模拟点击触发最近访问记录
      var link = sites.find(function(s){ return s.href === href; });
      if (link) {
        document.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, target: link}));
      }
      window.open(href, '_blank', 'noopener');
      return true;
    }
    return false;
  }

  function webSearch(){
    var raw = q.value.trim();
    if (!raw) return;
    var url = WEB_ENGINES[CURRENT_ENGINE].url + encodeURIComponent(raw);
    window.open(url, '_blank', 'noopener');
  }

  /* 引擎选择器 */
  engineBtn.addEventListener('click', function(e){
    e.stopPropagation();
    var open = engineBtn.getAttribute('aria-expanded') === 'true';
    engineBtn.setAttribute('aria-expanded', String(!open));
    engineMenu.hidden = open;
  });
  $$('.engine-opt').forEach(function(opt){
    opt.addEventListener('click', function(e){
      e.stopPropagation();
      CURRENT_ENGINE = opt.dataset.engine;
      try { localStorage.setItem(ENGINE_KEY, CURRENT_ENGINE); } catch(ex){}
      updateEngineUI();
      engineBtn.setAttribute('aria-expanded', 'false');
      engineMenu.hidden = true;
      q.focus();
    });
  });
  document.addEventListener('click', function(e){
    if (!engineBtn.contains(e.target) && !engineMenu.contains(e.target)) {
      engineBtn.setAttribute('aria-expanded', 'false');
      engineMenu.hidden = true;
    }
    if (!suggestEl.contains(e.target) && e.target !== q) { hideSuggestions(); }
  });

  /* 搜索输入 */
  q.addEventListener('input', filter);
  clearBtn.addEventListener('click', function(){ q.value = ''; filter(); q.focus(); });
  goBtn.addEventListener('click', webSearch);

  q.addEventListener('keydown', function(e){
    var items = suggestEl.querySelectorAll('li');
    var n = items.length;
    if (e.key === 'ArrowDown') {
      if (n) {
        e.preventDefault();
        activeIdx = (activeIdx + 1) % n;
        items.forEach(function(li, i){
          li.classList.toggle('is-active', i === activeIdx);
          li.setAttribute('aria-selected', i === activeIdx ? 'true' : 'false');
        });
        // 将选中项内容填入输入框（Tab 补全的预览）
        q.setAttribute('data-preview', items[activeIdx].dataset.name);
      }
    } else if (e.key === 'ArrowUp') {
      if (n) {
        e.preventDefault();
        activeIdx = (activeIdx - 1 + n) % n;
        items.forEach(function(li, i){
          li.classList.toggle('is-active', i === activeIdx);
          li.setAttribute('aria-selected', i === activeIdx ? 'true' : 'false');
        });
        q.setAttribute('data-preview', items[activeIdx].dataset.name);
      }
    } else if (e.key === 'Tab') {
      if (n && activeIdx >= 0) {
        e.preventDefault();
        q.value = items[activeIdx].dataset.name;
        filter();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        webSearch();
      } else if (n && openActiveSite()) {
        // ok
      } else {
        // 没有候选 → 尝试全网搜索
        webSearch();
      }
    } else if (e.key === 'Escape') {
      hideSuggestions();
    }
  });

  /* 点击候选 */
  suggestEl.addEventListener('click', function(e){
    var li = e.target.closest('li');
    if (!li) return;
    window.open(li.dataset.href, '_blank', 'noopener');
    hideSuggestions();
    // 触发最近访问
    var link = sites.find(function(s){ return s.href === li.dataset.href; });
    if (link) document.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, target: link}));
  });

  /* 全局快捷键 */
  document.addEventListener('keydown', function(e){
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault(); q.focus(); q.select();
    } else if (e.key === '/' && !typing) {
      e.preventDefault(); q.focus();
    } else if (e.key === 'Escape') {
      if (q.value) { q.value = ''; filter(); }
      q.blur();
      hideSuggestions();
    }
  });

  /* ---------- 最近访问 ---------- */
  var RECENT_KEY = 'lyls.recent.v1';
  var listEl = $('#recentList');
  function readRecent(){
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch(e){ return []; }
  }
  function writeRecent(arr){
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(arr)); } catch(e){}
  }
  function renderRecent(){
    var arr = readRecent();
    if (!arr.length) {
      listEl.innerHTML = '<span class="recent-empty">点击任意站点，这里会记住你最近去的地方</span>';
      return;
    }
    listEl.innerHTML = arr.map(function(item){
      return '<a class="recent-chip" href="' + item.url + '" target="_blank" rel="noopener">' +
        '<span class="mark-sm">' + item.mark + '</span>' + item.name + '</a>';
    }).join('');
  }
  document.addEventListener('click', function(e){
    var a = e.target.closest ? e.target.closest('a.site') : null;
    if (!a) return;
    var item = { name: a.dataset.name, mark: a.dataset.mark, url: a.href };
    var arr = readRecent().filter(function(x){ return x.url !== item.url; });
    arr.unshift(item);
    writeRecent(arr.slice(0, 5));
    renderRecent();
  });
  renderRecent();
})();
