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
  function filter(){
    var raw = q.value.trim(), query = raw.toLowerCase();
    var visible = 0;
    sites.forEach(function(a){
      var hay = (a.dataset.keywords + ' ' + a.dataset.name + ' ' + a.textContent).toLowerCase();
      var hit = !query || hay.indexOf(query) !== -1;
      a.classList.toggle('is-hidden', !hit);
      if (hit) visible++;
    });
    cats.forEach(function(cat){
      var shown = cat.querySelectorAll('.site:not(.is-hidden)').length;
      cat.classList.toggle('is-hidden', shown === 0);
      cat.querySelector('.cat-count').textContent = query ? String(shown).padStart(2, '0') : cat.dataset.count;
    });
    noResult.hidden = !(query && visible === 0);
    if (!query) {
      meta.textContent = '';
    } else {
      meta.textContent = visible
        ? '匹配 ' + visible + ' 个站点 · 按 Enter 打开第一个'
        : '匹配 0 个站点';
    }
    if (raw) { clearBtn.setAttribute('data-show', ''); } else { clearBtn.removeAttribute('data-show'); }
  }
  q.addEventListener('input', filter);
  clearBtn.addEventListener('click', function(){ q.value = ''; filter(); q.focus(); });
  q.addEventListener('keydown', function(e){
    if (e.key === 'Enter') {
      var first = $('.site:not(.is-hidden)');
      if (first) { first.click(); }
    }
  });
  document.addEventListener('keydown', function(e){
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault(); q.focus(); q.select();
    } else if (e.key === '/' && !typing) {
      e.preventDefault(); q.focus();
    } else if (e.key === 'Escape') {
      if (q.value) { q.value = ''; filter(); }
      q.blur();
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
