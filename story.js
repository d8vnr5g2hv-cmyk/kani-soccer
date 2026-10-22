/* Kani Life - 物語の道具箱
   ・同じ文章をくり返さない（使い切るまで重複なし）
   ・{mei} などの差し込み
   ・出来事の大きさ（インパクト）
   ・場面を短く書くための形式（KL.sc） */
(function () {
  'use strict';
  var KL = window.KL, U = KL.U;
  var ST = KL.Story = {};

  // ---------- 使い切るまで重複なし ----------
  // key ごとに使った番号を覚えておき、全部使ったらリセット
  ST.pick = function (S, key, arr) {
    if (!arr || !arr.length) return '';
    S.used = S.used || {};
    var used = S.used[key] || [];
    if (used.length >= arr.length) used = [];
    var free = []; for (var i = 0; i < arr.length; i++) if (used.indexOf(i) < 0) free.push(i);
    var k = free[Math.floor(Math.random() * free.length)];
    used.push(k); S.used[key] = used;
    var v = arr[k];
    return typeof v === 'function' ? v(S) : v;
  };
  // 文章を差し込みつきで取り出す
  ST.say = function (S, key, arr) { return KL.fill(S, ST.pick(S, key, arr)); };

  // ---------- 差し込み ----------
  function first(n) { return n ? (n.name.split(' ')[1] || n.name) : ''; }
  ST.first = first;
  var PH = KL.PH;
  PH.kun = function () { return 'くん'; };
  PH.club = function (S) { var so = S.soccer; return so && so.club ? KL.Soccer.club(S).n : (so && so.team) || 'チーム'; };
  PH.lg = function (S) { var so = S.soccer; return so && so.club ? KL.LEAGUES[KL.Soccer.club(S).l].name : ''; };
  PH.num = function (S) { return S.soccer && S.soccer.num ? S.soccer.num : ''; };
  PH.pos = function (S) { return S.soccer ? KL.Soccer.POS[S.soccer.pos].jp : ''; };
  PH.school = function (S) { return S.school || '学校'; };
  PH.city = function (S) { var so = S.soccer; if (so && so.club) { var c = KL.Soccer.club(S); return KL.CITY && KL.CITY[c.id] || KL.LEAGUES[c.l].country; } return S.pref; };
  PH.partner = function (S) { return first(KL.partner(S)) || '恋人'; };
  PH.best = function (S) { var b = S.npcs.filter(function (n) { return n.rel === 'best'; })[0] || S.npcs.filter(function (n) { return n.rel === 'friend' || n.rel === 'oldfriend'; }).slice(-1)[0]; return b ? first(b) : '友達'; };
  PH.mom = function (S) { return '母'; };
  PH.dad = function (S) { return '父'; };
  PH.coach = function (S) { var so = S.soccer; return so && so.coach ? so.coach.name : '監督'; };
  PH.mate = function (S) { var t = S.soccer && S.soccer.club ? KL.Soccer.teammates(S) : []; return t.length ? U.pick(t).name : U.pick(['キャプテン', 'ベテランの先輩', '同期の選手']); };
  PH.mate2 = function (S) { var t = S.soccer && S.soccer.club ? KL.Soccer.teammates(S) : []; return t.length > 1 ? t[1].name : 'エース'; };
  PH.agent = function (S) { return S.agent ? S.agent.name : '代理人'; };
  PH.rival = function (S) { return S.rival ? S.rival.name : 'ライバル'; };
  PH.nick = function (S) { var n = S.nicks && S.nicks[S.nicks.length - 1]; return n ? n.n : ''; };
  PH.age = function (S) { return KL.age(S); };
  PH.year = function (S) { return KL.year(S); };
  PH.fans = function (S) { return KL.Life ? KL.Life.fansLabel(S) : ''; };

  // ---------- インパクト（出来事の大きさ） ----------
  // 0〜100。年齢が若いほど・クラブの格が高いほど・珍しいほど大きい
  ST.clubTier = function (c) { if (!c) return 0; return c.s >= 86 ? 5 : c.s >= 80 ? 4 : KL.LEAGUES[c.l].europe ? 3 : c.l === 'J1' ? 2 : 1; };
  ST.impact = function (S, base, opt) {
    opt = opt || {};
    var a = KL.age(S), v = base;
    if (a <= 17) v += 22; else if (a <= 19) v += 14; else if (a <= 21) v += 6;
    if (opt.club) v += ST.clubTier(opt.club) * 7;
    if (opt.first) v += 10;
    if (opt.times && opt.times > 1) v -= Math.min(30, (opt.times - 1) * 9); // 慣れ
    return U.clamp(Math.round(v), 0, 100);
  };
  ST.level = function (imp) { return imp >= 80 ? 4 : imp >= 58 ? 3 : imp >= 35 ? 2 : 1; };

  // ---------- 場面を短く書く形式 ----------
  // KL.sc(id, opts, title, icon, text, choices)
  //  opts: cat / w / cond / imp / max / cool / sched / pri / img / hero
  //  choices: [ [ラベル, 効果, 結果の文章 or 関数, 方針タグ] ]
  //  効果: { trust, ego, form, fat, care, men, com, look, int, ath, hp, art, money, nat, loc, sch, fans, like:{who,v}, sk:{sht:1}, flag:'x' }
  ST.apply = function (S, fx) {
    if (!fx) return;
    var so = S.soccer;
    if (fx.trust && so) so.trust = U.clamp((so.trust || 50) + fx.trust, 0, 100);
    if (fx.ego) S.ego = U.clamp((S.ego || 0) + fx.ego, 0, 100);
    if (fx.form) S.form = U.clamp((S.form || 0) + fx.form, -10, 10);
    if (fx.fat) KL.fatAdd(S, fx.fat);
    if (fx.care) S.care = U.clamp((S.care || 50) + fx.care, 0, 100);
    ['men', 'com', 'look', 'int', 'ath', 'hp', 'art'].forEach(function (k) { if (fx[k]) KL.add(S, k, fx[k]); });
    if (fx.money) KL.moneyAdd(S, fx.money);
    if (fx.nat) KL.repAdd(S, 'nat', fx.nat);
    if (fx.loc) KL.repAdd(S, 'loc', fx.loc);
    if (fx.sch) KL.repAdd(S, 'sch', fx.sch);
    if (fx.fans && KL.Life) KL.Life.addFans(S, fx.fans);
    if (fx.sk && so) Object.keys(fx.sk).forEach(function (k) { KL.Soccer.skAdd(S, k, fx.sk[k]); });
    if (fx.like) { var arr = fx.like.length ? fx.like : [fx.like]; arr.forEach(function (l) { var n = ST.who(S, l.who); if (n) KL.likeAdd(n, l.who === 'hero' && l.v > 0 && KL.Hero && KL.Hero.likeMul ? Math.round(l.v * KL.Hero.likeMul(S)) : l.v); }); }
    if (fx.hero && KL.Hero) KL.Hero.aff(S, fx.hero);
    if (fx.flag) S.flags[fx.flag] = (S.flags[fx.flag] || 0) + 1;
    if (fx.team && so) so.teamRel = U.clamp((so.teamRel || 50) + fx.team, 0, 100);
    if (fx.apt && so) KL.Soccer.aptAdd(S, fx.apt[0], fx.apt[1]);
  };
  ST.who = function (S, w) {
    if (w === 'partner') return KL.partner(S);
    if (w === 'best') return S.npcs.filter(function (n) { return n.rel === 'best'; })[0] || S.npcs.filter(function (n) { return n.rel === 'friend' || n.rel === 'oldfriend'; }).slice(-1)[0];
    if (w === 'mate') return S.npcs.filter(function (n) { return n.rel === 'teammate'; }).slice(-1)[0];
    if (w === 'hero') return KL.Hero ? KL.Hero.npc(S) : null;
    return null;
  };
  KL.sc = function (id, o, title, icon, text, choices) {
    o = o || {};
    var ev = {
      id: id, cat: o.cat || 'life', w: o.w === undefined ? 1 : o.w, sched: o.sched, pri: o.pri, repeat: o.repeat, max: o.max, cool: o.cool, imp: o.imp === undefined ? 0 : o.imp, img: o.img, hero: o.hero,
      cond: o.cond || function () { return true; }, title: title, icon: icon || '✨',
      text: typeof text === 'function' ? text : function (S) { return KL.fill(S, Array.isArray(text) ? ST.pick(S, 'tx_' + id, text) : text); },
      people: o.people, cards: o.cards,
      choices: (choices || []).map(function (c) {
        return {
          t: c[0], pol: c[3], req: c[4], aw: c[5],
          fx: function (S) {
            ST.apply(S, typeof c[1] === 'function' ? c[1](S) : c[1]);
            var r = typeof c[2] === 'function' ? c[2](S) : Array.isArray(c[2]) ? ST.pick(S, 'rs_' + id + c[0], c[2]) : c[2];
            return KL.fill(S, r || '');
          }
        };
      })
    };
    if (o.fx) ev.fx = o.fx;
    (KL.EVENTS = KL.EVENTS || []).push(ev);
    return ev;
  };
  // 既存の出来事を差し替える
  KL.replaceEvent = function (ev) { KL.EVENTS = (KL.EVENTS || []).filter(function (e) { return e.id !== ev.id; }); KL.EVENTS.push(ev); return ev; };
  KL.OFF = KL.OFF || {};
  KL.disable = function (ids) { ids.forEach(function (id) { KL.OFF[id] = true; }); };

  // ---------- 節目のメッセージ（恋人・家族・親友から） ----------
  // kind: join / debut / firstgoal / title / nt / ballon / injury / transfer
  ST.messages = function (S, kind, info) {
    var out = [], pt = KL.partner(S), best = ST.who(S, 'best');
    var M = {
      join: ['{club}って……ほんまに？ おめでとう！', 'ニュースで見た。体には気をつけてね', '{club}のユニフォーム、似合ってる'],
      debut: ['デビューおめでとう。テレビの前で叫んだ', '緊張してたやろ。顔に出てた', 'スタジアムで見てたよ。泣いた'],
      firstgoal: ['初ゴール！！ 録画、100回は見る', 'あのゴール、一生忘れへん', 'ほんまに点取りよった……'],
      title: ['優勝おめでとう！ 今日は好きなもの食べてな', 'トロフィー持ってる姿、かっこよかった', 'ずっと頑張ってたもんな'],
      nt: ['日本代表やって。家族LINEが大騒ぎや', '代表のユニフォーム、楽しみにしてる', '昔からいつか呼ばれると思ってた'],
      ballon: ['世界一って……言葉が出えへん', 'バロンドール、おめでとう。誇りに思う', '小さい頃からボール離さんかったもんな'],
      injury: ['大丈夫？ 何かできることあったら言って', '焦らんでいい。待ってる', 'ちゃんと寝て、ちゃんと食べてな'],
      transfer: ['新しい街でも、応援してる', '寂しくなるけど、行っておいで', '向こうでもご飯ちゃんと食べてな']
    };
    var pool = M[kind] || M.title;
    if (pt && !pt.dead) out.push({ who: first(pt) + '（' + (S.spouseId ? '配偶者' : '恋人') + '）', text: KL.Hero && pt.hero ? KL.Hero.msg(S, pt, kind) : ST.say(S, 'msgp_' + kind, pool) });
    out.push({ who: '母', text: ST.say(S, 'msgm_' + kind, ['おめでとう。お父さんも嬉しそうよ', 'ちゃんとご飯食べてる？ おめでとう', '近所の人がみんな知ってたわ。おめでとう', '体だけは大事にしなさいね', '昔の写真、引っ張り出して見てたの']) });
    if (best) out.push({ who: first(best) + '（親友）', text: ST.say(S, 'msgb_' + kind, ['やばすぎ。今度おごれよ', '地元で自慢しまくってる', 'お前が友達でよかったわ（照）', 'まじで誇り。飲み行こ', 'スクショして待ち受けにした']) });
    return out;
  };
  ST.pushMessages = function (S, kind, info, title) {
    var ms = ST.messages(S, kind, info);
    S.msgs = S.msgs || []; S.msgs.push({ t: S.t, kind: kind, list: ms }); if (S.msgs.length > 30) S.msgs.shift();
    KL.push(S, { id: 'msg_' + kind, cat: 'life', imp: 0, title: title || '📱 届いたメッセージ', icon: '📱', text: ms.map(function (m) { return m.who + '「' + KL.fill(S, m.text) + '」'; }).join('\n\n'), choices: [] });
  };

  // ---------- ニュースの見出し ----------
  ST.headline = function (S, text, imp) {
    S.heads = S.heads || []; S.heads.push({ t: S.t, y: KL.year(S), text: text, imp: imp || 0 }); if (S.heads.length > 60) S.heads.shift();
  };
})();
