/* Kani Life - プロのシーズン（1試合ごとに進む）
   日付 d は「シーズン開始年の8月1日」からの日数（0〜364）
   前半（8〜1月）= d < 184 / 後半（2〜7月）= d >= 184 */
(function () {
  'use strict';
  var KL = window.KL, U = KL.U, SO = KL.Soccer, M = KL.Match, ST = KL.Story;
  var SE = KL.Season = {};

  // ---------- 日付 ----------
  var ML = [31, 30, 31, 30, 31, 31, 28, 31, 30, 31, 30, 31], MN = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7];
  SE.md = function (d) { var m = 0; while (m < 11 && d >= ML[m]) { d -= ML[m]; m++; } return { mi: m, m: MN[m], day: d + 1 }; };
  SE.fmt = function (d) { var x = SE.md(d); return x.m + '/' + x.day; };
  SE.HALF = 184;
  SE.range = function (S) { return KL.isB(S) ? [SE.HALF, 365] : [0, SE.HALF]; };
  SE.active = function (S) { return S.stage === 'pro' && S.soccer && S.soccer.club && !S.soccer.retired; };
  function line(S, t) { if (S.sea) { S.sea.lines = S.sea.lines || []; S.sea.lines.push(t); } else KL.line(S, t); }
  SE.line = line;

  // ---------- データ ----------
  SE.CUP = { PL: 'FAカップ', LL: 'コパ・デル・レイ', SA: 'コッパ・イタリア', BL: 'DFBポカール', L1: 'クープ・ドゥ・フランス', J1: '天皇杯', J2: '天皇杯', J3: '天皇杯' };
  SE.DERBY = [['ars', 'tot', 'ノースロンドン・ダービー'], ['mci', 'mun', 'マンチェスター・ダービー'], ['liv', 'eve', 'マージーサイド・ダービー'], ['liv', 'mun', 'ノースウェスト・ダービー'], ['ars', 'che', 'ロンドン・ダービー'], ['che', 'tot', 'ロンドン・ダービー'],
    ['rma', 'fcb', 'エル・クラシコ'], ['rma', 'atm', 'マドリード・ダービー'], ['bet', 'sev', 'セビージャ・ダービー'], ['ath', 'rso', 'バスク・ダービー'], ['int', 'mil', 'ミラノ・ダービー'], ['rom', 'laz', 'ローマ・ダービー'], ['juv', 'int', 'イタリア・ダービー'], ['juv', 'tor', 'トリノ・ダービー'],
    ['bay', 'bvb', 'デア・クラシカー'], ['bvb', 's04', 'ルール・ダービー'], ['psg', 'om', 'ル・クラシック'], ['ol', 'asm', 'ローヌ・アルプ対決'],
    ['gosaka', 'cosaka', '大阪ダービー'], ['ftokyo', 'tokyov', '東京ダービー'], ['yokohamafm', 'kawasaki', '神奈川ダービー'], ['kashima', 'urawa', 'ナショナル・ダービー'], ['kashima', 'mito', '茨城ダービー'], ['shimizu', 'j2_13', '静岡ダービー'], ['urawa', 'j2_7', 'さいたまダービー'], ['kashiwa', 'chiba', '千葉ダービー']];
  SE.derby = function (a, b) { for (var i = 0; i < SE.DERBY.length; i++) { var x = SE.DERBY[i]; if ((x[0] === a && x[1] === b) || (x[0] === b && x[1] === a)) return x[2]; } return ''; };
  SE.ASIA = [['アル・ヒラル', 76], ['アル・ナスル', 76], ['アル・アハリ', 75], ['アル・イテハド', 74], ['アル・サッド', 70], ['シャバブ・アル・アハリ', 69], ['アル・ワフダ', 68], ['蔚山HD', 68], ['浦項スティーラーズ', 66], ['上海海港', 67], ['上海申花', 65], ['ブリーラム・ユナイテッド', 64], ['ジョホール・ダルル・タクジム', 63], ['メルボルン・シティ', 63]];
  SE.NT = { 'ブラジル': 87, 'フランス': 88, 'スペイン': 89, 'アルゼンチン': 87, 'イングランド': 87, 'ドイツ': 85, 'ポルトガル': 86, 'オランダ': 85, 'ベルギー': 82, 'イタリア': 83, 'クロアチア': 82, 'ウルグアイ': 81, 'コロンビア': 81, 'モロッコ': 81, 'アメリカ': 79, 'メキシコ': 79, 'セネガル': 79, 'スイス': 80, 'デンマーク': 80, 'トルコ': 79, 'ノルウェー': 80, '韓国': 76, 'オーストラリア': 74, 'イラン': 74, 'サウジアラビア': 71, 'カタール': 70, 'イラク': 70, 'ウズベキスタン': 71, 'UAE': 68, 'オマーン': 66, 'バーレーン': 65, 'インドネシア': 66, '中国': 66, 'ヨルダン': 69, 'エクアドル': 79, 'カナダ': 77, 'ガーナ': 76, 'ナイジェリア': 78, 'エジプト': 77, 'パラグアイ': 77, 'ペルー': 74, 'チリ': 75, 'ポーランド': 79, 'セルビア': 78, 'ウクライナ': 79, 'オーストリア': 80, 'スコットランド': 77 };
  SE.WC_FAV = ['ブラジル', 'フランス', 'スペイン', 'アルゼンチン', 'イングランド', 'ドイツ', 'ポルトガル', 'オランダ'];
  SE.ASIA_NT = ['オーストラリア', 'サウジアラビア', '韓国', 'イラン', 'カタール', 'イラク', 'ウズベキスタン', 'UAE', 'オマーン', 'バーレーン', 'インドネシア', '中国', 'ヨルダン'];
  SE.jpnS = function (S) { return 76 + Math.max(0, SO.eovr(S) - 76) * 0.28; };
  SE.CITY = { gosaka: '吹田', cosaka: '大阪', fcb: 'バルセロナ', rma: 'マドリード', atm: 'マドリード', ars: 'ロンドン', che: 'ロンドン', tot: 'ロンドン', ful: 'ロンドン', cry: 'ロンドン', bre: 'ロンドン', mci: 'マンチェスター', mun: 'マンチェスター', liv: 'リヴァプール', eve: 'リヴァプール', int: 'ミラノ', mil: 'ミラノ', juv: 'トリノ', tor: 'トリノ', rom: 'ローマ', laz: 'ローマ', nap: 'ナポリ', bay: 'ミュンヘン', bvb: 'ドルトムント', psg: 'パリ', pfc: 'パリ', om: 'マルセイユ', ol: 'リヨン', asm: 'モナコ', b04: 'レヴァークーゼン', rbl: 'ライプツィヒ', kashima: '鹿嶋', urawa: 'さいたま', kawasaki: '川崎', yokohamafm: '横浜', ftokyo: '東京', tokyov: '東京', machida: '町田', kobe: '神戸', hiroshima: '広島', nagoya: '名古屋', kyoto: '京都', fukuoka: '福岡', kashiwa: '柏', shimizu: '静岡', okayama: '岡山', nagasaki: '長崎', chiba: '千葉', mito: '水戸' };
  KL.CITY = SE.CITY;

  // ---------- 力 ----------
  SE.power = function (S, min) {
    var so = S.soccer, c = SO.club(S); if (!c) return 60;
    var eo = SO.eovr(S) + M.giftBonus(S), share = min === undefined ? 1 : min / 90;
    return c.s + Math.max(0, eo - c.s) * 0.3 * share + (SO.hasBadge(S, 'captain') ? 0.8 : 0);
  };

  // ---------- 日程づくり ----------
  function excluded(lg, d) {
    var nt = [[30, 41], [65, 76], [100, 111], [230, 243]];
    for (var i = 0; i < nt.length; i++) if (d >= nt[i][0] && d <= nt[i][1]) return true;
    if (KL.LEAGUES[lg].japan && d >= 133 && d < 196) return true;
    if (!KL.LEAGUES[lg].japan && lg !== 'PL' && d >= 143 && d < 156) return true;
    return false;
  }
  function roundDays(lg, R) {
    var start = 9, end = KL.LEAGUES[lg].japan ? 300 : 292, wk = [], mid = [];
    for (var d = start; d <= end; d += 7) if (!excluded(lg, d)) wk.push(d);
    for (var d2 = start + 3; d2 <= end; d2 += 7) if (!excluded(lg, d2)) mid.push(d2);
    var need = R - wk.length;
    if (need > 0) { var step = mid.length / need; for (var i = 0; i < need; i++) wk.push(mid[Math.floor(i * step + step / 2)]); }
    wk.sort(function (a, b) { return a - b; });
    if (wk.length > R) { var out = [], st = wk.length / R; for (var j = 0; j < R; j++) out.push(wk[Math.floor(j * st)]); wk = out; }
    return wk;
  }
  function roundRobin(ids) {
    var n = ids.length, arr = ids.slice(), rounds = [];
    for (var r = 0; r < n - 1; r++) {
      var rd = [];
      for (var i = 0; i < n / 2; i++) { var a = arr[i], b = arr[n - 1 - i]; rd.push(r % 2 === 0 ? [a, b] : [b, a]); }
      rounds.push(rd);
      arr.splice(1, 0, arr.pop());
    }
    var second = rounds.map(function (rd) { return rd.map(function (p) { return [p[1], p[0]]; }); });
    return rounds.concat(U.shuffle(second));
  }
  function mid(d, start) { return d + (((start + 3 - d) % 7) + 7) % 7; }
  SE.leagueClubs = function (S, lg) {
    var so = S.soccer, ov = so.lgOv || {};
    return KL.CLUBS.filter(function (c) { return (ov[c.id] || c.l) === lg; }).map(function (c) { return c.id; });
  };
  SE.clubS = function (S, id) { var c = SO.club(S, id); return c ? c.s : 60; };
  function rankEstimate(S, c) {
    var so = S.soccer, lg = SO.club(S, c.id).l;
    if (so.lastPos && so.lastPosClub === c.id) return so.lastPos;
    var ranked = SE.leagueClubs(S, lg).map(function (id) { return { id: id, s: SE.clubS(S, id) + U.gauss() * 2 }; }).sort(function (a, b) { return b.s - a.s; });
    return ranked.findIndex(function (x) { return x.id === c.id; }) + 1;
  }

  // 新しいシーズン（または途中加入）
  SE.newSeason = function (S, fromD) {
    var so = S.soccer, c = SO.club(S), lgKey = c.l, lg = KL.LEAGUES[lgKey];
    var y = KL.seasonStart(S);
    var ids = U.shuffle(SE.leagueClubs(S, lgKey));
    var rounds = roundRobin(ids), days = roundDays(lgKey, rounds.length);
    var sea = S.sea = { y: y, club: c.id, lg: lgKey, label: KL.seasonLabel(S), rounds: rounds, rdD: days, rdDone: 0, table: {}, fx: [], d: fromD || 0, mi: SE.md(fromD || 0).mi - 1, plan: [], lines: [], recent: [], ntWin: {}, cupN: SE.CUP[lgKey] };
    ids.forEach(function (id) { sea.table[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    // 自分のリーグ戦
    rounds.forEach(function (rd, ri) {
      rd.forEach(function (p) {
        if (p[0] !== c.id && p[1] !== c.id) return;
        var home = p[0] === c.id, opp = home ? p[1] : p[0];
        sea.fx.push({ d: days[ri], comp: 'L', cn: sea.special || lg.name, rd: '第' + (ri + 1) + '節', ri: ri, opp: SO.club(S, opp).n, oppId: opp, oppS: SE.clubS(S, opp), home: home });
      });
    });
    // 国内カップ
    var start = 9, jp = lg.japan;
    var cupD = jp ? [45, 76, 101, 122, 136, 153] : [mid(96, start), mid(158, start), mid(203, start), mid(240, start), mid(266, start), 289];
    var cupR = jp ? ['2回戦', '3回戦', 'ラウンド16', '準々決勝', '準決勝', '決勝'] : ['3回戦', '4回戦', '5回戦', '準々決勝', '準決勝', '決勝'];
    sea.cup = { name: SE.CUP[lgKey], d: cupD, r: cupR, i: 0, alive: true };
    SE.addCup(S);
    // 大陸の大会
    var pos = rankEstimate(S, c), comp = null;
    if (lg.europe) { if (pos <= lg.cl) comp = 'CL'; else if (pos <= lg.cl + lg.el) comp = 'EL'; }
    if (lg.acl && pos <= lg.acl) comp = 'ACL';
    if (comp) { sea.cont = { comp: comp, name: { CL: 'チャンピオンズリーグ', EL: 'ヨーロッパリーグ', ACL: 'ACLエリート' }[comp], pts: 0, md: 0, alive: true, stage: 'league' }; SE.addContLeague(S); }
    sea.fx.sort(function (a, b) { return a.d - b.d; });
    // 途中加入：それより前の試合は済んだことにする
    if (fromD) {
      sea.fx = sea.fx.filter(function (f) { return f.d >= fromD || f.comp === 'L'; });
      sea.fx.forEach(function (f) { if (f.d < fromD && f.comp === 'L') { f.skip = true; f.played = true; } });
      while (sea.rdDone < rounds.length && days[sea.rdDone] < fromD) simRound(S, sea.rdDone, null);
      if (sea.cont && fromD >= 184) { sea.cont = null; sea.fx = sea.fx.filter(function (f) { return f.comp !== 'C'; }); }
      if (sea.cup) { sea.fx = sea.fx.filter(function (f) { return f.comp !== 'CUP'; }); var ci = 0; while (ci < sea.cup.d.length && sea.cup.d[ci] < fromD) ci++; sea.cup.i = ci; sea.cup.alive = ci < sea.cup.d.length && (ci === 0 || U.chance(Math.pow(0.6, ci))); if (sea.cup.alive) SE.addCup(S); }
    }
    return sea;
  };
  SE.addCup = function (S) {
    var sea = S.sea, cu = sea.cup, c = SO.club(S); if (!cu || !cu.alive || cu.i >= cu.d.length) return;
    var lgc = SE.leagueClubs(S, c.l).filter(function (id) { return id !== c.id; });
    var opp, oppS, oppId = null;
    if (cu.i <= 1 && U.chance(0.6)) { oppS = Math.round(KL.LEAGUES[c.l].base - U.ri(6, 14)); opp = KL.LEAGUES[c.l].japan ? U.pick(KL.CLUBS.filter(function (x) { return x.l === 'J3' || x.l === 'J2'; })).n : U.pick(['2部の', '3部の']) + U.pick(KL.NAMES.fLast) + 'FC'; }
    else { var pool = lgc.map(function (id) { return SO.club(S, id); }).sort(function (a, b) { return b.s - a.s; }); var lvl = Math.min(pool.length - 1, Math.max(0, Math.floor(pool.length * (1 - cu.i / 6)) - U.ri(0, 4))); var o = pool[U.ri(Math.max(0, lvl - 3), lvl)]; opp = o.n; oppS = o.s; oppId = o.id; }
    sea.fx.push({ d: cu.d[cu.i], comp: 'CUP', cn: cu.name, rd: cu.r[cu.i], opp: opp, oppId: oppId, oppS: oppS, home: cu.i === cu.d.length - 1 ? null : U.chance(0.5), ko: true, final: cu.i === cu.d.length - 1 });
    sea.fx.sort(function (a, b) { return a.d - b.d; });
  };
  SE.contPool = function (S, comp, minS) {
    var c = SO.club(S);
    if (comp === 'ACL') return SE.ASIA.map(function (x) { return { n: x[0], s: x[1] }; }).concat(KL.CLUBS.filter(function (x) { return x.l === 'J1' && x.id !== c.id; }).slice(0, 4).map(function (x) { return { n: x.n, s: x.s, id: x.id }; }));
    return KL.CLUBS.filter(function (x) { return KL.LEAGUES[x.l].europe && x.l !== c.l && x.s >= (minS || 70); }).map(function (x) { return { n: x.n, s: x.s, id: x.id }; });
  };
  SE.addContLeague = function (S) {
    var sea = S.sea, ct = sea.cont;
    var days = ct.comp === 'ACL' ? [48, 62, 83, 97, 118, 132, 202, 216] : ct.comp === 'CL' ? [47, 62, 83, 97, 118, 132, 173, 180] : [48, 63, 84, 98, 119, 133, 174, 181];
    var pool = U.shuffle(SE.contPool(S, ct.comp, ct.comp === 'CL' ? 76 : 70));
    pool.sort(function (a, b) { return b.s - a.s; });
    var picks = [pool[U.ri(0, 3)], pool[U.ri(2, 7)], pool[U.ri(4, 10)], pool[U.ri(6, 14)], pool[U.ri(8, 18)], pool[U.ri(10, 22)], pool[U.ri(12, 26)], pool[U.ri(14, 30)]].map(function (x, i) { return x || pool[i % pool.length]; });
    var seen = {}; picks = picks.filter(function (x) { if (seen[x.n]) return false; seen[x.n] = 1; return true; });
    while (picks.length < 8) picks.push(pool[U.ri(0, pool.length - 1)]);
    U.shuffle(picks).forEach(function (o, i) { sea.fx.push({ d: days[i], comp: 'C', cn: ct.name, rd: (ct.comp === 'ACL' ? 'リーグステージ' : 'リーグフェーズ') + '第' + (i + 1) + '節', opp: o.n, oppId: o.id || null, oppS: o.s, home: i % 2 === 0, md: i + 1 }); });
  };
  var KO = {
    CL: [['プレーオフ', 201, 208, 84], ['ラウンド16', 222, 229, 85], ['準々決勝', 250, 257, 86], ['準決勝', 271, 278, 87], ['決勝', 298, 0, 88]],
    EL: [['プレーオフ', 202, 209, 77], ['ラウンド16', 223, 230, 78], ['準々決勝', 251, 258, 79], ['準決勝', 272, 279, 80], ['決勝', 293, 0, 81]],
    ACL: [['ラウンド16', 223, 230, 70], ['準々決勝', 254, 0, 72], ['準決勝', 257, 0, 74], ['決勝', 260, 0, 75]]
  };
  SE.KO = KO;
  SE.addContKO = function (S, k) {
    var sea = S.sea, ct = sea.cont, r = KO[ct.comp][k]; if (!r) return;
    ct.ko = k;
    var pool = SE.contPool(S, ct.comp, r[3] - 8).filter(function (x) { return x.s >= r[3] - 5; });
    var o = pool.length ? U.pick(pool) : { n: '欧州の強豪', s: r[3] };
    var fin = r[0] === '決勝';
    if (r[2]) {
      sea.fx.push({ d: r[1], comp: 'C', cn: ct.name, rd: r[0] + ' 第1戦', opp: o.n, oppId: o.id || null, oppS: Math.max(o.s, r[3] - 2), home: U.chance(0.5), leg: 1, kok: k });
      sea.fx.push({ d: r[2], comp: 'C', cn: ct.name, rd: r[0] + ' 第2戦', opp: o.n, oppId: o.id || null, oppS: Math.max(o.s, r[3] - 2), home: null, leg: 2, ko: true, kok: k });
      sea.fx[sea.fx.length - 1].home = !sea.fx[sea.fx.length - 2].home;
    } else sea.fx.push({ d: r[1], comp: 'C', cn: ct.name, rd: r[0], opp: o.n, oppId: o.id || null, oppS: Math.max(o.s, r[3]), home: null, ko: true, kok: k, final: fin });
    sea.fx.sort(function (a, b) { return a.d - b.d; });
  };

  // ---------- 代表 ----------
  SE.WIN = [[33, 37, '9月'], [69, 73, '10月'], [105, 109, '11月'], [235, 240, '3月'], [309, 313, '6月']];
  SE.wcYear = function (y) { return y >= 2030 && (y - 2030) % 4 === 0; };
  SE.called = function (S) {
    var so = S.soccer, a = KL.age(S), eo = SO.eovr(S);
    var thr = 73.5 + U.gauss() * 1.0 - (so.caps > 10 ? 1.5 : 0) - (so.caps > 40 ? 1 : 0);
    return a >= 18 && eo >= thr && (a >= 19 || eo >= 78);
  };
  SE.ntWindow = function (S, wi) {
    var sea = S.sea, so = S.soccer, w = SE.WIN[wi], y = sea.y;
    if (sea.ntWin[wi]) return; sea.ntWin[wi] = true;
    var callYear = w[0] >= 184 ? y + 1 : y;
    if (w[2] === '6月' && SE.wcYear(y + 1)) return; // W杯の年の6月は本大会
    var called = SE.called(S);
    var wasNow = so.ntNow; so.ntNow = called;
    if (!called) { if (wasNow) line(S, '🇯🇵 ' + w[2] + 'の代表メンバーから外れた。'); return; }
    if (!so.ntNum || (SO.eovr(S) >= 80 && SO.ICON[so.pos].indexOf(so.ntNum) < 0)) so.ntNum = SO.eovr(S) >= 80 ? SO.iconNum(so, SO.eovr(S) >= 84) : U.pick([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 25, 26]);
    var qual = (SE.wcYear(y + 2) && w[0] >= 33) || (SE.wcYear(y + 1) && w[0] < 240);
    var opps = qual ? U.shuffle(SE.ASIA_NT).slice(0, 2) : [U.pick(Object.keys(SE.NT).filter(function (k) { return SE.NT[k] >= 79; })), U.pick(Object.keys(SE.NT))];
    var label = qual ? 'W杯アジア最終予選' : '国際親善試合';
    [w[0], w[1]].forEach(function (d, i) {
      sea.fx.push({ d: d, comp: 'NT', cn: '日本代表', rd: label, opp: opps[i] + '代表', oppS: SE.NT[opps[i]] || 72, home: i === 0, nt: true, qual: qual });
    });
    sea.fx.sort(function (a, b) { return a.d - b.d; });
    if (!so.caps && !S.flags.ntCalled) {
      S.flags.ntCalled = 1;
      var imp = ST.impact(S, 55, { first: true });
      KL.push(S, { id: 'nt_first', cat: 'soccer', imp: 1, title: '日本代表に初招集', icon: '🇯🇵', text: KL.age(S) + '歳。' + w[2] + 'の日本代表メンバー発表で、自分の名前が読み上げられた。\n背番号は' + so.ntNum + '。\n\n' + (KL.Rec ? KL.Rec.reactText(S, 'nt', imp) : ''), choices: [] });
      ST.pushMessages(S, 'nt');
      KL.log(S, '日本代表に初招集（背番号' + so.ntNum + '）。', 2);
    } else line(S, '🇯🇵 ' + w[2] + 'の日本代表に招集（背番号' + so.ntNum + '）');
  };
  // アジアカップ（2027年1月、以後4年ごと）
  SE.asianCup = function (S) {
    var sea = S.sea, y = sea.y; if (sea.acDone || (y + 1 - 2027) % 4 !== 0) return; sea.acDone = true;
    if (!SE.called(S)) { line(S, '🏆 ' + (y + 1) + '年アジアカップのメンバーには選ばれなかった。'); return; }
    S.soccer.ntNow = true;
    if (!S.soccer.ntNum) S.soccer.ntNum = U.pick([13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);
    var g = U.shuffle(SE.ASIA_NT).slice(0, 3);
    sea.ac = { stage: 0, pts: 0, name: (y + 1) + '年アジアカップ' };
    [160, 164, 168].forEach(function (d, i) { sea.fx.push({ d: d, comp: 'AC', cn: sea.ac.name, rd: 'グループステージ第' + (i + 1) + '戦', opp: g[i] + '代表', oppS: SE.NT[g[i]] || 70, home: null, nt: true, md: i + 1 }); });
    sea.fx.sort(function (a, b) { return a.d - b.d; });
    line(S, '🏆 ' + sea.ac.name + 'の日本代表メンバーに選ばれた。');
  };
  SE.AC_KO = [['ラウンド16', 172, 72], ['準々決勝', 176, 74], ['準決勝', 179, 75], ['決勝', 183, 76]];
  SE.WC_KO = [['ラウンド32', 330, 78], ['ラウンド16', 334, 81], ['準々決勝', 339, 84], ['準決勝', 344, 86], ['決勝', 350, 88]];
  // W杯の本大会
  SE.worldCup = function (S) {
    var sea = S.sea, y = sea.y + 1; if (sea.wcDone || !SE.wcYear(y)) return; sea.wcDone = true;
    var so = S.soccer, called = SE.called(S) || (so.caps >= 20 && SO.eovr(S) >= 72);
    sea.wc = { year: y, name: y + '年ワールドカップ', called: called, stage: 0, pts: 0, goals: 0 };
    if (!called) { line(S, '🌍 ' + sea.wc.name + 'のメンバーに選ばれなかった。'); SE.wcSimNoMe(S); return; }
    so.ntNow = true;
    if (!so.ntNum) so.ntNum = SO.eovr(S) >= 80 ? SO.iconNum(so, SO.eovr(S) >= 84) : U.pick([13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);
    var g = [U.pick(SE.WC_FAV), U.pick(['クロアチア', 'ウルグアイ', 'コロンビア', 'モロッコ', 'スイス', 'デンマーク', 'セネガル', 'メキシコ', 'ノルウェー', 'ポーランド', 'エクアドル']), U.pick(['カナダ', 'ガーナ', 'パラグアイ', 'カタール', 'サウジアラビア', 'ヨルダン', 'オーストラリア', 'ペルー'])];
    U.shuffle(g).forEach(function (n, i) { sea.fx.push({ d: [315, 320, 325][i], comp: 'WC', cn: sea.wc.name, rd: 'グループステージ第' + (i + 1) + '戦', opp: n + '代表', oppS: SE.NT[n] || 76, home: null, nt: true, md: i + 1 }); });
    sea.fx.sort(function (a, b) { return a.d - b.d; });
    var imp = ST.impact(S, 60, { times: (so.wcs || 0) + 1 });
    KL.push(S, { id: 'wc_squad', cat: 'soccer', imp: 1, title: sea.wc.name + ' メンバー発表', icon: '🌍', text: '5月。' + sea.wc.name + 'に挑む日本代表26人が発表された。\n背番号' + so.ntNum + '、' + S.sei + ' ' + S.mei + '。\n\n' + (KL.Rec ? KL.Rec.reactText(S, 'wc', imp) : ''), choices: [] });
    so.wcs = (so.wcs || 0) + 1;
  };
  SE.wcSimNoMe = function (S) {
    var r = 0, js = 78; while (r < 6 && U.chance(U.sig((js - [74, 78, 81, 84, 86, 88][r]) / 4.2))) r++;
    var res = ['グループステージ敗退', 'ベスト32', 'ベスト16', 'ベスト8', 'ベスト4', '準優勝', '優勝'][r];
    line(S, '🌍 ' + S.sea.wc.name + '：日本は' + res + '。テレビの前で見守った。');
  };

  // ---------- 他のクラブの試合 ----------
  function apply(t, gf, ga) { t.p++; t.gf += gf; t.ga += ga; if (gf > ga) { t.w++; t.pts += 3; } else if (gf === ga) { t.d++; t.pts++; } else t.l++; }
  function simRound(S, ri, mine) {
    var sea = S.sea;
    sea.rounds[ri].forEach(function (p) {
      var h = p[0], a = p[1], gh, ga;
      if (mine && (h === sea.club || a === sea.club)) { gh = h === sea.club ? mine.gf : mine.ga; ga = h === sea.club ? mine.ga : mine.gf; }
      else { var sh = SE.clubS(S, h), sa = SE.clubS(S, a); gh = M.poisson(M.lam(sh, sa, true)); ga = M.poisson(M.lamOpp(sh, sa, true)); }
      apply(sea.table[h], gh, ga); apply(sea.table[a], ga, gh);
    });
    sea.rdDone = ri + 1;
  }
  SE.standings = function (S) {
    var sea = S.sea; if (!sea) return [];
    return Object.keys(sea.table).map(function (id) { var t = sea.table[id]; return { id: id, n: SO.club(S, id).n, p: t.p, w: t.w, d: t.d, l: t.l, gf: t.gf, ga: t.ga, gd: t.gf - t.ga, pts: t.pts }; })
      .sort(function (a, b) { return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf; });
  };
  SE.myPos = function (S) { var st = SE.standings(S); return st.findIndex(function (x) { return x.id === S.sea.club; }) + 1; };

  // ---------- 出場するか ----------
  SE.select = function (S, fx) {
    var so = S.soccer, c = SO.club(S);
    if ((so.injDays || 0) > 0) return { start: false, min: 0, why: '怪我で欠場' };
    var eo = SO.eovr(S), need = fx.nt ? 74 : c.s - 1;
    var comp = fx.nt ? null : SO.teammates(S).filter(function (p) { return p.pos === so.pos && p.ovr >= eo + 2; })[0];
    var sc = (eo - need) / 3 + ((so.trust || 50) - 50) / 22 + (S.form || 0) * 0.08 - Math.max(0, S.fat - 62) / 9 - (comp ? 1.2 : 0);
    if (fx.comp === 'CUP' && fx.rd && !/準|決勝/.test(fx.rd) && c.s >= 80) sc -= 0.7;
    if (eo >= need + 4 && S.fat < 75) sc += 3;
    var p = U.sig(sc + 0.6);
    if (U.chance(p)) return { start: true, min: S.fat > 80 && U.chance(0.4) ? U.ri(60, 75) : 90 };
    if (U.chance(U.sig(sc + 2.0))) return { start: false, min: U.ri(12, 35), why: '途中出場' };
    return { start: false, min: 0, why: comp ? comp.name + 'が先発（ベンチ）' : 'ベンチ' };
  };
  // 遊ぶ試合かどうか（理由を返す）
  SE.isBig = function (S, fx) {
    var so = S.soccer, sea = S.sea, play = (S.cfg && S.cfg.play) || 'std';
    if (!so.proApps) return 'プロデビュー戦';
    if (fx.final) return '決勝';
    if (fx.comp === 'WC') return 'ワールドカップ';
    if (play === 'less') return SE.derby(sea.club, fx.oppId) ? 'ダービー' : '';
    if (fx.comp === 'AC' && !fx.md) return 'アジアカップ';
    if (fx.comp === 'C' && (fx.kok || 0) >= (sea.cont && sea.cont.comp === 'ACL' ? 1 : 2)) return sea.cont.name + ' ' + fx.rd;
    if (fx.comp === 'CUP' && /準決勝/.test(fx.rd)) return fx.cn + ' 準決勝';
    if (fx.comp === 'NT' && !so.caps) return '代表デビュー';
    if (fx.comp === 'L') {
      var dn = SE.derby(sea.club, fx.oppId); if (dn) return dn;
      var st = SE.standings(S), me = SE.myPos(S), op = st.findIndex(function (x) { return x.id === fx.oppId; }) + 1, R = sea.rounds.length;
      if (fx.ri >= 8 && me <= 3 && op <= 3 && Math.abs(st[me - 1].pts - st[op - 1].pts) <= 4) return '首位攻防戦';
      if (fx.ri >= R - 5 && me <= 2 && st[0].pts - st[1].pts <= 4) return '優勝争い';
      if (fx.ri >= R - 4 && me >= st.length - 3) return '残留争い';
      if (fx.ri === 0) return '開幕戦';
    }
    if (S.rival && fx.oppId && S.rival.club === fx.oppId) return 'ライバル対決';
    if (fx.comp === 'C' && fx.md === 1) return sea.cont.name + ' 初戦';
    if (so.justBack) return '怪我からの復帰戦';
    var tg = so.totalGoals, ms = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    for (var i = 0; i < ms.length; i++) if (tg < ms[i] && tg >= ms[i] - 1 && ['ST', 'WG', 'OM'].indexOf(so.pos) >= 0) return '通算' + ms[i] + 'ゴールまであと' + (ms[i] - tg);
    if (play === 'more' && (fx.ri || 0) % 3 === 1) return '注目の一戦';
    return '';
  };
  SE.ctx = function (S, fx, sel, big) {
    var so = S.soccer, c = SO.club(S);
    var myS = fx.nt ? SE.jpnS(S) : SE.power(S, sel.min);
    if (fx.nt && !sel.min) myS = 78;
    var agg = null;
    if (fx.leg === 2) { var f1 = S.sea.fx.filter(function (f) { return f.kok === fx.kok && f.leg === 1 && f.comp === fx.comp && f.played; })[0]; if (f1) agg = { gf: f1.gf, ga: f1.ga }; }
    var venue = fx.home === true ? (fx.nt ? '満員の国立競技場' : c.n + 'のホームスタジアム') : fx.home === false ? fx.opp + 'のホームスタジアム' : (fx.comp === 'WC' ? 'W杯の会場' : fx.final ? '決勝の舞台' : '中立地');
    return {
      id: 'fx', title: fx.cn + ' ' + fx.rd, icon: fx.nt ? '🇯🇵' : fx.final ? '🏆' : '⚽', comp: fx.comp, venue: venue,
      my: fx.nt ? '日本代表' : c.n, opp: fx.opp, myS: myS, oppS: fx.oppS, home: fx.home, ko: !!fx.ko, agg: agg, nt: !!fx.nt, big: !!big, final: !!fx.final, sel: sel,
      stakes: big ? '――' + big + (agg ? '（第1戦 ' + agg.gf + '-' + agg.ga + '）' : '') : (agg ? '第1戦は' + agg.gf + '-' + agg.ga + '。' : ''), fx: fx
    };
  };

  // ---------- 1ステップ進める ----------
  // 返り値: {type:'queue'} / {type:'match', fx, ctx} / {type:'auto', fx, res} / {type:'halfEnd'}
  SE.next = function (S, opt) {
    opt = opt || {};
    var sea = S.sea; if (!sea) return { type: 'halfEnd' };
    if (S._queue && S._queue.length) return { type: 'queue' };
    var rg = SE.range(S);
    var nx = sea.fx.filter(function (f) { return !f.played && f.d >= rg[0] && f.d < rg[1]; })[0];
    var nd = nx ? nx.d : rg[1] - 1;
    // 予定の場面（その日までに起きるもの）
    var due = sea.plan.filter(function (p) { return p.atD <= nd; });
    if (due.length) {
      sea.plan = sea.plan.filter(function (p) { return p.atD > nd; });
      due.forEach(function (p) { if (p.ev) KL.push(S, { ev: p.ev }); else if (p.inst) KL.push(S, p.inst); else if (p.fn && SE.FN[p.fn]) SE.FN[p.fn](S, p); });
      if (S._queue && S._queue.length) return { type: 'queue' };
    }
    // 代表の招集・大会
    SE.WIN.forEach(function (w, wi) { if (!sea.ntWin[wi] && nd >= w[0] - 4 && w[0] >= rg[0] && w[0] < rg[1]) SE.ntWindow(S, wi); });
    if (!KL.isB(S) && nd >= 150 && !sea.acDone) SE.asianCup(S);
    if (KL.isB(S) && nd >= 284 && !sea.wcDone && SE.wcYear(sea.y + 1)) SE.worldCup(S);
    if (S._queue && S._queue.length) return { type: 'queue' };
    nx = sea.fx.filter(function (f) { return !f.played && f.d >= rg[0] && f.d < rg[1]; })[0];
    // 月が変わったら練習（方針）
    var mi = SE.md(nx ? nx.d : rg[1] - 1).mi;
    if (mi > sea.mi) {
      for (var m = sea.mi + 1; m < mi; m++) SO.monthTrain(S, S.focus || 'auto');
      sea.mi = mi;
      if (S.cfg.train === 'ask' && nx) { SE.trainEvent(S); return { type: 'queue' }; }
      SO.monthTrain(S, S.focus || 'auto');
      if (S._queue && S._queue.length) return { type: 'queue' };
    }
    if (!nx) return { type: 'halfEnd' };
    // 日が進む：疲労・怪我の回復
    var days = Math.max(0, nx.d - sea.d);
    if (days) { KL.fatAdd(S, -days * (1.3 + (S.care || 50) / 120)); var so0 = S.soccer; if (so0.injDays > 0) { so0.injDays = Math.max(0, so0.injDays - days); if (!so0.injDays) { so0.justBack = true; line(S, '🩹 怪我から復帰した。'); } } }
    sea.d = nx.d;
    var sel = SE.select(S, nx), big = SE.isBig(S, nx);
    if (big && sel.min > 0 && !opt.noPlay) { if (!sel.start && (nx.final || nx.comp === 'WC' || /デビュー/.test(big)) && (S.soccer.injDays || 0) === 0) sel = { start: true, min: 90 }; return { type: 'match', fx: nx, ctx: SE.ctx(S, nx, sel, big), big: big }; }
    var ctx = SE.ctx(S, nx, sel, big);
    var res = M.sim(S, ctx);
    var out = SE.record(S, nx, res, ctx);
    return { type: 'auto', fx: nx, res: res, sel: sel, out: out };
  };
  SE.FN = {};

  // ---------- 試合の結果を記録 ----------
  SE.record = function (S, fx, res, ctx) {
    var so = S.soccer, sea = S.sea, cu = so.cur, my = res.my, out = [];
    fx.played = true; fx.gf = res.gf; fx.ga = res.ga; fx.pk = res.pk; fx.my = my; fx.win = res.win; fx.mom = !!res.mom;
    if (fx.comp === 'L') { while (sea.rdDone < fx.ri) simRound(S, sea.rdDone, null); simRound(S, fx.ri, res); }
    // 個人成績
    if (my.min > 0) {
      so.proApps = (so.proApps || 0) + 1; so.justBack = false;
      if (fx.nt) { so.caps++; so.ntGoals += my.g; cu.ntApps++; cu.ntGoals += my.g; if (fx.comp === 'WC') { so.wcGoals = (so.wcGoals || 0) + my.g; if (sea.wc) sea.wc.goals += my.g; } }
      else {
        cu.apps++; cu.goals += my.g; cu.ast += my.a; cu.rs += my.r; cu.rn++;
        so.totalApps++; so.totalGoals += my.g; so.totalAst += my.a;
        if (fx.comp === 'L') { cu.lgG = (cu.lgG || 0) + my.g; cu.lgA = (cu.lgA || 0) + my.a; cu.lgApps = (cu.lgApps || 0) + 1; }
        if (fx.comp === 'C') { cu.euroGoals = (cu.euroGoals || 0) + my.g; if (sea.cont.comp === 'CL') so.clGoals = (so.clGoals || 0) + my.g; }
        so.clubGoals = so.clubGoals || {}; so.clubGoals[sea.club] = (so.clubGoals[sea.club] || 0) + my.g;
      }
      if (res.mom) { cu.mom = (cu.mom || 0) + 1; so.moms = (so.moms || 0) + 1; }
      // 調子・信頼・疲労・ファン
      S.form = U.clamp((S.form || 0) * 0.8 + (my.r - 6.6) * 1.3, -10, 10);
      if (!fx.nt) so.trust = U.clamp((so.trust || 50) + (my.r - 6.5) * (my.min >= 60 ? 2.2 : 1.2), 0, 100);
      KL.fatAdd(S, my.min / 90 * 8.5);
      SO.aptAdd(S, so.pos, 0.12 * my.min / 90);
      SO.matchExp(S, my.min / 90 * 0.035);
      if (KL.Life) KL.Life.addFans(S, Math.round((my.g * 6000 + my.a * 2500 + (res.mom ? 5000 : 0)) * (fx.nt ? 2 : 1) * (1 + ST.clubTier(SO.club(S)) * 0.25)));
      KL.repAdd(S, 'nat', (my.g * 0.35 + (res.mom ? 0.4 : 0)) * (fx.nt ? 1.6 : 1) * (KL.LEAGUES[sea.lg].japan ? 0.7 : 1));
      // 怪我
      var a = KL.age(S), inj = 0.011 * (my.min / 90) * (1 + S.fat / 45) * (SO.hasBadge(S, 'iron') ? 0.5 : 1) * (1.45 - (S.care || 50) / 110) * (a >= 31 ? 1.35 : 1);
      if (U.chance(inj)) SE.injury(S, fx);
    } else if (!fx.nt) { so.trust = U.clamp((so.trust || 50) - 0.4, 0, 100); S.form = (S.form || 0) * 0.9; }
    // 大会の進行
    var res2 = SE.progress(S, fx, res);
    if (res2) out.push(res2);
    if (KL.Rec && KL.Rec.afterMatch) { try { KL.Rec.afterMatch(S, fx, res, ctx); } catch (e) { if (window.console) console.warn('rec.after', e); } }
    // 結果の一行
    var s = SE.resultLine(S, fx);
    sea.recent.push(s); if (sea.recent.length > 60) sea.recent.shift();
    return out.join('\n');
  };
  SE.resultLine = function (S, fx) {
    var my = fx.my || {}, r = fx.win === true ? '○' : fx.win === false ? '●' : '△';
    var me = my.min > 0 ? (my.g ? ' ⚽' + my.g : '') + (my.a ? ' 🅰' + my.a : '') + ' 採点' + my.r.toFixed(1) + (fx.mom ? ' MOM' : '') : ((S.soccer.injDays || 0) > 0 && !my.min ? ' 欠場' : ' 出場なし');
    return SE.fmt(fx.d) + ' ' + r + ' ' + fx.rd + ' vs ' + fx.opp + ' ' + fx.gf + '-' + fx.ga + (fx.pk ? '(PK' + fx.pk.gf + '-' + fx.pk.ga + ')' : '') + '｜' + me;
  };
  SE.injury = function (S, fx) {
    var so = S.soccer, r = Math.random();
    var days = r < 0.6 ? U.ri(7, 20) : r < 0.9 ? U.ri(21, 55) : r < 0.97 ? U.ri(56, 110) : U.ri(150, 240);
    so.injDays = days; so.injCount = (so.injCount || 0) + 1;
    var part = U.pick(['太ももの裏', '足首', '膝', 'ふくらはぎ', '股関節', '肩', '足の甲']);
    var big = days >= 56;
    KL.log(S, part + 'を負傷（全治' + (days >= 30 ? Math.round(days / 30) + 'か月' : days + '日') + '）。', big ? 2 : 1);
    so.cur.notes.push('負傷離脱');
    KL.push(S, { id: 'injury', cat: 'soccer', imp: big ? 1 : 0, title: big ? '大怪我' : '負傷', icon: '🩹', text: fx.opp + '戦で' + part + 'を痛めた。全治' + (days >= 30 ? '約' + Math.round(days / 30) + 'か月' : days + '日') + '。' + (big ? '\n\n医師の言葉が、頭の中で何度もくり返された。' : ''),
      choices: big ? [
        { t: '焦らず、完璧に治す', ok: true, pol: 'b', fx: function (S) { S.care = U.clamp((S.care || 50) + 6, 0, 100); return 'リハビリは長い。でも、焦らないと決めた。'; } },
        { t: '1日でも早く戻る（再発リスクあり）', ok: true, pol: 'soccer', fx: function (S) { so.injDays = Math.round(so.injDays * 0.7); if (U.chance(0.3)) { so.injDays += 30; return '早く戻りすぎて、また痛めてしまった……。'; } return '予定より早く、ピッチに戻れそうだ。'; } }
      ] : [] });
    if (big) ST.pushMessages(S, 'injury');
  };

  // 大会の勝ち上がり
  SE.progress = function (S, fx, res) {
    var sea = S.sea, so = S.soccer;
    if (fx.comp === 'CUP') {
      if (res.win) { sea.cup.i++; if (fx.final) { SO.trophy(S, sea.cup.name + '優勝'); sea.cup.alive = false; return '🏆 ' + sea.cup.name + '優勝！'; } SE.addCup(S); return sea.cup.name + '：' + fx.rd + '突破'; }
      sea.cup.alive = false; if (fx.final) { so.cur.notes.push(sea.cup.name + ' 準優勝'); return sea.cup.name + '準優勝'; } return sea.cup.name + '：' + fx.rd + '敗退';
    }
    if (fx.comp === 'C') {
      var ct = sea.cont;
      if (fx.md) {
        ct.pts += res.win === true ? 3 : res.win === null ? 1 : 0; ct.md = fx.md;
        if (fx.md === 8) {
          var acl = ct.comp === 'ACL', top = ct.pts + U.gauss() * 1.6;
          if (acl ? top >= 12 : top >= 16) { ct.stage = 'ko'; SE.addContKO(S, acl ? 0 : 1); return ct.name + '：リーグ上位で決勝トーナメントへ（勝ち点' + ct.pts + '）'; }
          if (!acl && top >= 10) { ct.stage = 'ko'; SE.addContKO(S, 0); return ct.name + '：プレーオフへ（勝ち点' + ct.pts + '）'; }
          ct.alive = false; so.cur.notes.push(ct.name + ' リーグフェーズ敗退'); return ct.name + '：リーグフェーズ敗退（勝ち点' + ct.pts + '）';
        }
        return '';
      }
      if (fx.leg === 1) return '';
      var rd = KO[ct.comp][fx.kok][0];
      if (res.win) {
        if (fx.final) { ct.alive = false; SO.trophy(S, ct.name + '優勝'); KL.repAdd(S, 'nat', ct.comp === 'CL' ? 25 : 12); return '🏆 ' + ct.name + '制覇！'; }
        SE.addContKO(S, fx.kok + 1); return ct.name + '：' + rd + '突破';
      }
      ct.alive = false; so.cur.notes.push(ct.name + ' ' + (fx.final ? '準優勝' : rd + '敗退')); if (fx.final) KL.title(S, ct.name + ' 準優勝');
      return ct.name + '：' + (fx.final ? '準優勝' : rd + '敗退');
    }
    if (fx.comp === 'AC') {
      var ac = sea.ac;
      if (fx.md) { ac.pts += res.win === true ? 3 : res.win === null ? 1 : 0; if (fx.md === 3) { if (ac.pts >= 4 || (ac.pts >= 3 && U.chance(0.5))) { ac.k = 0; SE.addNTKO(S, 'AC', 0); return ac.name + '：グループ突破'; } line(S, '🏆 ' + ac.name + '：グループステージ敗退'); return ac.name + '：グループ敗退'; } return ''; }
      if (res.win) { if (fx.final) { SO.trophy(S, ac.name + '優勝'); return '🏆 ' + ac.name + '優勝！'; } SE.addNTKO(S, 'AC', ac.k + 1); return ac.name + '：' + fx.rd + '突破'; }
      if (fx.final) KL.title(S, ac.name + ' 準優勝'); return ac.name + '：' + fx.rd + '敗退';
    }
    if (fx.comp === 'WC') {
      var wc = sea.wc;
      if (fx.md) { wc.pts += res.win === true ? 3 : res.win === null ? 1 : 0; if (fx.md === 3) { if (wc.pts >= 4 || (wc.pts === 3 && U.chance(0.6))) { wc.k = 0; SE.addNTKO(S, 'WC', 0); return wc.name + '：グループ突破！'; } SE.wcEnd(S, 0); return wc.name + '：グループステージ敗退'; } return ''; }
      if (res.win) { if (fx.final) { SE.wcEnd(S, 6); return '🏆 ' + wc.name + '優勝！！'; } SE.addNTKO(S, 'WC', wc.k + 1); return wc.name + '：' + fx.rd + '突破'; }
      SE.wcEnd(S, wc.k + 1); return wc.name + '：' + fx.rd + '敗退';
    }
    return '';
  };
  SE.addNTKO = function (S, comp, k) {
    var sea = S.sea, list = comp === 'AC' ? SE.AC_KO : SE.WC_KO, r = list[k]; if (!r) return;
    var holder = comp === 'AC' ? sea.ac : sea.wc; holder.k = k;
    var pool = Object.keys(SE.NT).filter(function (n) { return comp === 'AC' ? SE.ASIA_NT.indexOf(n) >= 0 && SE.NT[n] >= r[2] - 6 : SE.NT[n] >= r[2] - 4; });
    var o = U.pick(pool.length ? pool : ['ブラジル']);
    sea.fx.push({ d: r[1], comp: comp, cn: holder.name, rd: r[0], opp: o + '代表', oppS: Math.max(SE.NT[o] || r[2], r[2] - 2), home: null, nt: true, ko: true, final: r[0] === '決勝' });
    sea.fx.sort(function (a, b) { return a.d - b.d; });
  };
  SE.wcEnd = function (S, r) {
    var so = S.soccer, wc = S.sea.wc;
    var res = ['グループステージ敗退', 'ベスト32', 'ベスト16', 'ベスト8', 'ベスト4', '準優勝', '優勝'][r];
    if (r >= 6) { so.wcWin = true; SO.trophy(S, 'FIFAワールドカップ優勝'); KL.repAdd(S, 'nat', 40); }
    else if (r >= 3) KL.title(S, wc.name + ' ' + res);
    if (wc.goals >= 6) SO.trophy(S, wc.name + ' 得点王');
    KL.log(S, wc.name + '出場（日本：' + res + '、' + wc.goals + '得点）', 2);
    line(S, '🌍 ' + wc.name + '：日本は' + res + '。自分は' + wc.goals + '得点。');
    if (KL.Rec && KL.Rec.onWC) KL.Rec.onWC(S, r, wc);
  };

  // ---------- 月の練習 ----------
  SE.trainEvent = function (S) {
    var so = S.soccer, m = SE.md(S.sea.d + 1).m, cur = S.focus || 'auto';
    var opts = SO.FOCUS.filter(function (f) { return (f.k !== 'gk' || so.pos === 'GK') && (f.k !== 'sht' && f.k !== 'dri' || so.pos !== 'GK'); });
    KL.push(S, { id: 'train', cat: 'soccer', imp: 1, title: m + '月の練習方針', icon: '🏋️', text: '今月はどこを重点的に鍛える？\n（いま：' + (SO.FOCUS.filter(function (f) { return f.k === cur; })[0] || SO.FOCUS[0]).n + '／疲労 ' + Math.round(S.fat) + '）',
      choices: [{ t: '先月と同じ（' + (SO.FOCUS.filter(function (f) { return f.k === cur; })[0] || SO.FOCUS[0]).n + '）', ok: true, fx: function (S) { SO.monthTrain(S, cur); return '先月と同じメニューで鍛えた。'; } }].concat(opts.filter(function (f) { return f.k !== cur; }).map(function (f) {
        return { t: f.n + '（' + f.d + '）', ok: true, fx: function (S) { S.focus = f.k; SO.monthTrain(S, f.k); return f.n + 'を重点的に鍛えた。'; } };
      })) });
  };

  // ---------- 背番号の希望 ----------
  SE.numberEvent = function (S, joining) {
    var so = S.soccer, c = SO.club(S), eo = SO.eovr(S);
    var wish = (so.pos === 'GK' ? [1, 12, 10] : [10, 7, 9, 11]).concat(SO.ICON[so.pos] || []).filter(function (n, i, a) { return a.indexOf(n) === i && n !== so.num; }).slice(0, 4);
    var star = eo >= c.s + 3 || (so.ballons && so.ballons.length) || (so.trust >= 80 && eo >= c.s);
    KL.push(S, { id: 'num', cat: 'soccer', imp: 1, title: '背番号', icon: '👕', text: (joining ? c.n + 'との契約。クラブの担当者が言った。「背番号の希望はありますか？」' : '新シーズン。背番号を変えるなら、今がそのタイミングだ。') + '\n（いま：' + so.num + '番）',
      choices: wish.map(function (n) {
        return { t: n + '番を希望する', ok: true, fx: function (S) {
          var hard = n === 10 || (n === 1 && so.pos === 'GK') ? 4 : n === 7 || n === 9 ? 2 : 1, ok = star ? U.chance(0.75 + (eo - c.s) * 0.04) : eo >= c.s + hard - 1 && U.chance(0.45);
          if ((n === 10 || (n === 1 && so.pos === 'GK')) && !star && eo < c.s + 2) ok = false;
          if (ok) { SE.setNum(S, n); return '「' + n + '番は、あなたに託します」。\nユニフォームを受け取る手が、少し震えた。'; }
          so.numPromise = n; return '「今季、' + n + '番はほかの選手がつけています。結果を出してくれたら、来季は必ず」。\n悔しいが、今は' + so.num + '番で証明するしかない。';
        } };
      }).concat([{ t: '今の' + so.num + '番のままでいい', ok: true, fx: function (S) { return so.num + '番に、自分の色をつけていく。'; } }]) });
  };
  SE.setNum = function (S, n) {
    var so = S.soccer; so.num = n; if (so.cur && !so.cur.closed) so.cur.num = n; so.numPromise = null;
    so.numHist = so.numHist || []; so.numHist.push({ n: n, club: so.club, y: KL.seasonStart(S) });
    KL.log(S, SO.club(S).n + 'で背番号' + n + 'を背負うことになった。', n === 10 ? 2 : 1);
    if (n === 10 && KL.Rec) KL.Rec.onTen(S);
  };

  // ---------- 半年のはじめ ----------
  SE.halfStart = function (S) {
    var so = S.soccer;
    KL.beginTurn(S);
    if (so.pending) { var pd = so.pending; so.pending = null; if (so.cur && !so.cur.closed) SO.closeSeason(S); SO.join(S, pd.club, pd.wage, pd.years); SO.newSeason(S); so.cur.half = KL.isB(S); }
    if (!SE.active(S)) return;
    var rg = SE.range(S);
    if (!S.sea || S.sea.y !== KL.seasonStart(S) || S.sea.club !== so.club) {
      if (!so.cur || so.cur.closed) SO.newSeason(S);
      SE.newSeason(S, KL.isB(S) ? SE.HALF : 0);
    }
    var sea = S.sea; sea.lines = []; sea.recent = []; sea.half = S.t; sea.hd = 0;
    if (!KL.isB(S)) {
      // 夏：移籍市場・背番号・プレシーズン
      if (sea.started !== true) {
        sea.started = true;
        if (KL.age(S) <= 35 && (so.contract <= 0 || SO.offers(S, 'normal').length)) SE.transferEvent(S, 'summer');
        if (so.numPromise && so.trust >= 60 && so.seasons.length && (so.seasons[so.seasons.length - 1].rating || 0) >= 7.0) { var pn = so.numPromise; SE.setNum(S, pn); KL.push(S, { id: 'numgift', cat: 'soccer', imp: 1, title: '約束の背番号', icon: '👕', text: '新シーズンの初日。用具係がロッカーにユニフォームを掛けていた。\n背中には「' + pn + '」。\n\n去年の約束を、クラブは覚えていた。', choices: [] }); }
        else if (!SO.isIcon(so) && (SO.eovr(S) >= SO.club(S).s + 2 || U.chance(0.12))) SE.numberEvent(S, false);
      }
      if (so.ballonPending) sea.plan.push({ atD: 92, fn: 'ballon' });
      sea.plan.push({ atD: 168, fn: 'winter' });
    }
    // 場面（サッカー6：私生活4くらい）
    var evs = KL.pickEvents(S, { quota: { soccer: U.ri(5, 7), life: U.ri(5, 7), hero: 2 } });
    var span = rg[1] - rg[0] - 30;
    evs.forEach(function (ev, i) { sea.plan.push({ atD: ev.sched ? rg[0] + 2 + i : rg[0] + 8 + Math.floor(Math.random() * span), ev: ev }); });
    sea.plan.sort(function (a, b) { return a.atD - b.atD; });
  };
  SE.FN.ballon = function (S) { if (KL.Rec) KL.Rec.ballonEvent(S); };
  SE.FN.winter = function (S) { var so = S.soccer; if (KL.age(S) <= 34 && U.chance(0.3) && SO.offers(S, 'normal').length) SE.transferEvent(S, 'winter'); };
  SE.transferEvent = function (S, when) {
    var so = S.soccer, offers = SO.offers(S, 'normal');
    if (!offers.length && so.contract > 0) return;
    S._offers = offers;
    var c = SO.club(S);
    var exp = so.contract <= 0 ? '（契約満了）' : '（契約残り' + so.contract + '年）';
    KL.push(S, KL.evInstance(S, {
      id: 's_transfer', cat: 'soccer', imp: 2, title: when === 'summer' ? '夏の移籍市場' : '冬の移籍市場', icon: '✈️',
      text: offers.length ? offers.length + 'つのクラブからオファーが届いた。' + c.n + exp + 'に残る？' : c.n + 'から契約更新の話が来た。',
      cards: function (S) { return (S._offers || []).map(function (o) { return SO.offerCard(S, o); }); },
      choices: [0, 1, 2].map(function (i) {
        return { t: function (S) { var o = S._offers && S._offers[i]; return o ? o.name + 'との交渉に進む' : ''; }, req: function (S) { return S._offers && S._offers[i]; },
          fx: function (S) { var o = S._offers[i]; SO.negotiate(S, o); return o.name + 'の代理人と交渉のテーブルについた。'; } };
      }).concat([{ t: function (S) { return S.soccer.contract <= 0 ? '残留（契約更新）' : '残留する'; }, fx: function (S) {
        var so = S.soccer;
        if (so.contract <= 0) { var c = SO.club(S), ovr = SO.ovr(so); if (ovr < c.s - 9 && KL.age(S) >= 30) so.salary = Math.round(so.salary * 0.6); else so.salary = Math.max(so.salary, SO.wage(S, c, ovr)); so.contract = U.ri(1, 3); return '契約を更新した（年俸' + U.yen(so.salary) + '）。'; }
        so.trust = Math.min(100, so.trust + 3); return 'このクラブで勝負を続ける。';
      } }])
    }));
  };
  // クラブが変わったとき（シーズン途中の移籍も）
  SE.onJoin = function (S, c, prev) {
    if (S.stage !== 'pro') return;
    var d = S.sea ? S.sea.d : (KL.isB(S) ? SE.HALF : 0);
    var keepNT = S.sea ? S.sea.fx.filter(function (f) { return f.nt && !f.played; }) : [];
    var old = S.sea;
    SE.newSeason(S, d > 0 ? d + 1 : 0);
    if (old) { S.sea.plan = old.plan; S.sea.lines = old.lines; S.sea.recent = old.recent; S.sea.ntWin = old.ntWin; S.sea.acDone = old.acDone; S.sea.wcDone = old.wcDone; S.sea.wc = old.wc; S.sea.ac = old.ac; S.sea.started = true; S.sea.half = old.half; S.sea.mi = old.mi; S.sea.d = old.d; }
    keepNT.forEach(function (f) { S.sea.fx.push(f); }); S.sea.fx.sort(function (a, b) { return a.d - b.d; });
  };

  // ---------- 半年の終わり ----------
  SE.halfEnd = function (S) {
    var so = S.soccer, sea = S.sea, lines = (sea && sea.lines ? sea.lines.slice() : []);
    // 残っている自分以外の試合を消化
    if (sea && KL.isB(S)) while (sea.rdDone < sea.rounds.length) simRound(S, sea.rdDone, null);
    SO.halfAge(S);
    KL.moneyAdd(S, so.salary / 2);
    var cu = so.cur;
    if (cu) lines.unshift('⚽ ' + SO.teamName(S) + '：' + cu.apps + '試合 ' + cu.goals + '得点 ' + cu.ast + 'アシスト（シーズン通算）' + (cu.rn ? ' 平均採点' + (cu.rs / cu.rn).toFixed(2) : ''));
    KL.halfCommon(S);
    if (KL.isB(S)) SE.seasonEnd(S);
    SO.checkBadges(S);
    return lines.concat(S._lines || []);
  };
  SE.seasonEnd = function (S) {
    var so = S.soccer, sea = S.sea, c = SO.club(S), lg = KL.LEAGUES[sea.lg], cu = so.cur;
    var st = SE.standings(S), pos = SE.myPos(S);
    cu.pos = pos; so.lastPos = pos; so.lastPosClub = c.id;
    line(S, '📊 ' + (sea.special || lg.name) + ' 最終順位：' + pos + '位（' + st.length + 'クラブ中）');
    if (cu.half) { so.contract--; line(S, '（途中加入のため、個人賞の対象外）'); SO.closeSeason(S); return; }
    if (pos === 1) { SO.trophy(S, (sea.special || lg.name) + '優勝'); KL.repAdd(S, 'nat', lg.japan ? 8 : 12); KL.push(S, { id: 'lgwin', cat: 'soccer', imp: 1, title: 'リーグ優勝', icon: '🏆', text: c.n + 'が' + (sea.special || lg.name) + 'を制した！' + (cu.apps > lg.games * 0.5 ? '\n主力として、タイトルに貢献した。' : '') + '\n\n' + (KL.Rec ? KL.Rec.reactText(S, 'title', ST.impact(S, 40, { club: c, times: so.trophies.filter(function (t) { return /リーグ優勝$|百年構想リーグ優勝$/.test(t.name); }).length })) : ''), choices: [] }); ST.pushMessages(S, 'title'); }
    so.lgOv = so.lgOv || {};
    if (lg.japan && sea.lg !== 'J1' && pos <= 2) { var up = sea.lg === 'J3' ? 'J2' : 'J1'; so.lgOv[c.id] = up; cu.notes.push(up + '昇格'); line(S, '🎉 ' + c.n + 'は' + up + '昇格を決めた！'); KL.repAdd(S, 'loc', 10); }
    else if (lg.japan && sea.lg !== 'J3' && pos >= st.length - 2) { var dn = sea.lg === 'J1' ? 'J2' : 'J3'; so.lgOv[c.id] = dn; cu.notes.push(dn + '降格'); line(S, '😢 ' + c.n + 'は' + dn + 'に降格してしまった…'); }
    else if (!lg.japan && pos >= st.length - 2) { cu.notes.push('降格圏'); line(S, '😢 ' + c.n + 'は降格圏でシーズンを終えた。'); so.contract = Math.min(so.contract, 0); }
    // 個人タイトル
    var lgG = cu.lgG || 0, lgA = cu.lgA || 0, games = sea.rounds.length;
    var stars = SO.realActive(S).filter(function (p) { var cc = KL.clubById(p.club); return cc && cc.l === sea.lg && (p.pos === 'ST' || p.pos === 'WG'); }).sort(function (x, y) { return y.ovr - x.ovr; });
    var base = { PL: 24, LL: 24, SA: 23, BL: 26, L1: 23, J1: 19, J2: 21, J3: 19 }[sea.lg] || 20;
    var rivalGoals = Math.round(base + U.gauss() * 3), rivalName = stars[0] ? stars[0].name : SO.genStar(sea.y, 3).name;
    if (S.rival && S.rival.club && KL.clubById(S.rival.club) && KL.clubById(S.rival.club).l === sea.lg && S.rival.lastLgG > rivalGoals) { rivalGoals = S.rival.lastLgG; rivalName = S.rival.name; }
    cu.topScorer = { name: rivalName, g: rivalGoals };
    if (lgG > rivalGoals || (lgG === rivalGoals && U.chance(0.5))) { SO.trophy(S, lg.name + '得点王'); KL.push(S, { id: 'topscorer', cat: 'soccer', imp: 1, title: '得点王', icon: '👟', text: 'リーグ戦' + lgG + 'ゴールで、' + lg.name + '得点王に輝いた！\n（2位は' + rivalName + 'の' + Math.min(rivalGoals, lgG) + '点）', choices: [] }); }
    else if (lgG >= 8) line(S, '得点ランキング：リーグ' + lgG + '点（得点王は' + rivalName + 'の' + rivalGoals + '点）');
    if (lgA >= Math.round(12 + U.gauss() * 2)) SO.trophy(S, lg.name + 'アシスト王');
    var rating = cu.rn ? cu.rs / cu.rn : 0;
    if (rating >= 7.15 && cu.apps >= games * 0.55) SO.trophy(S, lg.name + 'ベストイレブン');
    if (rating >= 7.45 && pos <= 3 && cu.apps >= games * 0.6) SO.trophy(S, lg.name + '年間MVP');
    if (KL.age(S) <= 21 && rating >= 7.0 && cu.apps >= games * 0.5) SO.trophy(S, lg.japan ? 'Jリーグ ベストヤングプレーヤー賞' : lg.name + ' 最優秀若手選手');
    // バロンドール候補
    var att = ['ST', 'WG', 'OM'].indexOf(so.pos) >= 0, ovr = SO.ovr(so);
    var gT = cu.goals + cu.ntGoals;
    var bScore = (ovr - 80) * 1.2 + (att ? KL.Rec.goalPts(gT, cu.ast) : KL.Rec.goalPts(gT * 1.6, cu.ast * 1.5)) + (rating - 6.8) * 5.5 + (lg.japan ? -20 : 0) + (so.pos === 'GK' ? 10 : so.pos === 'CB' || so.pos === 'DM' ? 6 : 0) + U.gauss() * 3;
    so.trophies.forEach(function (t) {
      if (t.season !== KL.seasonLabel(S)) return;
      if (/チャンピオンズリーグ優勝/.test(t.name)) bScore += 14; else if (/ワールドカップ優勝/.test(t.name)) bScore += 20; else if (/W杯 得点王|ワールドカップ 得点王/.test(t.name)) bScore += 8;
      else if (/ヨーロッパリーグ優勝/.test(t.name)) bScore += 4; else if (/リーグ優勝$/.test(t.name)) bScore += 6; else if (/得点王/.test(t.name)) bScore += 3; else if (/年間MVP/.test(t.name)) bScore += 3;
    });
    if (sea.wc) bScore += Math.min(10, sea.wc.goals * 1.2);
    so.ballonPending = cu.apps >= games * 0.5 ? { score: bScore, season: KL.seasonLabel(S), goals: cu.goals + cu.ntGoals, club: c.n, wc: sea.wc ? (so.wcWin && sea.wc.year === sea.y + 1 ? 'JPN' : 'other') : '' } : null;
    so.proYears++; so.clubYears = so.yearsClub === so.club ? (so.clubYears || 0) + 1 : 1; so.yearsClub = so.club;
    so.contract--;
    KL.repAdd(S, 'nat', 2);
    if (KL.Rec && KL.Rec.seasonEnd) KL.Rec.seasonEnd(S, cu);
    SO.closeSeason(S);
    sea.done = true;
    // 引退の決断
    var a = KL.age(S), eo = SO.eovr(S);
    if ((a >= 33 && eo < c.s - 7) || a >= 37 || (a >= 35 && eo < c.s - 3)) SE.retireEvent(S);
  };
  SE.retireEvent = function (S) {
    var so = S.soccer;
    KL.push(S, { id: 'retire', cat: 'soccer', imp: 2, title: '引退の決断', icon: '🌅', text: KL.age(S) + '歳。体は正直だ。\n通算' + so.totalApps + '試合' + so.totalGoals + '得点、代表' + so.caps + '試合' + so.ntGoals + '得点。\n現役を続ける？',
      choices: [
        { t: '現役続行（下のカテゴリーでも）', ok: KL.age(S) < 41 && SO.ovr(so) >= 58, fx: function (S) {
          var ovr = SO.ovr(so), c = U.pick(KL.CLUBS.filter(function (x) { return x.s <= ovr + 3 && x.s >= ovr - 8; })) || U.pick(KL.CLUBS.filter(function (x) { return x.l === 'J3'; }));
          if (c.id !== so.club) SO.join(S, c.id, SO.wage(S, c, ovr) * 0.7, 1, { quiet: true }); else so.contract = 1;
          return SO.club(S).n + 'で、もう1年戦う。';
        } },
        { t: 'スパイクを脱ぐ', ok: true, fx: function (S) { SO.retire(S); S.stage = 'retired'; S.sea = null; if (KL.Rec) KL.Rec.retireCeremony(S); KL.push(S, SO.secondCareer()); return '現役引退。たくさんの拍手に送られて、ピッチを去った。'; } }
      ] });
  };
})();
