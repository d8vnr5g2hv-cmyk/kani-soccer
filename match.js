/* Kani Life - 試合（遊ぶ試合の実況と、おまかせ試合の計算） */
(function () {
  'use strict';
  var KL = window.KL, U = KL.U, SO = KL.Soccer, ST = KL.Story;
  var M = KL.Match = {};

  function grp(pos) { return pos === 'GK' ? 'gk' : (pos === 'CB' || pos === 'SB') ? 'df' : (pos === 'DM' || pos === 'CM') ? 'mf' : 'fw'; }
  M.grp = grp;
  function sk(so, ks) { return ks.reduce(function (t, k) { return t + (so.sk[k] || 0); }, 0) / ks.length; }
  function poisson(l) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L && k < 12); return k - 1; }
  M.poisson = poisson;
  function mateName(S, ctx) {
    if (ctx && ctx.nt) return U.pick(KL.Rec ? KL.Rec.ntMates(S) : ['10番', 'キャプテン']);
    if (ctx && ctx.youth) return U.pick(['10番', '右サイドの仲間', 'キャプテン', '同期の相棒', 'ボランチの先輩']);
    var t = S.soccer && S.soccer.club ? SO.teammates(S).filter(function (p) { return p.pos !== 'GK'; }) : [];
    return t.length ? U.pick(t.slice(0, 8)).name : U.pick(['10番', '右サイドの味方', 'キャプテン']);
  }
  M.giftBonus = function (S) { var g = S.gift && S.gift.id; return g === 'god' || g === 'chosen' ? 3 : g === 'prodigy' ? 1.5 : g === 'six' ? 0.6 : 0; };

  // ======================================================
  //  強さ・得点期待値
  // ======================================================
  M.lam = function (a, b, home, tac) {
    var l = 1.3 * Math.exp((a - b) / 18) * (home === true ? 1.08 : home === false ? 0.93 : 1);
    if (tac === 'atk') l *= 1.15; if (tac === 'def') l *= 0.85;
    return U.clamp(l, 0.15, 4.2);
  };
  M.lamOpp = function (a, b, home, tac) {
    var l = 1.3 * Math.exp((b - a) / 18) * (home === true ? 0.93 : home === false ? 1.08 : 1);
    if (tac === 'atk') l *= 1.12; if (tac === 'def') l *= 0.8;
    return U.clamp(l, 0.15, 4.2);
  };
  // 自分の90分あたりの得点・アシスト期待値
  M.rates = function (S, oppS) {
    var so = S.soccer, eo = SO.eovr(S) + M.giftBonus(S) + (S.form || 0) * 0.25, d = eo - oppS, pw = SO.POS[so.pos], b = function (k) { return SO.hasBadge(S, k); };
    var f = Math.exp(d / 12);
    var g = pw.g * f * (0.55 + so.sk.sht / 115), a = pw.a * f * (0.6 + so.sk.pas / 125);
    g *= (b('speed') ? 1.05 : 1) * (b('striker') ? 1.06 : 1) * (b('fk') ? 1.04 : 1) * (b('dribble') ? 1.03 : 1);
    a *= b('passer') ? 1.12 : 1;
    // 上限に向かってなめらかに頭打ちになる
    var gc = M.giftBonus(S) >= 3 ? 0.95 : 0.88, ac = 0.48;
    g = gc * (1 - Math.exp(-g / gc)); a = ac * (1 - Math.exp(-a / ac));
    return { g: g, a: a, eo: eo };
  };

  // ======================================================
  //  おまかせ試合（一瞬で計算）
  // ======================================================
  M.sim = function (S, ctx) {
    var so = S.soccer, min = ctx.sel ? ctx.sel.min : 0;
    var lm = M.lam(ctx.myS, ctx.oppS, ctx.home), lo = M.lamOpp(ctx.myS, ctx.oppS, ctx.home);
    var my = { min: min, g: 0, a: 0, r: 0, tech: [] };
    if (min > 0 && so) {
      var rt = M.rates(S, ctx.oppS), sh = min / 90;
      my.g = poisson(rt.g * sh);
      lm = Math.max(0.12, lm - rt.g * sh * 0.55);
    }
    var gf = poisson(lm) + my.g, ga = poisson(lo);
    if (min > 0 && so) {
      var others = gf - my.g, rt2 = M.rates(S, ctx.oppS);
      for (var i = 0; i < others; i++) if (U.chance(Math.min(0.55, rt2.a * (min / 90) / Math.max(1, lm) * 1.4))) my.a++;
    }
    var res = { gf: gf, ga: ga, my: my, pk: null, et: false, log: [] };
    M.decide(S, ctx, res);
    if (min > 0) my.r = M.rating(S, ctx, res, 0);
    return res;
  };
  // 勝敗が必要な試合（ノックアウト）
  M.decide = function (S, ctx, res) {
    if (!ctx.ko) { res.win = res.gf > res.ga ? true : res.gf < res.ga ? false : null; return; }
    var af = res.gf + (ctx.agg ? ctx.agg.gf : 0), aa = res.ga + (ctx.agg ? ctx.agg.ga : 0);
    if (af === aa) {
      res.et = true;
      var a = poisson(M.lam(ctx.myS, ctx.oppS, null) / 3), b = poisson(M.lamOpp(ctx.myS, ctx.oppS, null) / 3);
      res.gf += a; res.ga += b; af += a; aa += b;
      if (af === aa) {
        var mine = U.chance(0.5 + U.clamp((ctx.myS - ctx.oppS) / 60, -0.12, 0.12) + ((S.st.men || 50) - 50) / 600);
        res.pk = mine ? { gf: U.ri(4, 5), ga: U.ri(2, 4) } : { gf: U.ri(2, 4), ga: U.ri(4, 5) };
        if (res.pk.gf === res.pk.ga) res.pk.gf++;
        res.win = mine; return;
      }
    }
    res.win = af > aa;
  };
  M.rating = function (S, ctx, res, actBonus) {
    var so = S.soccer, g = grp(so.pos), my = res.my;
    var r = 6.1 + my.g * 0.95 + my.a * 0.55 + (actBonus || 0);
    if (res.win === true) r += 0.3; else if (res.win === false) r -= 0.3;
    if ((g === 'df' || g === 'gk') && res.ga === 0 && my.min >= 60) r += 0.55;
    if (g === 'gk') r += U.clamp((ctx.oppS - ctx.myS) * 0.02, -0.2, 0.4);
    r += (SO.eovr(S) - ctx.oppS) * 0.018 + U.gauss() * 0.3;
    if (SO.hasBadge(S, 'wall') || SO.hasBadge(S, 'keeper')) r += 0.12;
    if (my.min < 30) r = 6.0 + (r - 6.0) * 0.6;
    return U.clamp(Math.round(r * 10) / 10, 4.0, 10.0);
  };

  // ======================================================
  //  遊ぶ試合（局面を選ぶ）
  // ======================================================
  M.TACTICS = [
    { k: 'atk', n: '攻めろ', d: '点は取りやすいが、取られやすくもなる' },
    { k: 'bal', n: 'いつも通り', d: '自分たちのサッカーをする' },
    { k: 'def', n: '守り切れ', d: '失点を減らすが、チャンスも減る' }
  ];
  M.begin = function (S, ctx) {
    var sel = ctx.sel || { start: true, min: 90 };
    var enter = sel.start ? 0 : U.ri(58, 72);
    var times = sel.start ? [U.ri(10, 19), U.ri(31, 42), U.ri(51, 60), U.ri(68, 77), U.ri(84, 89)] : [enter + U.ri(4, 8), U.ri(80, 85), U.ri(87, 90)];
    if (sel.start && U.chance(0.65)) times.splice(U.ri(1, 3), 1); // 4局面のことが多い
    var m = { ctx: ctx, min: 0, gf: 0, ga: 0, times: times, pi: 0, enter: enter, log: [], tac: 'bal', my: { min: sel.start ? 90 : 90 - enter, g: 0, a: 0, tech: [], act: 0, key: [] }, done: false, goalsLog: [] };
    var so = S.soccer;
    m.log.push('🏟️ ' + (ctx.venue || 'スタジアム') + '。' + ctx.my + ' vs ' + ctx.opp + (ctx.stakes ? '\n' + ctx.stakes : ''));
    if (so && so.num) m.log.push(sel.start ? '📋 スタメン発表。背番号' + so.num + '、' + SO.POS[so.pos].jp + 'で先発だ。' : '📋 今日はベンチスタート。出番を待つ。');
    return m;
  };
  M.setTac = function (m, k) { m.tac = k; m.log.push('監督の指示：「' + ({ atk: '前から行くぞ。攻めろ！', bal: 'いつも通りやろう', def: 'まずは守備から。焦るな' })[k] + '」'); };

  // 背景で試合を進める（自分の局面以外の得点）
  function runTo(S, m, to) {
    var ctx = m.ctx, from = m.min; if (to <= from) return;
    var lm = M.lam(ctx.myS, ctx.oppS, ctx.home, m.tac) * 0.62, lo = M.lamOpp(ctx.myS, ctx.oppS, ctx.home, m.tac) * 0.85;
    var sh = (to - from) / 90;
    // 負けているときは攻め、勝っているときは守る
    var d = m.gf - m.ga;
    if (d < 0 && to > 60) { lm *= 1.15; lo *= 1.1; } if (d > 0 && to > 70) { lm *= 0.85; lo *= 1.1; }
    var a = poisson(lm * sh), b = poisson(lo * sh);
    var evs = [];
    for (var i = 0; i < a; i++) evs.push({ t: U.ri(from + 1, to), me: true });
    for (var j = 0; j < b; j++) evs.push({ t: U.ri(from + 1, to), me: false });
    evs.sort(function (x, y) { return x.t - y.t; });
    evs.forEach(function (e) {
      if (e.me) {
        m.gf++;
        var who = mateName(S, ctx), ast = m.my.min > 0 && e.t >= m.enter && U.chance(0.14);
        if (ast) { m.my.a++; m.my.act += 0.2; }
        m.log.push('⚽ ' + e.t + '分　' + ST.say(S, 'mc_teamgoal', ['{w}のゴール！ ' + m.gf + '-' + m.ga, '{w}が押し込んだ！ ' + m.gf + '-' + m.ga, 'こぼれ球を{w}が蹴り込む！ ' + m.gf + '-' + m.ga, '{w}、見事なヘディング！ ' + m.gf + '-' + m.ga, 'セットプレーから{w}！ ' + m.gf + '-' + m.ga]).replace(/\{w\}/g, who) + (ast ? '（アシスト：自分）' : ''));
      } else {
        m.ga++;
        m.log.push('😣 ' + e.t + '分　' + ST.say(S, 'mc_oppgoal', ['{o}に決められた。' + m.gf + '-' + m.ga, '一瞬のスキを突かれ、失点。' + m.gf + '-' + m.ga, '{o}のカウンター。ネットが揺れた。' + m.gf + '-' + m.ga, 'セットプレーから失点。' + m.gf + '-' + m.ga, 'ミドルシュートが突き刺さる。' + m.gf + '-' + m.ga]).replace(/\{o\}/g, ctx.opp));
      }
    });
    if (!a && !b && to - from >= 15 && U.chance(0.45)) m.log.push('… ' + ST.say(S, 'mc_flow', ['一進一退の攻防が続く。', 'スタジアムの歓声が地鳴りのように響く。', '相手のポゼッションの時間帯。じっと耐える。', '中盤で激しい潰し合い。', 'ポストを叩く惜しいシュートがあった。', '相手GKの好セーブ。まだ0点のまま', 'サポーターのチャントが一段と大きくなる。', 'ボールを持つ時間が増えてきた。流れはこっちだ。']));
    m.min = to;
  }

  // 局面の状況と選択肢
  // 局面：t = c（決定機）/ b（組み立て）/ d（守備）
  var SIT = {
    fw: [
      { t: 'c', s: 'ペナルティエリアの手前でボールを受けた。前を向ける。', o: ['shoot', 'dri', 'pass'] },
      { t: 'c', s: 'カウンター！ 前にはDFが1枚だけ。', o: ['dri', 'shoot', 'pass'] },
      { t: 'c', s: 'サイドから鋭いクロスが入ってくる。', o: ['volley', 'head', 'pass'] },
      { t: 'c', s: 'GKと1対1になった！', o: ['shoot', 'chip', 'dri'] },
      { t: 'c', s: '密集の中で、こぼれ球が足元に転がってきた。', o: ['shoot', 'dri', 'pass'] },
      { t: 'c', s: 'ペナルティエリアの中で、DFを背負ってボールを受けた。', o: ['shoot', 'dri', 'pass'] },
      { t: 'c', s: 'ゴール前25m、ファウルを受けてFKを獲得した。', o: ['fk', 'pass', 'shoot'], need: 'fk' },
      { t: 'b', s: 'サイドで孤立した。DF2人に囲まれている。', o: ['dri', 'pass', 'long'] },
      { t: 'b', s: '中盤まで下りてボールを受けた。前線が空いている。', o: ['pass', 'dri', 'mid'] },
      { t: 'b', s: '相手のバックパスが少し短い。', o: ['press', 'shoot', 'pass'] },
      { t: 'b', s: 'スローインから足元にボール。味方の上がりを待つか、仕掛けるか。', o: ['pass', 'dri', 'mid'] },
      { t: 'd', s: '相手のCK。ニアサイドの守備を任された。', o: ['aerial', 'jockey', 'tackle'] },
      { t: 'd', s: '前線からのプレス。相手CBがボールを持っている。', o: ['press', 'jockey', 'steal'] },
      { t: 'd', s: '自陣深くまで戻って守備。相手のSBが上がってくる。', o: ['tackle', 'jockey', 'foul'] }
    ],
    mf: [
      { t: 'c', s: 'バイタルエリアでフリーになった。', o: ['mid', 'pass', 'dri'] },
      { t: 'c', s: 'ゴール前25m。シュートコースが少しだけ見える。', o: ['mid', 'pass', 'dri'] },
      { t: 'c', s: 'クリアボールがペナルティエリアの外にこぼれてきた。', o: ['volley', 'pass', 'dri'] },
      { t: 'c', s: 'FKのチャンス。キッカーを任された。', o: ['fk', 'pass', 'mid'], need: 'fk' },
      { t: 'b', s: '中盤で前を向いた。前線が裏へ走り出す。', o: ['pass', 'dri', 'mid'] },
      { t: 'b', s: '自陣でボールを奪った。一気にカウンターだ。', o: ['pass', 'dri', 'mid'] },
      { t: 'b', s: '相手のプレスが激しい。最終ラインからボールを受ける。', o: ['pass', 'dri', 'long'] },
      { t: 'b', s: '逆サイドが大きく空いている。', o: ['long', 'pass', 'dri'] },
      { t: 'd', s: '相手のパスが中盤を通過しようとしている。', o: ['steal', 'press', 'intercept'] },
      { t: 'd', s: '相手のカウンター。戻りながら対応する。', o: ['tackle', 'jockey', 'foul'] },
      { t: 'd', s: '相手の10番がバイタルエリアで前を向いた。', o: ['tackle', 'intercept', 'jockey'] }
    ],
    df: [
      { t: 'd', s: '相手のエースがスピードに乗って仕掛けてくる。', o: ['tackle', 'jockey', 'foul'] },
      { t: 'd', s: 'クロスが上がる。相手FWと空中戦だ。', o: ['aerial', 'jockey', 'tackle'] },
      { t: 'd', s: '相手の決定的なスルーパスが通りかけた。', o: ['tackle', 'intercept', 'jockey'] },
      { t: 'd', s: 'ゴール前の混戦。相手FWがシュート体勢に入った。', o: ['tackle', 'aerial', 'jockey'] },
      { t: 'd', s: '相手の大型FWに背負われた。', o: ['jockey', 'aerial', 'foul'] },
      { t: 'c', s: 'CKのチャンス。ゴール前に上がった。', o: ['head', 'shoot', 'pass'] },
      { t: 'b', s: '最終ラインでボールを持った。前線が走り出す。', o: ['long', 'pass', 'dri'] },
      { t: 'b', s: '相手のプレスをかわせば、一気に前が開ける。', o: ['dri', 'pass', 'long'] }
    ],
    gk: [
      { t: 'd', s: '相手FWが抜け出した。1対1だ。', o: ['rush', 'stay', 'angle'] },
      { t: 'd', s: 'ゴール前の混戦から、至近距離のシュートが飛んでくる。', o: ['save', 'stay', 'rush'] },
      { t: 'd', s: 'ハイボールのクロスが上がる。', o: ['punch', 'catch', 'stay'] },
      { t: 'd', s: 'PKを与えてしまった……。キッカーと向き合う。', o: ['pkL', 'pkR', 'pkC'], pk: true },
      { t: 'd', s: '無回転のミドルシュートが飛んでくる。', o: ['save', 'punch', 'catch'] },
      { t: 'b', s: 'ボールを持った。相手は前から来ている。', o: ['long', 'pass', 'catch'] }
    ]
  };
  var TW = { fw: [['c', 0.45], ['b', 0.3], ['d', 0.25]], mf: [['c', 0.25], ['b', 0.45], ['d', 0.3]], df: [['d', 0.6], ['c', 0.15], ['b', 0.25]], gk: [['d', 0.85], ['b', 0.15]] };
  // 選択肢の定義：ks=使う能力 / kind: goal(自分で決める) ast(味方に決めさせる) chance(チャンスを作る) def(失点を防ぐ)
  var OPT = {
    shoot: { t: '自分で打つ', ks: ['sht', 'iq'], kind: 'goal', cat: 'sht', ok: ['ゴール右隅に突き刺した！', 'GKの手をかすめて、ネットが揺れた！', '迷わず振り抜いた。ゴール！'], ng: ['わずかに枠の外。', 'GKに読まれていた。', 'DFの足に当たってコースが変わった。'] },
    chip: { t: 'ループで浮かせる', ks: ['sht', 'iq'], kind: 'goal', cat: 'sht', tech: 'chip', ok: ['ふわりと浮いたボールが、GKの頭上を越えてゴールへ！'], ng: ['浮かせすぎて、バーの上。'] },
    volley: { t: 'ダイレクトで合わせる', ks: ['sht', 'phy'], kind: 'goal', cat: 'sht', ok: ['ダイレクトで叩いた！ ゴール！'], ng: ['ミートしきれず、ボールは上へ。'] },
    head: { t: '頭で合わせる', ks: ['phy', 'sht'], kind: 'goal', cat: 'def', ok: ['ドンピシャのヘディング！ ゴール！'], ng: ['ヘディングは枠の上へ。'] },
    dri: { t: 'ドリブルで仕掛ける', ks: ['dri', 'spd'], kind: 'goal2', cat: 'dri', ok: ['DFをかわして、そのまま流し込んだ！'], ng: ['囲まれてボールを失った。', '体を寄せられて倒された。笛は鳴らない。'] },
    pass: { t: 'フリーの味方へ出す', ks: ['pas', 'iq'], kind: 'ast', cat: 'pas', ok: ['完璧なパス。味方が押し込んだ！'], ng: ['パスはDFにカットされた。', 'わずかに合わなかった。'] },
    mid: { t: 'ミドルシュートを狙う', ks: ['sht', 'phy'], kind: 'goal', cat: 'sht', ok: ['25mの弾丸ミドルがネットに突き刺さった！'], ng: ['クロスバーを直撃！ 惜しい。', '枠をわずかに外れた。'] },
    fk: { t: '直接FKを狙う', ks: ['sht', 'pas'], kind: 'goal', cat: 'sht', bonus: 3, ok: ['壁の上を越えて、ゴール左上に吸い込まれた！'], ng: ['FKは壁に当たった。'] },
    press: { t: '前から奪いに行く', ks: ['spd', 'def'], kind: 'chance', cat: 'def', ok: ['高い位置で奪った！ そのままチャンスに。'], ng: ['かわされて、逆に走られた。'] },
    steal: { t: 'パスコースに飛び込む', ks: ['def', 'iq'], kind: 'chance', cat: 'def', ok: ['完璧に読んでカット！ カウンター発動！'], ng: ['一歩届かなかった。'] },
    tackle: { t: 'スライディングで止める', ks: ['def', 'spd'], kind: 'def', cat: 'def', tech: 'tackle', ok: ['ボールだけを正確に刈り取った。決定的なピンチを防いだ！'], ng: ['かわされた。'] },
    jockey: { t: '体を寄せて時間を作る', ks: ['phy', 'iq'], kind: 'def', cat: 'def', ok: ['冷静に外へ追いやり、味方の戻りを待った。'], ng: ['体勢を崩され、シュートを打たれた。'] },
    intercept: { t: 'パスを読んでカットする', ks: ['def', 'iq'], kind: 'def', cat: 'def', tech: 'intercept', ok: ['コースを読み切ってカット！'], ng: ['読みが外れた。'] },
    aerial: { t: '競り勝つ', ks: ['phy', 'def'], kind: 'def', cat: 'def', tech: 'aerial', ok: ['誰よりも高く跳んで跳ね返した！'], ng: ['競り負けた。'] },
    foul: { t: 'ファウルで止める（イエロー覚悟）', ks: ['phy', 'def'], kind: 'def', cat: 'def', bonus: 6, card: true, ok: ['戦術的なファウルで止めた。イエローカード。'], ng: ['倒しきれず、そのまま行かれた。'] },
    long: { t: '前線へロングフィード', ks: ['pas', 'iq'], kind: 'ast', cat: 'pas', ok: ['50mのロングフィードがピタリ。味方が決めた！'], ng: ['ボールは長すぎた。'] },
    rush: { t: '前に飛び出す', ks: ['gk', 'spd'], kind: 'def', cat: 'gk', ok: ['果敢な飛び出しでボールを弾き出した！'], ng: ['一瞬遅れて、かわされた。'] },
    stay: { t: 'ゴール前で構える', ks: ['gk', 'iq'], kind: 'def', cat: 'gk', ok: ['至近距離のシュートを片手でストップ！'], ng: ['逆を突かれた。'] },
    angle: { t: 'コースを消して待つ', ks: ['gk', 'iq'], kind: 'def', cat: 'gk', ok: ['シュートコースを完全に消した。シュートは正面！'], ng: ['股の間を抜かれた。'] },
    save: { t: '反応で飛ぶ', ks: ['gk', 'phy'], kind: 'def', cat: 'gk', tech: 'supersave', ok: ['ありえない反応でかき出した！ スーパーセーブ！'], ng: ['届かなかった。'] },
    punch: { t: 'パンチングで弾く', ks: ['gk', 'phy'], kind: 'def', cat: 'gk', ok: ['力強いパンチングでクリア！'], ng: ['ボールに触れず、頭で合わされた。'] },
    catch: { t: 'しっかりキャッチ', ks: ['gk', 'iq'], kind: 'def', cat: 'gk', ok: ['落ち着いてキャッチ。'], ng: ['ボールをこぼした！'] },
    pkL: { t: '左に飛ぶ', ks: ['gk', 'iq'], kind: 'pk', cat: 'gk', ok: ['読み通り！ PKストップ！'], ng: ['逆を突かれた。'] },
    pkR: { t: '右に飛ぶ', ks: ['gk', 'iq'], kind: 'pk', cat: 'gk', ok: ['読み通り！ PKストップ！'], ng: ['逆を突かれた。'] },
    pkC: { t: '最後まで動かない', ks: ['gk', 'men'], kind: 'pk', cat: 'gk', tech: 'pkstop', ok: ['真ん中！ 動かずに止めた！'], ng: ['隅に決められた。'] }
  };
  M.OPT = OPT;
  // 覚えた技は、合う選択肢を置き換えて出てくる
  function techOptions(S, cat) {
    var so = S.soccer;
    return (so.tech || []).map(SO.techById).filter(function (t) { return t && t.cat === cat; }).sort(function (a, b) { return b.b - a.b; });
  }
  M.next = function (S, m) {
    if (m.pi >= m.times.length) { runTo(S, m, 90); m.done = true; return null; }
    var t = m.times[m.pi++];
    runTo(S, m, t);
    var so = S.soccer, g = grp(so.pos);
    var d = m.gf - m.ga, late = t >= 80, r = Math.random(), acc = 0, ty = TW[g][0][0];
    for (var wi = 0; wi < TW[g].length; wi++) { acc += TW[g][wi][1]; if (r < acc) { ty = TW[g][wi][0]; break; } }
    if (late && d < 0 && g !== 'gk') ty = g === 'df' ? 'b' : 'c';
    var list = SIT[g].filter(function (x) { return x.t === ty && (!x.need || SO.hasBadge(S, x.need) || U.chance(0.25)) && (!x.pk || U.chance(0.25)); });
    if (!list.length) list = SIT[g].filter(function (x) { return !x.need && !x.pk; });
    var sit = ST.pick(S, 'msit_' + g + ty, list);
    var opts = sit.o.map(function (k) { var o = OPT[k], th = o.tech && SO.hasTech(S, o.tech) ? SO.techById(o.tech) : null; return { k: k, t: th ? '【' + th.n + '】' + o.t : o.t, ks: o.ks, kind: o.kind, cat: o.cat, bonus: (o.bonus || 0) + (th ? th.b : 0), ok: o.ok, ng: o.ng, card: o.card, tech: th ? th.k : null, techObj: th }; });
    // 技の選択肢（最大2つ）：守備の局面では守備・GKの技だけ
    var cats = ty === 'd' ? (g === 'gk' ? ['gk'] : ['def']) : { fw: ['dri', 'sht', 'pas'], mf: ['pas', 'dri', 'sht'], df: ['pas', 'def'], gk: [] }[g];
    var added = 0;
    if (!sit.pk) cats.forEach(function (c) {
      if (added >= 2) return;
      var ts = techOptions(S, c).filter(function (t) { return !opts.some(function (o) { return o.tech === t.k; }); });
      if (!ts.length) return;
      var tk = ts[0]; if (ts.length > 1 && U.chance(0.4)) tk = ts[1];
      var kind = c === 'dri' ? 'goal2' : c === 'sht' ? 'goal' : c === 'pas' ? 'ast' : 'def';
      if (ty === 'b' && kind === 'goal') return;
      if (ty !== 'd' && kind === 'def') return;
      opts.push({ k: 'tech_' + tk.k, t: '【' + tk.n + '】', ks: c === 'dri' ? ['dri', 'spd'] : c === 'sht' ? ['sht', 'iq'] : c === 'pas' ? ['pas', 'iq'] : c === 'def' ? ['def', 'phy'] : ['gk', 'iq'], kind: kind, cat: c, bonus: tk.b, tech: tk.k, techObj: tk, ok: [tk.fx + '――'], ng: ['【' + tk.n + '】は読まれていた。'] });
      added++;
    });
    var stTxt = late ? (d < 0 ? '1点を追う終盤。残された時間はわずか。' : d > 0 ? '1点リードの終盤。ここを守れば勝てる。' : '同点の終盤。次の1点がすべてを決める。') : '';
    m.cur = { t: t, sit: sit.s, opts: opts };
    return { min: t, text: (stTxt ? stTxt + '\n' : '') + t + '分――' + sit.s, opts: opts };
  };
  M.choose = function (S, m, i) {
    var so = S.soccer, o = m.cur.opts[i], ctx = m.ctx, out = [];
    var val = sk(so, o.ks) + o.bonus + M.giftBonus(S) + (S.form || 0) * 0.35 + ((S.st.men || 50) - 50) * 0.05 + (SO.hasBadge(S, 'bigmatch') && ctx.big ? 4 : 0) - SO.APT_PEN[SO.aptGrade(SO.apt(so))] * 0.6;
    if ((S.tal.ath >= 6 && (o.cat === 'dri' || o.cat === 'sht')) || (S.tal.art >= 6 && (o.cat === 'dri' || o.cat === 'pas'))) val += 2;
    var diff = ctx.oppS + (o.kind === 'def' ? 1 : 3) + U.ri(-2, 2) + m.my.g * 2.5 + (ctx.final ? 2 : 0);
    var p = U.clamp(U.sig((val - diff) / 6), 0.06, 0.86);
    if (o.kind === 'pk') p = o.k === 'pkC' && o.tech ? 0.42 : U.chance(0.5) ? 0.38 : 0.2;
    var ok = U.chance(p), t = m.cur.t;
    var tech = o.techObj || (o.tech ? SO.techById(o.tech) : null);
    if (tech && ok) { out.push('✨【' + tech.n + '】'); m.my.tech.push(tech.k); }
    out.push(t + '分　' + (ok ? '✅ ' : '❌ ') + U.pick(ok ? o.ok : o.ng));
    if (ok) {
      m.my.act += 0.3;
      var conv = o.kind === 'goal' ? (tech ? 0.85 : 0.72) : 0.75;
      if ((o.kind === 'goal' || o.kind === 'goal2') && !U.chance(conv)) { out.push(U.pick(['……しかし、GKが指先で弾き出した！', 'ボールはポストを叩いた！ 惜しい！', 'DFが体を投げ出してブロック！'])); m.my.act += 0.1; }
      else if (o.kind === 'goal' || (o.kind === 'goal2' && U.chance(0.75))) {
        m.gf++; m.my.g++; m.my.act += 0.15;
        out.push('⚽ ゴール！！ ' + m.gf + '-' + m.ga + '　' + KL.Rec.goalCall(S, m, tech));
        m.goalsLog.push({ min: t, tech: tech ? tech.n : '', score: m.gf + '-' + m.ga });
      } else if (o.kind === 'goal2' || o.kind === 'ast' || (o.kind === 'chance' && U.chance(0.45))) {
        if (o.kind === 'chance' || U.chance(o.kind === 'goal2' ? 0.7 : 0.85)) {
          m.gf++; m.my.a++; m.my.act += 0.1;
          out.push('⚽ ' + mateName(S, ctx) + 'が決めた！ ' + m.gf + '-' + m.ga + '（アシスト：自分）');
        } else out.push('惜しくも味方のシュートは枠の外。');
      } else if (o.kind === 'def' || o.kind === 'pk') {
        m.my.act += 0.25;
        if (o.kind === 'pk') out.push('スタジアムが揺れるほどの大歓声！');
      }
    } else {
      m.my.act -= 0.2;
      if (o.kind === 'def' || o.kind === 'pk') {
        if (o.kind === 'pk' || U.chance(0.55)) { m.ga++; m.my.act -= 0.25; out.push('😣 失点…… ' + m.gf + '-' + m.ga); }
        else out.push('なんとか味方がカバーしてくれた。');
      }
      if (o.card) out.push('🟨 イエローカード。');
    }
    if (o.card && ok) m.my.act -= 0.1;
    m.log = m.log.concat(out);
    m.cur = null;
    return out;
  };
  // 試合終了の処理（延長・PK・採点）
  M.finish = function (S, m) {
    var ctx = m.ctx;
    var res = { gf: m.gf, ga: m.ga, my: { min: m.my.min, g: m.my.g, a: m.my.a, tech: m.my.tech, r: 0 }, pk: null, et: false, log: m.log, goalsLog: m.goalsLog, played: true };
    var g0 = res.gf, a0 = res.ga;
    M.decide(S, ctx, res);
    if (res.et) m.log.push('⏱️ 延長戦へ。' + (res.gf !== g0 || res.ga !== a0 ? '延長で' + res.gf + '-' + res.ga + '。' : '延長でも決着がつかない。'));
    if (res.pk) m.log.push('🥅 PK戦 ' + res.pk.gf + '-' + res.pk.ga + '。' + (res.win ? '最後のキッカーが決めた！' : '最後のキックが止められた……'));
    res.my.r = M.rating(S, ctx, res, m.my.act);
    res.mom = res.my.r >= 8.0 || (res.my.g >= 2 && res.win !== false) || (res.my.r >= 7.6 && res.win === true && U.chance(0.5));
    m.log.push('🔔 試合終了。' + ctx.my + ' ' + res.gf + '-' + res.ga + ' ' + ctx.opp + (res.pk ? '（PK ' + res.pk.gf + '-' + res.pk.ga + '）' : '') + (res.win === true ? '　勝利！' : res.win === false ? '　敗戦' : '　引き分け'));
    return res;
  };

  // 記者会見（試合後）
  M.PRESS = [
    { k: 'humble', t: '「チームのみんなのおかげです」', fx: { ego: -3, team: 3, trust: 1 } },
    { k: 'bold', t: '「次も自分が決めます」', fx: { ego: 4, fans: 2000, form: 1 } },
    { k: 'fans', t: '「サポーターの声が力になりました」', fx: { fans: 3000, loc: 2 } }
  ];

  // ======================================================
  //  昔の形式（年代別の決勝など）からの呼び出し
  // ======================================================
  M.push = function (S, o) {
    var so = S.soccer, pw = U.clamp(o.pWin || 0.5, 0.05, 0.95);
    var myS = o.youth || !so || !so.club ? (o.oppLv || 70) + 5 * Math.log(pw / (1 - pw)) : KL.Season ? KL.Season.power(S) : o.oppLv;
    var ctx = {
      id: o.id, title: o.title, icon: o.icon || '🏟️', venue: o.venue, my: o.myTeam, opp: o.opp, myS: myS, oppS: o.oppLv || 70, home: null,
      ko: true, stakes: o.stakes, youth: !!o.youth || !(so && so.club), big: true, final: /決勝/.test(o.title), sel: { start: o.starter !== false, min: o.starter !== false ? 90 : 25 },
      onEnd: function (S, res) {
        var so2 = S.soccer;
        if (so2 && so2.cur && res.my.min) { so2.cur.apps++; so2.cur.goals += res.my.g; so2.cur.ast += res.my.a; so2.cur.rs += res.my.r; so2.cur.rn++; so2.totalApps++; so2.totalGoals += res.my.g; so2.totalAst += res.my.a; }
        if (res.my.g && so2) so2.bigOk = (so2.bigOk || 0) + 1;
        return res.win ? (o.onWin(S) || '') : (o.onLose(S) || '');
      }
    };
    KL.push(S, { id: 'm_' + o.id, cat: 'soccer', imp: 2, title: o.title, icon: ctx.icon, match: ctx });
  };
})();
