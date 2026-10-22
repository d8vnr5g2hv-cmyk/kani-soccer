/* Kani Life - 記録・異名・生涯のライバル・名場面・周りの反響 */
(function () {
  'use strict';
  var KL = window.KL, U = KL.U, SO = KL.Soccer, ST = KL.Story;
  var R = KL.Rec = {};

  // ======================================================
  //  レジェンドの記録（比較用）
  //  ※数字は2026年夏ごろの目安。変わったらここを直すだけで反映されます
  // ======================================================
  R.LEGENDS = [
    { k: 'ballon', n: 'バロンドール', v: 8, who: 'メッシ', unit: '回' },
    { k: 'ballon', n: 'バロンドール', v: 5, who: 'C・ロナウド', unit: '回' },
    { k: 'goals', n: '通算得点（クラブ＋代表）', v: 976, who: 'C・ロナウド（2026年7月時点）', unit: '点' },
    { k: 'goals', n: '通算得点（クラブ＋代表）', v: 906, who: 'メッシ（2026年5月時点）', unit: '点' },
    { k: 'club', n: '1クラブでの得点', v: 672, who: 'メッシ（バルセロナ）', unit: '点' },
    { k: 'cl', n: 'CL通算得点', v: 140, who: 'C・ロナウド', unit: '点' },
    { k: 'cl', n: 'CL通算得点', v: 129, who: 'メッシ', unit: '点' },
    { k: 'nt', n: '代表通算得点', v: 146, who: 'C・ロナウド（2026年夏時点の目安）', unit: '点' },
    { k: 'nt', n: '代表通算得点', v: 75, who: '釜本邦茂（日本代表の歴代最多）', unit: '点' },
    { k: 'caps', n: '日本代表 出場', v: 152, who: '遠藤保仁（歴代最多）', unit: '試合' },
    { k: 'season', n: 'リーグ戦 1シーズン得点', v: 50, who: 'メッシ（2011-12 ラ・リーガ）', unit: '点' }
  ];
  R.val = function (S, k) {
    var so = S.soccer; if (!so) return 0;
    if (k === 'ballon') return (so.ballons || []).length;
    if (k === 'goals') return so.totalGoals + so.ntGoals;
    if (k === 'club') { var m = 0; for (var c in (so.clubGoals || {})) m = Math.max(m, so.clubGoals[c]); return m; }
    if (k === 'cl') return so.clGoals || 0;
    if (k === 'nt') return so.ntGoals;
    if (k === 'caps') return so.caps;
    if (k === 'season') return Math.max(so.cur ? so.cur.lgG || 0 : 0, (so.seasons || []).reduce(function (m, x) { return Math.max(m, x.lgG || 0); }, 0));
    return 0;
  };
  // 記録を超えたらニュースにする
  R.checkLegends = function (S) {
    S.recs = S.recs || {};
    R.LEGENDS.forEach(function (L, i) {
      var key = 'leg' + i; if (S.recs[key]) return;
      var v = R.val(S, L.k);
      if (v > L.v || (L.k === 'ballon' && v >= L.v)) {
        S.recs[key] = { y: KL.year(S), age: KL.age(S) };
        var tie = L.k === 'ballon' && v === L.v;
        var t = tie ? L.who + 'の' + L.n + L.v + L.unit + 'に並んだ' : L.who + 'の' + L.n + '（' + L.v + L.unit + '）を超えた';
        ST.headline(S, S.sei + '、' + t, 3);
        KL.log(S, t + '。', 2);
        KL.push(S, { id: 'legend', cat: 'soccer', imp: 1, title: tie ? '伝説に並ぶ' : '歴史を塗り替える', icon: '📜', text: t + '。\n\n' + ST.say(S, 'legend_tx', ['記者会見の最初の質問は、そのことだった。「実感はまだありません」と答えた。', 'スタジアムの大型ビジョンに、その数字が映し出された。総立ちの拍手がしばらく鳴りやまなかった。', '世界中のサッカーメディアが、同じ見出しを打った。', 'ロッカールームに戻ると、チームメイトが記念の横断幕を用意していた。', '試合後、相手チームの選手までが握手を求めてきた。']), choices: [] });
        R.addHL(S, { title: t, text: '', kind: 'record' });
      }
    });
  };

  // ======================================================
  //  最年少・日本人初の記録
  // ======================================================
  R.FIRSTS = {
    ntYoung: { n: '日本代表 史上最年少出場', check: function (S) { return S.soccer.caps >= 1 && KL.age(S) <= 17; } },
    ntGoalYoung: { n: '日本代表 史上最年少ゴール', check: function (S) { return S.soccer.ntGoals >= 1 && KL.age(S) <= 18; } },
    ballonYoung: { n: '史上最年少バロンドール', check: function (S) { return (S.soccer.ballons || []).length >= 1 && KL.age(S) <= 20; } },
    ballonJp: { n: '日本人初のバロンドール', check: function (S) { return (S.soccer.ballons || []).length >= 1; } },
    topJp: { n: '日本人初の5大リーグ得点王', check: function (S) { return S.soccer.trophies.some(function (t) { return /(プレミアリーグ|ラ・リーガ|セリエA|ブンデスリーガ|リーグ・アン)得点王/.test(t.name); }); } },
    clTopJp: { n: '日本人初のチャンピオンズリーグ制覇（主力として）', check: function (S) { return S.soccer.trophies.some(function (t) { return /チャンピオンズリーグ優勝/.test(t.name); }); } },
    wcJp: { n: '日本をW杯優勝に導いた', check: function (S) { return !!S.soccer.wcWin; } },
    goal100: { n: '通算100ゴール', check: function (S) { return R.val(S, 'goals') >= 100; } },
    goal300: { n: '通算300ゴール', check: function (S) { return R.val(S, 'goals') >= 300; } },
    goal500: { n: '通算500ゴール', check: function (S) { return R.val(S, 'goals') >= 500; } },
    goal700: { n: '通算700ゴール', check: function (S) { return R.val(S, 'goals') >= 700; } },
    goal1000: { n: '通算1000ゴール', check: function (S) { return R.val(S, 'goals') >= 1000; } }
  };
  R.checkFirsts = function (S) {
    S.recs = S.recs || {};
    Object.keys(R.FIRSTS).forEach(function (k) {
      if (S.recs[k]) return; var f = R.FIRSTS[k], ok = false; try { ok = f.check(S); } catch (e) { ok = false; }
      if (!ok) return;
      S.recs[k] = { y: KL.year(S), age: KL.age(S) };
      KL.title(S, f.n); KL.log(S, f.n + '（' + KL.age(S) + '歳）。', 2);
      ST.headline(S, f.n + '――' + S.sei + ' ' + S.mei + '（' + KL.age(S) + '歳）', 2);
      if (/^goal/.test(k)) R.addHL(S, { title: f.n, text: KL.age(S) + '歳で到達。', kind: 'record' });
    });
  };

  // ======================================================
  //  メディアがつける異名（GOATが最高）
  // ======================================================
  R.NICKS = [
    { k: 'kid', n: function (S) { return S.pref + 'の神童'; }, c: function (S, so) { return KL.age(S) <= 16 && so && SO.ovr(so) - SO.E(KL.age(S)) >= 10; } },
    { k: 'wasei', n: function (S) { var so = S.soccer; return '和製' + (so.pos === 'ST' ? (so.sk.phy >= 80 ? 'ハーランド' : 'レヴァンドフスキ') : so.pos === 'WG' ? (S.tal.art >= 5 ? 'メッシ' : 'エムバペ') : so.pos === 'OM' ? 'デ・ブライネ' : so.pos === 'CM' ? 'モドリッチ' : so.pos === 'DM' ? 'ロドリ' : so.pos === 'GK' ? 'ノイアー' : 'ファン・ダイク'); }, c: function (S, so) { return so && so.club && SO.ovr(so) >= 82 && KL.age(S) <= 23; } },
    { k: 'gem', n: function (S) { return SO.club(S).n + 'の至宝'; }, c: function (S, so) { return so && so.club && KL.age(S) <= 22 && so.seasons.some(function (x) { return x.club === so.club && (x.rating || 0) >= 7.2; }); } },
    { k: 'jpgem', n: function () { return '日本の至宝'; }, c: function (S, so) { return so && so.caps >= 10 && KL.age(S) <= 25; } },
    { k: 'monster', n: function (S) { return KL.LEAGUES[SO.club(S).l].name + 'の怪物'; }, c: function (S, so) { return so && so.club && !KL.LEAGUES[SO.club(S).l].japan && so.seasons.some(function (x) { return x.goals >= 30; }); } },
    { k: 'king', n: function () { return 'フットボールの王'; }, c: function (S, so) { return so && (so.ballons || []).length >= 1; } },
    { k: 'legend', n: function () { return '生ける伝説'; }, c: function (S, so) { return so && ((so.ballons || []).length >= 3 || (so.wcWin && (so.ballons || []).length >= 1)); } },
    { k: 'goat', n: function () { return 'GOAT'; }, c: function (S, so) { var b = so ? (so.ballons || []).length : 0; return b >= 9 || (b >= 8 && so.wcWin) || (b >= 6 && so.wcWin && R.val(S, 'goals') >= 800); } }
  ];
  R.checkNicks = function (S) {
    var so = S.soccer; S.nicks = S.nicks || []; S.recs = S.recs || {};
    R.NICKS.forEach(function (x) {
      if (S.recs['nick_' + x.k]) return; var ok = false; try { ok = x.c(S, so); } catch (e) { ok = false; }
      if (!ok) return;
      var n = x.n(S); S.recs['nick_' + x.k] = 1;
      S.nicks.push({ n: n, y: KL.year(S), by: 'メディア' });
      KL.log(S, '「' + n + '」と呼ばれるようになった。', x.k === 'goat' ? 3 : 1);
      ST.headline(S, '「' + n + '」' + S.sei + ' ' + S.mei, x.k === 'goat' ? 4 : 2);
      KL.push(S, { id: 'nick_' + x.k, cat: 'soccer', imp: 1, title: x.k === 'goat' ? '史上最高の選手' : '新しい異名', icon: x.k === 'goat' ? '🐐' : '📰',
        text: x.k === 'goat' ? '世界中のメディアが、ついにその言葉を使い始めた。\n\n「GOAT」――Greatest Of All Time。\n\nサッカーの歴史上、最も偉大な選手。議論はもう終わった、と誰かが書いた。' : 'スポーツ紙の見出しに、新しい呼び名が躍った。\n\n「' + n + '」\n\n' + ST.say(S, 'nick_tx', ['照れくさいけど、悪くない響きだ。', 'チームメイトにさっそくいじられた。', '母が切り抜きをスクラップしているらしい。', 'SNSのトレンドに、その呼び名が上がっていた。']), choices: [] });
    });
  };
  R.nick = function (S) { var n = S.nicks && S.nicks[S.nicks.length - 1]; return n ? n.n : ''; };

  // ======================================================
  //  生涯のライバル（同い年の海外の天才）
  // ======================================================
  R.NATS = [{ jp: 'ブラジル', c: ['rma', 'fcb', 'psg'] }, { jp: 'アルゼンチン', c: ['fcb', 'mci', 'int'] }, { jp: 'フランス', c: ['psg', 'rma', 'bay'] }, { jp: 'スペイン', c: ['fcb', 'rma', 'atm'] }, { jp: 'イングランド', c: ['mci', 'liv', 'ars'] }, { jp: 'ドイツ', c: ['bay', 'bvb', 'b04'] }, { jp: 'ポルトガル', c: ['mun', 'psg', 'che'] }, { jp: 'オランダ', c: ['liv', 'ars', 'bay'] }];
  R.initRival = function (S) {
    if (S.rival) return;
    var nat = U.pick(R.NATS), g = S.gift && S.gift.id;
    var peak = g === 'god' || g === 'chosen' ? 92 : g === 'prodigy' ? 91 : U.ri(89, 91);
    S.rival = { name: U.pick(KL.NAMES.fFirst) + '・' + U.pick(KL.NAMES.fLast), natJp: nat.jp, homeClubs: nat.c, pos: U.pick(['WG', 'ST', 'OM']), peak: peak, ovr: 50, club: null, seasons: [], ballons: [], goals: 0, h2h: { w: 0, d: 0, l: 0 }, met: '', lastLgG: 0 };
  };
  R.rivalOvr = function (S) { var rv = S.rival, a = KL.age(S); var o = rv.peak - Math.max(0, 24 - a) * 2.3 - Math.max(0, a - 31) * 2.2; return Math.round(U.clamp(o, 40, 92)); };
  R.rivalYear = function (S) {
    var rv = S.rival; if (!rv) return; var a = KL.age(S), y = KL.seasonStart(S);
    if (rv.lastY === y) return; rv.lastY = y;
    rv.ovr = R.rivalOvr(S);
    if (a < 17) return;
    if (a >= 36) { if (!rv.retired) { rv.retired = true; KL.Love && S.news && S.news.push({ t: S.t, text: '生涯のライバル、' + rv.name + 'が現役引退を発表した', imp: 1 }); } return; }
    // 所属クラブ
    var top = KL.CLUBS.filter(function (c) { return KL.LEAGUES[c.l].europe && c.s >= rv.ovr - 3 && c.s <= rv.ovr + 2; });
    if (!rv.club) rv.club = U.pick(rv.homeClubs);
    else if (U.chance(0.18) && top.length) rv.club = U.pick(top).id;
    if (rv.ovr >= 88 && KL.clubById(rv.club).s < 85) rv.club = U.pick(KL.CLUBS.filter(function (c) { return c.s >= 86; })).id;
    var games = 48, f = Math.exp((rv.ovr - 80) / 13), gr = Math.min(1.05, SO.POS[rv.pos].g * f * 1.3);
    var g = Math.round(games * gr * U.rf(0.75, 1.15)), as = Math.round(games * SO.POS[rv.pos].a * f * U.rf(0.6, 1.1));
    var cs = KL.clubById(rv.club).s, cl = cs >= 86 && U.chance((cs - 82) / 25), lgw = U.chance((cs - 80) / 18);
    var rating = 6.6 + (rv.ovr - 80) * 0.07 + U.gauss() * 0.15;
    var score = (rv.ovr - 80) * 1.2 + g * 0.6 + as * 0.3 + (rating - 6.8) * 8 + (cl ? 17 : 0) + (lgw ? 8 : 0) + U.gauss() * 3;
    rv.goals += g; rv.lastLgG = Math.round(g * 0.62);
    rv.seasons.push({ y: y, club: rv.club, ovr: rv.ovr, g: g, a: as, cl: cl, lg: lgw, score: Math.round(score) });
    rv.cur = { score: score, g: g, cl: cl, y: y };
  };
  R.rivalMeet = function (S, where) { if (S.rival && !S.rival.met) { S.rival.met = where; KL.log(S, '生涯のライバル、' + S.rival.name + '（' + S.rival.natJp + '）と出会った。', 1); } };
  R.rivalH2H = function (S, r) { var h = S.rival && S.rival.h2h; if (!h) return; if (r > 0) h.w++; else if (r < 0) h.l++; else h.d++; };

  // ======================================================
  //  バロンドール（TOP10）
  // ======================================================
  // ほかのスター選手の1シーズン（自分と同じ物差しで点数化）
  // 得点・アシストの評価（多いほど伸びが鈍る）
  R.goalPts = function (g, a) { return 34 * (1 - Math.exp(-g / 38)) + 9 * (1 - Math.exp(-a / 20)); };
  R.starScore = function (p) {
    var ovr = p.ovr, pos = SO.POS[p.pos] ? p.pos : 'ST', pw = SO.POS[pos], c = KL.clubById(p.club), cs = c ? c.s : 82;
    var f = Math.exp((ovr - 79) / 12), g = pw.g * f * (0.55 + ovr / 115), a = pw.a * f * (0.6 + ovr / 125);
    g = 0.92 * (1 - Math.exp(-g / 0.92)); a = 0.5 * (1 - Math.exp(-a / 0.5));
    var apps = 46 * U.rf(0.8, 1.05), goals = Math.round(g * apps * U.rf(0.8, 1.2)), ast = Math.round(a * apps * U.rf(0.8, 1.2));
    var rating = 6.55 + (ovr - 80) * 0.07 + goals / apps * 0.6 + U.gauss() * 0.12;
    var att = ['ST', 'WG', 'OM'].indexOf(pos) >= 0;
    var sc = (ovr - 80) * 1.2 + (att ? R.goalPts(goals, ast) : R.goalPts(goals * 1.6, ast * 1.5)) + (rating - 6.8) * 5.5 + (pos === 'GK' ? 10 : pos === 'CB' || pos === 'DM' ? 6 : 0);
    if (U.chance(U.sig((cs - 85) / 2) * 0.6)) sc += 6;
    if (cs >= 85 && U.chance((cs - 83) / 22)) sc += 14;
    return sc + U.gauss() * 3;
  };
  R.ballonEvent = function (S) {
    var so = S.soccer, bp = so.ballonPending; if (!bp) return;
    so.ballonPending = null;
    var stars = SO.worldStars(S).filter(function (p) { return !S.rival || p.name !== S.rival.name; }).slice(0, 14);
    var wcNat = bp.wc === 'other' || (!bp.wc && /-(31|35|39|43|47|51)$/.test(bp.season)) ? U.pick(['ARG', 'FRA', 'ESP', 'ENG', 'BRA', 'GER', 'POR', 'NED']) : '', wcGiven = false;
    var list = stars.map(function (p) { var sc = R.starScore(p); if (wcNat && !wcGiven && p.nat === wcNat) { sc += 18; wcGiven = true; } return { name: p.name, club: KL.clubById(p.club) ? KL.clubById(p.club).n : '', sc: sc }; });
    if (S.rival && S.rival.cur && !S.rival.retired) list.push({ name: S.rival.name, club: KL.clubById(S.rival.club).n, sc: S.rival.cur.score, rival: true });
    // 連続受賞は「またか」と票が割れる
    var rk = (so.ballonRanks || []), streak = 0; for (var q = rk.length - 1; q >= 0 && rk[q].rank === 1; q--) streak++;
    list.push({ name: S.sei + ' ' + S.mei, club: bp.club, sc: bp.score - [0, 9, 16, 22, 26][Math.min(4, streak)], me: true });
    list.sort(function (a, b) { return b.sc - a.sc; });
    var rank = list.findIndex(function (x) { return x.me; }) + 1;
    var top = list.slice(0, 10);
    var rvRank = S.rival ? list.findIndex(function (x) { return x.rival; }) + 1 : 0;
    if (S.rival && rvRank) S.rival.ballons = S.rival.ballons || [], rvRank === 1 && S.rival.ballons.push(bp.season);
    so.ballonRanks = so.ballonRanks || []; so.ballonRanks.push({ season: bp.season, rank: rank, rv: rvRank });
    so.ballonBest = Math.min(so.ballonBest || 99, rank);
    var txt = bp.season + 'シーズンのバロンドール。パリの授賞式。\n\n' + top.map(function (x, i) { return (i + 1) + '位 ' + x.name + (x.me ? '（あなた）' : x.rival ? '（ライバル）' : '') + '｜' + x.club; }).join('\n') + (rank > 10 ? '\n…\n' + rank + '位 ' + S.sei + ' ' + S.mei : '');
    if (rank === 1) {
      so.ballon = true; so.ballons = so.ballons || []; so.ballons.push(bp.season);
      var n = so.ballons.length;
      SO.trophy(S, 'バロンドール受賞');
      KL.repAdd(S, 'nat', 30);
      var imp = ST.impact(S, 80, { times: n });
      txt += '\n\n' + (n === 1 ? '名前が呼ばれた瞬間、会場が大きく揺れた。日本人で初めての、世界最高の選手。' : n === 8 ? '8度目。メッシに並んだ。もう誰も、この選手を比べる言葉を持っていない。' : n >= 9 ? n + '度目。サッカーの歴史で、誰も到達したことのない場所にいる。' : n + '度目の受賞。') + '\n\n' + R.reactText(S, 'ballon', imp);
      ST.pushMessages(S, 'ballon');
      R.addHL(S, { title: (n === 1 ? '' : n + '度目の') + 'バロンドール受賞（' + bp.season + '）', text: '', kind: 'ballon' });
    } else {
      KL.title(S, 'バロンドール' + rank + '位');
      txt += '\n\n' + (rank <= 3 ? '表彰台。世界の頂点の背中が、手の届くところにある。' : rank <= 10 ? 'トップ10入り。世界が名前を覚え始めた。' : 'ノミネートされただけでも、大きな一歩だ。');
    }
    if (rvRank && rvRank < rank && rvRank <= 3) txt += '\n\n' + S.rival.name + 'が' + rvRank + '位。また、あいつに先を越された。';
    if (rvRank && rank < rvRank && rank <= 3) txt += '\n\n' + S.rival.name + 'は' + rvRank + '位。今年は、こっちの勝ちだ。';
    KL.push(S, { id: 'ballon', cat: 'soccer', imp: 1, title: 'バロンドール発表', icon: '🥇', text: txt, choices: [] });
    R.checkLegends(S); R.checkFirsts(S); R.checkNicks(S);
  };

  // ======================================================
  //  実況の名ゼリフ
  // ======================================================
  R.CALLS = {
    normal: ['「決めたー！ {mei}！」', '「見事！ これが{mei}です！」', '「ゴォォォル！ {sei}！」', '「冷静！ 完璧なフィニッシュ！」', '「スタジアムが揺れています！」', '「待ってました、この男！」'],
    big: ['「決めたーーー！ {mei}！ {mei}！ この舞台で、この男がやってくれましたー！」', '「信じられない！ 歴史に残るゴールだー！」', '「{mei}！ {mei}！ 日本中が、いま、叫んでいます！」', '「この瞬間のために、彼はボールを蹴ってきたのかもしれません！」', '「ゴォォォォル！！ 夢じゃない、これは夢じゃない！」'],
    tech: ['「なんだ今のは！ {t}！ 世界が目撃しました！」', '「{t}！ こんなプレー、ゲームの中でしか見たことがない！」', '「魔法です！ {t}から、そのまま決めたー！」', '「ありえない！ {t}で相手をあざ笑うかのように！」'],
    legend: ['「神は、ここにいた――！」', '「これが{nickq}です！ 説明は、もういらない！」', '「サッカーの歴史が、いま書き換えられました！」']
  };
  R.goalCall = function (S, m, tech) {
    var ctx = m.ctx, big = ctx.final || ctx.comp === 'WC' || (ctx.big && /決勝|ダービー|クラシコ|優勝/.test(ctx.stakes || ''));
    var key = tech && tech.legend ? 'legend' : tech ? 'tech' : big ? 'big' : 'normal';
    var s = ST.pick(S, 'call_' + key, R.CALLS[key]).replace('{t}', tech ? tech.n : '').replace('{nickq}', R.nick(S) ? '「' + R.nick(S) + '」' : S.sei);
    m.lastCall = KL.fill(S, s);
    return m.lastCall;
  };

  // ======================================================
  //  名場面集
  // ======================================================
  R.addHL = function (S, h) {
    S.hl = S.hl || [];
    h.y = h.y || KL.year(S); h.age = h.age === undefined ? KL.age(S) : h.age;
    S.hl.push(h); if (S.hl.length > 80) S.hl.shift();
  };
  R.topHL = function (S, n) {
    var w = function (h) { return (h.kind === 'ballon' ? 9 : h.kind === 'final' ? 8 : h.kind === 'wc' ? 8 : h.kind === 'legend' ? 9 : h.kind === 'record' ? 6 : h.kind === 'tech' ? 5 : 4) + (h.big ? 2 : 0); };
    return (S.hl || []).slice().sort(function (a, b) { return w(b) - w(a) || a.y - b.y; }).slice(0, n || 10);
  };

  // ======================================================
  //  試合のあと
  // ======================================================
  R.afterMatch = function (S, fx, res, ctx) {
    var so = S.soccer, my = res.my;
    if (S.rival && fx.oppId && S.rival.club === fx.oppId && my.min > 0) { R.rivalH2H(S, res.win === true ? 1 : res.win === false ? -1 : 0); if (!S.rival.met) R.rivalMeet(S, fx.cn); }
    if (S.rival && fx.nt && fx.opp.indexOf(S.rival.natJp) === 0 && my.min > 0) R.rivalH2H(S, res.win === true ? 1 : res.win === false ? -1 : 0);
    // 名場面
    if (my.g > 0 && (res.played || my.g >= 3)) {
      var gl = (res.goalsLog || []);
      var tech = gl.filter(function (g) { return g.tech; })[0];
      var kind = fx.final ? 'final' : fx.comp === 'WC' ? 'wc' : tech ? 'tech' : my.g >= 3 ? 'hat' : 'goal';
      if (res.played || my.g >= 3) R.addHL(S, { title: fx.cn + ' ' + fx.rd + ' vs ' + fx.opp, text: (my.g >= 3 ? 'ハットトリック' + (my.g > 3 ? '（' + my.g + '得点）' : '') + '。' : '') + (tech ? '【' + tech.tech + '】からのゴール。' : '') + (gl.length ? gl.map(function (g) { return g.min + '分'; }).join('・') + 'にゴール。' : '') + (res.win ? '試合は' + res.gf + '-' + res.ga + 'で勝利。' : ''), call: res.played && my.g ? (KL.Match && res.lastCall) || '' : '', kind: kind, big: !!fx.final || fx.comp === 'WC' });
    }
    if (fx.final && res.win && my.min > 0) R.addHL(S, { title: fx.cn + ' 優勝', text: fx.opp + 'との決勝を制した。' + (my.g ? '自分も' + my.g + 'ゴール。' : ''), kind: 'final', big: true });
    // 年代別最年少など・通算記録
    if (my.g || fx.nt) { R.checkFirsts(S); R.checkLegends(S); }
    // 初ゴール・デビュー
    if (my.min > 0 && !fx.nt && so.proApps === 1) { R.debut(S, fx, res); }
    if (my.g > 0 && !fx.nt && !S.recs.firstGoal) { S.recs.firstGoal = { y: KL.year(S), age: KL.age(S) }; ST.pushMessages(S, 'firstgoal'); KL.log(S, 'プロ初ゴール（' + fx.opp + '戦）。', 2); R.addHL(S, { title: 'プロ初ゴール', text: fx.cn + ' ' + fx.rd + ' vs ' + fx.opp + '。', kind: 'goal' }); }
    if (fx.nt && my.min > 0 && so.caps === 1) { KL.log(S, '日本代表デビュー（' + fx.opp + '戦）。', 2); R.addHL(S, { title: '日本代表デビュー', text: fx.opp + '戦。背番号' + (so.ntNum || '') + '。', kind: 'goal' }); }
  };
  R.debut = function (S, fx, res) {
    var c = SO.club(S), imp = ST.impact(S, 30, { club: c, first: true });
    KL.log(S, 'プロデビュー（' + fx.opp + '戦）。', 2);
    KL.push(S, { id: 'debut', cat: 'soccer', imp: 1, title: 'プロデビュー', icon: '✨', text: fx.cn + '・' + fx.opp + '戦。\nついにプロのピッチに立った。' + (res.my.g ? 'しかも、デビュー戦でゴール！' : '') + '\n\n' + R.reactText(S, 'debut', imp), choices: [] });
    ST.pushMessages(S, 'debut');
  };

  // ======================================================
  //  周りの反響（出来事の大きさで変わる）
  // ======================================================
  var RX = {
    join: {
      1: ['何人かから「おめでとう」と連絡が来た。', '地元の友達のグループLINEが、少しだけ盛り上がった。'],
      2: ['学校の掲示板に「祝・プロ契約」の貼り紙が出た。廊下を歩くと、知らない後輩にまで声をかけられる。', '地元の新聞に小さく名前が載った。近所の人が切り抜きを持って家に来たらしい。', '同級生のSNSが、その話題で埋まった。'],
      3: ['夕方のニュースで名前が流れた。「{age}歳で{club}へ」。日本中が、この名前を知った。', 'スポーツ紙の一面。駅の売店で、自分の顔が並んでいた。', '学校の正門に報道陣が集まった。先生が対応に追われている。'],
      4: ['世界中のサッカーメディアが速報を打った。「日本から、{age}歳の{nickq}が{club}へ」。', 'ヨーロッパのサッカーファンが、こぞって過去の映像を掘り起こし始めた。SNSのトレンド世界1位。', '日本のテレビは、どのチャンネルもこのニュース一色になった。']
    },
    nt: {
      1: ['家族のグループLINEが鳴りやまない。'],
      2: ['地元の商店街に「祝・日本代表」の横断幕がかかった。', '昔のチームメイトから、次々にメッセージが届く。'],
      3: ['「{age}歳の招集」。ニュース番組が特集を組んだ。', 'サッカーファンの間では「ついに来た」とお祭り騒ぎになった。'],
      4: ['海外メディアまでが「日本の{nickq}、ついに代表へ」と報じた。']
    },
    wc: { 1: ['地元で応援の準備が始まった。'], 2: ['母校でパブリックビューイングの企画が立ち上がった。'], 3: ['日本中の期待が、背中にのしかかる。'], 4: ['世界が、日本の{nickq}を見るためにチャンネルを合わせる。'] },
    title: { 1: ['サポーターが朝まで歌っていた。'], 2: ['街がクラブカラーに染まった。'], 3: ['日本中のニュースがこの話題で持ちきりになった。'], 4: ['世界中のメディアが、このシーズンの主役として名前を挙げた。'] },
    ballon: { 1: ['もう誰も、驚かなくなってきた。それ自体が、とんでもないことだ。'], 2: ['日本中が祝福ムードに包まれた。'], 3: ['号外が配られた。街頭のビジョンに、自分の顔が映っている。', '首相までがコメントを出した。'], 4: ['日本中が泣いた。号外、特番、街頭インタビュー。「歴史が変わった日」。', '世界中のサッカー少年が、明日から{mei}の真似をするだろう。'] },
    debut: { 1: ['見に来てくれた家族が、スタンドで手を振っていた。'], 2: ['地元のテレビ局がデビュー戦を取り上げた。'], 3: ['「{age}歳でデビュー」。ネットニュースのトップに名前が載った。'], 4: ['世界中のスカウトが、そのデビュー戦の映像を見ていた。'] },
    ten: { 1: ['チームメイトに「似合わねー」と笑われた。'], 2: ['サポーターがさっそく背番号入りのタオルを掲げていた。'], 3: ['「10番」のユニフォームが、発売初日で完売した。'], 4: ['世界中のショップで、そのユニフォームが売り切れた。'] }
  };
  var USED = {
    join: ['「また移籍か」くらいの反応。慣れたものだ。', 'ニュースにはなったが、もう誰も驚かない。それだけの選手になった。'],
    ballon: ['「もう恒例行事だな」と、記者が笑った。', '受賞の瞬間より、「あと何回取るのか」が話題になった。']
  };
  R.reactText = function (S, kind, imp, times) {
    var lv = ST.level(imp), pool = RX[kind] || RX.title, arr = [];
    for (var l = lv; l >= 1 && arr.length < 3; l--) { if (pool[l]) arr.push(ST.say(S, 'rx_' + kind + l, pool[l])); }
    var so = S.soccer;
    var t = arr.join('\n');
    return t.replace('{age}', KL.age(S)).replace('{club}', so && so.club ? SO.club(S).n : '').replace(/\{nickq\}/g, R.nick(S) ? '「' + R.nick(S) + '」' : '天才');
  };
  R.onJoin = function (S, c, prev, first) {
    var a = KL.age(S), times = (S.soccer.clubHist || []).length;
    var imp = ST.impact(S, first ? 26 : 16, { club: c, times: first ? 1 : Math.max(1, times - 1) });
    ST.headline(S, (first ? a + '歳の' + S.sei + '、' + c.n + 'とプロ契約' : S.sei + '、' + c.n + 'へ移籍'), ST.level(imp));
    var txt = (first ? c.n + 'とのプロ契約が正式に発表された。' : c.n + 'への移籍が正式に発表された。') + '\n\n' + R.reactText(S, 'join', imp);
    if (!first && times >= 3 && imp < 50) txt += '\n' + ST.say(S, 'rx_join_used', USED.join);
    KL.push(S, { id: 'join_react', cat: 'soccer', imp: 0, title: first ? 'プロ契約の反響' : '移籍の反響', icon: '📣', text: txt, choices: [] });
    ST.pushMessages(S, first ? 'join' : 'transfer');
  };
  R.onTen = function (S) {
    var c = SO.club(S), imp = ST.impact(S, 30, { club: c });
    KL.push(S, { id: 'ten_react', cat: 'soccer', imp: 0, title: c.n + 'の10番', icon: '👕', text: c.n + 'の「10番」。クラブの歴史を背負う番号だ。\n\n' + R.reactText(S, 'ten', imp), choices: [] });
    R.addHL(S, { title: c.n + 'の10番を背負う', text: KL.age(S) + '歳。', kind: 'record' });
  };
  R.onWC = function (S, r, wc) {
    if (r >= 6) { R.addHL(S, { title: wc.name + ' 優勝', text: '日本が世界の頂点に立った。自分は' + wc.goals + '得点。', kind: 'wc', big: true }); ST.pushMessages(S, 'title', null, '📱 日本中から'); }
    R.checkNicks(S);
  };

  // ======================================================
  //  シーズンの終わり・半年ごと
  // ======================================================
  R.seasonEnd = function (S, cu) {
    R.checkLegends(S); R.checkFirsts(S); R.checkNicks(S);
  };
  R.half = function (S) {
    if (!S.rival) R.initRival(S);
    if (KL.isB(S)) R.rivalYear(S);
    if (S.soccer && !S.soccer.club) R.checkNicks(S);
  };

  // ======================================================
  //  引退セレモニー
  // ======================================================
  R.retireCeremony = function (S) {
    var so = S.soccer, top = R.topHL(S, 3);
    var txt = '引退試合。スタジアムは満員だった。\n\n通算' + so.totalApps + '試合' + so.totalGoals + '得点' + so.totalAst + 'アシスト。日本代表' + so.caps + '試合' + so.ntGoals + '得点。' + ((so.ballons || []).length ? '\nバロンドール' + so.ballons.length + '回。' : '') +
      (top.length ? '\n\n大型ビジョンに、名場面が流れた。\n' + top.map(function (h) { return '・' + h.title; }).join('\n') : '') +
      (S.rival ? '\n\n客席に、' + S.rival.name + 'の姿があった。対戦成績は' + S.rival.h2h.w + '勝' + S.rival.h2h.d + '分' + S.rival.h2h.l + '敗。' : '') +
      '\n\n最後に、センターサークルでスパイクを脱いだ。';
    KL.push(S, { id: 'ceremony', cat: 'soccer', imp: 1, title: '引退試合', icon: '🌅', text: txt, choices: [] });
  };

  // ======================================================
  //  代表のチームメイト（実在の日本人選手）
  // ======================================================
  R.ntMates = function (S) {
    var jp = SO.realActive(S).filter(function (p) { return p.nat === 'JPN' && p.pos !== 'GK'; }).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 8).map(function (p) { return p.name; });
    return jp.length ? jp : ['キャプテン', '10番', '右サイドの味方'];
  };

  // ---------- 人生の称号（GOATなど） ----------
  var oldTitle = KL.lifeTitle;
  KL.lifeTitle = function (S) {
    var so = S.soccer, b = so ? (so.ballons || []).length : 0;
    if (S.recs && S.recs.nick_goat) return 'GOAT――史上最高の選手';
    if (b >= 5) return 'バロンドール' + b + '回の伝説';
    if (b >= 1 && so.wcWin) return 'W杯とバロンドールを手にした男';
    if (b >= 1) return 'バロンドーラー';
    return oldTitle(S);
  };
  var oldScore = KL.lifeScore;
  KL.lifeScore = function (S) {
    var r = oldScore(S), so = S.soccer;
    if (so) { var add = (so.ballons || []).length * 25 + (so.wcWin ? 30 : 0) + (S.recs && S.recs.nick_goat ? 60 : 0); r.score += add; var sc = r.score; r.rank = sc >= 320 ? 'SSS' : sc >= 260 ? 'SS+' : sc >= 210 ? 'SS' : sc >= 150 ? 'S' : sc >= 100 ? 'A' : sc >= 65 ? 'B' : sc >= 40 ? 'C' : 'D'; }
    return r;
  };
  // 周りの見る目に異名を足す
  var oldPer = SO.perception;
  SO.perception = function (S) {
    var p = oldPer(S), so = S.soccer, n = R.nick(S);
    if (so && n && n !== (S.gift && S.gift.n)) { p.tags = (p.tags || []).slice(); p.tags.unshift('「' + n + '」'); }
    if (so && (so.ballons || []).length >= 2 && !so.retired) p.main = 'バロンドール' + so.ballons.length + '回の、世界最高の選手';
    if (S.recs && S.recs.nick_goat) p.main = (so.retired ? '史上最高のサッカー選手だった人' : '史上最高のサッカー選手');
    return p;
  };
  KL.PH.nickq = function (S) { return R.nick(S) ? '「' + R.nick(S) + '」' : S.sei; };
})();
