/* Kani Life - サッカーの道 */
(function () {
  'use strict';
  var KL = window.KL, U = KL.U;
  var SO = KL.Soccer = {};
  KL.EVENTS = KL.EVENTS || [];

  SO.POS = {
    GK: { n: 'GK', jp: 'ゴールキーパー', w: { gk: 0.7, iq: 0.2, phy: 0.1 }, g: 0, a: 0.01 },
    CB: { n: 'CB', jp: 'センターバック', w: { def: 0.45, phy: 0.3, iq: 0.15, spd: 0.1 }, g: 0.05, a: 0.03 },
    SB: { n: 'SB', jp: 'サイドバック', w: { spd: 0.3, def: 0.3, pas: 0.2, phy: 0.2 }, g: 0.04, a: 0.12 },
    DM: { n: 'DM', jp: 'ボランチ', w: { def: 0.35, pas: 0.25, iq: 0.2, phy: 0.2 }, g: 0.04, a: 0.07 },
    CM: { n: 'CM', jp: 'セントラルMF', w: { pas: 0.35, iq: 0.25, def: 0.15, phy: 0.15, dri: 0.1 }, g: 0.09, a: 0.15 },
    OM: { n: 'OM', jp: 'トップ下', w: { pas: 0.3, dri: 0.25, iq: 0.25, sht: 0.2 }, g: 0.22, a: 0.25 },
    WG: { n: 'WG', jp: 'ウイング', w: { spd: 0.3, dri: 0.3, sht: 0.2, pas: 0.1, iq: 0.1 }, g: 0.28, a: 0.22 },
    ST: { n: 'ST', jp: 'ストライカー', w: { sht: 0.35, spd: 0.2, dri: 0.15, phy: 0.15, iq: 0.15 }, g: 0.42, a: 0.14 }
  };
  SO.SK = [
    { k: 'spd', n: 'スピード', base: ['ath'] }, { k: 'dri', n: 'ドリブル', base: ['ath', 'art'] },
    { k: 'pas', n: 'パス', base: ['int', 'art'] }, { k: 'sht', n: '決定力', base: ['ath', 'men'] },
    { k: 'phy', n: 'フィジカル', base: ['hp'] }, { k: 'def', n: '守備', base: ['hp', 'men'] },
    { k: 'iq', n: 'サッカーIQ', base: ['int'] }, { k: 'gk', n: 'セービング', base: ['ath', 'men'] }
  ];
  var SKN = {}; SO.SK.forEach(function (s) { SKN[s.k] = s.n; });
  SO.skName = SKN;

  SO.E = function (a) { return Math.min(70, 12 + 3.6 * (a - 5)); };
  SO.MAX_OVR = 92; // OVRの最高値
  SO.ovr = function (so, pos) {
    var w = SO.POS[pos || so.pos].w, v = 0;
    for (var k in w) v += (so.sk[k] || 0) * w[k];
    return Math.min(SO.MAX_OVR, Math.round(v));
  };
  SO.bestPos = function (so) {
    var best = null, bv = -1;
    for (var p in SO.POS) { var v = SO.ovr(so, p); if (v > bv) { bv = v; best = p; } }
    return best;
  };

  // ---------- 開始 ----------
  SO.start = function (S, level, teamName) {
    var st = S.st, exp = S.flags.soccerExp || 0;
    var so = S.soccer = {
      pos: 'ST', level: level, team: teamName, club: null, salary: 0, contract: 0,
      sk: {
        spd: st.ath * 0.6, dri: st.ath * 0.45 + exp * 0.6, pas: st.int * 0.25 + st.ath * 0.25 + exp * 0.3,
        sht: st.ath * 0.45 + exp * 0.4, phy: st.hp * 0.55, def: st.hp * 0.35 + st.men * 0.2, iq: st.int * 0.35 + exp * 0.3, gk: st.ath * 0.35
      },
      cap: {}, capBonus: U.ri(-3, 6) + Math.round(Math.max(0, ((S.tal.ath || 3) + (S.tal.hp || 3) + (S.tal.men || 3)) / 3 - 3.5) * 6), // 運動系の天才ほど上限が高い trust: 50, scout: 0, injury: 0,
      seasons: [], cur: null, totalApps: 0, totalGoals: 0, totalAst: 0, caps: 0, ntGoals: 0,
      trophies: [], europe: false, ballon: false, wcWin: false, youthNT: '', proYears: 0, retired: false, clubHist: []
    };
    SO.SK.forEach(function (s) {
      var avg = s.base.reduce(function (t, b) { return t + (S.tal[b] || 3); }, 0) / s.base.length;
      so.cap[s.k] = Math.min(99, Math.round(55 + avg * 9 + so.capBonus));
      so.sk[s.k] = Math.min(so.sk[s.k], so.cap[s.k] - 5);
    });
    so.pos = SO.bestPos(so) === 'GK' && S.st.ath > 30 ? 'ST' : SO.bestPos(so);
    so.tech = []; so.numHist = []; so.ballons = []; so.coach = null;
    SO.initApt(S); so.apt[so.pos] = Math.max(so.apt[so.pos], 70);
    S.track = 'soccer';
    newSeason(S);
    KL.log(S, teamName + 'でサッカーを始めた。', 2);
  };

  function skAge(a) { return a < 13 ? 1.2 : a < 19 ? 1.15 : a < 24 ? 1.0 : a < 28 ? 0.9 : a < 31 ? 0.5 : 0.25; }
  SO.grow = function (S, k, base) {
    var so = S.soccer, cap = so.cap[k], s = so.sk[k];
    var b = SO.SK.filter(function (x) { return x.k === k; })[0].base;
    var avg = b.reduce(function (t, x) { return t + (S.tal[x] || 3); }, 0) / b.length;
    var a = KL.age(S), gen = Math.max(0, avg - 3.5); // 天才度（素質★4.5以上で大きくなる）
    var mult = 0.55 + (avg - 1) * 0.24 + gen * 0.8;
    // 年齢による上限：天才ほど早く完成する（★5は16〜17歳で上限いっぱい）
    cap = cap * Math.min(1, 0.45 + (0.033 + gen * 0.022) * (a - 6)) * SO.oldCap(S, k);
    var g = base * 0.9 * mult * skAge(a) * (1 - S.fat / 230);
    var room = (cap - s) / cap;
    g *= room > 0 ? Math.max(0.12, Math.min(1, room * 3)) : 0.02;
    so.sk[k] = U.clamp(s + g, 0, 99);
    S._sd = S._sd || {}; S._sd[k] = (S._sd[k] || 0) + g;
    return g;
  };
  // 30代になると体を使う能力の上限が年々下がる（練習では打ち消しきれない）
  SO.PHYS = { spd: 1.3, phy: 1, dri: 0.8, sht: 0.6, def: 0.7, gk: 0.5 };
  SO.declineAge = function (S) { var c = S.care === undefined ? 50 : S.care; return 30 + (((S.tal.hp || 3) + (S.tal.men || 3)) / 2 >= 4.5 ? 1 : 0) + ((S.tal.hp || 3) >= 6 ? 1 : 0) + (c >= 75 ? 1 : c < 30 ? -1 : 0) + (c >= 92 ? 1 : 0); };
  SO.oldCap = function (S, k) { var a = KL.age(S), d0 = SO.declineAge(S), w = SO.PHYS[k]; if (!w || a <= d0) return 1; return Math.max(0.5, 1 - (a - d0) * 0.035 * w); };
  // 試合経験：出場が多いほど全能力が少しずつ伸びる（share = 出場割合 0〜1）
  SO.matchExp = function (S, share) {
    if (!share) return;
    var so = S.soccer;
    SO.SK.forEach(function (s) { if (s.k === 'gk' ? so.pos === 'GK' : true) SO.grow(S, s.k, 1.1 * share); });
  };
  SO.skAdd = function (S, k, v) { var so = S.soccer; so.sk[k] = U.clamp(so.sk[k] + v, 0, 99); S._sd = S._sd || {}; S._sd[k] = (S._sd[k] || 0) + v; };

  // ---------- ポジション適性 ----------
  SO.POS_KEYS = ['GK', 'CB', 'SB', 'DM', 'CM', 'OM', 'WG', 'ST'];
  SO.aptGrade = function (v) { return v >= 88 ? 'S' : v >= 72 ? 'A' : v >= 56 ? 'B' : v >= 40 ? 'C' : 'D'; };
  SO.APT_PEN = { S: 0, A: 2, B: 5, C: 10, D: 18 };
  SO.initApt = function (S) {
    var so = S.soccer, vals = SO.POS_KEYS.map(function (p) { return SO.ovr(so, p); });
    var mean = vals.reduce(function (t, v) { return t + v; }, 0) / vals.length;
    so.apt = {};
    SO.POS_KEYS.forEach(function (p, i) { so.apt[p] = U.clamp(Math.round(38 + (vals[i] - mean) * 2.2 + U.ri(-4, 4)), 15, 66); });
    var T = S.tal;
    if (T.art >= 5) { so.apt.OM += 10; so.apt.WG += 6; }
    if (T.ath >= 5) { so.apt.ST += 8; so.apt.WG += 8; }
    if (T.int >= 5) { so.apt.CM += 8; so.apt.DM += 8; }
    if (T.hp >= 5) { so.apt.CB += 6; so.apt.SB += 6; so.apt.DM += 4; }
    so.apt.GK = Math.min(so.apt.GK, 35);
  };
  SO.aptAdd = function (S, pos, v) { var so = S.soccer; if (!so || !so.apt) return; so.apt[pos] = U.clamp((so.apt[pos] || 30) + v, 0, 100); };
  SO.setPos = function (S, pos) { var so = S.soccer; so.pos = pos; if (!so.apt) SO.initApt(S); so.apt[pos] = Math.max(so.apt[pos], 76); };
  SO.apt = function (so, pos) { return so.apt ? (so.apt[pos || so.pos] || 30) : 80; };
  // 適性を含めた実際の力
  SO.eovr = function (S, pos) { var so = S.soccer; pos = pos || so.pos; return SO.ovr(so, pos) - SO.APT_PEN[SO.aptGrade(SO.apt(so, pos))]; };

  // ---------- 技 ----------
  SO.TECH = [
    { k: 'scissors', n: 'シザース', cat: 'dri', req: { dri: 60 }, b: 2, fx: '両足でボールをまたぎ、DFの足を止めた' },
    { k: 'double', n: 'ダブルタッチ', cat: 'dri', req: { dri: 68 }, b: 3, fx: '右から左へ、一瞬のダブルタッチ。DFが置き去りになる' },
    { k: 'elastico', n: 'エラシコ', cat: 'dri', req: { dri: 77 }, tal: { art: 4 }, b: 4, fx: 'アウトで外へ、瞬時にインで内へ――DFの重心が完全に逆を取られた' },
    { k: 'marseille', n: 'マルセイユルーレット', cat: 'dri', req: { dri: 80, phy: 60 }, b: 4, fx: 'ボールを足裏で引き、くるりと一回転。背後のDFが空を切る' },
    { k: 'heel', n: 'ヒールリフト', cat: 'dri', req: { dri: 86 }, tal: { art: 5 }, b: 5, fx: 'かかとで蹴り上げたボールが、DFの頭上を越えていく' },
    { k: 'slalom', n: '神の5人抜き', cat: 'dri', req: { dri: 89, spd: 84 }, gift: ['god', 'chosen'], b: 8, fx: '一人、二人、三人――止まらない。ボールが足に吸いついたまま、ゴール前まで運び切った', legend: true },
    { k: 'curl', n: '巻いたシュート', cat: 'sht', req: { sht: 70 }, b: 3, fx: 'インサイドで巻いたボールが、ファーサイドへ弧を描く' },
    { k: 'chip', n: 'ループシュート', cat: 'sht', req: { sht: 77, iq: 68 }, b: 3, fx: 'GKの位置を一瞬で見て、ふわりと頭上を越した' },
    { k: 'volley', n: 'ダイレクトボレー', cat: 'sht', req: { sht: 80, phy: 64 }, b: 4, fx: '浮き球をトラップせず、そのまま叩いた' },
    { k: 'knuckle', n: '無回転シュート', cat: 'sht', req: { sht: 85 }, b: 5, fx: '回転のないボールが、GKの手元で揺れて落ちた' },
    { k: 'bicycle', n: 'オーバーヘッド', cat: 'sht', req: { sht: 84, phy: 74 }, tal: { ath: 5 }, b: 5, fx: '背を向けたまま宙に舞い、体ごとボールを叩きつけた' },
    { k: 'through', n: 'スルーパス', cat: 'pas', req: { pas: 70 }, b: 3, fx: 'DFラインの裏へ、針の穴を通すパス' },
    { k: 'outside', n: 'アウトサイドパス', cat: 'pas', req: { pas: 77 }, b: 3, fx: 'アウトサイドでこすったボールが、DFの間をカーブして抜けた' },
    { k: 'nolook', n: 'ノールックパス', cat: 'pas', req: { pas: 80, iq: 77 }, b: 4, fx: '視線は右、ボールは左。誰も読めないパス' },
    { k: 'rabona', n: 'ラボーナ', cat: 'pas', req: { pas: 82, dri: 78 }, tal: { art: 5 }, b: 4, fx: '軸足の後ろから足を回すラボーナ。スタジアムがどよめく' },
    { k: 'tackle', n: 'スライディング', cat: 'def', req: { def: 70 }, b: 3, fx: '芝を滑り、ボールだけを正確に刈り取った' },
    { k: 'intercept', n: 'インターセプト', cat: 'def', req: { def: 77, iq: 74 }, b: 4, fx: 'パスコースを読み切り、一歩先でカットした' },
    { k: 'aerial', n: '空中戦', cat: 'def', req: { phy: 80 }, b: 3, fx: '誰よりも高く跳び、頭でボールを跳ね返した' },
    { k: 'pkstop', n: 'PKストップ', cat: 'gk', req: { gk: 80 }, b: 4, fx: '最後まで動かず、コースを見切って弾き出した' },
    { k: 'supersave', n: 'スーパーセーブ', cat: 'gk', req: { gk: 86 }, b: 5, fx: '指先一本。ありえない反応でボールをかき出した' }
  ];
  SO.techById = function (k) { return SO.TECH.filter(function (t) { return t.k === k; })[0]; };
  SO.hasTech = function (S, k) { var so = S.soccer; return !!(so && so.tech && so.tech.indexOf(k) >= 0); };
  SO.techOk = function (S, t) {
    var so = S.soccer;
    for (var k in t.req) if ((so.sk[k] || 0) < t.req[k]) return false;
    if (t.tal) for (var k2 in t.tal) if ((S.tal[k2] || 3) < t.tal[k2]) return false;
    if (t.gift && !(S.gift && t.gift.indexOf(S.gift.id) >= 0)) return false;
    if (t.cat === 'gk' && so.pos !== 'GK') return false;
    return true;
  };
  // 月ごと（プロ）・半年ごと（学生）に技を覚えるチャンス
  SO.checkTech = function (S, focus) {
    var so = S.soccer; if (!so) return; so.tech = so.tech || [];
    SO.TECH.forEach(function (t) {
      if (so.tech.indexOf(t.k) >= 0 || !SO.techOk(S, t)) return;
      var p = 0.22 + (focus === t.cat ? 0.3 : 0) + ((S.tal.art || 3) >= 6 && t.cat !== 'def' ? 0.2 : 0);
      if (!U.chance(p)) return;
      so.tech.push(t.k);
      KL.log(S, '技「' + t.n + '」を身につけた。', 1);
      KL.push(S, { id: 'tech_' + t.k, cat: 'soccer', imp: 1, title: '新しい技「' + t.n + '」', icon: t.legend ? '🌟' : '🪄',
        text: (t.legend ? '練習が終わったあと、誰もいないグラウンドで――\n\n' : '居残り練習で、何百回もくり返してきた動きが、ある日ふっと体に馴染んだ。\n\n') + '【' + t.n + '】\n' + t.fx + '。\n\n' + (t.legend ? 'それを見ていたコーチが、言葉を失って立ち尽くしていた。' : '試合の局面で「' + t.n + '」を選べるようになった。'), choices: [] });
    });
  };

  // ---------- 月ごとの練習（プロ） ----------
  SO.FOCUS = [
    { k: 'auto', n: 'おまかせ', d: '自分の弱点とポジションに合わせて決める' },
    { k: 'sht', n: 'シュート', d: '決定力' }, { k: 'dri', n: 'ドリブル', d: 'ドリブル・スピード' },
    { k: 'pas', n: 'パス', d: 'パス・サッカーIQ' }, { k: 'def', n: '守備', d: '守備・フィジカル' },
    { k: 'phy', n: 'フィジカル', d: 'フィジカル・スピード' }, { k: 'iq', n: '戦術・映像分析', d: 'サッカーIQ' },
    { k: 'gk', n: 'GK練習', d: 'セービング' }, { k: 'pos', n: '別ポジション', d: '別のポジションの適性' },
    { k: 'rest', n: 'コンディション重視', d: '疲労回復・怪我の予防' }
  ];
  SO.autoFocus = function (S) {
    var so = S.soccer, w = SO.POS[so.pos].w, worst = null, wv = 999;
    Object.keys(w).forEach(function (k) { var v = so.sk[k] / (so.cap[k] || 99); if (w[k] >= 0.15 && v < wv) { wv = v; worst = k; } });
    if (S.fat >= 70) return 'rest';
    return worst || 'iq';
  };
  SO.monthTrain = function (S, focus) {
    var so = S.soccer; if (!so) return;
    var f = focus === 'auto' || !focus ? SO.autoFocus(S) : focus;
    // チーム練習（全体）
    SO.SK.forEach(function (s) { if (s.k !== 'gk' || so.pos === 'GK') SO.grow(S, s.k, 0.12); });
    var g = 1.25;
    if (f === 'sht') SO.grow(S, 'sht', g);
    else if (f === 'dri') { SO.grow(S, 'dri', g); SO.grow(S, 'spd', g * 0.25); }
    else if (f === 'pas') { SO.grow(S, 'pas', g); SO.grow(S, 'iq', g * 0.25); }
    else if (f === 'def') { SO.grow(S, 'def', g); SO.grow(S, 'phy', g * 0.2); }
    else if (f === 'phy') { SO.grow(S, 'phy', g * 0.8); SO.grow(S, 'spd', g * 0.45); KL.grow(S, 'hp', 0.3); }
    else if (f === 'iq') { SO.grow(S, 'iq', g); KL.grow(S, 'int', 0.15); }
    else if (f === 'gk') { SO.grow(S, 'gk', g); }
    else if (f === 'pos') { var alt = so.altPos || SO.bestAlt(S); SO.aptAdd(S, alt, 6); }
    else if (f === 'rest') { KL.fatAdd(S, -14); S.care = U.clamp((S.care || 50) + 1, 0, 100); }
    if (f !== 'rest') KL.fatAdd(S, 3);
    so.lastFocus = f;
    SO.checkTech(S, f === 'phy' ? 'def' : f);
    SO.checkBadges(S);
  };
  SO.bestAlt = function (S) {
    var so = S.soccer, best = null, bv = -1;
    SO.POS_KEYS.forEach(function (p) { if (p === so.pos || p === 'GK') return; var v = SO.ovr(so, p); if (v > bv) { bv = v; best = p; } });
    return best;
  };

  // ---------- 監督 ----------
  SO.STYLES = ['攻撃的', '堅守速攻', 'ポゼッション', 'ハイプレス', '守備的', '若手起用'];
  SO.newCoach = function (S, c) {
    var jp = KL.LEAGUES[c.l].japan, N = KL.NAMES;
    var name = jp && U.chance(0.75) ? U.pick(N.sei) + ' ' + U.pick(N.m) : U.pick(N.fFirst) + '・' + U.pick(N.fLast);
    return { name: name + '監督', style: U.pick(SO.STYLES), like: 50, since: S.t, club: c.id };
  };

  SO.actions = function (S) {
    var so = S.soccer, L = [], pro = S.stage === 'pro';
    function a(id, n, d, fat, fx) { L.push({ id: id, n: n, d: d, fat: fat, fx: fx, soccer: true }); }
    a('s_team', pro ? 'チーム練習に全力' : 'チーム練習', '全能力・監督の信頼', 4, function (S, p) {
      SO.SK.forEach(function (s) { if (s.k !== 'gk' || so.pos === 'GK') SO.grow(S, s.k, 0.55 * p); });
      so.trust = U.clamp(so.trust + 3 * p, 0, 100);
    });
    if (so.pos === 'GK') a('s_gk', 'GK練習', 'セービング', 5, function (S, p) { SO.grow(S, 'gk', 2.8 * p); SO.grow(S, 'iq', 0.5 * p); });
    else {
      a('s_dri', 'ドリブル練習', 'ドリブル・スピード', 5, function (S, p) { SO.grow(S, 'dri', 2.6 * p); SO.grow(S, 'spd', 0.6 * p); });
      a('s_sht', 'シュート練習', '決定力', 5, function (S, p) { SO.grow(S, 'sht', 2.7 * p); });
      a('s_pas', 'パス・ビルドアップ', 'パス・サッカーIQ', 4, function (S, p) { SO.grow(S, 'pas', 2.6 * p); SO.grow(S, 'iq', 0.6 * p); });
      a('s_def', '守備練習', '守備・フィジカル', 5, function (S, p) { SO.grow(S, 'def', 2.6 * p); SO.grow(S, 'phy', 0.5 * p); });
    }
    a('s_phy', 'フィジカル強化', 'フィジカル・スピード・体力', 6, function (S, p) { SO.grow(S, 'phy', 2.3 * p); SO.grow(S, 'spd', 1.1 * p); KL.grow(S, 'hp', 0.8 * p); });
    a('s_iq', '戦術研究・映像分析', 'サッカーIQ', 2, function (S, p) { SO.grow(S, 'iq', 2.6 * p); KL.grow(S, 'int', 0.4 * p); });
    if (pro) a('s_media', 'メディア・SNS対応', '知名度', 2, function (S, p) { KL.repAdd(S, 'nat', 1.5 * p); KL.grow(S, 'com', 0.8 * p); });
    return L;
  };

  // ---------- シーズン管理 ----------
  // ---------- 特殊能力（バッジ） ----------
  SO.BADGES = [
    { k: 'speed', n: 'スピードスター', d: '得点率アップ', c: function (S, so) { return so.sk.spd >= 90; } },
    { k: 'dribble', n: 'ドリブラー', d: '仕掛けの成功率アップ', c: function (S, so) { return so.sk.dri >= 88; } },
    { k: 'passer', n: '司令塔', d: 'アシストが増える', c: function (S, so) { return so.sk.pas >= 85 && so.sk.iq >= 80; } },
    { k: 'striker', n: '点取り屋', d: '得点率アップ', c: function (S, so) { return so.seasons.some(function (x) { return x.goals >= 30 && x.club; }); } },
    { k: 'fk', n: 'FK職人', d: '大一番で直接FKが蹴れる', c: function (S, so) { return (so.fkTrain && so.sk.sht >= 72) || (so.sk.sht >= 85 && so.sk.pas >= 78); } },
    { k: 'pk', n: 'PKキッカー', d: '大一番でPKを狙える', c: function (S, so) { return S.st.men >= 75 && so.sk.sht >= 78; } },
    { k: 'iron', n: '鉄人', d: '怪我をしにくい', c: function (S, so) { return so.sk.phy >= 88 || (S.tal.hp >= 5 && KL.age(S) >= 20); } },
    { k: 'bigmatch', n: 'ビッグマッチ男', d: '大一番に強い', c: function (S, so) { return (so.bigOk || 0) >= 3; } },
    { k: 'captain', n: 'キャプテンシー', d: 'チーム力アップ', c: function (S, so) { return S.st.com >= 65 && so.trust >= 70 && (so.clubYears || 0) >= 3; } },
    { k: 'wall', n: '鉄壁', d: '守備で高評価', c: function (S, so) { return so.sk.def >= 88 && ['CB', 'SB', 'DM'].indexOf(so.pos) >= 0; } },
    { k: 'keeper', n: '守護神', d: '守備で高評価', c: function (S, so) { return so.pos === 'GK' && so.sk.gk >= 88; } },
    { k: 'allround', n: '万能型', d: 'どのポジションでも戦える', c: function (S, so) { return ['spd', 'dri', 'pas', 'sht', 'phy', 'def', 'iq'].filter(function (k) { return so.sk[k] >= 80; }).length >= 5; } },
    { k: 'treasure', n: '日本の至宝', d: '代表の象徴', c: function (S, so) { return so.caps >= 50; } }
  ];
  SO.hasBadge = function (S, k) { var so = S.soccer; return !!(so && so.badges && so.badges.indexOf(k) >= 0); };
  SO.badgeName = function (k) { var b = SO.BADGES.filter(function (x) { return x.k === k; })[0]; return b ? b.n : k; };
  SO.checkBadges = function (S) {
    var so = S.soccer; so.badges = so.badges || [];
    SO.BADGES.forEach(function (b) {
      if (so.badges.indexOf(b.k) >= 0) return;
      var ok = false; try { ok = b.c(S, so); } catch (e) { ok = false; }
      if (ok) { so.badges.push(b.k); KL.line(S, '🏅 特殊能力「' + b.n + '」を獲得！（' + b.d + '）'); KL.log(S, '特殊能力「' + b.n + '」を獲得。', 1); }
    });
  };

  // ---------- 背番号 ----------
  SO.ICON = { GK: [1], CB: [4, 5, 3], SB: [2, 3, 22], DM: [6, 16], CM: [8, 14], OM: [10, 8], WG: [7, 11, 10], ST: [9, 10, 11] };
  SO.isIcon = function (so) { return SO.ICON[so.pos].indexOf(so.num) >= 0; };
  SO.iconNum = function (so, ace) { var L = SO.ICON[so.pos]; return ace && ['OM', 'WG', 'ST'].indexOf(so.pos) >= 0 ? (U.chance(0.5) ? 10 : L[0]) : L[0]; };
  SO.bigNum = function (so, pro) { var base = so.pos === 'GK' ? [21, 23, 30, 31] : pro ? [13, 15, 17, 18, 19, 20, 24, 25, 26, 27, 28, 29, 33, 34, 37, 41] : [12, 13, 14, 15, 16, 17, 18, 19, 20]; return U.pick(base); };
  // シーズンのはじめに背番号を決める（エースになれば定番の番号を託される）
  SO.seasonNumber = function (S) {
    var so = S.soccer, ovr = SO.ovr(so);
    if (so.club) {
      var c = SO.club(S);
      if (!so.num) { so.num = ovr >= c.s + 1 ? SO.iconNum(so, ovr >= c.s + 3) : SO.bigNum(so, true); return; }
      if (!SO.isIcon(so) && ovr >= c.s && so.trust >= 55 && U.chance(0.45)) {
        var nn = SO.iconNum(so, ovr >= c.s + 3);
        KL.line(S, '👕 背番号' + so.num + '→' + nn + '。チームの顔として「' + nn + '番」を託された！');
        if (so.cur) so.cur.notes.push('背番号' + nn + 'を継承'); so.num = nn; KL.repAdd(S, 'nat', 2);
      }
      return;
    }
    // 学生・ユース年代（チームが変わったら番号も決め直し）
    var d = ovr - SO.E(KL.age(S));
    if (!so.num || so.numTeam !== so.team) { so.num = d >= 6 ? SO.iconNum(so, d >= 10) : SO.bigNum(so, false); so.numTeam = so.team; return; }
    if (!SO.isIcon(so) && d >= 6) { var n2 = SO.iconNum(so, d >= 10); KL.line(S, '👕 ' + so.team + 'で背番号' + n2 + 'をもらった！'); so.num = n2; }
  };

  function newSeason(S) {
    var so = S.soccer;
    if (!so.club) SO.seasonNumber(S);
    so.cur = { label: KL.seasonLabel(S), club: so.club, team: SO.teamName(S), lg: SO.leagueName(S), num: so.num, apps: 0, goals: 0, ast: 0, rs: 0, rn: 0, ntApps: 0, ntGoals: 0, notes: [], ovr: SO.ovr(so) };
  }
  function closeSeason(S) {
    var so = S.soccer, c = so.cur; if (!c) return;
    c.rating = c.rn ? U.r1(c.rs / c.rn) : 0; c.ovrEnd = SO.ovr(so); c.age = KL.age(S);
    so.seasons.push(c);
    c.closed = true;
  }
  SO.club = function (S, id) {
    var so = S.soccer; id = id || (so && so.club); if (!id) return null;
    var c = KL.clubById(id), ov = so && so.lgOv && so.lgOv[id];
    return ov ? { id: c.id, n: c.n, s: c.s + ({ J1: 4, J2: 0, J3: -4 }[ov] - { J1: 4, J2: 0, J3: -4 }[c.l]), l: ov } : c;
  };
  SO.teamName = function (S) { var so = S.soccer; if (so.club) return SO.club(S).n; return so.team || '—'; };
  SO.leagueName = function (S) {
    var so = S.soccer;
    if (so.club) return KL.LEAGUES[SO.club(S).l].name;
    return { shonen: '少年団', jr: 'ジュニア', bukatsu: '中学部活', machi: '街クラブ', jy: 'ジュニアユース', hs: '高校サッカー', hs_power: '高校サッカー', youth: 'ユース', univ: '大学リーグ' }[so.level] || '';
  };
  SO.HOME = { '大阪': ['gosaka', 'cosaka'], '東京': ['ftokyo', 'tokyov', 'machida'], '神奈川': ['yokohamafm', 'kawasaki'], '埼玉': ['urawa'], '千葉': ['chiba', 'kashiwa'], '茨城': ['kashima', 'mito'], '愛知': ['nagoya'], '静岡': ['shimizu'], '京都': ['kyoto'], '兵庫': ['kobe'], '岡山': ['okayama'], '広島': ['hiroshima'], '福岡': ['fukuoka'], '長崎': ['nagasaki'] };
  SO.homeClub = function (S) { var h = SO.HOME[S.pref]; return KL.clubById(h ? U.pick(h) : U.pick(KL.CLUBS.filter(function (c) { return c.l === 'J1'; })).id); };
  SO.levelStr = { shonen: 40, jr: 62, bukatsu: 38, machi: 50, jy: 66, hs: 45, hs_power: 70, youth: 70, univ: 60 };

  // ---------- 実在選手の加齢 ----------
  SO.realNow = function (S, row) {
    var diff = KL.seasonStart(S) - 2026, age = row[4] + diff, o = row[3];
    for (var i = 0; i < diff; i++) {
      var ag = row[4] + i;
      o += ag < 24 ? 1.5 : ag < 30 ? 0 : ag < 33 ? -1.5 : -3;
    }
    var retireAge = 36 + (row[0].length % 3);
    if (row[2] === 'GK') retireAge += 3;
    if (age > retireAge || o < 60) return null;
    return { name: row[0], club: row[1], pos: row[2], ovr: Math.round(Math.min(SO.MAX_OVR, o)), age: age, nat: row[5] };
  };
  SO.realActive = function (S) {
    return KL.REAL_PLAYERS.map(function (r) { return SO.realNow(S, r); }).filter(Boolean);
  };
  // 世代交代用の架空スター
  function seeded(seed) { var x = Math.sin(seed) * 10000; return x - Math.floor(x); }
  SO.genStar = function (year, idx) {
    var s1 = seeded(year * 31 + idx * 7), s2 = seeded(year * 17 + idx * 13), s3 = seeded(year * 7 + idx * 3);
    var F = KL.NAMES.fFirst, L = KL.NAMES.fLast;
    var europe = KL.CLUBS.filter(function (c) { return KL.LEAGUES[c.l].europe && c.s >= 84; });
    return {
      name: F[Math.floor(s1 * F.length)] + '・' + L[Math.floor(s2 * L.length)],
      club: europe[Math.floor(s3 * europe.length)].id, pos: ['ST', 'WG', 'OM', 'ST', 'CM'][idx % 5],
      ovr: 87 + Math.floor(s3 * 6) > SO.MAX_OVR ? SO.MAX_OVR : 87 + Math.floor(s3 * 6), age: 21 + Math.floor(s1 * 7), gen: true
    };
  };
  SO.worldStars = function (S) {
    var list = SO.realActive(S).filter(function (p) { return p.ovr >= 84; });
    var y = KL.seasonStart(S), need = Math.max(0, 12 - list.length);
    for (var i = 0; i < need; i++) list.push(SO.genStar(y - (i % 4), i));
    list.sort(function (a, b) { return b.ovr - a.ovr; });
    return list;
  };
  SO.teammates = function (S) {
    var so = S.soccer; if (!so || !so.club) return [];
    return SO.realActive(S).filter(function (p) { return p.club === so.club; }).sort(function (a, b) { return b.ovr - a.ovr; });
  };

  // ---------- 給料 ----------
  SO.wage = function (S, club, ovr) {
    var c = typeof club === 'string' ? KL.clubById(club) : club;
    var base = Math.pow(10, (c.s - 40) / 16) * 1e6; // 年俸（円）
    var w = base * Math.pow(Math.max(0.5, ovr / c.s), 5);
    var min = KL.LEAGUES[c.l].japan ? (c.l === 'J1' ? 4.8e6 : c.l === 'J2' ? 3.6e6 : 2.4e6) : 2e7;
    return Math.round(Math.max(min, w) / 1e5) * 1e5;
  };

  // ---------- 毎ターン（プロになる前） ----------
  SO.turn = function (S) {
    var so = S.soccer;
    if (!so || so.retired) return;
    if (so.club && KL.Season) return; // プロは試合ごとに進む（season.js）
    if (!so.cur || so.cur.closed) newSeason(S);
    SO.halfAge(S);
    if (so.injury > 0) so.injury--;
    var injP = (0.04 + S.fat / 380) * (SO.hasBadge(S, 'iron') ? 0.5 : 1) * (1.3 - (S.care || 50) / 170);
    var hurt = 0;
    if (U.chance(injP)) { hurt = U.ri(1, 3); KL.line(S, '⚠️ 怪我で約' + hurt + 'か月離脱した。'); so.cur.notes.push('負傷離脱'); }
    youthHalf(S, hurt);
    SO.checkBadges(S); SO.checkTech(S, null);
    if (KL.isB(S)) closeSeason(S);
  };
  // 加齢による衰え（半年ごと）。体の強い素質（体力・メンタル）とケアで遅くなる
  SO.halfAge = function (S) {
    var so = S.soccer, a = KL.age(S), d0 = SO.declineAge(S);
    if (a < d0) return;
    Object.keys(SO.PHYS).forEach(function (k) { var lim = so.cap[k] * SO.oldCap(S, k); if (so.sk[k] > lim) SO.skAdd(S, k, -(so.sk[k] - lim) * 0.35); });
    var m = (a >= d0 + 6 ? 3.4 : a >= d0 + 4 ? 2.8 : a >= d0 + 2 ? 2.1 : 1.0) * 0.5;
    SO.skAdd(S, 'spd', -1.2 * m); SO.skAdd(S, 'phy', -0.7 * m);
    if (a >= d0 + 1) { SO.skAdd(S, 'dri', -0.7 * m); SO.skAdd(S, 'sht', -0.6 * m); SO.skAdd(S, 'def', -0.5 * m); SO.skAdd(S, 'gk', -0.4 * m); }
    if (a >= d0 + 4) SO.skAdd(S, 'pas', -0.3 * m);
    else { SO.skAdd(S, 'iq', 0.2); SO.skAdd(S, 'pas', 0.1); } // 経験で円熟する
  };
  SO.newSeason = function (S) { newSeason(S); };
  SO.closeSeason = function (S) { closeSeason(S); };

  // ---------- ユース年代 ----------
  function youthHalf(S, hurt) {
    var so = S.soccer, a = KL.age(S), ovr = SO.ovr(so), lv = SO.levelStr[so.level] || 45;
    var need = SO.E(a) + (lv - 50) / 4;
    var share = U.sig((ovr - need) / 4) * (1 - hurt / 7);
    var games = 12, apps = Math.round(games * U.clamp(share * U.rf(0.85, 1.1), 0, 1));
    var pw = SO.POS[so.pos], f = Math.min(2, Math.exp((ovr - need) / 10));
    var goals = 0, ast = 0;
    for (var i = 0; i < apps; i++) { if (U.chance(Math.min(0.9, pw.g * f * 1.3))) goals++; if (U.chance(pw.g * f * 0.3)) goals++; if (U.chance(Math.min(0.7, pw.a * f))) ast++; }
    var rating = U.clamp(6.3 + (ovr - need) * 0.04 + (apps ? (goals + ast * 0.6) / apps * 0.6 : 0) + U.gauss() * 0.2, 5.5, 8.6);
    var c = so.cur; c.apps += apps; c.goals += goals; c.ast += ast; if (apps) { c.rs += rating * apps; c.rn += apps; }
    so.totalGoals += goals; so.totalAst += ast; so.totalApps += apps;
    SO.matchExp(S, apps / games * 0.8);
    so.scout += Math.max(0, (ovr - SO.E(a)) * 0.6 + goals * 0.3);
    if (apps >= games * 0.7) KL.repAdd(S, 'sch', 2); if (goals >= 8) KL.repAdd(S, 'loc', 3);
    KL.line(S, '⚽ ' + so.team + '：' + apps + '試合 ' + goals + '得点 ' + ast + 'アシスト');
    if (apps < games * 0.3) KL.line(S, '出場機会が少なかった（チーム内の序列：控え）');
  }

  // 年代別大会の決勝を実況で遊ぶ
  SO.youthFinal = function (S, t, o) {
    KL.Match.push(S, { id: o.id, title: o.title, icon: o.icon || '🏆', venue: o.venue, myTeam: o.my, opp: o.opp, oppLv: SO.E(KL.age(S)) + (o.lv || 6),
      pWin: t.pWin, starter: true, stakes: o.stakes || '勝てば日本一だ。', youth: true, rival: o.rival,
      onWin: function (S) { return o.win(S); }, onLose: function (S) { return o.lose(S); } });
  };
  // 大会のシミュレーション
  SO.tournament = function (S, name, teamStr, rounds, base, step, stopFinal) {
    var so = S.soccer, a = KL.age(S), ovr = SO.ovr(so);
    var bonus = (ovr - SO.E(a)) * 0.35;
    var r = 0, goals = 0, pw = SO.POS[so.pos];
    for (; r < rounds.length; r++) {
      if (stopFinal && r === rounds.length - 1 && KL.Match) { so.totalGoals += goals; if (so.cur) so.cur.goals += goals; return { final: true, round: r, goals: goals, pWin: U.sig((teamStr + bonus - (base + r * step)) / 5), res: '決勝進出' }; }
      if (U.chance(Math.min(0.9, pw.g * Math.exp((ovr - SO.E(a)) / 12) * 1.2))) goals++;
      var opp = base + r * step;
      if (!U.chance(U.sig((teamStr + bonus - opp) / 5))) break;
    }
    so.totalGoals += goals; if (so.cur) so.cur.goals += goals;
    var res = r >= rounds.length ? '優勝' : rounds[r] + '敗退';
    return { res: res, round: r, win: r >= rounds.length, goals: goals };
  };

  // ---------- プロ ----------
  function competitor(S) {
    var so = S.soccer, ovr = SO.ovr(so);
    return SO.teammates(S).filter(function (p) { return p.pos === so.pos && p.ovr >= ovr + 2; })[0];
  }
  SO.clubPower = function (S) {
    var so = S.soccer, c = SO.club(S);
    return c.s + Math.max(0, SO.ovr(so) - c.s) * 0.25 + (SO.hasBadge(S, 'captain') ? 1 : 0);
  };
  function trophy(S, name) { var so = S.soccer; so.trophies.push({ name: name, season: KL.seasonLabel(S) }); so.cur.notes.push(name); KL.title(S, name); KL.log(S, name + '！', 2); }
  SO.trophy = trophy;

  // ---------- オファー ----------
  SO.offers = function (S, mode) {
    var so = S.soccer, ovr = SO.ovr(so), a = KL.age(S), list = [];
    var cur = so.club ? SO.club(S) : null;
    var rating = 0, last = so.seasons[so.seasons.length - 1];
    if (last && last.rating) rating = last.rating;
    var pot = ovr + Math.max(0, (24 - a)) * 0.8; // 若さによる伸びしろ評価
    var share = last && cur ? last.apps / KL.LEAGUES[cur.l].games : 0.6;
    var cands = KL.CLUBS.filter(function (c) {
      if (cur && c.id === cur.id) return false;
      var lg = KL.LEAGUES[c.l];
      var gap = pot - c.s;
      if (mode === 'rookie') return lg.japan ? gap >= -4 : gap >= -3 && c.s <= 78;
      return gap >= -3 && gap <= 12 && (!cur || c.s >= cur.s - 2 || share < 0.4);
    });
    cands = U.shuffle(cands).sort(function (x, y) { return y.s - x.s; });
    var interest = function (c) {
      var lg = KL.LEAGUES[c.l], p = mode === 'rookie' ? 0.35 : 0.1 + (so.contract <= 0 ? 0.1 : 0);
      if (!lg.japan) p *= (S.rep.nat > 25 || rating >= 7.0 || so.caps > 0) ? 1.4 : 0.35;
      if (rating >= 7.2) p += 0.2;
      if (cur && c.s > cur.s + 3) p += 0.15;
      return p;
    };
    for (var i = 0; i < cands.length && list.length < 3; i++) if (U.chance(interest(cands[i]))) list.push(cands[i]);
    return list.map(function (c) { return { club: c.id, name: c.n, lg: KL.LEAGUES[c.l].name, s: c.s, wage: SO.wage(S, c, ovr) * (mode === 'rookie' ? 0.6 : 1) }; });
  };
  // ---------- オファーの詳細 ----------
  SO.offerInfo = function (S, o) {
    var so = S.soccer, c = KL.clubById(o.club), lg = KL.LEAGUES[c.l], ovr = SO.ovr(so);
    var ranked = KL.CLUBS.filter(function (x) { return x.l === c.l; }).sort(function (a, b) { return b.s - a.s; });
    var rk = ranked.findIndex(function (x) { return x.id === c.id; }) + 1;
    var comp = lg.europe ? (rk <= lg.cl ? 'CL出場圏' : rk <= lg.cl + lg.el ? 'EL出場圏' : '欧州大会なし') : lg.acl && rk <= lg.acl ? 'ACL出場圏' : 'アジア大会なし';
    var rival = SO.realActive(S).filter(function (p) { return p.club === c.id && p.pos === so.pos; }).sort(function (a, b) { return b.ovr - a.ovr; })[0];
    var share = U.sig((ovr - (c.s - 1)) / 4) * 0.97 * (rival && rival.ovr >= ovr + 2 ? 0.65 : 1);
    var role = share >= 0.75 ? '主力（先発の中心）' : share >= 0.5 ? 'ローテーション' : share >= 0.25 ? '途中出場が中心' : '控え';
    return { comp: comp, rival: rival, share: share, role: role, rank: rk };
  };
  SO.offerCard = function (S, o) {
    var inf = SO.offerInfo(S, o), c = KL.clubById(o.club);
    return { title: o.name, sub: o.lg + '・チーム力' + c.s + '（リーグ' + inf.rank + '番手）', rows: [
      ['年俸', U.yen(o.wage)], ['大会', inf.comp],
      ['ライバル', inf.rival ? inf.rival.name + '（OVR' + inf.rival.ovr + '・' + inf.rival.age + '歳）' : '目立ったライバルなし'],
      ['予想される立場', inf.role + '・出場率' + Math.round(inf.share * 100) + '%']
    ] };
  };
  SO.join = function (S, clubId, wage, years, opt) {
    opt = opt || {};
    var so = S.soccer, c = KL.clubById(clubId), first = !so.club && !(so.clubHist && so.clubHist.length);
    var prev = so.club ? SO.club(S) : null;
    if (so.club) so.clubHist.push({ club: so.club, until: KL.seasonLabel(S) });
    if (so.cur && !so.cur.closed && so.cur.club && so.cur.club !== clubId) { so.cur.notes.push('シーズン途中で' + c.n + 'へ移籍'); so.cur.team = c.n; so.cur.lg = KL.LEAGUES[c.l].name; so.cur.club = clubId; }
    so.club = clubId; so.salary = Math.round(wage); so.contract = years || 3; so.trust = 45; so.level = 'pro';
    so.compSeason = null; so.lastPos = null; so.coach = SO.newCoach(S, c); so.teamRel = 45; so.clubYears = 0; so.yearsClub = clubId;
    var ovrJ = SO.ovr(so); so.num = ovrJ >= c.s + 2 ? SO.iconNum(so, ovrJ >= c.s + 4) : SO.bigNum(so, true);
    if (so.cur && !so.cur.closed) so.cur.num = so.num;
    if (KL.LEAGUES[c.l].europe && !so.europe) { so.europe = true; KL.repAdd(S, 'nat', 10); }
    KL.log(S, c.n + '（' + KL.LEAGUES[c.l].name + '）に加入。年俸' + U.yen(wage) + '。', 2);
    var tm = KL.newNPC(S, 'friend', S.sex, { met: c.n, like: 45, job: 'プロサッカー選手（' + c.n + '）', ad: U.ri(-4, 4) }); tm.rel = 'teammate';
    if (KL.Season && KL.Season.onJoin) KL.Season.onJoin(S, c, prev);
    if (KL.Rec && KL.Rec.onJoin) KL.Rec.onJoin(S, c, prev, first);
    if (!opt.quiet && KL.Season && KL.Season.numberEvent) KL.Season.numberEvent(S, true);
  };

  // ---------- 他者評価 ----------
  SO.perception = function (S) {
    var so = S.soccer, a = KL.age(S), ovr = SO.ovr(so), pj = SO.POS[so.pos].jp;
    if (so.retired) return { main: (so.caps ? '元日本代表の' : '元プロ' + (so.proYears ? '' : 'を目指した')) + 'サッカー選手', tags: so.trophies.slice(-2).map(function (t) { return t.name; }) };
    if (so.club) {
      var c = SO.club(S), lg = KL.LEAGUES[c.l];
      var last = so.seasons[so.seasons.length - 1];
      if (so.ballon) return { main: '世界最高の選手', tags: [c.n, '日本代表'] };
      if (so.ballonBest && so.ballonBest <= 3) return { main: '世界トップクラスのフットボーラー', tags: [c.n] };
      if (so.ntNow && ovr >= 78) return { main: '日本代表の主力' + pj, tags: [c.n, lg.name] };
      if (so.ntNow) return { main: '日本代表に呼ばれるくらいの' + pj, tags: [c.n] };
      if (!lg.japan) return { main: '海外で戦う日本人' + pj, tags: [c.n, lg.name] };
      if (last && last.goals >= 12) return { main: c.n + 'のエース', tags: [lg.name] };
      return { main: c.n + 'の' + (so.trust > 60 ? 'レギュラー' : '選手'), tags: [lg.name] };
    }
    var d = ovr - SO.E(a);
    var scope = S.rep.nat >= 35 ? '全国区の' : S.rep.loc >= 40 ? '地元で有名な' : S.rep.sch >= 40 ? '学校中が知ってる' : '隣のクラスの';
    if (so.youthNT && a <= 18) return { main: so.youthNT + '日本代表のサッカー選手', tags: [so.team] };
    if (so.youthNT) return { main: '元' + so.youthNT + '日本代表の' + (S.stage === 'univ' ? '大学サッカー選手' : 'サッカー選手'), tags: [so.team] };
    if (d >= 12) return { main: scope + '、全国でも注目のサッカー少年', tags: [so.team] };
    if (d >= 5) return { main: scope + '、めちゃくちゃサッカーが上手い人', tags: [so.team] };
    if (d >= -2) return { main: scope + '、サッカーが上手い人', tags: [so.team] };
    return { main: scope + '、サッカー部の人', tags: [so.team] };
  };

  // ======================================================
  //  サッカーの出来事
  // ======================================================
  var E = KL.EVENTS;
  function isSo(S) { return S.track === 'soccer' && S.soccer && !S.soccer.retired; }
  function age(S) { return KL.age(S); }

  // 少年団に入る
  E.push({
    id: 's_join_kid', sched: true, pri: 6,
    cond: function (S) { return !S.track && age(S) >= 6 && age(S) <= 9 && KL.isB(S) && (S.flags.soccerExp || 0) >= 3 && !S.flags.soccerDeclined; },
    title: 'サッカー少年団の勧誘', icon: '⚽',
    text: function (S) { return '近所のサッカー少年団のコーチが声をかけてきた。「' + S.mei + 'くん、ボール扱いがうまいね。うちでやってみない？」'; },
    choices: [
      { t: '入団する', fx: function (S) { SO.start(S, 'shonen', U.pick(KL.PLACE) + 'FC少年団'); KL.push(S, posPickEvent(S)); return '少年団に入団した。ここから、サッカーの道が始まる。'; } },
      { t: '今はやめておく', fx: function (S) { S.flags.soccerDeclined = true; return 'サッカーは遊びで楽しむことにした。'; } }
    ]
  });
  // 遅れて始める（中学の部活）
  E.push({
    id: 's_join_jhs', sched: true, pri: 6,
    cond: function (S) { return !S.track && age(S) === 12 && KL.isB(S) && (S.flags.soccerExp || 0) >= 2; },
    title: '部活選び', icon: '⚽', text: '中学校の部活紹介。サッカー部の先輩たちが楽しそうにボールを蹴っている。',
    choices: [
      { t: 'サッカー部に入る', fx: function (S) { SO.start(S, 'bukatsu', S.school + 'サッカー部'); KL.push(S, posPickEvent(S)); return 'サッカー部に入部した。'; } },
      { t: '別の道を選ぶ', fx: function () { return 'サッカーとは別の青春を選んだ。'; } }
    ]
  });
  function posPickEvent(S) {
    var so = S.soccer;
    var ranked = Object.keys(SO.POS).map(function (p) { return { p: p, v: SO.ovr(so, p) - SO.APT_PEN[SO.aptGrade(SO.apt(so, p))] }; }).sort(function (a, b) { return b.v - a.v; });
    return {
      title: 'ポジションを決める', icon: '📋',
      text: 'コーチ「適性を見ると、' + SO.POS[ranked[0].p].jp + 'か' + SO.POS[ranked[1].p].jp + 'が向いてそうだな。どこをやりたい？」\n\n適性はS〜Dの5段階。低いポジションでは実力を出しきれないけど、続けていれば上がっていく。',
      choices: ranked.map(function (r, i) {
        return { t: SO.POS[r.p].jp + '（' + r.p + '）・適性' + SO.aptGrade(SO.apt(so, r.p)) + (i < 2 ? ' ★' : ''), ok: true, fx: function (S) { SO.setPos(S, r.p); return SO.POS[r.p].jp + 'として練習することになった。'; } };
      })
    };
  }
  SO.posPickEvent = posPickEvent;

  // Jクラブのジュニアのセレクション
  E.push({
    id: 's_jr_select', sched: true, pri: 6,
    cond: function (S) { return isSo(S) && S.soccer.level === 'shonen' && age(S) >= 9 && age(S) <= 11 && !KL.isB(S) && SO.ovr(S.soccer) >= SO.E(age(S)) + 2 && !S.flags['jrTry' + age(S)]; },
    title: 'Jクラブのセレクション', icon: '📣',
    text: function (S) { return '少年団での活躍が目に留まり、Jクラブのジュニアチームのセレクション案内が届いた。'; },
    choices: [
      { t: 'セレクションを受ける', fx: function (S) {
        S.flags['jrTry' + age(S)] = true;
        var ok = KL.chk(S, SO.ovr(S.soccer), SO.E(age(S)) + 5, 3);
        if (ok) { var jc = SO.homeClub(S); S.soccer.level = 'jr'; S.soccer.team = jc.n + ' U-12'; S.soccer.homeClub = jc.id; KL.repAdd(S, 'loc', 15); KL.log(S, jc.n + 'のジュニアチームに合格した。', 2); return '合格！ ' + jc.n + ' U-12 の一員になった。'; }
        return '不合格だった。悔しさをバネにもっと練習しよう。';
      } },
      { t: '今のチームで頑張る', fx: function (S) { S.flags['jrTry' + age(S)] = true; return '仲間と一緒に、今のチームで上を目指すことにした。'; } }
    ]
  });
  // 全日本U-12
  E.push({
    id: 's_u12', sched: true, pri: 7, cond: function (S) { return isSo(S) && age(S) === 11 && !KL.isB(S); },
    title: '全日本U-12選手権', icon: '🏆',
    text: function (S) {
      var t = SO.tournament(S, 'U-12', SO.levelStr[S.soccer.level] + 6, ['県大会', '1回戦', '2回戦', '準々決勝', '準決勝', '決勝'], 48, 3);
      if (t.round >= 3) KL.repAdd(S, 'loc', 10 + t.round * 3);
      if (t.win) { KL.title(S, '全日本U-12選手権 優勝'); KL.repAdd(S, 'nat', 10); }
      return S.soccer.team + 'で挑んだ小学生最後の全国大会。結果は' + t.res + '。自分は' + t.goals + '得点。';
    }, choices: []
  });
  // 中学でのサッカー
  E.push({
    id: 's_jhs_choice', sched: true, pri: 3, cond: function (S) { return isSo(S) && age(S) === 12 && KL.isB(S); },
    title: '中学でのサッカー', icon: '⚽',
    text: function (S) { return '中学ではどこでサッカーを続ける？（今の実力：OVR ' + SO.ovr(S.soccer) + '）'; },
    choices: [
      { t: 'Jクラブのジュニアユース（セレクション）', fx: function (S) {
        var ok = KL.chk(S, SO.ovr(S.soccer), SO.E(12) + 4 - (S.soccer.level === 'jr' ? 5 : 0), 3);
        if (ok) { var jc = S.soccer.homeClub ? KL.clubById(S.soccer.homeClub) : SO.homeClub(S); S.soccer.homeClub = jc.id; S.soccer.level = 'jy'; S.soccer.team = jc.n + ' U-15'; KL.log(S, jc.n + ' U-15に加入。', 1); return '合格！ ' + jc.n + ' U-15 に加入した。'; }
        S.soccer.level = 'bukatsu'; S.soccer.team = '中学サッカー部'; return '不合格…。中学のサッカー部でやることになった。';
      } },
      { t: '強い街クラブ', fx: function (S) { S.soccer.level = 'machi'; S.soccer.team = U.pick(KL.PLACE) + 'FC U-15'; return '地元の強豪街クラブに入った。'; } },
      { t: '中学のサッカー部', fx: function (S) { S.soccer.level = 'bukatsu'; S.soccer.team = '中学サッカー部'; return '友達と一緒に部活でサッカーを続ける。'; } },
      { t: 'サッカーをやめる', fx: function (S) { quit(S); return 'サッカーをやめた。これからは別のことに打ち込もう。'; } }
    ]
  });
  // 中学の全国大会
  E.push({
    id: 's_u15', sched: true, pri: 7, cond: function (S) { return isSo(S) && age(S) === 14 && !KL.isB(S); },
    title: function (S) { return S.soccer.level === 'bukatsu' ? '全国中学校サッカー大会' : '高円宮杯 U-15'; }, icon: '🏆',
    text: function (S) {
      var nm = S.soccer.level === 'bukatsu' ? '全中' : '高円宮杯U-15';
      var t = SO.tournament(S, 'U-15', SO.levelStr[S.soccer.level] + 4, ['地区予選', '1回戦', '2回戦', '準々決勝', '準決勝', '決勝'], 50, 3, true);
      if (t.round >= 3) KL.repAdd(S, 'loc', 12 + t.round * 3);
      if (t.final) {
        SO.youthFinal(S, t, { id: 'u15final', title: nm + ' 決勝', venue: '全国大会の決勝のピッチ', my: S.soccer.team, opp: U.pick(['青森山田中', '神村学園中', 'FC東京U-15深川', '鹿島アントラーズジュニアユース', '大宮アルディージャU15', 'ガンバ大阪ジュニアユース']).replace(S.soccer.team, '名古屋グランパスU-15'), lv: 5,
          win: function (S) { KL.title(S, '中学年代 全国制覇'); KL.repAdd(S, 'nat', 12); KL.log(S, nm + 'で日本一。', 2); return '🏆 中学年代の日本一！ 名前が全国に知られ始めた。'; },
          lose: function (S) { KL.title(S, nm + ' 準優勝'); return '準優勝。表彰式で銀メダルを握りしめた。'; } });
        return '中学最後の全国大会。勝ち進んで、ついに決勝へ！（ここまで' + t.goals + '得点）';
      }
      if (t.win) { KL.title(S, '中学年代 全国制覇'); KL.repAdd(S, 'nat', 12); }
      return '中学最後の全国大会。結果は' + t.res + '。自分は' + t.goals + '得点。' + (t.round >= 4 ? '名前が全国に知られ始めた。' : '');
    }, choices: []
  });
  // 年代別代表
  E.push({
    id: 's_youthnt', sched: true, pri: 6, repeat: true,
    cond: function (S) { return isSo(S) && !S.soccer.club && age(S) >= 14 && age(S) <= 17 && SO.ovr(S.soccer) >= SO.E(age(S)) + 9 && S.soccer.youthNT !== ('U-' + (age(S) <= 15 ? 15 : 17)); },
    title: '年代別日本代表に選出', icon: '🇯🇵',
    text: function (S) { var u = 'U-' + (age(S) <= 15 ? 15 : 17); S.soccer.youthNT = u; KL.repAdd(S, 'nat', 12); KL.repAdd(S, 'sch', 20); S.soccer.scout += 30; KL.log(S, u + '日本代表に選ばれた。', 2); return u + '日本代表に選ばれた！ 学校ではちょっとした有名人だ。'; },
    choices: []
  });
  E.push({
    id: 's_u17wc', sched: true, pri: 7, cond: function (S) { return isSo(S) && age(S) === 16 && !KL.isB(S) && S.soccer.youthNT === 'U-17'; },
    title: 'U-17ワールドカップ', icon: '🌍',
    text: function (S) {
      var t = SO.tournament(S, 'U-17W杯', 66, ['グループステージ', 'ラウンド32', 'ラウンド16', '準々決勝', '準決勝', '決勝'], 60, 3, true);
      KL.repAdd(S, 'nat', 8 + t.round * 3); S.soccer.scout += 20 + t.round * 5;
      var rv = S.rival, rvTxt = rv ? '\n\nグループステージで当たった' + rv.natJp + 'に、とんでもない選手がいた。' + rv.name + '。同い年だという。試合後、向こうから握手を求めてきた。「次は大人の舞台で」。' : '';
      if (rv && KL.Rec) KL.Rec.rivalMeet(S, 'U-17W杯');
      if (t.final) {
        SO.youthFinal(S, t, { id: 'u17final', title: 'U-17W杯 決勝', icon: '🌍', venue: '世界大会の決勝', my: 'U-17日本代表', opp: rv ? 'U-17' + rv.natJp + '代表' : 'U-17ブラジル代表', lv: 9, rival: !!rv, stakes: '世界一まで、あと1勝。',
          win: function (S) { KL.title(S, 'U-17ワールドカップ優勝'); KL.repAdd(S, 'nat', 16); S.soccer.scout += 30; KL.log(S, 'U-17W杯で世界一。', 2); if (rv) KL.Rec.rivalH2H(S, 1); return '🌍 U-17世界一！ 日本中のニュースが、この話題で持ちきりになった。'; },
          lose: function (S) { KL.title(S, 'U-17ワールドカップ準優勝'); if (rv) KL.Rec.rivalH2H(S, -1); return '準優勝。世界の頂点の背中が、はっきり見えた。'; } });
        return 'U-17日本代表として世界と戦い、決勝まで勝ち上がった！（ここまで' + t.goals + '得点）' + rvTxt;
      }
      if (t.win) KL.title(S, 'U-17ワールドカップ優勝');
      return 'U-17日本代表として世界と戦った。結果は' + t.res + '、' + t.goals + '得点。海外スカウトの視線を感じた。' + rvTxt;
    }, choices: []
  });
  // 高校でのサッカー
  E.push({
    id: 's_hs_choice', sched: true, pri: 2, cond: function (S) { return isSo(S) && age(S) === 15 && KL.isB(S); },
    title: '高校でのサッカー', icon: '⚽',
    text: function (S) { return '高校ではどこでサッカーをする？（OVR ' + SO.ovr(S.soccer) + '）'; },
    choices: [
      { t: 'Jクラブのユースに昇格・加入', req: function (S) { return S.soccer.level === 'jy' || SO.ovr(S.soccer) >= SO.E(15) + 6; }, hint: true, fx: function (S) {
        var ok = KL.chk(S, SO.ovr(S.soccer), SO.E(15) + 3 - (S.soccer.level === 'jy' ? 4 : 0), 3);
        if (ok) { var jc = S.soccer.homeClub ? KL.clubById(S.soccer.homeClub) : SO.homeClub(S); S.soccer.homeClub = jc.id; S.soccer.level = 'youth'; S.soccer.team = jc.n + ' U-18'; KL.log(S, jc.n + ' U-18に昇格・加入。', 1); return jc.n + ' U-18 の一員になった。プロまであと一歩。'; }
        S.soccer.level = 'hs'; S.soccer.team = S.school + 'サッカー部'; return 'ユースには上がれなかった。高校のサッカー部で這い上がる。';
      } },
      { t: 'サッカー強豪校（推薦）', req: function (S) { return SO.ovr(S.soccer) >= SO.E(15) - 2; }, hint: true, fx: function (S) { var n = U.pick(KL.PLACE) + '学園高校'; S.school = n; S.soccer.level = 'hs_power'; S.soccer.team = n + 'サッカー部'; return n + 'にサッカー推薦で入学した。選手権を目指す。'; } },
      { t: '普通の高校のサッカー部', fx: function (S) { S.soccer.level = 'hs'; S.soccer.team = S.school + 'サッカー部'; return '高校のサッカー部で、楽しくも本気で。'; } },
      { t: 'サッカーをやめる', fx: function (S) { quit(S); return '高校ではサッカーをやめることにした。'; } }
    ]
  });
  // 高校選手権
  E.push({
    id: 's_senshuken', sched: true, pri: 7, repeat: true,
    cond: function (S) { return isSo(S) && !S.soccer.club && (S.soccer.level === 'hs' || S.soccer.level === 'hs_power') && age(S) >= 15 && age(S) <= 17 && !KL.isB(S) && !S.flags['sen' + age(S)]; },
    title: '全国高校サッカー選手権', icon: '🏟️',
    text: function (S) {
      S.flags['sen' + age(S)] = true;
      var t = SO.tournament(S, '選手権', SO.levelStr[S.soccer.level] + (age(S) - 15) * 3, ['県予選', '1回戦', '2回戦', '3回戦', '準々決勝', '準決勝', '決勝（国立）'], 50, 3, true);
      if (t.round >= 1) KL.repAdd(S, 'loc', 10 + t.round * 2);
      if (t.final) {
        KL.repAdd(S, 'nat', 18); S.soccer.scout += 20;
        KL.Match.push(S, { id: 'senshuken', title: '高校サッカー選手権 決勝', icon: '🏟️', venue: '満員の国立競技場', myTeam: S.soccer.team.replace(/サッカー部$/, ''), opp: U.pick(['青森山田', '流通経済大柏', '前橋育英', '静岡学園', '東福岡', '神村学園']), oppLv: SO.E(age(S)) + 6,
          pWin: t.pWin, starter: true, stakes: 'テレビの前の日本中が見ている。',
          onWin: function (S) { KL.title(S, '高校サッカー選手権 優勝'); KL.repAdd(S, 'nat', 15); KL.log(S, '高校選手権で日本一。', 2); return '🏆 日本一！ 国立で、仲間と抱き合って泣いた。'; },
          onLose: function (S) { KL.title(S, '高校サッカー選手権 準優勝'); return '準優勝。それでも、この冬のことは一生忘れない。'; } });
        return '冬の選手権。勝ち進んで、ついに国立での決勝へ！（ここまで' + t.goals + '得点）';
      }
      if (t.round >= 4) { KL.repAdd(S, 'nat', 6 + t.round * 2); S.soccer.scout += 15; }
      if (t.win) { KL.title(S, '高校サッカー選手権 優勝'); KL.repAdd(S, 'nat', 15); KL.log(S, '高校選手権で日本一。', 2); }
      return '冬の選手権。結果は' + t.res + '。自分は' + t.goals + '得点。' + (t.round >= 5 ? '国立のピッチに立った。' : t.round === 0 ? '県予選で涙をのんだ。' : '');
    }, choices: []
  });
  // ユースの大会
  E.push({
    id: 's_youth_cup', sched: true, pri: 7, repeat: true,
    cond: function (S) { return isSo(S) && S.soccer.level === 'youth' && age(S) >= 16 && age(S) <= 17 && KL.isB(S) && !S.flags['yc' + age(S)]; },
    title: '日本クラブユース選手権', icon: '🏆',
    text: function (S) {
      S.flags['yc' + age(S)] = true;
      var t = SO.tournament(S, 'クラブユース', 72, ['グループステージ', 'ラウンド16', '準々決勝', '準決勝', '決勝'], 64, 3, true);
      KL.repAdd(S, 'loc', 6 + t.round * 2); S.soccer.scout += 5 + t.round * 3;
      if (age(S) === 17) S.soccer.scout += 10;
      if (t.final) {
        SO.youthFinal(S, t, { id: 'ycfinal' + age(S), title: 'クラブユース選手権 決勝', venue: '夏の決勝のピッチ', my: S.soccer.team, opp: U.pick(['FC東京U-18', '浦和レッズユース', 'サンフレッチェ広島ユース', '川崎フロンターレU-18', '鹿島アントラーズユース']), lv: 6,
          win: function (S) { KL.title(S, 'クラブユース選手権 優勝'); KL.repAdd(S, 'nat', 6); return '🏆 クラブユース日本一！ トップチームの監督も見に来ていたらしい。'; },
          lose: function (S) { return '準優勝。それでも、夏の決勝のピッチは特別だった。'; } });
        return (age(S) === 16 ? '1年目の夏' : '最後の夏') + '。ユースの大一番で決勝まで勝ち上がった！（ここまで' + t.goals + '得点）';
      }
      if (t.win) KL.title(S, 'クラブユース選手権 優勝');
      return (age(S) === 16 ? '1年目の夏。上級生に混じって' : 'ユース最後の夏。') + '結果は' + t.res + '、' + t.goals + '得点。';
    }, choices: []
  });
  // 2種登録・トップ昇格
  E.push({
    id: 's_top_debut', sched: true, pri: 6,
    cond: function (S) { return isSo(S) && S.soccer.level === 'youth' && age(S) === 17 && KL.isB(S) && SO.ovr(S.soccer) >= 57; },
    title: '2種登録', icon: '✨',
    text: function (S) { KL.repAdd(S, 'nat', 6); return KL.clubById(S.soccer.homeClub).n + 'のトップチームに2種登録された。高校生ながら、プロの練習に参加する日々。'; }, choices: []
  });
  // 進路（プロ or 大学 or 一般）
  E.push({
    id: 's_pro_offer', sched: true, pri: 2,
    cond: function (S) { return isSo(S) && !S.soccer.club && age(S) === 17 && !KL.isB(S); },
    title: '進路決定：プロへの扉', icon: '📝',
    text: function (S) {
      var so = S.soccer, ovr = SO.ovr(so);
      var offers = SO.offers(S, 'rookie');
      if (so.level === 'youth' && so.homeClub && ovr >= 55 && !offers.some(function (o) { return o.club === so.homeClub; })) { var hc = KL.clubById(so.homeClub); offers.unshift({ club: hc.id, name: hc.n, lg: KL.LEAGUES[hc.l].name, s: hc.s, wage: SO.wage(S, hc, ovr) * 0.6, top: true }); }
      if (ovr < 48) offers = [];
      S._offers = offers.slice(0, 3);
      return offers.length ? 'スカウトから正式オファーが届いた！（OVR ' + ovr + '）' : 'プロからのオファーは届かなかった…（OVR ' + ovr + '）。';
    },
    cards: function (S) { return (S._offers || []).map(function (o) { return SO.offerCard(S, o); }); },
    choices: [0, 1, 2].map(function (i) {
      return { t: function (S) { var o = S._offers && S._offers[i]; return o ? o.name + '（' + o.lg + '）年俸' + U.yen(o.wage) + (o.top ? ' ※トップ昇格' : '') : ''; }, req: function (S) { return S._offers && S._offers[i]; },
        fx: function (S) { var o = S._offers[i]; S.soccer.pending = { club: o.club, wage: o.wage, years: 3 }; S.plan = 'pro'; KL.log(S, o.name + 'への加入が内定。', 2); return o.name + 'への加入が内定！ 卒業後、プロサッカー選手になる。'; } };
    }).concat([
      { t: '大学でサッカーを続ける', fx: function (S) { S.plan = 'univ'; S.flags.soccerUniv = true; var u = S.st.int >= 60 ? '難関私大' : '体育大学'; S.nextSchool = u + '（スポーツ推薦）'; return '大学サッカーで4年間鍛え、改めてプロを目指す。'; } },
      { t: 'サッカーをやめて普通に進学・就職', fx: function (S) { quit(S); return 'サッカーは高校で区切りをつけた。'; } }
    ])
  });
  // 大学サッカー開始
  E.push({
    id: 's_univ_start', sched: true, pri: 6,
    cond: function (S) { return isSo(S) && !S.soccer.club && S.stage === 'univ' && S.soccer.level !== 'univ'; },
    title: '大学サッカー部', icon: '🎓', text: function (S) { S.soccer.level = 'univ'; S.soccer.team = S.school.replace(/（.*）/, '') + 'サッカー部'; return '大学サッカー部に入部した。4年後のプロ入りを目指す。'; }, choices: []
  });
  E.push({
    id: 's_univ_offer', sched: true, pri: 2,
    cond: function (S) { return isSo(S) && !S.soccer.club && !S.soccer.pending && S.stage === 'univ' && age(S) === 21 && !KL.isB(S); },
    title: '大学4年：プロ入りのチャンス', icon: '📝',
    text: function (S) {
      var ovr = SO.ovr(S.soccer), offers = ovr >= 54 ? SO.offers(S, 'rookie') : [];
      S._offers = offers;
      return offers.length ? 'Jクラブからオファーが届いた！（OVR ' + ovr + '）' : 'プロからのオファーはなかった（OVR ' + ovr + '）。';
    },
    cards: function (S) { return (S._offers || []).map(function (o) { return SO.offerCard(S, o); }); },
    choices: [0, 1, 2].map(function (i) {
      return { t: function (S) { var o = S._offers && S._offers[i]; return o ? o.name + '（' + o.lg + '）年俸' + U.yen(o.wage) : ''; }, req: function (S) { return S._offers && S._offers[i]; },
        fx: function (S) { var o = S._offers[i]; S.soccer.pending = { club: o.club, wage: o.wage, years: 3 }; KL.log(S, o.name + 'への加入が内定。', 2); return o.name + 'への加入が内定！ 卒業後、プロの世界へ。'; } };
    }).concat([{ t: 'プロは諦めて就職する', fx: function (S) { quit(S); return 'サッカーは大学で終わり。社会人として生きていく。'; } }])
  });

  // 年俸交渉
  SO.negotiate = function (S, o) {
    var so = S.soccer, c = KL.clubById(o.club), want = U.sig((SO.ovr(so) - c.s + 2) / 3); // 相手がどれだけ欲しがっているか
    KL.push(S, { id: 's_nego', title: o.name + 'との契約交渉', icon: '🤝', text: '提示は年俸' + U.yen(o.wage) + '・' + (o.years || 3) + '年契約。\n先方の熱意：' + (want >= 0.75 ? 'どうしても欲しいらしい' : want >= 0.45 ? 'かなり乗り気' : '様子見の雰囲気'), cards: [SO.offerCard(S, o)],
      choices: [
        { t: 'このままサインする', ok: true, fx: function (S) { SO.join(S, o.club, o.wage, o.years || U.ri(2, 4)); return '✍️ サイン完了。' + o.name + 'への移籍が決まった！'; } },
        { t: '年俸アップを要求（+30%）', ok: true, fx: function (S) { if (U.chance(0.25 + want * 0.7)) { SO.join(S, o.club, Math.round(o.wage * 1.3), o.years || U.ri(2, 4)); return '要求が通った！ 年俸' + U.yen(o.wage * 1.3) + 'で' + o.name + 'へ。'; } return '「その条件では難しい」。交渉は決裂し、残留することになった。'; } },
        { t: '強気に要求（+70%）', ok: true, fx: function (S) { if (U.chance(want * 0.6 - 0.05)) { SO.join(S, o.club, Math.round(o.wage * 1.7), o.years || U.ri(2, 4)); KL.repAdd(S, 'nat', 2); return 'まさかの満額回答！ 年俸' + U.yen(o.wage * 1.7) + 'で' + o.name + 'へ。'; } so.trust = Math.max(0, so.trust - 5); return '先方は席を立った。交渉決裂。今のクラブにも話が伝わり、少し気まずい。'; } }
      ] });
  };

  // 引退
  E.push({
    id: 's_retire', sched: true, pri: 3, repeat: true,
    cond: function (S) {
      if (!isSo(S) || !S.soccer.club || !KL.isB(S)) return false;
      var a = age(S), so = S.soccer, c = SO.club(S);
      return (a >= 33 && SO.ovr(so) < c.s - 7) || a >= 37;
    },
    title: '引退の決断', icon: '🌅',
    text: function (S) { var so = S.soccer; return KL.age(S) + '歳。体は正直だ。通算' + so.totalApps + '試合' + so.totalGoals + '得点。現役を続ける？'; },
    choices: [
      { t: '現役続行（下のカテゴリーでも）', req: function (S) { return age(S) < 41; }, fx: function (S) {
        var so = S.soccer, ovr = SO.ovr(so);
        var c = U.pick(KL.CLUBS.filter(function (x) { return x.s <= ovr + 3 && x.s >= ovr - 8; })) || U.pick(KL.CLUBS.filter(function (x) { return x.l === 'J3'; }));
        if (c.id !== so.club) SO.join(S, c.id, SO.wage(S, c, ovr) * 0.7, 1); else so.contract = 1;
        return SO.club(S).n + 'でもう1年戦う。';
      } },
      { t: 'スパイクを脱ぐ', fx: function (S) { SO.retire(S); KL.push(S, secondCareer()); return '現役引退。たくさんの拍手に送られて、ピッチを去った。'; } }
    ]
  });
  SO.retire = function (S) {
    var so = S.soccer;
    if (so.cur && !so.cur.closed) closeSeason(S);
    so.retired = true; so.retireAge = KL.age(S);
    S.track = null;
    KL.log(S, KL.age(S) + '歳で現役を引退（通算' + so.totalApps + '試合' + so.totalGoals + '得点、代表' + so.caps + '試合）。', 2);
  };
  function secondCareer() {
    return {
      title: 'セカンドキャリア', icon: '🧭', text: '引退後はどう生きる？',
      choices: [
        { t: '指導者になる', ok: true, fx: function (S) { S.job = { id: 'coach', name: 'サッカー指導者', title: 0, perf: 40, years: 0 }; S.stage = 'work'; KL.log(S, '指導者としての道を歩み始めた。'); return 'ライセンスを取り、指導者の道へ。'; } },
        { t: '解説者・タレントになる', ok: true, fx: function (S) { S.stage = 'free'; S.talent = 'サッカー解説者'; S.flags.commentator = true; KL.repAdd(S, 'nat', 5); return 'テレビでサッカーを語る仕事を始めた。'; } },
        { t: '一般企業に就職する', ok: true, fx: function (S) { var jd = KL.JOBS.filter(function (j) { return j.id === 'sales'; })[0]; KL.setJob(S, jd); S.stage = 'work'; return '一社会人として、新しいスタートを切った。'; } },
        { t: 'のんびり暮らす', ok: true, fx: function (S) { S.stage = 'retired'; return '貯えで穏やかに暮らすことにした。'; } }
      ]
    };
  }
  SO.secondCareer = secondCareer;

  function quit(S) {
    if (!S.soccer) return;
    if (S.soccer.cur && !S.soccer.cur.closed) closeSeason(S);
    S.soccer.retired = true; S.soccer.retireAge = KL.age(S);
    S.track = null;
    KL.log(S, 'サッカーをやめた。');
  }
  SO.quit = quit;
})();
