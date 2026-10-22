/* Kani Life - 画面 */
(function () {
  'use strict';
  var KL = window.KL, U = KL.U, SO = KL.Soccer, SE = KL.Season, M = KL.Match, ST = KL.Story;
  var app = document.getElementById('app');
  var sheet = document.getElementById('sheet');
  var sheetBody = sheet.querySelector('.sheet-body');
  var S = null, alloc = {}, tab = 'home', setup = null, flow = null, MS = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function r0(v) { return Math.round(v); }
  function openSheet(html) { sheetBody.innerHTML = html; sheet.hidden = false; sheetBody.scrollTop = 0; }
  function closeSheet() { sheet.hidden = true; sheetBody.innerHTML = ''; }
  function starStr(n) { var s = ''; for (var i = 1; i <= 6; i++) s += i <= n ? (n >= 6 ? '<span class="s6">★</span>' : '★') : (i <= 5 ? '<span class="off">★</span>' : ''); return s; }

  // ================= 似顔絵（SVG） =================
  var HAIR = {
    '清楚系': '#2B2220', 'かわいい系': '#6B4430', '美人系': '#3A2A25', 'ギャル系': '#C49A5A', 'スポーティ': '#4A3326', '大人っぽい': '#5A3A2E', 'ふんわり系': '#9C6B4A', 'クール系美人': '#1E1A1A',
    '爽やか系': '#3B2B22', '塩顔': '#1E1A1A', 'ワイルド': '#2B2220', '王子様系': '#B88A5A', '知的': '#2B2220', '韓国アイドル系': '#D9CFC6', '体育会系': '#1E1A1A'
  };
  var SKIN = ['#F8DCC4', '#F3CBA8', '#EDC19C', '#F6D7C3'];
  var SHIRT = ['#20999C', '#E07A95', '#5B7FD0', '#F2B84B', '#7C6BC4', '#4FA36B', '#E58A55', '#61797F'];
  function hash(n) { var x = Math.sin((n || 1) * 9301 + 49297) * 233280; return x - Math.floor(x); }
  function avatar(n, size) {
    size = size || 40;
    var sx = n.sex || 'm', seed = n.id || (n.name ? n.name.length * 7 : 3);
    var r1 = hash(seed), r2 = hash(seed + 11), r3 = hash(seed + 23);
    var hair = n.old ? '#B9B4AE' : (HAIR[n.vt] || (sx === 'f' ? '#4A3326' : '#2B2220'));
    var skin = SKIN[Math.floor(r1 * SKIN.length)], shirt = n.shirt || SHIRT[Math.floor(r2 * SHIRT.length)];
    var g = '<path d="M10 64 Q10 49 32 49 Q54 49 54 64Z" fill="' + shirt + '"/>';
    var style = sx === 'f' ? (n.vt === 'スポーティ' ? 'pony' : n.vt === 'かわいい系' || r3 < 0.3 ? 'bob' : 'long') : (n.vt === '体育会系' ? 'buzz' : n.vt === '韓国アイドル系' || n.vt === 'かわいい系' || r3 < 0.3 ? 'mash' : 'short');
    if (style === 'long') g += '<path d="M13 31 Q13 11 32 11 Q51 11 51 31 L52 56 Q32 60 12 56 Z" fill="' + hair + '"/>';
    if (style === 'bob') g += '<path d="M13 31 Q13 11 32 11 Q51 11 51 31 L51 44 Q32 47 13 44 Z" fill="' + hair + '"/>';
    if (style === 'pony') g += '<circle cx="49" cy="20" r="6.5" fill="' + hair + '"/><path d="M50 22 Q58 32 52 42 Q50 32 47 26Z" fill="' + hair + '"/>';
    g += '<ellipse cx="32" cy="32" rx="15.5" ry="16.5" fill="' + skin + '"/>';
    if (style === 'long' || style === 'bob' || style === 'pony') g += '<path d="M16 31 Q15 13 32 13 Q49 13 48 31 Q45 22 37 20 Q33 25 26 22 Q20 23 16 31Z" fill="' + hair + '"/>';
    if (style === 'short') g += '<path d="M16 30 Q15 12 32 12 Q49 12 48 30 Q46 21 40 20 Q32 23 25 20 Q18 22 16 30Z" fill="' + hair + '"/>';
    if (style === 'mash') g += '<path d="M15 32 Q14 11 32 11 Q50 11 49 32 Q47 25 42 26 Q37 23 32 27 Q27 23 22 26 Q17 25 15 32Z" fill="' + hair + '"/>';
    if (style === 'buzz') g += '<path d="M17 27 Q17 14 32 14 Q47 14 47 27 Q40 20 32 20 Q24 20 17 27Z" fill="' + hair + '"/>';
    var smile = /明るく|よく笑う|天然|甘えん坊/.test(n.pers || '');
    if (smile) g += '<path d="M23.5 34 Q26 31 28.5 34" stroke="#2B2220" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M35.5 34 Q38 31 40.5 34" stroke="#2B2220" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    else g += '<ellipse cx="26" cy="33.5" rx="1.9" ry="' + (sx === 'f' ? 2.6 : 2.2) + '" fill="#2B2220"/><ellipse cx="38" cy="33.5" rx="1.9" ry="' + (sx === 'f' ? 2.6 : 2.2) + '" fill="#2B2220"/>';
    if (n.vt === '知的') g += '<circle cx="26" cy="33.5" r="4.2" stroke="#2B2220" stroke-width="1.2" fill="none"/><circle cx="38" cy="33.5" r="4.2" stroke="#2B2220" stroke-width="1.2" fill="none"/><path d="M30.2 33.5 H33.8" stroke="#2B2220" stroke-width="1.2"/>';
    if (sx === 'f' || n.vt === 'かわいい系') g += '<ellipse cx="22.5" cy="38.5" rx="2.6" ry="1.5" fill="#F29C9C" opacity=".55"/><ellipse cx="41.5" cy="38.5" rx="2.6" ry="1.5" fill="#F29C9C" opacity=".55"/>';
    g += '<path d="M29 41 Q32 43.5 35 41" stroke="#B5524F" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    var bg = sx === 'f' ? '#FCE8EE' : '#E4F1F6';
    return '<svg class="av" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="' + bg + '"/>' + g + '</svg>';
  }
  function npcAvatar(n, size) {
    size = size || 40;
    if (n.hero && KL.Hero) { var f = KL.Hero.face(S, n); if (f) return '<img class="av hero" width="' + size + '" height="' + size + '" src="' + f + '" alt="" onerror="this.replaceWith(document.createTextNode(\'\'))">'; }
    var a = n.id ? KL.npcAge(S, n) : 30; return avatar({ id: n.id, sex: n.sex, vt: n.vt, pers: n.pers, name: n.name, old: a >= 62 }, size);
  }
  function meAvatar(size) { var st = S.st; return avatar({ id: 777 + (S.sei + S.mei).length, sex: 'm', vt: S.track === 'soccer' ? '体育会系' : st.look >= 70 ? '爽やか系' : '塩顔', pers: 'よく笑う', old: KL.age(S) >= 62, shirt: '#20999C' }, size); }
  KL.avatar = avatar;

  function fitLabel(n) { var f = KL.prefFit(S, n); return f >= 6 ? '◎ 好みにドンピシャ' : f >= 1 ? '○ 好みに合っている' : f >= -5 ? '△ 好みとは少し違う' : '× タイプではないかも'; }
  function pcard(n) {
    KL.ensureProfile(S, n);
    var a = KL.npcAge(S, n);
    var rows = [['年齢', a + '歳' + (n.ad ? '（' + (n.ad > 0 ? n.ad + '歳上' : (-n.ad) + '歳下') + '）' : '')], ['身長', n.ht + 'cm'], ['職業', KL.npcJob(S, n)], ['趣味', n.hobby], ['好きなタイプ', KL.prefName(n.pref)]];
    if (KL.canLove(S, n) && !n.hero) rows.push(['相性', fitLabel(n)]);
    return '<div class="pcard"><div class="pcard-h">' + npcAvatar(n, 56) + '<div><b>' + esc(n.name) + '</b><span>' + esc(KL.profileLine(S, n)) + '</span></div></div>' +
      '<dl class="pgrid">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>' +
      '<div class="like" style="margin-top:6px"><i style="width:' + n.like + '%"></i></div></div>';
  }
  function infoCard(c) {
    return '<div class="icard">' + (c.img || '') + '<div class="icard-b"><b>' + esc(c.title) + '</b>' + (c.sub ? '<span>' + esc(c.sub) + '</span>' : '') +
      (c.rows && c.rows.length ? '<dl class="pgrid">' + c.rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>' : '') + '</div></div>';
  }
  // 挿絵：ev-◯◯.png を置くと表示（なければ非表示）
  function imgKey(ev) {
    var id = ev.id || '';
    if (id === 'birth' || /^baby_|^first_/.test(id)) return 'birth';
    if (/^k_/.test(id)) return 'kinder';
    if (ev.cat === 'soccer' || /^(m_|s_|fx|tech_|nt_|wc_|ballon|debut|retire|ceremony|lgwin|topscorer|num|legend|nick_|injury)/.test(id)) return /injury/.test(id) ? '' : 'soccer';
    if (/^(l_date|l_bday|s_firstdate|s_hanabi|s_xmas)$/.test(id)) return 'date';
    if (/^(r_confess|r_confessed|r_moteki|r_newcrush|s_koibana|s_button|s_senpai|k_first_love|r_valentine)$/.test(id)) return 'love';
    if (/^(r_propose|r_goldwed|l_parents|l_invite)$/.test(id)) return 'wedding';
    if (/^(r_baby|r_kid_grow|r_mago|f_)/.test(id)) return 'family';
    if (/^(w_|u_shukatsu)/.test(id)) return 'work';
    if (/^(o_|r_spouse_bye|w_parent)/.test(id)) return 'old';
    if (/^(e_|j_|h_|u_)/.test(id)) return 'school';
    return '';
  }
  function evImg(ev) {
    if (ev.img) return '<img class="ev-hero" src="' + ev.img + '" alt="" onerror="this.remove()">';
    var k = imgKey(ev); return k ? '<img class="ev-img" src="ev-' + k + '.png" alt="" onerror="this.remove()">' : '';
  }

  // ================= タイトル =================
  function title() {
    var slots = KL.slots(), hall = KL.hall();
    var hallHtml = hall.length ? '<div class="hall"><h3>これまでの人生</h3>' + hall.slice(0, 6).map(function (h) {
      return '<div class="hall-row"><b>' + esc(h.rank) + '</b><div>' + esc(h.name) + '（' + h.age + '歳）<br><small style="color:var(--sub)">' + esc(h.title) + '</small></div><span>' + new Date(h.when).toLocaleDateString('ja-JP') + '</span></div>';
    }).join('') + '</div>' : '';
    app.innerHTML =
      '<div class="title-screen">' +
      '<h1 class="logo">Kani Life<small>天賦の才を持って、もうひとつの人生を。</small></h1>' +
      '<p class="title-lead">才能はガチャで決まる。<br>その才能で、どう生きる？</p>' +
      '<p class="title-sub">生まれてから老後まで。サッカーの道を歩む、規格外の才能を持った人間の一生を。</p>' +
      '<div class="slots">' + slots.map(function (sv, i) {
        var n = i + 1;
        if (sv && !sv.dead) return '<div class="slot"><div><small>セーブ' + n + '</small><b>' + esc(sv.sei + ' ' + sv.mei) + '・' + KL.age(sv) + '歳</b><span>' + esc(KL.stageLabel(sv)) + (sv.gift ? '・' + esc(sv.gift.n) : '') + '</span></div><button class="btn btn-sm btn-main" data-a="continue" data-s="' + n + '">続きから</button><button class="btn btn-sm btn-line" data-a="delslot" data-s="' + n + '" aria-label="削除">✕</button></div>';
        return '<div class="slot empty"><div><small>セーブ' + n + '</small><b>空き</b></div><button class="btn btn-sm btn-ghost" data-a="new" data-s="' + n + '">新しい人生</button></div>';
      }).join('') + '</div>' + hallHtml + '</div>';
  }

  // ================= 才能ガチャ =================
  function rollFamily() { return U.wpick(KL.FAMILIES, function (f) { return f.w; }); }
  function newSetup(slot) {
    var tal = {}; KL.STATS.forEach(function (s) { tal[s.k] = 0; });
    setup = { sei: '', mei: '', pref: '大阪', family: rollFamily(), tal: tal, pulls: 0, slot: slot || 1, last: '' };
  }
  function gachaView() {
    var st = setup, all = KL.STATS.every(function (s) { return st.tal[s.k] > 0; });
    var gift = all ? KL.giftOf(st.tal) : null;
    var cards = KL.STATS.map(function (s) {
      var v = st.tal[s.k], cls = v >= 6 ? 'gc six' : v === 5 ? 'gc five' : v ? 'gc' : 'gc back';
      if (st.last === s.k) cls += ' flip';
      return '<button class="' + cls + '" data-a="pull" data-k="' + s.k + '"><small>' + s.n + '</small>' + (v ? '<b>' + starStr(v) + '</b><em>' + (v >= 6 ? '規格外・' + KL.NICK6[s.k] : ['', '苦手', 'やや苦手', '普通', '得意', '天才'][v]) + '</em><i>引き直す</i>' : '<b class="q">？</b><i>タップで引く</i>') + '</button>';
    }).join('');
    app.innerHTML =
      '<div class="page">' +
      '<button class="btn btn-sm btn-line" data-a="toTitle">戻る</button>' +
      '<h2>才能ガチャ</h2>' +
      '<p class="lead">7つの才能を1枚ずつ引く。何度でも引き直せる。★6は2%の「規格外」。</p>' +
      '<div class="gacha">' + cards + '</div>' +
      '<div class="gacha-bar"><button class="btn btn-sm btn-ghost" data-a="pullAll">まとめて引く</button><span>引いた回数 <b class="num">' + st.pulls + '</b></span></div>' +
      (gift ? '<div class="gift"><small>この才能の組み合わせは</small><b>「' + esc(gift.n) + '」</b><p>' + esc(gift.d) + '</p></div>' : '') +
      '<div class="field" style="margin-top:18px"><label>名前</label><div class="row2"><input class="input" id="sei" placeholder="姓（空欄でおまかせ）" value="' + esc(st.sei) + '"><input class="input" id="mei" placeholder="名（空欄でおまかせ）" value="' + esc(st.mei) + '"></div></div>' +
      '<div class="field"><label>出身地</label><select class="input" id="pref">' + KL.PREFS.map(function (p) { return '<option' + (p === st.pref ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>生まれる家庭</label><div class="family"><div><b>' + esc(st.family.name) + '</b><p>' + esc(st.family.desc) + '</p></div><button class="btn btn-sm btn-ghost" data-a="reroll">引き直す</button></div></div>' +
      '<p class="note">' + KL.BIRTH_YEAR + '年生まれ・男の子。18歳でちょうど2026-27シーズンを迎える世代です。</p>' +
      '<button class="btn btn-main" data-a="start" style="margin:14px 0 32px" ' + (all ? '' : 'disabled') + '>' + (all ? 'この才能で生まれる' : 'すべての才能を引いてください') + '</button>' +
      '</div>';
    ['sei', 'mei'].forEach(function (id) { document.getElementById(id).addEventListener('input', function (e) { setup[id] = e.target.value.trim(); }); });
    document.getElementById('pref').addEventListener('change', function (e) { setup.pref = e.target.value; });
  }
  function pull(k) { setup.tal[k] = KL.gacha(); setup.pulls++; setup.last = k; var y = window.scrollY; gachaView(); window.scrollTo(0, y); }
  function startLife() {
    var st = setup;
    S = KL.newGame({ sei: st.sei || U.pick(KL.NAMES.sei), mei: st.mei || U.pick(KL.NAMES.m), pref: st.pref, family: st.family.id, tal: JSON.parse(JSON.stringify(st.tal)), slot: st.slot, order: KL.STATS.map(function (s) { return s.k; }) });
    if (KL.Hero) KL.Hero.init(S);
    if (KL.Rec) KL.Rec.initRival(S);
    S.flags.pulls = st.pulls;
    alloc = {}; tab = 'home';
    KL.save(S);
    render();
    KL.beginTurn(S);
    var birth = KL.EVENTS.filter(function (e) { return e.id === 'birth'; })[0];
    S.done.birth = 1;
    flow = { mode: 'single' };
    showEvent(KL.evInstance(S, birth));
  }
  // 誕生の文章に才能を足す
  (function () {
    var b = KL.EVENTS.filter(function (e) { return e.id === 'birth'; })[0]; if (!b) return;
    b.text = function (S) {
      var fam = KL.familyOf(S);
      var s = KL.year(S) + '年春、' + S.pref + 'の' + fam.name + 'に元気な産声が響いた。名前は「' + S.mei + '」。';
      var six = KL.STATS.filter(function (x) { return S.tal[x.k] >= 6; });
      if (S.gift) s += '\n\n✨ 生まれ持った才能：「' + S.gift.n + '」\n' + S.gift.d;
      if (six.length) s += '\n\n規格外の才能：' + six.map(function (x) { return x.n + '（' + KL.NICK6[x.k] + '）'; }).join('・');
      if (S.gift && (S.gift.id === 'god' || S.gift.id === 'chosen')) s += '\n\n産婦人科の先生が、なぜか「この子は、ボールを蹴るために生まれてきた気がする」と言った。';
      return s;
    };
  })();

  // ================= メイン =================
  function isPro() { return SE && SE.active(S); }
  function render() {
    if (!S) return title();
    if (S.dead) return resultView();
    var body = tab === 'home' ? homeView() : tab === 'rec' ? recView() : tab === 'rel' ? relView() : tab === 'sea' ? seasonView() : logView();
    app.innerHTML = topbar() + body + tabsView() + (tab === 'home' ? goView() : '');
  }
  function topbar() {
    var when = isPro() && S.sea ? SE.fmt(S.sea.d) + '（' + KL.seasonLabel(S) + '）' : KL.period(S);
    return '<div class="topbar"><div class="age num">' + KL.age(S) + '<small>歳</small></div>' +
      '<div class="who"><b>' + esc(S.sei + ' ' + S.mei) + '・' + esc(KL.stageLabel(S)) + '</b><span>' + esc(when) + '</span></div>' +
      '<div class="money"><span>所持金</span><b class="num">' + U.yen(S.money) + '</b></div>' +
      '<button class="menu-btn" data-a="menu" aria-label="メニュー">≡</button></div>';
  }
  function tabsView() {
    var t = [['home', '🏠', 'ホーム'], ['sea', '📊', isPro() ? 'シーズン' : '学校'], ['rec', '🏆', '記録'], ['rel', '💞', '人間関係'], ['log', '📜', '年表']];
    return '<nav class="tabs">' + t.map(function (x) { return '<button data-a="tab" data-v="' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '"><i>' + x[1] + '</i>' + x[2] + '</button>'; }).join('') + '</nav>';
  }
  function fromLabel() {
    var a = KL.age(S);
    if (S.stage === 'pro' || S.rep.nat >= 40 || S.talent) return '世間から見たあなた';
    if (a < 6 || S.stage === 'retired') return '近所の人から見たあなた';
    if (KL.isStudent(S)) return '同級生から見たあなた';
    if (S.stage === 'work') return '職場の人から見たあなた';
    return '周りから見たあなた';
  }
  function homeView() {
    var p = KL.perception(S);
    var h = '<div class="eyes"><p class="from">' + fromLabel() + '</p><div class="bubble"><p class="q">「' + esc(p.main) + '」</p>' +
      (p.tags && p.tags.length ? '<div class="tags">' + p.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
      '</div><div class="me">' + meAvatar(34) + esc(S.sei + ' ' + S.mei) + (S.gift ? '<span class="giftchip">' + esc(S.gift.n) + '</span>' : '') + '</div></div>';
    if (isPro()) h += proCard();
    h += heroRow() + voicesView() + loveRow() + headView() + newsView();
    if (S.track === 'soccer' && S.soccer) h += soccerCard();
    h += '<div class="sec"><div class="sec-h"><h3>能力</h3><span>★＝才能</span></div><div class="panel">' +
      KL.STATS.map(function (s) {
        var v = S.st[s.k], cap = KL.capOf(S, s.k), t = S.tal[s.k];
        return '<div class="bar ' + (t >= 6 ? 'gold' : '') + '"><span class="n">' + s.n + '<small class="' + (t >= 6 ? 's6' : '') + '">' + '★'.repeat(t) + '</small></span><div class="track"><div class="fill" style="width:' + v + '%"></div><div class="cap" style="left:' + cap + '%"></div></div><span class="v num">' + r0(v) + '</span></div>';
      }).join('') +
      '<div class="bar ' + (S.fat > 60 ? 'warn' : '') + '"><span class="n">疲労</span><div class="track"><div class="fill" style="width:' + S.fat + '%;' + (S.fat <= 60 ? 'background:#9DC7C8' : '') + '"></div></div><span class="v num">' + r0(S.fat) + '</span></div>' +
      '</div></div>';
    if (!isPro()) h += actionsView();
    return h;
  }
  // プロの「次の試合」
  function formLabel(f) { return f >= 6 ? '絶好調' : f >= 2 ? '好調' : f > -2 ? '普通' : f > -6 ? '不調' : '絶不調'; }
  function proCard() {
    var so = S.soccer, sea = S.sea, rg = SE.range(S), nx = sea ? sea.fx.filter(function (f) { return !f.played && f.d >= rg[0] && f.d < rg[1]; })[0] : null;
    var h = '<div class="sec"><div class="nextm">';
    if (nx) {
      var big = SE.isBig(S, nx), pos = nx.comp === 'L' ? SE.standings(S).findIndex(function (x) { return x.id === nx.oppId; }) + 1 : 0;
      h += '<small>次の試合・' + SE.fmt(nx.d) + '</small><b>' + esc(nx.cn) + ' ' + esc(nx.rd) + '</b><p>' + (nx.home === true ? '🏠 ホーム' : nx.home === false ? '✈️ アウェイ' : '🏟️ 中立地') + '　vs <strong>' + esc(nx.opp) + '</strong>' + (pos ? '（' + pos + '位）' : '') + '</p>' + (big ? '<span class="bigtag">🔥 ' + esc(big) + '</span>' : '');
    } else h += '<small>' + (KL.isB(S) ? 'シーズンオフ' : '半年の区切り') + '</small><b>この半年の試合はすべて終わった</b><p>次へ進むと、半年のまとめが出ます。</p>';
    h += '</div>';
    var st = [['調子', formLabel(S.form || 0)], ['疲労', r0(S.fat)], ['監督の信頼', r0(so.trust)], ['怪我', so.injDays > 0 ? 'あと' + so.injDays + '日' : 'なし']];
    h += '<div class="pstat">' + st.map(function (x) { return '<div><small>' + x[0] + '</small><b>' + esc(x[1]) + '</b></div>'; }).join('') + '</div>';
    var fc = (SO.FOCUS.filter(function (f) { return f.k === (S.focus || 'auto'); })[0] || SO.FOCUS[0]).n;
    h += '<div class="prow"><button class="pbtn" data-a="focusSheet"><small>今月の練習</small><b>' + esc(fc) + '</b></button><button class="pbtn" data-a="policySheet"><small>おまかせの方針</small><b>' + ({ soccer: 'サッカー優先', balance: 'バランス', life: '私生活優先' })[S.policy || 'balance'] + '</b></button></div>';
    var rec = (sea && sea.recent || []).slice(-4).reverse();
    if (rec.length) h += '<div class="recent">' + rec.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>';
    if (sea) { var stn = SE.standings(S), me = SE.myPos(S); h += '<p class="note" style="margin:6px 2px 0">' + esc(sea.special || KL.LEAGUES[sea.lg].name) + ' ' + me + '位（勝ち点' + (stn[me - 1] ? stn[me - 1].pts : 0) + '）・首位 ' + esc(stn[0] ? stn[0].n : '') + '（' + (stn[0] ? stn[0].pts : 0) + '）</p>'; }
    return h + '</div>';
  }
  function heroRow() {
    var n = KL.Hero && KL.Hero.npc(S); if (!n || n.hidden || S.hero.gone) return '';
    var d = KL.Hero.D[n.hero], st = KL.Hero.married(S) ? '妻' : KL.Hero.dating(S) ? '恋人' : d.role;
    return '<div class="sec"><button class="herochip" data-a="who" data-id="' + n.id + '">' + npcAvatar(n, 54) + '<span><small>' + esc(st) + '</small><b>' + esc(n.name) + '</b><em>' + esc(KL.Love ? KL.Love.nowOf(S, n) : '') + '</em></span><i>' + '♥'.repeat(Math.max(1, Math.min(5, Math.round(n.like / 20)))) + '</i></button></div>';
  }
  function voicesView() {
    if (KL.age(S) < 1 || !KL.mobVoices) return '';
    var vs = KL.mobVoices(S);
    if (!vs.length) return '';
    return '<div class="sec"><div class="sec-h"><h3>周りの声</h3><span>' + (isPro() ? '最近の反応' : '半年ごとに変わる') + '</span></div><div class="voices">' + vs.map(function (x, i) {
      var sx = /女子|ママ|おばちゃん|母|おばあ/.test(x.who) ? 'f' : /男子|おじさん|監督|記者|教授/.test(x.who) ? 'm' : (hash(x.who.length * 31 + i) > 0.5 ? 'f' : 'm');
      var nn = x.npc ? KL.npc(S, x.npc) : null;
      var face = nn ? npcAvatar(nn, 30) : avatar({ id: 5000 + x.who.length * 97 + i * 13 + S.t, sex: sx, vt: '', pers: /！|尊|最高|大好き/.test(x.text) ? 'よく笑う' : '', old: /おばちゃん|おじさん|教授|おばあ/.test(x.who) }, 30);
      return '<div class="voice"' + (nn ? ' data-a="who" data-id="' + nn.id + '" role="button"' : '') + '>' + face + '<div><small>' + esc(x.who) + '</small><p>「' + esc(x.text) + '」</p></div></div>';
    }).join('') + '</div></div>';
  }
  function headView() {
    var hs = (S.heads || []).filter(function (x) { return x.t >= S.t - 1; }).slice(-3).reverse();
    if (!hs.length) return '';
    return '<div class="sec"><div class="sec-h"><h3>ニュース</h3><span>📰 見出し</span></div><div class="heads">' + hs.map(function (x) { return '<p class="lv' + (x.imp || 0) + '">' + esc(x.text) + '</p>'; }).join('') + '</div></div>';
  }
  function newsView() {
    var ns = (S.news || []).filter(function (x) { return x.t >= S.t - 2; }).slice(-4).reverse();
    if (!ns.length) return '';
    return '<div class="sec"><div class="sec-h"><h3>知り合いの近況</h3><span>📱 SNSより</span></div><div class="panel">' + ns.map(function (x) {
      var n = x.id ? KL.npc(S, x.id) : null;
      return '<div class="person"' + (n ? ' data-a="who" data-id="' + n.id + '" role="button"' : '') + '>' + (n ? '<div class="ava pic">' + npcAvatar(n, 36) + '</div>' : '<div class="ava pic">' + avatar({ id: 9100 + x.text.length, sex: /娘/.test(x.text) ? 'f' : 'm', vt: '' }, 36) + '</div>') + '<div class="p"><p style="margin:0;font-size:14px">' + esc(x.text) + '</p></div></div>';
    }).join('') + '</div></div>';
  }
  function loveRow() {
    var pt = KL.partner(S), cr = KL.age(S) >= 10 ? KL.crush(S) : null, h = '';
    if (pt && pt.hero) pt = null;
    if (cr && cr.hero) cr = null;
    if (!pt && !cr) return '';
    h += '<div class="sec"><div class="lrow">';
    if (pt) h += '<button class="lchip" data-a="who" data-id="' + pt.id + '">' + npcAvatar(pt, 38) + '<span><small>' + (S.spouseId ? (pt.dead ? '亡き配偶者' : '配偶者') : '恋人') + '</small><b>' + esc(pt.name) + '</b><em>' + esc(KL.profileLine(S, pt)) + '</em></span></button>';
    if (cr && !S.spouseId) h += '<button class="lchip" data-a="who" data-id="' + cr.id + '">' + npcAvatar(cr, 38) + '<span><small>気になる人</small><b>' + esc(cr.name) + '</b><em>' + esc(KL.profileLine(S, cr)) + '</em></span></button>';
    return h + '</div></div>';
  }
  function skillBars(defs, vals, caps) {
    return defs.map(function (d) { var v = vals[d.k]; return '<div class="bar"><span class="n">' + d.n + '</span><div class="track" style="background:#fff"><div class="fill" style="width:' + v + '%"></div>' + (caps ? '<div class="cap" style="left:' + caps[d.k] + '%"></div>' : '') + '</div><span class="v num">' + r0(v) + '</span></div>'; }).join('');
  }
  function soccerCard() {
    var so = S.soccer, ovr = SO.ovr(so), eo = SO.eovr(S), c = so.club ? SO.club(S) : null;
    var sub = c ? KL.LEAGUES[c.l].name + '・年俸' + U.yen(so.salary) + '・契約残り' + Math.max(0, so.contract) + '年' : SO.leagueName(S);
    if (so.pending) sub += '（' + KL.clubById(so.pending.club).n + 'に内定）';
    if (so.retired) sub = '引退済み';
    var defs = SO.SK.filter(function (s) { return so.pos === 'GK' ? ['gk', 'iq', 'phy', 'pas'].indexOf(s.k) >= 0 : s.k !== 'gk'; });
    var apt = so.apt ? '<div class="apt">' + SO.POS_KEYS.map(function (p) { var g = SO.aptGrade(SO.apt(so, p)); return '<span class="g' + g + (p === so.pos ? ' cur' : '') + '"><small>' + p + '</small>' + g + '</span>'; }).join('') + '</div>' : '';
    var tech = (so.tech || []).map(SO.techById).filter(Boolean);
    return '<div class="sec"><div class="sec-h"><h3>サッカー</h3><span>' + esc(SO.POS[so.pos].jp) + (eo !== ovr ? '（適性込み ' + eo + '）' : '') + '</span></div><div class="track-card">' +
      '<div class="track-head"><div class="ovr"><div><b class="num">' + ovr + '</b><small>OVR</small></div></div>' + (so.num ? '<div class="shirt" aria-label="背番号' + so.num + '"><b class="num">' + so.num + '</b><small>背番号</small></div>' : '') + '<div class="t"><b>' + esc(SO.teamName(S)) + '</b><span>' + esc(sub) + '</span></div></div>' +
      skillBars(defs, so.sk) + apt +
      (tech.length ? '<div class="badges">' + tech.map(function (t) { return '<span class="badge tech' + (t.legend ? ' legend' : '') + '">🪄 ' + esc(t.n) + '</span>'; }).join('') + '</div>' : '') +
      (so.badges && so.badges.length ? '<div class="badges">' + so.badges.map(function (k) { return '<span class="badge">🏅 ' + esc(SO.badgeName(k)) + '</span>'; }).join('') + '</div>' : '') +
      (so.ntNow ? '<p class="mates">🇯🇵 日本代表・背番号' + (so.ntNum || '-') + '（通算' + so.caps + '試合' + so.ntGoals + '得点）</p>' : '') +
      '</div></div>';
  }
  function actionsView() {
    var acts = KL.getActions(S), ap = KL.apOf(S);
    if (!acts.length || !ap) return '<div class="sec"><div class="panel"><p class="empty">まだ小さいので、すくすく育つのを見守ろう。</p></div></div>';
    var ids = acts.map(function (a) { return a.id; });
    Object.keys(alloc).forEach(function (k) { if (ids.indexOf(k) < 0) delete alloc[k]; });
    var used = used0();
    while (used > ap) { var k0 = Object.keys(alloc).filter(function (k) { return alloc[k] > 0; }).pop(); alloc[k0]--; used--; }
    var dots = ''; for (var i = 0; i < ap; i++) dots += '<i class="' + (i < used ? '' : 'off') + '"></i>';
    return '<div class="sec"><div class="sec-h"><h3>この半年の過ごし方</h3><div class="ap" aria-label="残り' + (ap - used) + '回">' + dots + '</div></div><div class="panel">' +
      acts.map(function (a) {
        var v = alloc[a.id] || 0;
        return '<div class="act ' + (v ? 'on' : '') + '"><div class="info"><b>' + esc(a.n) + (a.soccer ? '<span class="tag-s soc">⚽</span>' : '') + '</b><span>' + esc(a.d) + '</span></div>' +
          '<div class="step"><button data-a="al" data-k="' + a.id + '" data-d="-1" ' + (v <= 0 ? 'disabled' : '') + ' aria-label="減らす">−</button><span class="v num">' + v + '</span>' +
          '<button data-a="al" data-k="' + a.id + '" data-d="1" ' + (used >= ap ? 'disabled' : '') + ' aria-label="増やす">＋</button></div></div>';
      }).join('') + '</div><p class="note">余った回数は「休養」になります。配分は次の半年にも引き継がれます。</p></div>';
  }
  function used0() { return Object.keys(alloc).reduce(function (t, k) { return t + (alloc[k] || 0); }, 0); }
  function goView() {
    if (isPro()) return '<div class="go two"><button class="btn btn-main" data-a="pstep">⚽ 次へ進む</button><button class="btn btn-ghost" data-a="pfast">⏩ 大事な場面まで</button></div>';
    var label = KL.apOf(S) ? 'この半年を過ごす' : 'すくすく育つ（半年後へ）';
    return '<div class="go"><button class="btn btn-main" data-a="play">' + label + '</button></div>';
  }

  // ---------- シーズン（順位表・日程） ----------
  function seasonView() {
    if (!isPro() || !S.sea) {
      var so = S.soccer;
      return '<div class="sec"><div class="sec-h"><h3>' + (KL.isStudent(S) ? esc(S.school || '学校') : 'いま') + '</h3><span>' + esc(KL.stageLabel(S)) + '</span></div><div class="panel"><p class="empty">' + (so && !so.retired ? esc(so.team || '') + 'でプレー中。プロになると、ここに順位表と日程が出ます。' : 'プロになると、ここに順位表と日程が出ます。') + '</p></div></div>' + albumMini();
    }
    var sea = S.sea, st = SE.standings(S), me = sea.club;
    var h = '<div class="sec"><div class="sec-h"><h3>' + esc(sea.special || KL.LEAGUES[sea.lg].name) + '</h3><span>' + esc(sea.label) + '</span></div><div class="table"><div class="tr th"><span>#</span><span>クラブ</span><span>試</span><span>差</span><span>点</span></div>' +
      st.map(function (x, i) { return '<div class="tr' + (x.id === me ? ' me' : '') + (i < (KL.LEAGUES[sea.lg].cl || KL.LEAGUES[sea.lg].acl || 0) ? ' up' : '') + (i >= st.length - 3 ? ' dn' : '') + '"><span>' + (i + 1) + '</span><span>' + esc(x.n) + '</span><span>' + x.p + '</span><span>' + (x.gd > 0 ? '+' : '') + x.gd + '</span><span><b>' + x.pts + '</b></span></div>'; }).join('') + '</div></div>';
    var comps = [];
    if (sea.cup) comps.push(sea.cup.name + '：' + (sea.cup.alive ? sea.cup.r[Math.min(sea.cup.i, sea.cup.r.length - 1)] + 'へ' : '敗退/終了'));
    if (sea.cont) comps.push(sea.cont.name + '：' + (sea.cont.alive ? (sea.cont.stage === 'league' ? 'リーグフェーズ（勝ち点' + sea.cont.pts + '）' : '決勝トーナメント') : '敗退/終了'));
    if (comps.length) h += '<div class="sec"><div class="panel">' + comps.map(function (c) { return '<div class="trophy"><i>🏆</i>' + esc(c) + '</div>'; }).join('') + '</div></div>';
    var fx = sea.fx.filter(function (f) { return !f.skip; }), firstOpen = fx.filter(function (f) { return !f.played; })[0];
    var shortCn = function (f) { return f.comp === 'L' ? KL.LEAGUES[sea.lg].name.replace(/リーグ$/, '') : f.comp === 'C' ? (sea.cont ? sea.cont.comp : '欧州') : f.comp === 'NT' ? '日本代表' : f.comp === 'AC' ? 'アジア杯' : f.comp === 'WC' ? 'W杯' : f.cn; };
    h += '<div class="sec"><div class="sec-h"><h3>日程・結果</h3><span>' + fx.filter(function (f) { return f.played; }).length + '/' + fx.length + '試合</span></div><div class="fxlist">' +
      fx.map(function (f) {
        var bg = !f.played ? SE.isBig(S, f) : '';
        if (bg === 'プロデビュー戦' && f !== firstOpen) bg = '';
        var res = f.played ? (f.win === true ? '<em class="w">○</em>' : f.win === false ? '<em class="l">●</em>' : '<em>△</em>') + f.gf + '-' + f.ga + (f.my && f.my.min ? '<small>' + (f.my.g ? '⚽' + f.my.g : '') + (f.my.a ? '🅰' + f.my.a : '') + ' ' + f.my.r.toFixed(1) + '</small>' : '<small>' + ((f.my && f.my.min === 0) ? '出場なし' : '') + '</small>') : '<small>' + (bg ? '🔥' + esc(bg.slice(0, 6)) : '') + '</small>';
        return '<div class="fx' + (f.played ? ' done' : '') + '"><span class="d">' + SE.fmt(f.d) + '</span><span class="c">' + esc(shortCn(f)) + '<br><small>' + esc(f.rd) + '</small></span><span class="o">' + (f.home === true ? 'H ' : f.home === false ? 'A ' : '') + esc(f.opp) + '</span><span class="r">' + res + '</span></div>';
      }).join('') + '</div></div>';
    return h;
  }

  // ---------- 記録（トロフィールーム） ----------
  function recView() {
    var h = '', so = S.soccer, R = KL.Rec;
    if (so) {
      var bn = (so.ballons || []).length;
      h += '<div class="sec"><div class="sec-h"><h3>トロフィールーム</h3><span>' + esc(SO.POS[so.pos].jp) + (so.retired ? '・引退' : '') + '</span></div>' +
        '<div class="totals"><div><small>出場</small><b class="num">' + so.totalApps + '</b></div><div><small>得点</small><b class="num">' + so.totalGoals + '</b></div><div><small>アシスト</small><b class="num">' + so.totalAst + '</b></div><div><small>代表</small><b class="num">' + so.caps + '/' + so.ntGoals + '</b></div></div>' +
        '<div class="ballon"><div class="bb"><b class="num">' + bn + '</b><small>バロンドール</small></div><div class="bl">' + ((so.ballonRanks || []).length ? so.ballonRanks.slice().reverse().map(function (x) { return '<span class="' + (x.rank === 1 ? 'gold' : '') + '">' + esc(x.season) + '：' + x.rank + '位</span>'; }).join('') : '<span>まだノミネートなし</span>') + '</div></div></div>';
      if (S.nicks && S.nicks.length) h += '<div class="sec"><div class="sec-h"><h3>異名</h3><span>呼ばれてきた名前</span></div><div class="nicks">' + S.nicks.map(function (n) { return '<span class="' + (n.n === 'GOAT' ? 'goat' : '') + '"><b>' + esc(n.n) + '</b><small>' + n.y + '年・' + esc(n.by) + '</small></span>'; }).join('') + '</div></div>';
      if (R) {
        h += '<div class="sec"><div class="sec-h"><h3>レジェンドとの比較</h3><span>2026年夏ごろの記録</span></div><div class="panel">' + R.LEGENDS.map(function (L) {
          var v = R.val(S, L.k), pct = Math.min(100, v / L.v * 100);
          return '<div class="leg"><div><b>' + esc(L.n) + '</b><small>' + esc(L.who) + '：' + L.v + L.unit + '</small></div><div class="track"><div class="fill' + (v >= L.v ? ' over' : '') + '" style="width:' + pct + '%"></div></div><span class="num">' + v + '</span></div>';
        }).join('') + '</div></div>';
        var fs = Object.keys(R.FIRSTS).filter(function (k) { return S.recs && S.recs[k]; });
        if (fs.length) h += '<div class="sec"><div class="sec-h"><h3>記録</h3><span>' + fs.length + '個</span></div><div class="panel">' + fs.map(function (k) { return '<div class="trophy"><i>📜</i>' + esc(R.FIRSTS[k].n) + '<span>' + S.recs[k].y + '年・' + S.recs[k].age + '歳</span></div>'; }).join('') + '</div></div>';
      }
      if (S.rival) {
        var rv = S.rival, hh = rv.h2h;
        h += '<div class="sec"><div class="sec-h"><h3>生涯のライバル</h3><span>' + (rv.met ? '出会い：' + esc(rv.met) : 'まだ出会っていない') + '</span></div><div class="rival"><b>' + (rv.met ? esc(rv.name) : '？？？') + '</b><span>' + esc(rv.natJp) + '・同い年' + (rv.met && rv.club ? '・' + esc(KL.clubById(rv.club).n) : '') + (rv.retired ? '・引退' : '') + '</span>' +
          (rv.met ? '<div class="rv"><div><small>対戦成績</small><b>' + hh.w + '勝' + hh.d + '分' + hh.l + '敗</b></div><div><small>通算得点</small><b>' + rv.goals + '</b></div><div><small>バロンドール</small><b>' + (rv.ballons || []).length + '</b></div></div>' : '') + '</div></div>';
      }
      var hl = R ? R.topHL(S, 12) : [];
      if (hl.length) h += '<div class="sec"><div class="sec-h"><h3>名場面集</h3><span>' + (S.hl || []).length + '場面</span></div><div class="hls">' + hl.map(function (x) { return '<div class="hl k' + esc(x.kind) + '"><small>' + x.y + '年・' + x.age + '歳</small><b>' + esc(x.title) + '</b>' + (x.text ? '<p>' + esc(x.text) + '</p>' : '') + (x.call ? '<p class="call">🎙️ ' + esc(x.call) + '</p>' : '') + '</div>'; }).join('') + '</div></div>';
      var ss = so.seasons.slice(); if (so.cur && !so.cur.closed) ss.push(so.cur);
      ss = ss.filter(function (x) { return x.apps > 0 || x.club; }).reverse();
      h += '<div class="sec"><div class="sec-h"><h3>シーズンごとの成績</h3></div>' + (ss.length ? ss.map(function (x) {
        var rt = x.rn ? (x.rs / x.rn).toFixed(2) : '-';
        var notes = (x.notes || []).filter(function (n, i, a) { return a.indexOf(n) === i; });
        return '<div class="season"><div class="season-h"><span class="y num">' + esc(x.label) + '</span><span class="tm">' + (x.num ? '#' + x.num + ' ' : '') + esc(x.team) + '（' + esc(x.lg) + '）' + (x.closed ? '' : ' 進行中') + '</span><span class="o num">OVR ' + (x.ovrEnd || SO.ovr(so)) + '</span></div>' +
          '<div class="cells"><div><small>出場</small><b class="num">' + x.apps + '</b></div><div><small>得点</small><b class="num">' + x.goals + '</b></div><div><small>アシスト</small><b class="num">' + x.ast + '</b></div><div><small>評価</small><b class="num">' + rt + '</b></div><div><small>代表</small><b class="num">' + x.ntApps + '</b></div><div><small>代表点</small><b class="num">' + x.ntGoals + '</b></div></div>' +
          (notes.length ? '<div class="notes">' + notes.map(function (n) { return '<span class="' + (/優勝|王|MVP|イレブン|賞|昇格|継承/.test(n) ? '' : 'plain') + '">' + esc(n) + '</span>'; }).join('') + '</div>' : '') + '</div>';
      }).join('') : '<p class="empty">まだ公式戦の記録はありません。</p>') + '</div>';
      if (so.numHist && so.numHist.length) h += '<div class="sec"><div class="sec-h"><h3>背番号の歴史</h3></div><div class="nicks">' + so.numHist.map(function (x) { return '<span><b>#' + x.n + '</b><small>' + esc(KL.clubById(x.club) ? KL.clubById(x.club).n : '') + '・' + x.y + '年</small></span>'; }).join('') + '</div></div>';
    }
    var tc = {}; S.titles.forEach(function (t) { tc[t.name] = (tc[t.name] || 0) + 1; });
    var tk = Object.keys(tc);
    h += '<div class="sec"><div class="sec-h"><h3>タイトル・称号</h3><span>' + S.titles.length + '</span></div><div class="panel">' +
      (tk.length ? tk.reverse().map(function (k) { return '<div class="trophy"><i>' + (/優勝|バロンドール|ワールドカップ/.test(k) ? '🏆' : '🏅') + '</i>' + esc(k) + '<span>' + (tc[k] > 1 ? '×' + tc[k] : '') + '</span></div>'; }).join('') : '<p class="empty">まだありません。これからの人生で。</p>') + '</div></div>';
    if (S.job) h += '<div class="sec"><div class="sec-h"><h3>仕事</h3><span>勤続' + S.job.years + '年</span></div><div class="panel"><div class="trophy"><i>💼</i>' + esc(S.job.name) + '・' + esc(KL.jobTitles(S)[S.job.title]) + '<span>年収' + U.yen(KL.salary(S)) + '</span></div></div></div>';
    if (!S.soccer) h += '<div class="sec"><p class="note">サッカー教室や部活でサッカー経験を積むと、少年団やサッカー部から声がかかります。</p></div>';
    return h;
  }

  // ---------- 人間関係 ----------
  function moteNote(a) { return 'モテ度は 見た目・コミュ力・' + (a < 22 ? '運動神経・学校での評判' : 'メンタル・知名度') + ' で決まります。'; }
  function profRows(n) {
    KL.ensureProfile(S, n);
    var a = KL.npcAge(S, n), rows = [
      ['見た目', (KL.lookWord(n) && !n.hero ? KL.lookWord(n) + ' ' : '') + n.vt],
      ['性格', n.pers], ['年齢', a + '歳（' + (n.ad > 0 ? n.ad + '歳上' : n.ad < 0 ? (-n.ad) + '歳下' : '同い年') + '）'],
      ['身長', n.ht + 'cm'], ['職業・学校', KL.npcJob(S, n)], ['趣味', n.hobby],
      ['好きなタイプ', KL.prefName(n.pref)], ['出会い', n.met]
    ];
    if (n.how) rows.push(['なれそめ', n.how]);
    if (n.hero) rows.push(['呼び方', '「' + KL.Hero.call(S) + '」']);
    return rows;
  }
  function relView() {
    var h = '', m = KL.mote(S), a = KL.age(S), hn = KL.Hero && KL.Hero.npc(S);
    if (hn && !hn.hidden && !S.hero.gone) {
      var d = KL.Hero.D[hn.hero], stl = KL.Hero.married(S) ? '結婚して' + Math.floor((S.t - (S.marriedT || S.t)) / 2) + '年' : KL.Hero.dating(S) ? '付き合って' + Math.floor((S.t - (S.hero.dateT || S.t)) / 2) + '年' : d.role;
      h += '<div class="sec"><div class="herocard"><img src="' + KL.Hero.face(S, hn) + '" alt="" onerror="this.remove()"><div class="hc"><small>' + esc(stl) + '</small><b>' + esc(hn.name) + '</b><p class="now">💬 ' + esc(KL.Love ? KL.Love.nowOf(S, hn) : '') + '</p><div class="like"><i style="width:' + hn.like + '%"></i></div><button class="btn btn-sm btn-ghost" data-a="who" data-id="' + hn.id + '">プロフィール</button> <button class="btn btn-sm btn-ghost" data-a="album">思い出</button></div></div></div>';
    }
    if (a >= 10) {
      h += '<div class="sec"><div class="sec-h"><h3>恋愛・交友</h3><span>' + esc(KL.moteLabel(S)) + '</span></div><div class="panel">' +
        '<div class="bar"><span class="n">モテ度</span><div class="track"><div class="fill" style="width:' + m + '%;background:#E07A95"></div></div><span class="v num">' + m + '</span></div>' +
        (KL.Life ? '<div class="trophy"><i>🌐</i>交友の層<span>' + esc(KL.Life.CIRCLE[KL.Life.circle(S)]) + '</span></div><div class="trophy"><i>📱</i>SNSのフォロワー<span>' + esc(KL.Life.fansLabel(S)) + '</span></div>' : '') +
        '<div class="totals" style="margin:8px 0"><div><small>告白された</small><b class="num">' + (S.flags.confessed || 0) + '</b></div><div><small>告白した</small><b class="num">' + (S.confessOk + S.confessNg) + '</b></div><div><small>交際人数</small><b class="num">' + (S.flags.dated || 0) + '</b></div><div><small>チョコ</small><b class="num">' + S.choc + '</b></div></div>' +
        '<p class="note" style="margin:0 0 8px">' + moteNote(a) + '</p></div></div>';
    }
    var pt = KL.partner(S);
    if (pt && !pt.hero) h += partnerCard(pt);
    var fam = S.family_members.map(function (f) { return person({ name: f.name, sex: /父|兄/.test(f.rel) ? 'm' : 'f' }, f.rel, null); });
    S.kids.forEach(function (k, i) {
      if (KL.Love) KL.Love.ensureKid(S, k, i);
      var ka = Math.floor((S.t - k.born) / 2);
      fam.push('<div class="person" data-a="kid" data-i="' + i + '" role="button"><div class="ava pic">' + avatar({ id: k.id, sex: k.sex, vt: k.vt, pers: k.pers, old: false }, 40) + '</div><div class="p"><b>' + esc(S.sei + ' ' + k.name) + '</b><span class="rel">' + (k.sex === 'm' ? '息子' : '娘') + '・' + ka + '歳</span><div style="font-size:12px;color:var(--sub)">' + esc(KL.Love ? KL.Love.kidStatus(S, k) : '') + '</div></div></div>');
    });
    if (S.flags.cat) fam.push('<div class="person"><div class="ava" style="background:var(--gold)">🐈</div><div class="p"><b>' + esc(S.flags.cat) + '</b><span class="rel">ねこ</span></div></div>');
    h += '<div class="sec"><div class="sec-h"><h3>家族</h3></div><div class="panel">' + fam.join('') + '</div></div>';
    var list = S.npcs.filter(function (n) { return n.id !== S.partnerId && n.id !== S.spouseId && !n.hidden && !(hn && n.id === hn.id); }).sort(function (x, y) { return (y.since - x.since) || (y.like - x.like); });
    var canCrush = function (n) { return !S.spouseId && !S.partnerId && a >= 10 && n.rel !== 'ex' && n.sex === 'f'; };
    h += '<div class="sec"><div class="sec-h"><h3>知り合い</h3><span>' + list.length + '人・タップで詳細</span></div><div class="panel">' +
      (list.length ? list.map(function (n) {
        var lbl = KL.relLabel(n) + (KL.roleLabel(n) ? '・' + KL.roleLabel(n) : '') + '（' + n.met + '）';
        var act = S.crushId === n.id ? '<span class="crush-mark">♥ 気になる人</span>' : canCrush(n) ? '<button class="btn btn-sm btn-ghost" data-a="crush" data-id="' + n.id + '">気になる</button>' : '';
        return person(n, lbl, n.like, act, true);
      }).join('') : '<p class="empty">まだ出会いはこれから。</p>') + '</div></div>';
    return h;
  }
  function partnerCard(pt) {
    var yrs = Math.floor((S.t - (S.spouseId ? (S.marriedT || pt.since) : pt.since)) / 2);
    return '<div class="sec"><div class="sec-h"><h3>' + (S.spouseId ? '配偶者' : '恋人') + '</h3><span>' + (S.spouseId ? '結婚して' : '付き合って') + (yrs ? yrs + '年' : '半年未満') + '</span></div>' +
      '<div class="track-card"><div class="track-head"><div class="ava pic" style="width:64px;height:64px">' + npcAvatar(pt, 64) + '</div><div class="t"><b>' + esc(pt.name) + (pt.dead ? '（故人）' : '') + '</b><span>' + esc(KL.profileLine(S, pt)) + '</span></div></div>' +
      (KL.Love && !pt.dead ? '<p class="now">💬 ' + esc(KL.Love.nowOf(S, pt)) + '</p>' : '') +
      '<dl class="kv" style="margin:8px 0 6px">' + profRows(pt).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>' +
      '<div class="bar"><span class="n">好感度</span><div class="track" style="background:#fff"><div class="fill" style="width:' + pt.like + '%;background:#E07A95"></div></div><span class="v num">' + r0(pt.like) + '</span></div></div></div>';
  }
  function person(n, rel, like, act, tap) {
    var ini = (n.name.split(' ')[1] || n.name).charAt(0);
    var face = n.id ? '<div class="ava pic">' + npcAvatar(n, 40) + '</div>' : '<div class="ava ' + (n.sex || 'm') + '">' + esc(ini) + '</div>';
    return '<div class="person">' + face + '<div class="p"' + (tap && n.id ? ' data-a="who" data-id="' + n.id + '" role="button" tabindex="0" style="cursor:pointer"' : '') + '><b>' + esc(n.name) + '</b><span class="rel">' + esc(rel) + '</span>' +
      (n.id && n.sex === 'f' && n.pers ? '<div style="font-size:11px;color:var(--sub)">' + esc(KL.profileLine(S, n)) + '</div>' : '') +
      (n.id && KL.Love && KL.npcAge(S, n) >= 18 ? '<div style="font-size:11px;color:var(--teal-d)">いま：' + esc(KL.Love.statusOf(S, n)) + '</div>' : '') +
      (like != null ? '<div class="like"><i style="width:' + like + '%"></i></div>' : '') + '</div>' + (act || '') + '</div>';
  }
  function kidSheet(i) {
    var k = S.kids[i]; if (!k) return; if (KL.Love) KL.Love.ensureKid(S, k, i);
    var ka = Math.floor((S.t - k.born) / 2);
    openSheet('<div class="ev-title"><div class="ava pic" style="width:64px;height:64px">' + avatar({ id: k.id, sex: k.sex, vt: k.vt, pers: k.pers }, 64) + '</div><h2>' + esc(S.sei + ' ' + k.name) + '<br><small style="font-size:13px;color:var(--sub);font-weight:500">' + (k.sex === 'm' ? '息子' : '娘') + '・' + ka + '歳・' + esc(k.pers) + '</small></h2></div>' +
      '<dl class="kv"><dt>いま</dt><dd>' + esc(KL.Love.kidStatus(S, k)) + '</dd><dt>才能</dt><dd>' + KL.STATS.map(function (s) { return s.n + '★' + k.tal[s.k]; }).join('　') + '</dd>' + (k.dream ? '<dt>夢</dt><dd>' + (k.dream === 'soccer' ? 'サッカー選手' : '') + '</dd>' : '') + '</dl>' +
      (k.hist && k.hist.length ? '<div class="log" style="margin-bottom:16px">' + k.hist.slice().reverse().map(function (h) { return '<div class="log-item"><small>' + h.y + '年</small><p>' + esc(h.text) + '</p></div>'; }).join('') + '</div>' : '<p class="note" style="margin-bottom:16px">まだ記録はありません。</p>') +
      '<button class="btn btn-main" data-a="closeSheet">閉じる</button>');
  }
  function whoSheet(id) {
    var n = KL.npc(S, id); if (!n) return;
    var big = n.hero ? '<img class="ev-hero" src="' + KL.Hero.face(S, n) + '" alt="" onerror="this.remove()">' : '';
    openSheet(big + '<div class="ev-title">' + (n.hero ? '' : '<div class="ava pic" style="width:64px;height:64px">' + npcAvatar(n, 64) + '</div>') + '<h2>' + esc(n.name) + '<br><small style="font-size:13px;color:var(--sub);font-weight:500">' + esc(KL.profileLine(S, n)) + '</small></h2></div>' +
      '<p class="ev-when" style="margin-bottom:10px">' + esc(n.hero ? KL.Hero.D[n.hero].role : KL.relLabel(n)) + (S.crushId === n.id ? '・♥ 気になる人' : '') + '</p>' +
      (KL.Love && !n.dead && (n.id === S.partnerId || n.id === S.spouseId || n.hero) ? '<p class="now">💬 ' + esc(KL.Love.nowOf(S, n)) + '</p>' : '') +
      '<dl class="kv">' + profRows(n).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + (KL.Love && KL.npcAge(S, n) >= 18 ? '<dt>いま</dt><dd>' + esc(KL.Love.statusOf(S, n)) + '</dd>' : '') + '<dt>好感度</dt><dd>' + r0(n.like) + ' / 100</dd></dl>' +
      (n.hist && n.hist.length ? '<div class="sec" style="margin:0 0 16px"><div class="sec-h"><h3>これまで</h3></div><div class="log">' + n.hist.slice().reverse().map(function (h) { return '<div class="log-item"><small>' + h.y + '年</small><p>' + esc(h.text) + '</p></div>'; }).join('') + '</div></div>' : '') +
      '<button class="btn btn-main" data-a="closeSheet">閉じる</button>');
  }
  function albumSheet() {
    var al = (S.album || []).slice().reverse();
    openSheet('<div class="ev-title"><i>📖</i><h2>思い出アルバム</h2></div>' + (al.length ? '<div class="album">' + al.map(function (x) { return '<div class="al">' + (x.img ? '<img src="' + x.img + '" alt="" onerror="this.remove()">' : '') + '<div><small>' + x.y + '年・' + x.age + '歳</small><b>' + esc(x.title) + '</b></div></div>'; }).join('') + '</div>' : '<p class="empty">まだ思い出はありません。</p>') + '<button class="btn btn-main" data-a="closeSheet" style="margin-top:12px">閉じる</button>');
  }
  function albumMini() { return ''; }

  // ---------- 年表 ----------
  function logView() {
    return '<div class="sec"><div class="sec-h"><h3>年表</h3><span>' + S.log.length + '件</span></div><div class="log">' +
      S.log.slice().reverse().map(function (l) { return '<div class="log-item i' + l.imp + '"><small>' + l.age + '歳・' + esc(l.p) + '</small><p>' + esc(l.text) + '</p></div>'; }).join('') + '</div></div>';
  }

  // ================= 出来事のキュー =================
  // キューを1つずつ処理する。表示が必要なものが出たら true を返す
  function pumpOne() {
    while (S._queue && S._queue.length) {
      var item = S._queue.shift();
      var inst = KL.realize(S, item);
      if (!inst) continue;
      if (inst.match) { startMatch(inst.match); return true; }
      if (inst.fx) { try { inst.fx(S); } catch (e) { if (window.console) console.warn(e); } inst.fx = null; }
      if (KL.shouldAuto(S, inst)) {
        var i = KL.autoPick(S, inst);
        if (i >= 0) { var res = inst.choices[i].fx(S) || ''; S.auto.push({ t: S.t, title: inst.title, choice: inst.choices[i].t, res: res }); if (S.auto.length > 40) S.auto.shift(); if (flow) (flow.autos = flow.autos || []).push(inst.title + '：' + inst.choices[i].t); continue; }
      }
      showEvent(inst); return true;
    }
    return false;
  }
  function pump() { if (pumpOne()) return; var d = flow && flow.done; if (d) { flow.done = null; d(); } else { closeSheet(); KL.save(S); render(); } }
  function showEvent(ev) {
    flow = flow || {};
    flow.ev = ev;
    var ch = ev.choices || [];
    var rest = S._queue ? S._queue.length : 0;
    var html = evImg(ev) + '<p class="ev-when">' + KL.age(S) + '歳・' + esc(isPro() && S.sea ? SE.fmt(S.sea.d) : KL.period(S)) + (ev.imp >= 1 ? '<span class="impt">大事な場面</span>' : '') + '</p>' +
      '<div class="ev-title"><i>' + (ev.icon || '✨') + '</i><h2>' + esc(ev.title) + '</h2></div>' +
      '<p class="ev-text">' + esc(ev.text) + '</p>' +
      (ev.people && ev.people.length ? '<div class="pcards">' + ev.people.map(function (id) { var n = KL.npc(S, id); return n ? pcard(n) : ''; }).join('') + '</div>' : '') +
      (ev.cards && ev.cards.length ? '<div class="pcards">' + ev.cards.map(infoCard).join('') + '</div>' : '');
    if (ch.length) html += '<div class="choices">' + ch.map(function (c, i) { return '<button class="choice" data-a="choose" data-i="' + i + '" ' + (c.ok === false ? 'disabled' : '') + '>' + esc(c.t) + '</button>'; }).join('') + '</div>';
    else html += '<button class="btn btn-main" data-a="evnext">' + (rest ? '次へ' : '続ける') + '</button>';
    openSheet(html);
  }
  function choose(i) {
    var ev = flow.ev, c = ev.choices[i];
    if (!c || c.ok === false) return;
    var res = '', before = S.partnerId, beforeSp = S.spouseId;
    try { res = c.fx(S) || ''; } catch (e) { console.error(e); res = 'その話は、いつの間にか立ち消えになった。'; }
    var newP = (S.partnerId && S.partnerId !== before) ? KL.npc(S, S.partnerId) : (S.spouseId && S.spouseId !== beforeSp) ? KL.npc(S, S.spouseId) : null;
    if (S._queue && S._queue.length && S._queue[0].match && /交渉/.test(res)) { }
    openSheet(evImg(ev) + '<div class="ev-title"><i>' + (ev.icon || '✨') + '</i><h2>' + esc(ev.title) + '</h2></div>' +
      '<p class="ev-text" style="color:var(--sub);font-size:14px">' + esc(c.t) + '</p><p class="result">' + esc(res) + '</p>' +
      (newP ? '<p class="note" style="margin:0 0 6px">' + (S.spouseId === newP.id ? '💍 結婚相手' : '💕 新しい恋人') + '</p><div class="pcards">' + pcard(newP) + '</div>' : '') +
      '<button class="btn btn-main" data-a="evnext">続ける</button>');
  }

  // ================= 半年の進行（学生・社会人・引退後） =================
  function play() {
    var acts = KL.getActions(S), ap = KL.apOf(S), a = {};
    acts.forEach(function (x) { if (alloc[x.id]) a[x.id] = alloc[x.id]; });
    var left = ap - Object.keys(a).reduce(function (t, k) { return t + a[k]; }, 0);
    if (left > 0 && acts.some(function (x) { return x.id === 'rest'; })) a.rest = (a.rest || 0) + left;
    flow = { mode: 'half', period: KL.period(S), age: KL.age(S), autos: [] };
    KL.runTurn(S, a);
    flow.lines = S._lines.slice();
    flow.done = finishTurn;
    pump();
  }
  function finishTurn() {
    var d = S._d || {}, sd = S._sd || {}, lines = flow.lines || [];
    var period = flow.period, age0 = flow.age, autos = flow.autos || [];
    KL.endTurn(S);
    if (S.dead) { KL.addHall(S); KL.clearSave(S.slot); closeSheet(); render(); return; }
    KL.save(S);
    var chips = [];
    KL.STATS.forEach(function (s) { var v = d[s.k] || 0; if (Math.abs(v) >= 0.5) chips.push('<span class="chip ' + (v < 0 ? 'dn' : '') + '">' + s.n + (v > 0 ? '+' : '') + r0(v) + '</span>'); });
    var skn = SO ? SO.skName : {};
    Object.keys(sd).forEach(function (k) { var v = sd[k]; if (Math.abs(v) >= 0.5) chips.push('<span class="chip sk ' + (v < 0 ? 'dn' : '') + '">' + (skn[k] || k) + (v > 0 ? '+' : '') + r0(v) + '</span>'); });
    if (S._money && Math.abs(S._money) >= 1000) chips.push('<span class="chip mo">お金' + (S._money > 0 ? '+' : '') + U.yen(S._money) + '</span>');
    var html = '<p class="ev-when">' + age0 + '歳・' + esc(period) + '</p><div class="ev-title"><i>🗓️</i><h2>この半年のまとめ</h2></div>' +
      (lines.length ? '<ul class="sum-lines">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') +
      (autos.length ? '<p class="note" style="margin:0 0 4px">おまかせで進んだこと</p><ul class="sum-lines auto">' + autos.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') +
      (chips.length ? '<div class="chips">' + chips.join('') + '</div>' : '<p class="note" style="margin-bottom:16px">大きな変化はなかった。</p>') +
      (age0 !== KL.age(S) ? '<p class="result">' + KL.age(S) + '歳になった。' + esc(KL.stageLabel(S)) + '</p>' : '') +
      '<button class="btn btn-main" data-a="sumclose">次へ</button>';
    flow = null;
    openSheet(html);
  }
  // 半年の区切りのあと：プロになったら試合ごとの進行へ
  function afterHalf() {
    closeSheet();
    if (S.stage === 'pro' && S.soccer && (S.soccer.club || S.soccer.pending) && !S.soccer.retired) {
      SE.halfStart(S); KL.save(S);
      flow = { mode: 'pro', autos: [], done: function () { flow = null; closeSheet(); KL.save(S); render(); window.scrollTo(0, 0); } };
      render(); pump(); return;
    }
    render(); window.scrollTo(0, 0);
  }

  // ================= プロ：1試合ずつ =================
  function pstep(fast) {
    flow = { mode: 'pro', fast: fast, autos: [], results: [], n: 0 };
    proLoop();
  }
  function proLoop() {
    var f = flow;
    for (var guard = 0; guard < 120; guard++) {
      var r = SE.next(S);
      if (r.type === 'queue') { f.done = function () { if (f.fast) proLoop(); else proEnd(); }; pump(); return; }
      if (r.type === 'match') { f.done = function () { if (f.fast) proLoop(); else proEnd(); }; startMatch(r.ctx); return; }
      if (r.type === 'auto') {
        f.results.push(r);
        if (r.out) f.results[f.results.length - 1].outTxt = r.out;
        if (S._queue && S._queue.length) { f.done = function () { if (f.fast) proLoop(); else proEnd(); }; pump(); return; }
        if (!f.fast) { proEnd(); return; }
        continue;
      }
      if (r.type === 'halfEnd') { halfEnd(); return; }
    }
    proEnd();
  }
  function proEnd() {
    var f = flow; KL.save(S);
    if (f && f.results && f.results.length) {
      var rs = f.results;
      var html = '<div class="ev-title"><i>⚽</i><h2>' + (rs.length === 1 ? '試合結果' : '試合結果（' + rs.length + '試合）') + '</h2></div><div class="fxres">' + rs.map(function (r) {
        var fx = r.fx, my = fx.my || {};
        return '<div class="fr ' + (fx.win === true ? 'w' : fx.win === false ? 'l' : 'd') + '"><small>' + SE.fmt(fx.d) + '・' + esc(fx.cn) + ' ' + esc(fx.rd) + '</small><b>' + esc(fx.nt ? '日本' : SO.club(S).n) + ' ' + fx.gf + '-' + fx.ga + ' ' + esc(fx.opp) + (fx.pk ? '（PK' + fx.pk.gf + '-' + fx.pk.ga + '）' : '') + '</b><p>' + (my.min ? (my.g ? '⚽' + my.g + ' ' : '') + (my.a ? '🅰' + my.a + ' ' : '') + '採点' + my.r.toFixed(1) + (fx.mom ? ' ⭐MOM' : '') + '・' + my.min + '分出場' : esc(r.sel && r.sel.why ? r.sel.why : '出場なし')) + '</p>' + (r.outTxt ? '<p class="o">' + esc(r.outTxt) + '</p>' : '') + '</div>';
      }).join('') + '</div>' + ((f.autos || []).length ? '<p class="note">おまかせで進んだこと：' + esc(f.autos.join('／')) + '</p>' : '') + '<button class="btn btn-main" data-a="closeHome" style="margin-top:14px">ホームへ</button>';
      flow = null; openSheet(html); render(); return;
    }
    flow = null; closeSheet(); render();
  }
  function halfEnd() {
    var age0 = KL.age(S), label = KL.isB(S) ? KL.seasonLabel(S) + 'シーズン終了' : '前半戦終了';
    var lines = SE.halfEnd(S);
    var f = flow; f.halfLines = lines; f.label = label; f.age0 = age0;
    f.done = function () { halfSummary(); };
    pump();
  }
  function halfSummary() {
    var f = flow, lines = f.halfLines || [], autos = f.autos || [], age0 = f.age0;
    KL.endTurn(S);
    if (S.dead) { KL.addHall(S); KL.clearSave(S.slot); closeSheet(); render(); return; }
    KL.save(S);
    var sd = S._sd || {}, chips = [];
    Object.keys(sd).forEach(function (k) { var v = sd[k]; if (Math.abs(v) >= 0.5) chips.push('<span class="chip sk ' + (v < 0 ? 'dn' : '') + '">' + (SO.skName[k] || k) + (v > 0 ? '+' : '') + r0(v) + '</span>'); });
    var html = '<div class="ev-title"><i>🗓️</i><h2>' + esc(f.label) + '</h2></div>' +
      (lines.length ? '<ul class="sum-lines">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') +
      (autos.length ? '<p class="note" style="margin:0 0 4px">おまかせで進んだこと</p><ul class="sum-lines auto">' + autos.slice(-12).map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') +
      (chips.length ? '<div class="chips">' + chips.join('') + '</div>' : '') +
      (age0 !== KL.age(S) ? '<p class="result">' + KL.age(S) + '歳になった。</p>' : '') +
      '<button class="btn btn-main" data-a="sumclose">次へ</button>';
    S._sd = {};
    flow = null; openSheet(html);
  }

  // ================= 試合画面 =================
  function startMatch(ctx) {
    MS = { ctx: ctx, m: M.begin(S, ctx), stage: 'pre', out: null };
    renderMatch();
  }
  function scoreboard() {
    var m = MS.m, ctx = MS.ctx;
    return '<div class="sb"><small>' + esc(ctx.title) + '</small><div class="sbr"><span>' + esc(ctx.my) + '</span><b class="num">' + m.gf + ' - ' + m.ga + '</b><span>' + esc(ctx.opp) + '</span></div><em>' + (MS.stage === 'end' ? '試合終了' : m.min ? m.min + '分' : 'キックオフ前') + '</em></div>';
  }
  function logHtml(n) { var L = MS.m.log.slice(-(n || 7)); return '<div class="mlog">' + L.map(function (l) { return '<p class="' + (/^⚽/.test(l) ? 'g' : /^😣/.test(l) ? 'x' : /^✨/.test(l) ? 't' : '') + '">' + esc(l) + '</p>'; }).join('') + '</div>'; }
  function renderMatch() {
    var m = MS.m, h = scoreboard();
    if (MS.stage === 'pre') {
      h += logHtml(4) + '<p class="ev-text" style="margin-top:8px">監督の指示は？</p><div class="choices">' + M.TACTICS.map(function (t) { return '<button class="choice" data-a="mtac" data-k="' + t.k + '">' + esc(t.n) + '<small>' + esc(t.d) + '</small></button>'; }).join('') + '</div>';
    } else if (MS.stage === 'phase') {
      var ph = MS.ph;
      h += logHtml(5) + '<div class="phase"><p>' + esc(ph.text) + '</p></div><div class="choices">' + ph.opts.map(function (o, i) { return '<button class="choice' + (o.tech ? ' techopt' : '') + '" data-a="mopt" data-i="' + i + '">' + esc(o.t) + '<small>' + o.ks.map(function (k) { return SO.skName[k] || k; }).join('・') + '</small></button>'; }).join('') + '</div>';
    } else if (MS.stage === 'res') {
      h += logHtml(7) + '<button class="btn btn-main" data-a="mnext">続ける</button>';
    } else if (MS.stage === 'end') {
      var res = MS.res, my = res.my;
      h += logHtml(6) + '<div class="mend ' + (res.win === true ? 'w' : res.win === false ? 'l' : 'd') + '"><b>' + (res.win === true ? '勝利' : res.win === false ? '敗戦' : '引き分け') + '</b><div class="mstats"><div><small>採点</small><b class="num">' + my.r.toFixed(1) + '</b></div><div><small>得点</small><b class="num">' + my.g + '</b></div><div><small>アシスト</small><b class="num">' + my.a + '</b></div><div><small>MOM</small><b>' + (res.mom ? '⭐' : '-') + '</b></div></div>' + (MS.out ? '<p class="result">' + esc(MS.out) + '</p>' : '') + '</div>' +
        (MS.press ? '' : '<p class="ev-text">試合後の記者会見。ひとこと。</p><div class="choices">' + M.PRESS.map(function (p, i) { return '<button class="choice" data-a="mpress" data-i="' + i + '">' + esc(p.t) + '</button>'; }).join('') + '</div>');
      if (MS.press) h += '<p class="result">' + esc(MS.press) + '</p><button class="btn btn-main" data-a="mdone">続ける</button>';
    }
    openSheet('<div class="match">' + h + '</div>');
    var lg = sheetBody.querySelector('.mlog'); if (lg) lg.scrollTop = lg.scrollHeight;
  }
  function mNext() {
    var ph = M.next(S, MS.m);
    if (!ph) return mFinish();
    MS.ph = ph; MS.stage = 'phase'; renderMatch();
  }
  function mFinish() {
    var ctx = MS.ctx, res = M.finish(S, MS.m);
    res.lastCall = MS.m.lastCall;
    MS.res = res;
    var out = '';
    try { if (ctx.fx) out = SE.record(S, ctx.fx, res, ctx); else if (ctx.onEnd) out = ctx.onEnd(S, res) || ''; } catch (e) { console.error(e); }
    if (!ctx.fx && KL.Rec && res.my.g && S.soccer) KL.Rec.addHL(S, { title: ctx.title + ' vs ' + ctx.opp, text: res.my.g + 'ゴール。' + (res.win ? '勝利。' : ''), call: res.lastCall || '', kind: ctx.final ? 'final' : 'goal', big: !!ctx.final });
    MS.out = out; MS.stage = 'end'; renderMatch();
  }
  function mPress(i) {
    var p = M.PRESS[i]; ST.apply(S, p.fx);
    MS.press = ST.say(S, 'press_' + p.k, {
      humble: ['記者たちは「優等生だ」と笑った。チームメイトがSNSでそのコメントを引用していた。', '翌日の見出しは「謙虚なエース」。', '監督が満足そうにうなずいていた。'],
      bold: ['「ビッグマウス」の見出しが躍った。でも、ファンは喜んでいた。', 'その強気なコメントが、海外でも話題になった。', '記者が一斉にペンを走らせた。'],
      fans: ['サポーターのSNSが、そのコメントで埋め尽くされた。', 'ゴール裏のチャントが、いつまでも鳴りやまなかった。', 'クラブの公式アカウントが、そのコメントを拡散した。']
    }[p.k]);
    renderMatch();
  }
  function mDone() { MS = null; KL.save(S); pump(); }

  // ================= 結果（人生のおわり） =================
  function resultView() {
    var r = KL.lifeScore(S), p = KL.perception(S);
    var so = S.soccer, sp = KL.npc(S, S.spouseId);
    var kv = [['生まれ', S.pref + '・' + KL.familyOf(S).name], ['才能', (S.gift ? '「' + S.gift.n + '」 ' : '') + KL.STATS.map(function (s) { return s.n + '★' + S.tal[s.k]; }).join(' ')], ['享年', S.deathAge + '歳（' + S.deathYear + '年）'], ['最後の印象', '「' + p.main + '」']];
    if (so && (so.totalApps || so.proYears)) kv.push(['サッカー', '通算' + so.totalApps + '試合' + so.totalGoals + '得点' + so.totalAst + 'アシスト・代表' + so.caps + '試合' + so.ntGoals + '得点' + ((so.ballons || []).length ? '・バロンドール' + so.ballons.length + '回' : '')]);
    if (S.rival && S.rival.met) kv.push(['生涯のライバル', S.rival.name + '（' + S.rival.natJp + '）・対戦' + S.rival.h2h.w + '勝' + S.rival.h2h.d + '分' + S.rival.h2h.l + '敗']);
    if (S.nicks && S.nicks.length) kv.push(['異名', S.nicks.map(function (n) { return n.n; }).join(' → ')]);
    if (S.job) kv.push(['仕事', S.job.name + '・' + KL.jobTitles(S)[S.job.title]]);
    kv.push(['家族', (sp ? sp.name + 'と結婚' : '独身') + (S.kids.length ? '・子ども' + S.kids.length + '人' : '') + (S.flags.mago ? '・孫' + S.flags.mago + '人' : '')]);
    kv.push(['遺した財産', U.yen(S.money)]);
    var hl = KL.Rec ? KL.Rec.topHL(S, 10) : [];
    app.innerHTML = '<div class="result-screen"><p class="ending">' + esc(S.sei + ' ' + S.mei) + 'の人生</p><h1>' + esc(KL.lifeTitle(S)) + '</h1>' +
      (sp && sp.hero ? '<img class="ev-hero" src="' + KL.Hero.img(S, 'base') + '" alt="" onerror="this.remove()">' : '') +
      '<div class="rank"><div class="r ' + r.rank.toLowerCase().replace('+', '') + '">' + r.rank + '</div><p>人生スコア<b class="num">' + r.score + '</b>獲得タイトル ' + S.titles.length + '個</p></div>' +
      '<dl class="kv">' + kv.map(function (x) { return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>' +
      (hl.length ? '<div class="sec" style="margin:0 0 20px"><div class="sec-h"><h3>キャリア名場面ベスト10</h3></div><div class="hls">' + hl.map(function (x, i) { return '<div class="hl k' + esc(x.kind) + '"><small>' + (i + 1) + '．' + x.y + '年・' + x.age + '歳</small><b>' + esc(x.title) + '</b>' + (x.call ? '<p class="call">🎙️ ' + esc(x.call) + '</p>' : '') + '</div>'; }).join('') + '</div></div>' : '') +
      '<div class="sec" style="margin:0 0 20px"><div class="sec-h"><h3>年表（ハイライト）</h3></div><div class="log">' + S.log.filter(function (l) { return l.imp >= 2; }).map(function (l) { return '<div class="log-item i' + l.imp + '"><small>' + l.age + '歳</small><p>' + esc(l.text) + '</p></div>'; }).join('') + '</div></div>' +
      '<button class="btn btn-main" data-a="newAfter">新しい人生をはじめる</button><button class="btn btn-line" style="margin-top:10px" data-a="toTitle">タイトルへ</button></div>';
  }

  // ================= メニュー・設定 =================
  function seg(name, cur, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button data-a="cfg" data-k="' + name + '" data-v="' + o[0] + '" class="' + (cur === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  function menu() {
    var c = S.cfg;
    openSheet('<div class="ev-title"><i>≡</i><h2>メニュー</h2></div>' +
      '<div class="field"><label>遊ぶ試合の量</label>' + seg('play', c.play, [['more', '多め'], ['std', '標準'], ['less', '少なめ']]) + '</div>' +
      '<div class="field"><label>おまかせの範囲</label>' + seg('auto', c.auto, [['manual', '全部自分で'], ['std', '大事な場面だけ'], ['all', '全部おまかせ']]) + '<p class="note">「大事な場面だけ」は、ふだんの場面を方針に沿って自動で選びます。告白・移籍・引退などはいつも自分で選びます。</p></div>' +
      '<div class="field"><label>月ごとの練習方針</label>' + seg('train', c.train, [['ask', '毎月選ぶ'], ['auto', 'おまかせ']]) + '</div>' +
      '<div class="menu-list">' +
      '<button class="btn btn-ghost" data-a="closeSheet">閉じる</button>' +
      '<button class="btn btn-line" data-a="toTitle">タイトルに戻る（自動で保存済み）</button>' +
      '<button class="btn btn-line" style="color:var(--red)" data-a="abandon">この人生を終えて、最初からやり直す</button>' +
      '</div><p class="note" style="margin-top:14px">セーブ' + S.slot + 'に保存されます。データはこの端末のブラウザに保存されます。</p>');
  }
  function focusSheet() {
    var so = S.soccer, cur = S.focus || 'auto';
    openSheet('<div class="ev-title"><i>🏋️</i><h2>練習の方針</h2></div><p class="ev-text">月が変わるたびに、この方針で鍛えます。</p><div class="choices">' +
      SO.FOCUS.filter(function (f) { return (f.k !== 'gk' || so.pos === 'GK') && ((f.k !== 'sht' && f.k !== 'dri') || so.pos !== 'GK'); }).map(function (f) { return '<button class="choice' + (f.k === cur ? ' on' : '') + '" data-a="setFocus" data-k="' + f.k + '">' + esc(f.n) + '<small>' + esc(f.d) + '</small></button>'; }).join('') + '</div>');
  }
  function policySheet() {
    var cur = S.policy || 'balance';
    openSheet('<div class="ev-title"><i>🧭</i><h2>おまかせの方針</h2></div><p class="ev-text">おまかせで進む場面を、どちら寄りで選ぶか。</p><div class="choices">' +
      [['soccer', 'サッカー優先', '練習・試合・評価を大事にする'], ['balance', 'バランス', 'どちらも大事に'], ['life', '私生活優先', '恋人・家族・友達との時間を大事にする']].map(function (p) { return '<button class="choice' + (p[0] === cur ? ' on' : '') + '" data-a="setPolicy" data-k="' + p[0] + '">' + p[1] + '<small>' + p[2] + '</small></button>'; }).join('') + '</div>');
  }

  // ================= 操作 =================
  var A = {
    'new': function (d) { newSetup(+d.s || 1); gachaView(); window.scrollTo(0, 0); },
    'continue': function (d) { S = KL.load(+d.s || 1); if (!S) { title(); return; } alloc = {}; tab = 'home'; flow = null; render(); },
    delslot: function (d) { if (confirm('セーブ' + d.s + 'を削除しますか？')) { KL.clearSave(+d.s); title(); } },
    toTitle: function () { closeSheet(); S = null; flow = null; MS = null; title(); window.scrollTo(0, 0); },
    reroll: function () { setup.family = rollFamily(); setup.last = ''; gachaView(); },
    pull: function (d) { pull(d.k); },
    pullAll: function () { KL.STATS.forEach(function (s) { setup.tal[s.k] = KL.gacha(); }); setup.pulls += 7; setup.last = ''; gachaView(); },
    start: startLife,
    tab: function (d) { tab = d.v; render(); window.scrollTo(0, 0); },
    al: function (d) {
      var ap = KL.apOf(S), k = d.k, v = alloc[k] || 0;
      if (+d.d > 0 && used0() < ap) alloc[k] = v + 1;
      if (+d.d < 0 && v > 0) alloc[k] = v - 1;
      var y = window.scrollY; render(); window.scrollTo(0, y);
    },
    play: play,
    pstep: function () { pstep(false); },
    pfast: function () { pstep(true); },
    choose: function (d) { choose(+d.i); },
    evnext: function () { pump(); },
    sumclose: afterHalf,
    closeHome: function () { closeSheet(); render(); },
    menu: menu,
    cfg: function (d) { S.cfg[d.k] = d.v; KL.save(S); menu(); },
    focusSheet: focusSheet, policySheet: policySheet,
    setFocus: function (d) { S.focus = d.k; KL.save(S); closeSheet(); render(); },
    setPolicy: function (d) { S.policy = d.k; KL.save(S); closeSheet(); render(); },
    closeSheet: closeSheet,
    abandon: function () { if (confirm('この人生を終わりにして、新しい人生を始めますか？（今のデータは消えます）')) { var sl = S.slot; KL.clearSave(sl); closeSheet(); S = null; newSetup(sl); gachaView(); } },
    who: function (d) { whoSheet(+d.id); },
    kid: function (d) { kidSheet(+d.i); },
    album: albumSheet,
    crush: function (d) { S.crushId = +d.id; KL.save(S); var y = window.scrollY; render(); window.scrollTo(0, y); },
    newAfter: function () { var sl = S.slot; S = null; newSetup(sl); gachaView(); window.scrollTo(0, 0); },
    mtac: function (d) { M.setTac(MS.m, d.k); mNext(); },
    mopt: function (d) { M.choose(S, MS.m, +d.i); MS.stage = 'res'; renderMatch(); },
    mnext: mNext,
    mpress: function (d) { mPress(+d.i); },
    mdone: mDone
  };
  function onClick(e) {
    var b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    var f = A[b.dataset.a]; if (f) { try { f(b.dataset); } catch (err) { console.error(err); if (window.__klErr) { window.__klErr.push('エラー：' + err.message); } } }
  }
  app.addEventListener('click', onClick);
  sheetBody.addEventListener('click', onClick);
  KL.UI = { get S() { return S; }, A: A };

  try { if (KL.Hero) KL.Hero.patch(); title(); KL.uiReady = true; } catch (e) { window.__klErr && window.__klErr.push('エラー：' + e.message + '（タイトル画面）'); if (window.__klShow) window.__klShow(); }
})();
