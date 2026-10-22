/* Kani Life - ヒロイン（1回の人生に1人だけ）
   ・ガチャの才能で「本命」が決まる（画面には出さない）
   ・本命と出会えない道を選んだら、出会える別のヒロインに切り替わる
   ・最初に出会った時点で確定。ほかの3人はその人生には出てこない
   ・出会いと必ず起きる出来事はあるが、そっけなくし続ければ付き合わずに終わる
   ※名前・口調・画像はこのファイルだけで差し替えられます */
(function () {
  'use strict';
  var KL = window.KL, U = KL.U, ST = KL.Story;
  var H = KL.Hero = {};

  H.D = {
    chisa: { sei: '朽葉', mei: '千咲', ad: 2, role: '幼なじみ', vt: '黒髪ロングに赤いリボン', pers: '無口だけど、まっすぐ', hobby: '読書と、手紙を書くこと', ht: 158, pref: 'men',
      img: { base: 'chisa-festival', school: 'chisa-school', serious: 'chisa-serious', dark: 'chisa-festival-dark', adult: 'chisa-festival' } },
    miyako: { sei: '月雪', mei: 'ミヤコ', ad: -1, role: '後輩マネージャー', vt: '白い髪のポニーテール', pers: '冷静で真面目。でも本当は寂しがり', hobby: 'データ分析と、うさぎの動画', ht: 152, pref: 'ath',
      img: { base: 'miyako-casual', school: 'miyako-uniform', summer: 'miyako-summer', dark: 'miyako-summer-dark', closed: 'miyako-summer-closed', adult: 'miyako-dress' } },
    hoshino: { sei: '小鳥遊', mei: 'ホシノ', ad: 1, role: '高校の先輩', vt: 'ピンクの長い髪、オッドアイ', pers: 'のんびり気だるげ。本気の時は誰より真剣', hobby: '昼寝', ht: 145, pref: 'men',
      img: { base: 'hoshino-school', school: 'hoshino-school', spring: 'hoshino-spring', resort: 'hoshino-resort', closed: 'hoshino-resort-closed', dark: 'hoshino-resort-dark' } },
    miyabi: { sei: '星見', mei: '雅', ad: 5, role: 'クラブのフィジカルコーチ', vt: '黒髪の姫カット、凛とした目', pers: '簡潔で威厳がある。普段は少し天然', hobby: '刀の手入れと、昼寝', ht: 166, pref: 'ath',
      img: { base: 'miyabi-work', work: 'miyabi-work', sword: 'miyabi-sword', formal: 'miyabi-formal', dark: 'miyabi-work-close' } }
  };
  H.TAL = { look: 'chisa', art: 'chisa', men: 'miyako', int: 'miyako', com: 'hoshino', ath: 'miyabi', hp: 'miyabi' };
  H.full = function (id) { var d = H.D[id]; return d.sei + ' ' + d.mei; };

  // ---------- 本命を決める ----------
  H.init = function (S) {
    if (S.hero) return S.hero;
    // 本命は才能に関係なくランダム（各25%）
    var order = U.shuffle(Object.keys(H.D));
    S.hero = { order: order, cur: order[0], main: order[0], met: false, npc: null, step: 0, lastT: -99, mode: 'main', gone: false, reunion: false, f: {} };
    return S.hero;
  };
  // 才能は「出会ったあと」に効く：相性の才能が高いほど距離が縮まりやすい
  H.MUL = [0, 0.8, 0.9, 1, 1.1, 1.2, 1.35];
  H.likeMul = function (S) {
    var h = S.hero; if (!h || !S.tal) return 1; var best = 0;
    Object.keys(H.TAL).forEach(function (k) { if (H.TAL[k] === h.cur) best = Math.max(best, S.tal[k] || 3); });
    return H.MUL[best] || 1;
  };
  H.npc = function (S) { return S.hero && S.hero.npc ? KL.npc(S, S.hero.npc) : null; };
  H.is = function (S, id) { return !!S.hero && S.hero.cur === id; };
  H.on = function (S, id) { var n = H.npc(S); return H.is(S, id) && S.hero.met && !S.hero.gone && !!n && !n.dead; };
  H.gap = function (S, n) { return S.t - (S.hero ? S.hero.lastT : -99) >= n; };
  H.like = function (S) { var n = H.npc(S); return n ? n.like : 0; };
  H.dating = function (S) { var n = H.npc(S); return !!n && (S.partnerId === n.id); };
  H.married = function (S) { var n = H.npc(S); return !!n && S.spouseId === n.id; };
  H.together = function (S) { return H.dating(S) || H.married(S); };
  H.single = function (S) { return !S.partnerId && !S.spouseId; };
  H.aff = function (S, v) { var n = H.npc(S); if (n) KL.likeAdd(n, v > 0 ? Math.round(v * H.likeMul(S)) : v); };

  // 出会える道かどうか： open（今出会える） / future（これから） / closed（もう無理）
  H.window = function (S, id) {
    var a = KL.age(S), so = S.soccer, lv = so && !so.retired ? so.level : '';
    var club = ['bukatsu', 'hs', 'hs_power', 'univ'].indexOf(lv) >= 0;
    if (id === 'chisa') { if (S.hero.mode === 'main' && S.hero.cur === 'chisa') return a <= 4 ? 'open' : 'closed'; return a < 16 ? 'future' : a <= 23 ? 'open' : 'closed'; }
    if (id === 'miyako') {
      if (a < 12) return 'future';
      if (S.track !== 'soccer' || !so || so.retired || so.club) return a < 13 && S.stage !== 'hs' ? 'future' : 'closed';
      if (lv === 'youth' || lv === 'jy') return 'closed';
      if (club && ((S.stage === 'jhs' && a >= 13 && a <= 14) || (S.stage === 'hs' && a >= 16 && a <= 17) || (S.stage === 'univ' && a <= 21))) return 'open';
      if (a <= 15) return 'future';
      if (a <= 17 && club) return 'future';
      if (S.stage === 'univ' && a <= 20) return 'future';
      return 'closed';
    }
    if (id === 'hoshino') { if (a < 15) return 'future'; if (S.stage === 'hs' && a <= 16) return 'open'; if (S.stage === 'univ' && a <= 20) return 'open'; if (a < 18) return 'future'; return 'closed'; }
    if (id === 'miyabi') { if (a < 18) return 'future'; if (a > 28) return 'closed'; if (S.stage === 'pro' && so && so.club) return 'open'; if (S.stage === 'work' && a >= 22) return 'open'; return a < 28 ? 'future' : 'closed'; }
    return 'closed';
  };
  // 半年ごと：出会えなくなったら次のヒロインへ
  H.half = function (S) {
    var h = H.init(S);
    if (h.met) return;
    if (H.window(S, h.cur) !== 'closed') return;
    var nx = U.shuffle(h.order.filter(function (id) { return id !== h.cur && !h['x_' + id]; }));
    h['x_' + h.cur] = true;
    for (var i = 0; i < nx.length; i++) {
      var prevMode = h.mode; h.mode = 'switch';
      if (H.window(S, nx[i]) !== 'closed') { h.cur = nx[i]; return; }
      h.mode = prevMode;
    }
    h.cur = 'chisa'; h.mode = 'switch';
  };
  // 呼び方
  H.call = function (S) {
    var h = S.hero; if (!h) return S.mei + 'くん';
    var m = H.married(S);
    if (h.cur === 'chisa') return S.mei + 'くん';
    if (h.cur === 'miyako') return m ? S.mei + 'さん' : '先輩';
    if (h.cur === 'hoshino') return m ? S.mei : (Math.random() < 0.3 ? S.mei + 'ちゃん' : S.mei + 'くん');
    if (h.cur === 'miyabi') return S.mei;
    return S.mei;
  };
  KL.PH.call = function (S) { return H.call(S); };
  KL.PH.hn = function (S) { return S.hero ? H.D[S.hero.cur].mei : ''; };
  KL.PH.hfull = function (S) { return S.hero ? H.full(S.hero.cur) : ''; };
  // 画像（年齢でふさわしいものを選ぶ）
  H.img = function (S, mood) {
    var h = S.hero; if (!h) return '';
    var d = H.D[h.cur], a = KL.age(S), ha = a + d.ad, im = d.img;
    if (h.cur === 'hoshino') {
      if (ha < 21 && (mood === 'resort' || mood === 'closed' || mood === 'dark')) mood = mood === 'dark' ? '' : 'spring';
      if (!mood) return '';
    }
    if (h.cur === 'miyako' && mood === 'adult' && ha < 20) mood = 'summer';
    if (h.cur === 'chisa' && mood === 'school' && ha >= 19) mood = 'base';
    var f = im[mood] || im.base;
    return f ? 'hero-' + f + '.jpg' : '';
  };
  H.face = function (S, n) { if (!n || !n.hero || !S.hero) return ''; var mood = n.like < 25 && H.together(S) ? 'dark' : KL.age(S) + H.D[n.hero].ad < 18 ? 'school' : 'base'; return H.img(S, mood) || H.img(S, 'base'); };

  // 出会う（ヒロインの人物を作る）
  H.meet = function (S, how) {
    var h = S.hero, d = H.D[h.cur];
    if (h.met) return H.npc(S);
    var n = KL.newNPC(S, 'crush', 'f', { name: d.sei + ' ' + d.mei, hero: h.cur, ad: d.ad, look: 96, vt: d.vt, pers: d.pers, hobby: d.hobby, ht: d.ht, pref: d.pref, like: 30, met: how || d.role, rel: 'hero' });
    n.role = 'heroine';
    h.met = true; h.npc = n.id; h.metAge = KL.age(S);
    KL.log(S, H.full(h.cur) + '（' + d.role + '）と出会った。', 2);
    return n;
  };
  H.mark = function (S, title, img) {
    var h = S.hero; if (!h) return;
    h.lastT = S.t;
    S.album = S.album || []; S.album.push({ t: S.t, y: KL.year(S), age: KL.age(S), title: title, img: img || '' }); if (S.album.length > 60) S.album.shift();
  };
  // 付き合う・結婚・別れ
  H.date = function (S, how) {
    var n = H.npc(S); if (!n) return;
    var old = KL.partner(S); if (old && old.id !== n.id) { S.hero.leftFor = old.name; KL.log(S, old.name + 'と別れた。', 1); }
    KL.startDating(S, n, how); n.rel = 'partner'; S.hero.st = 3; S.hero.dateT = S.t;
  };
  H.marry = function (S) {
    var n = H.npc(S); if (!n) return;
    n.rel = 'spouse'; S.spouseId = n.id; S.partnerId = null; S.marriedT = S.t; S.hero.st = 5; KL.likeAdd(n, 10);
    KL.title(S, H.full(S.hero.cur) + 'と結婚'); KL.log(S, H.full(S.hero.cur) + 'と結婚した。', 3);
  };
  H.part = function (S, why) {
    var n = H.npc(S); if (!n) return;
    if (S.partnerId === n.id) { S.partnerId = null; S.exCount++; }
    if (S.spouseId === n.id) { S.spouseId = null; S.flags.divorced = (S.flags.divorced || 0) + 1; }
    n.rel = 'ex'; n.hidden = true; S.hero.gone = true; S.hero.goneT = S.t; S.hero.st = -1;
    KL.log(S, H.full(S.hero.cur) + 'と別れた' + (why ? '（' + why + '）' : '') + '。', 2);
  };
  H.fade = function (S) { var n = H.npc(S); if (n) { n.hidden = true; n.rel = 'hero'; } S.hero.gone = true; S.hero.goneT = S.t; S.hero.faded = true; };

  // ---------- 口調の素材 ----------
  H.V = {
    chisa: { yes: ['……うん', '……そう', '……いいよ'], miss: ['……別に、待ってないけど', '……来ないと思ってた'], happy: ['……ふふ', '……よかった'], jeal: ['……さっきの人、誰', '……楽しそうだったね', '…………'] },
    miyako: { yes: ['了解しました', '……はい、先輩', 'わかりました'], miss: ['……先輩、遅いです', '連絡が3時間ありませんでした。……データ上、異常値です'], happy: ['……悪くない、と思います', 'ありがとうございます、先輩'], jeal: ['……先輩。今の方とは、どういったご関係ですか', '別に、気にしていません。……気にしていません', '先輩の自由です。……ですが、報告はしてください'] },
    hoshino: { yes: ['うへ〜、いいよ〜', 'しょうがないなぁ〜', 'おじさんに任せなさい〜'], miss: ['うへ〜、おそいよ〜', 'おじさん、待ちくたびれちゃった〜'], happy: ['うへへ〜', 'いやぁ、うれしいねぇ〜'], jeal: ['うへ〜、モテモテだねぇ〜……。……で、あの子だれ？', 'ふ〜ん、楽しそうだったねぇ〜。……ねぇ。次はないよ？', 'おじさん、そういうの見なかったことにできるほど大人じゃないんだよね〜'] },
    miyabi: { yes: ['承知した', 'よかろう', 'うむ'], miss: ['……遅い', '待っていた。……三時間ほど'], happy: ['……悪くない', '……そうか。嬉しいものだな'], jeal: ['……あの者は誰だ', '楽しそうだったな。……別に、構わんが', '次に同じことがあれば、手合わせで話をつける'] }
  };
  H.v = function (S, k) { var h = S.hero; return h ? ST.pick(S, 'hv_' + h.cur + k, H.V[h.cur][k]) : ''; };
  // 節目のメッセージ（story.js から呼ばれる）
  H.MSG = {
    chisa: { join: '……おめでとう。ずっと、知ってた', debut: '……見てた。かっこよかった', firstgoal: '……泣いた。内緒', title: '……おめでとう。今日は、ちゃんと寝てね', nt: '……昔、公園で言ってたこと。ほんとになったね', ballon: '……{mei}くんは、世界一。わたしは、ずっと前から知ってたけど', injury: '……そばにいる。何もしないけど、いる', transfer: '……さみしい。でも、行って' },
    miyako: { join: '先輩、プロ契約おめでとうございます。……データ通りです。でも、嬉しいです', debut: '出場時間、走行距離、全部記録しました。……先輩、おめでとうございます', firstgoal: '……先輩。ゴール、です。……すみません、うまく言えません', title: '優勝、おめでとうございます。了解しました、今日は先輩を甘やかします', nt: '日本代表……。先輩、私の分析は間違っていませんでした', ballon: 'ウサギは月まで跳べないそうです。……でも先輩は、跳びました', injury: '了解しました。リハビリの計画、もう作ってあります', transfer: '……ウサギは寂しくても生きていけるそうです。でも私は、ウサギではないので' },
    hoshino: { join: 'うへ〜、すごいじゃん〜！ おじさん鼻が高いよ〜', debut: '見てたよ〜。……ちょっと泣いたのは内緒ね〜', firstgoal: 'うへ〜！ やったね〜！ 今日はおじさんがごはん作るよ〜', title: '優勝かぁ〜。……ほんとに、よく頑張ったね', nt: '日本代表かぁ〜。遠くに行っちゃうなぁ〜……なんてね〜', ballon: '世界一だって〜。……うん。おじさんは、最初から知ってたよ', injury: '……大丈夫。おじさんがそばにいるから。適当に、ゆっくり治そ？', transfer: 'うへ〜、海外かぁ〜。……ちゃんと連絡してね。ほんとに' },
    miyabi: { join: '契約か。……鍛え方を変えねばな', debut: '見ていた。足の運びが良かった', firstgoal: '……よくやった。今夜は好きなものを作ってやろう', title: '優勝、見事だ。……だが慢心するな', nt: '国を背負うか。……誇りに思う', ballon: '世界一、か。……私の目に狂いはなかった', injury: '焦るな。体は嘘をつかん。治す計画は私が立てる', transfer: '……行け。私もいずれ追いかける' }
  };
  H.msg = function (S, n, kind) { var m = H.MSG[n.hero] || {}; return m[kind] || H.v(S, 'happy'); };
  // 嫉妬・誘惑への反応（life.js から呼ばれる）
  H.react = function (S, kind) {
    var h = S.hero; if (!h || !H.together(S)) return '';
    var id = h.cur;
    var R = {
      jealous: {
        chisa: '家に帰ると、千咲が玄関で待っていた。何も言わない。\nテーブルの上に、一枚の手紙。\n「……さっきの人、誰。わたしは、ちゃんと聞きたい」',
        miyako: 'ミヤコの返事が、急に敬語の温度を下げた。\n「……先輩。今の方とは、どういったご関係ですか」\n「別に、気にしていません。……気にしていません」',
        hoshino: '「うへ〜、モテモテだねぇ〜」\nホシノはいつもの調子で笑っていた。……途中までは。\n「……で、あの子だれ？」\n笑顔のまま、目だけが笑っていなかった。',
        miyabi: '雅は無言で刀の手入れをしていた。\n「……楽しそうだったな」\n「別に、構わん。……構わんが」\n刃を拭く手が、いつもより少しだけ速い。'
      },
      resist: {
        chisa: '帰って正直に話すと、千咲は少しだけ黙って、それから小さく笑った。\n「……ばか。でも、ありがとう」',
        miyako: '「……報告、ありがとうございます、先輩」\nミヤコは少しだけ目をそらした。\n「ウサギは浮気をしない動物だそうです。……先輩は、ウサギみたいですね」',
        hoshino: '「うへ〜、断ったんだ〜。えらいえらい〜」\nホシノは頭をぽんぽんしてきた。\n「……ほんとはね、ちょっとだけ心配してた。ちょっとだけね〜」',
        miyabi: '「そうか」\n雅は短く頷いた。\n「……お前を信じていた。だが、言葉にされると、存外嬉しいものだな」'
      },
      caught: {
        chisa: '週刊誌の記事を見た千咲は、何も言わなかった。\n次の日、ポストに手紙が一通。\n「……さよなら、とは書けなかった。でも、少しだけ、離れる」',
        miyako: '「……了解しました」\nミヤコの声は、聞いたことがないほど静かだった。\n「ウサギは寂しくても、一匹で生きていけるそうです。……私も、そうしてみます」',
        hoshino: '「……ねぇ」\nホシノはもう笑っていなかった。\n「おじさんね、怒るとほんとに怖いんだよ。……でも今は、怒る気力もないや」',
        miyabi: '雅は記事を一度だけ読み、静かに畳んだ。\n「……弁明は聞かん。少し、時間をくれ」\nその夜、道場の灯りは朝まで消えなかった。'
      }
    };
    return (R[kind] || R.jealous)[id] || '';
  };

  // ======================================================
  //  出来事の書き方
  // ======================================================
  var Ev = function (id, hid, o, title, icon, text, choices, img) {
    var cond = o.c || function () { return true; };
    var ev = KL.sc(id, {
      cat: 'hero', sched: o.sched !== false, pri: o.pri || 4, imp: o.imp === undefined ? 1 : o.imp, w: o.w, repeat: o.repeat, max: o.max, cool: o.cool, hero: hid,
      cond: function (S) { if (!S.hero || S.hero.cur !== hid) return false; if (o.meet ? S.hero.met : (!S.hero.met || S.hero.gone && !o.gone)) return false; if (o.step !== undefined && S.hero.step !== o.step) return false; if (!H.gap(S, o.gap === undefined ? 2 : o.gap)) return false; return cond(S); },
      img: function (S) { return img ? H.img(S, typeof img === 'function' ? img(S) : img) : ''; }
    }, title, icon, text, choices);
    ev.fx = function (S) { if (o.meet) H.meet(S, o.how); if (o.step !== undefined) S.hero.step = o.step + 1; H.mark(S, KL.fill(S, typeof title === 'function' ? title(S) : title), img ? H.img(S, typeof img === 'function' ? img(S) : img) : ''); };
    return ev;
  };
  H.Ev = Ev;
  var age = function (S) { return KL.age(S); };
  var soc = function (S) { return S.track === 'soccer' && S.soccer && !S.soccer.retired; };
  var pro = function (S) { return S.stage === 'pro' && S.soccer && S.soccer.club; };
  var abroad = function (S) { return pro(S) && !KL.LEAGUES[KL.Soccer.club(S).l].japan; };
  var like = H.like;

  // ======================================================
  //  朽葉 千咲（幼なじみ・2つ上・黒髪）
  // ======================================================
  Ev('ch_meet', 'chisa', { meet: true, how: '隣の家（幼なじみ）', step: 0, gap: 0, c: function (S) { return S.hero.mode === 'main' && age(S) >= 3 && age(S) <= 4; } }, '隣の家のお姉ちゃん', '🎀',
    '隣の家に、新しい家族が越してきた。\nあいさつに来たのは、黒い髪に赤いリボンをつけた、2つ年上の女の子。\nお母さんの後ろに隠れて、こっちをじっと見ている。\n\n「……朽葉、千咲。……よろしく」',
    [['「いっしょにあそぼ！」と手を引っぱる', { like: { who: 'hero', v: 12 }, com: 1 }, '千咲は少しびっくりして、それから小さくうなずいた。\nその日から、毎日のように一緒に遊ぶようになった。', 'life'],
     ['はずかしくて、お母さんの後ろに隠れる', { like: { who: 'hero', v: 4 } }, 'お互いにお母さんの後ろから、じーっと見つめ合った。\n帰り際、千咲が小さく手を振った。', 'b']]);
  Ev('ch_school', 'chisa', { step: 1, gap: 3, c: function (S) { return age(S) >= 6 && age(S) <= 8; } }, '千咲と登校', '🎒',
    '小学校に上がった。2つ上の千咲は、毎朝家の前で待っていてくれる。\n「……{mei}くん、寝ぐせ」\n無言で、手ぐしで直してくれた。',
    [['「ありがとう、千咲ちゃん」', { like: { who: 'hero', v: 8 } }, '千咲は「……別に」と言って、少し早足になった。耳が赤かった。', 'life'],
     ['照れくさくて走って先に行く', { like: { who: 'hero', v: 2 }, ath: 1 }, '振り返ると、千咲はいつもの歩幅で、ゆっくりついてきていた。', 'soccer']], 'school');
  Ev('ch_towel', 'chisa', { step: 2, gap: 2, c: function (S) { return age(S) >= 8 && age(S) <= 11; } }, '観客席の千咲', '🏟️',
    function (S) { return (soc(S) ? 'サッカーの試合' : '運動会') + 'の日。観客席の端っこに、千咲がいた。\n終わったあと、無言でタオルとスポーツドリンクを差し出してくる。\n「……見てた。' + (S.st.ath >= 40 ? '速かった' : 'がんばってた') + '」'; },
    [['「来てくれたん！？」と素直に喜ぶ', { like: { who: 'hero', v: 9 }, men: 1 }, '千咲は「……たまたま、通りかかっただけ」と言った。\n家から3駅も離れたグラウンドだった。', 'life'],
     ['「次はもっとすごいとこ見せる」と宣言する', { like: { who: 'hero', v: 6 }, ego: 1 }, '「……うん。待ってる」\n千咲は小さく笑った。めずらしいことだった。', 'soccer'],
     ['「別に来なくてもいいのに」', { like: { who: 'hero', v: -6 } }, '千咲は何も言わずに、タオルだけ置いて帰っていった。', 'b']], 'school');
  Ev('ch_jhs', 'chisa', { step: 3, gap: 2, c: function (S) { return age(S) >= 10 && age(S) <= 12; } }, '先に行く千咲', '🌸',
    '千咲が中学生になった。紺の制服。急に大人っぽく見える。\n「……先に行くね。中学」\n帰り道、千咲がぽつりと言った。',
    [['「すぐ追いつくから」', { like: { who: 'hero', v: 8 } }, '「……うん。待ってないけど、待ってる」\n意味がよくわからなかったけど、なんだか嬉しかった。', 'life'],
     ['「中学って楽しい？」と聞く', { like: { who: 'hero', v: 4 }, com: 1 }, '「……わかんない。でも、{mei}くんがいないのは、ちょっと変」', 'b']], 'school');
  Ev('ch_festival', 'chisa', { step: 4, gap: 2, c: function (S) { return age(S) >= 12 && age(S) <= 15 && KL.isB(S); } }, '夏祭り', '🎆',
    '地元の夏祭り。観覧車の前で、千咲が線香花火を持って立っていた。\n「……{mei}くんも、やる？」\n火花が、ぱちぱちと小さく弾ける。',
    [['隣にしゃがんで、一緒にやる', { like: { who: 'hero', v: 10 } }, '先に落ちたほうが、相手のお願いをひとつ聞く。\n千咲の玉が、少しだけ長く残った。\n「……じゃあ、お願い。……来年も、ここに来て」', 'life'],
     ['友達に呼ばれて、そっちに行く', { like: { who: 'hero', v: -5 }, com: 1 }, '振り返ると、千咲はひとりで最後の火花を見つめていた。', 'b']], 'base');
  Ev('ch_letter', 'chisa', { step: 5, gap: 2, c: function (S) { return (age(S) >= 13 && age(S) <= 16) || S.hero.mode === 'switch'; } }, '一通の手紙', '✉️',
    function (S) { return '下駄箱に、白い封筒が入っていた。見慣れた、千咲の字。\n\n「' + (soc(S) ? 'この前の試合、見に行きました。ボールを持ったとき、{mei}くんだけ時間が止まってるみたいだった。' : '最近、あんまり話せてないね。') + '\nわたしは口で言うのが下手だから、手紙にします。\n……応援してる。ずっと。」'; },
    [['返事の手紙を書く', { like: { who: 'hero', v: 10 }, art: 1 }, '慣れない手紙を三回書き直して、千咲の家のポストに入れた。\n次の日、千咲は一日中、目を合わせてくれなかった。たぶん、照れていた。', 'life'],
     ['直接「ありがとう」と言いに行く', { like: { who: 'hero', v: 8 }, com: 1 }, '「……読んだの。……恥ずかしい」\n千咲は真っ赤になって、ドアを閉めた。', 'b'],
     ['忙しくて、そのままにしてしまう', { like: { who: 'hero', v: -8 } }, '手紙は、机の引き出しの奥にしまわれたままになった。', 'soccer']], 'serious');
  Ev('ch_confess', 'chisa', { step: 6, gap: 2, imp: 2, c: function (S) { return age(S) >= 15 && (age(S) <= 20 || S.hero.mode === 'switch') && !S.spouseId; } }, '千咲の卒業式', '🌸',
    function (S) {
      if (abroad(S)) return like(S) >= 55 ? '千咲の高校の卒業式の日。\n時差で真夜中の{city}に、ビデオ通話がかかってきた。画面の向こうは、満開の桜だった。\n\n「……{mei}くん。ずっと言えなかったこと、言う」\n「……好き、だった。ずっと。……今も」' : '千咲の高校の卒業式の日。\n短いメッセージと、桜の写真が一枚だけ届いた。\n「卒業しました。東京の大学に行きます。……元気でね、{mei}くん」';
      return like(S) >= 55 ? '千咲の高校の卒業式の日。\n校門の前で待っていたのは、黒髪に赤いリボンの千咲だった。\n\n「……{mei}くん。ずっと言えなかったこと、言う」\n「……好き、だった。ずっと。……今も」' : '千咲の高校の卒業式の日。\n千咲は東京の大学に進むらしい。\n「……元気でね、{mei}くん」\nそれだけ言って、千咲は桜の下を歩いていった。'; },
    [['「おれも、ずっと好きやった」', function (S) { return {}; }, function (S) { if (like(S) >= 55) { H.date(S, '幼なじみの告白'); return '千咲は、泣きそうな顔で笑った。\n「……知ってた。……うそ。知らなかった」\n桜の下で、手をつないだ。'; } if (KL.chk(S, like(S) + S.st.com / 3, 55, 8)) { H.date(S, '幼なじみに告白'); return '千咲が立ち止まった。振り返った顔は、真っ赤だった。\n「……遅い。……ばか」'; } H.aff(S, -10); return '千咲は少し困った顔で、首を振った。\n「……ごめん。今は、わからない」'; }, 'life', null, 2],
     ['「元気でな」と見送る', { like: { who: 'hero', v: -10 } }, function (S) { if (like(S) < 40) H.fade(S); return (abroad(S) ? '「元気でな」とだけ返した。画面の向こうの桜が、少し遠く見えた。\n' : '千咲の背中が、桜の向こうに消えた。\n') + (like(S) < 40 ? 'それからしばらくして、隣の家は引っ越していった。' : '連絡先は、まだスマホに残っている。'); }, 'soccer']], 'serious');
  // 卒業式で付き合わなかったとき：海外にいれば、もう一度だけチャンス
  Ev('ch_second', 'chisa', { step: 7, gap: 3, imp: 2, c: function (S) { return !H.dating(S) && !S.spouseId && abroad(S) && age(S) >= 18 && age(S) <= 24; } }, '観客席の赤いリボン', '🎀',
    function (S) { return '{city}のスタジアム。試合後、スタンドの端に見覚えのある赤いリボンが見えた。\n\n「……来ちゃった。卒業旅行、ってことにして」\n千咲は、昔と同じタオルを握りしめていた。小さい頃、観客席で振っていたやつだ。\n「……{mei}くん、遠くに行っちゃったね。……ずっと、見てた」'; },
    [['「会いたかった。……付き合ってほしい」', {}, function (S) { if (KL.chk(S, like(S) + S.st.com / 3 + 8, 52, 8)) { H.date(S, '異国のスタジアムで'); S.hero.step = 9; var n = H.npc(S); if (n) { n.city = KL.ph(S, 'city'); n.job = '翻訳の仕事（リモート）'; } return '千咲は、タオルで顔を隠した。\n「……遅い。……ばか。……こっちで、仕事探す」\n知らない街の夜が、急に明るくなった。'; } H.aff(S, -10); H.fade(S); return '千咲は、ゆっくり首を振った。\n「……ごめん。……応援は、ずっとしてる」\n帰りの空港まで送った。それが、最後だった。'; }, 'life'],
     ['「来てくれてありがとう」と、街を案内する', { like: { who: 'hero', v: 6 } }, function (S) { H.fade(S); return '二人で{city}の旧市街を歩いた。千咲はずっと楽しそうだった。\n空港で、千咲は小さく手を振った。\n「……がんばってね。……ばいばい」'; }, 'soccer']], 'serious');
  // 付き合ってから
  Ev('ch_ldr', 'chisa', { step: 7, gap: 2, c: function (S) { return H.dating(S); } }, '東京と地元', '📱',
    '千咲は東京で一人暮らしを始めた。夜、ビデオ通話がかかってくる。\n画面の向こうで、千咲は何も話さず、ただこっちを見ている。\n「……顔、見たかっただけ」',
    [['通話をつないだまま、眠るまで話す', { like: { who: 'hero', v: 10 }, fat: 3 }, '途中から千咲は寝息を立て始めた。\n画面を切るのが、少しもったいなかった。', 'life'],
     ['「明日早いから」と切り上げる', { like: { who: 'hero', v: -3 }, form: 1 }, '「……うん。がんばって」\n切ったあと、短いメッセージが届いた。「おやすみ」', 'soccer']], 'base');
  Ev('ch_jealous', 'chisa', { gap: 3, sched: false, w: 2, repeat: true, max: 2, cool: 8, c: function (S) { return H.together(S) && KL.mote(S) >= 55; } }, '……さっきの人', '🖤',
    function (S) { return (pro(S) ? '試合のあと、出待ちの女の子たちに囲まれてサインをしていた。' : '帰り道、クラスの女子に話しかけられていた。') + '\nふと見ると、少し離れたところに千咲がいた。\n\n' + H.react(S, 'jealous'); },
    [['「ファンの子やで。千咲だけやから」と正直に話す', { like: { who: 'hero', v: 8 } }, '千咲は長い間黙っていた。それから、手紙の端を小さく折った。\n「……知ってる。でも、言ってほしかった」', 'life'],
     ['「気にしすぎ」と笑ってごまかす', { like: { who: 'hero', v: -10 } }, '千咲はそれ以上、何も言わなかった。\nその夜、既読がつかなかった。', 'soccer']], 'dark');
  Ev('ch_support', 'chisa', { gap: 2, sched: false, w: 3, c: function (S) { return H.together(S) && S.soccer && (S.soccer.injDays > 0 || (S.form || 0) <= -4); } }, '何もしないけど、いる', '🍵',
    function (S) { return (S.soccer && S.soccer.injDays > 0 ? '怪我で練習に出られない日。' : '結果が出ない日が続いている。') + '\n部屋に、千咲が来た。何も聞かない。\nお茶をいれて、隣で本を読んでいる。\n「……そばにいる。何もしないけど、いる」'; },
    [['黙って隣に座る', { like: { who: 'hero', v: 8 }, men: 3, form: 2 }, 'ページをめくる音だけが聞こえる。\nそれだけで、少し息ができるようになった。', 'life'],
     ['「一人にしてほしい」', { like: { who: 'hero', v: -4 }, men: 1 }, '千咲は小さくうなずいて、お茶だけ置いて帰った。\n湯気の向こうに、ドアの閉まる音。', 'soccer']], 'serious');
  Ev('ch_abroad', 'chisa', { step: 8, gap: 2, c: function (S) { return H.together(S) && abroad(S); } }, '海を越える', '✈️',
    function (S) { return KL.Soccer.club(S).n + 'への移籍が決まった。千咲に伝えると、しばらく黙っていた。\n「……行くんだね。遠いね」'; },
    [['「一緒に来てほしい」', { like: { who: 'hero', v: 12 } }, function (S) { var n = H.npc(S); if (n) { n.city = KL.ph(S, 'city'); n.job = '翻訳の仕事（リモート）'; } return '千咲は、指先でリボンをいじりながら言った。\n「……仕事、向こうでもできる。……行く」'; }, 'life'],
     ['「待っててほしい」', { like: { who: 'hero', v: 4 } }, '「……待つの、得意。小さい頃から」\n空港で、千咲は最後まで手を振っていた。', 'soccer']], 'serious');
  Ev('ch_propose', 'chisa', { step: 9, gap: 3, imp: 2, c: function (S) { return H.dating(S) && age(S) >= 21 && like(S) >= 65 && S.t - (S.hero.dateT || S.t) >= 4; } }, '観覧車', '💍',
    '地元の夏祭り。何年ぶりかに、二人で観覧車に乗った。\nてっぺんに近づく。千咲は窓の外を見たまま言った。\n「……ここ、小さい頃に約束した場所」\n\nポケットの中の小さな箱が、急に重く感じた。',
    [['「結婚してください」', {}, function (S) { H.marry(S); return '千咲は長いこと何も言わなかった。\nそれから、一通の手紙をこっちに差し出した。\n「……返事。昨日、書いた。……読んで」\n\n便箋には、一行だけ。\n「はい。」'; }, 'life'],
     ['今はまだ言えない', { like: { who: 'hero', v: -6 } }, '観覧車が一周して、地上に戻った。\n千咲は「……きれいだったね」とだけ言った。', 'soccer']], 'base');
  Ev('ch_wed', 'chisa', { step: 10, gap: 1, c: function (S) { return H.married(S); } }, '結婚式', '💒',
    '白いドレスの千咲は、いつもの赤いリボンをつけていた。\n「……これは、外したくない。{mei}くんが、最初に褒めてくれたから」\n\n誓いの言葉を、千咲は小さな声で、でもはっきり言った。',
    [['「一生、大事にする」', { like: { who: 'hero', v: 10 }, men: 3 }, '式のあと、千咲の父親に肩をたたかれた。\n「あの子が泣くの、初めて見たよ」', 'life']], 'base');
  Ev('ch_life', 'chisa', { gap: 6, sched: false, w: 2, repeat: true, max: 3, cool: 10, c: function (S) { return H.married(S); } }, '千咲のいる毎日', '🏠',
    ['朝、テーブルに手紙が置いてあった。「いってらっしゃい。今日も見てる」', '千咲が新しいリボンを買ってきた。「……どっちがいい？」 どっちも赤い。', '夜、千咲が読んでいた本を閉じて言った。「……{mei}くんの話、聞かせて」', '雨の日、千咲は窓際でずっと外を見ていた。「……昔も、こうやって雨やむの待ってたね」'],
    [['一緒に過ごす', { like: { who: 'hero', v: 6 }, men: 2, fat: -5 }, ['なんでもない一日が、いちばん贅沢だと思った。', '千咲が、めずらしく声を出して笑った。', '並んで同じ本を読んだ。千咲のほうが三倍速かった。'], 'life']], 'base');

  // ======================================================
  //  月雪 ミヤコ（後輩マネージャー・1つ下）
  // ======================================================
  Ev('my_meet', 'miyako', { meet: true, how: 'サッカー部の後輩マネージャー', step: 0, gap: 0, c: function (S) { return H.window(S, 'miyako') === 'open'; } }, '新しいマネージャー', '📋',
    function (S) { return '新学期。サッカー部に、新しいマネージャーが入ってきた。\n白い髪をポニーテールにした、小柄な1年生。\n\n「月雪ミヤコです。データ分析を担当します。……先輩方、よろしくお願いします」\n\n練習が終わると、ミヤコはまっすぐこっちに来た。\n「……先輩の今日のスプリント回数、ほかの方の1.4倍でした。異常値です」'; },
    [['「よう見てるなぁ。よろしく、月雪」', { like: { who: 'hero', v: 10 }, com: 1 }, '「……ミヤコ、で結構です。先輩」\nミヤコはノートに何か書き込んだ。たぶん、自分のことだ。', 'life'],
     ['「異常値ってなんやねん」とツッコむ', { like: { who: 'hero', v: 6 } }, '「褒め言葉です。……たぶん」\nミヤコは少しだけ首をかしげた。', 'b'],
     ['軽く会釈して帰る', { like: { who: 'hero', v: 1 } }, '「……了解しました」\n背中に、ペンを走らせる音が聞こえた。', 'soccer']], 'school');
  Ev('my_note', 'miyako', { step: 1, gap: 2, c: function (S) { return true; } }, 'ミヤコのノート', '📓',
    '居残り練習のあと、ベンチにノートが置き忘れられていた。表紙には「先輩・観察記録」。\n中には、自分のプレーの癖、得意なコース、疲れると左足の踏み込みが浅くなること――びっしりと書かれている。\n\n息を切らしたミヤコが戻ってきた。\n「……見ましたか、先輩」',
    [['「すごいな。これ、練習に使わせて」', { like: { who: 'hero', v: 10 }, sk: { iq: 1 } }, '「……了解しました。では、明日から一緒に映像を見ます」\nミヤコはノートを胸に抱えたまま、少しだけ笑った。', 'soccer'],
     ['「おれのファンなん？」とからかう', { like: { who: 'hero', v: 5 }, ego: 1 }, '「……違います。分析対象です」\n耳まで真っ赤だった。', 'life'],
     ['見なかったことにする', { like: { who: 'hero', v: -2 } }, '「……そうですか」\nミヤコは、どこか残念そうにノートをしまった。', 'b']], 'school');
  Ev('my_rabbit', 'miyako', { step: 2, gap: 2, c: function (S) { return KL.isB(S); } }, '合宿の夜', '🐇',
    '夏合宿の最終日の夜。宿舎の外で、ミヤコがひとりで星を見ていた。\n\n「……先輩。ウサギは寂しいと死んでしまう、という話をご存じですか」\n「あれは俗説です。実際は、一匹でも生きていけるそうです」\n\n少し間があった。\n「……でも、私はウサギではないので」',
    [['「……じゃあ、一人にせんとくわ」と隣に座る', { like: { who: 'hero', v: 12 } }, 'ミヤコは何も言わなかった。\nただ、少しだけこっちに寄りかかってきた。\n「……了解、しました」', 'life'],
     ['「それ、どういう意味？」と聞く', { like: { who: 'hero', v: 4 } }, '「……データ不足で、回答できません」\nミヤコはそっぽを向いた。', 'b'],
     ['「冷えるで。もう寝え」と声をかけて戻る', { like: { who: 'hero', v: -3 } }, '「……はい。おやすみなさい、先輩」', 'soccer']], 'summer');
  Ev('my_late', 'miyako', { gap: 2, sched: false, w: 3, c: function (S) { return !H.together(S) && S.hero.step >= 2 && S.soccer && ((S.form || 0) <= -2 || S.soccer.injDays > 0); } }, '誰もいないグラウンド', '🌙',
    '結果が出なくて、日が暮れても一人でシュートを打っていた。\nボールを拾いに行くと、ゴール裏にミヤコが立っていた。\n「……先輩。今日の決定率、改善しています。あと17本で、いつもの数字に戻ります」',
    [['「じゃあ、あと17本付き合って」', { like: { who: 'hero', v: 9 }, sk: { sht: 1 }, form: 2 }, '17本目がネットを揺らすと、ミヤコは小さく拍手した。\n「……データ通りです」', 'soccer'],
     ['「もう帰り。遅いし」', { like: { who: 'hero', v: 2 } }, '「……先輩が帰るなら、帰ります」\nミヤコは最後まで、帰らなかった。', 'b']], 'school');
  Ev('my_confess', 'miyako', { step: 3, gap: 2, imp: 2, c: function (S) { return !S.spouseId && (age(S) >= 15 || S.stage === 'univ'); } }, '卒業の日', '🌸',
    function (S) { return like(S) >= 55 ? '卒業式のあと。部室の前で、ミヤコが待っていた。\n\n「……先輩。卒業、おめでとうございます」\n「分析の結果を報告します。……私は、先輩のことが好きです。誤差は、ありません」\n\nミヤコはノートをぎゅっと握りしめていた。' : '卒業式のあと。部室の前で、ミヤコが頭を下げた。\n「先輩、お疲れさまでした。……データは、引き継いでおきます」\nそれだけ言って、ミヤコはグラウンドに戻っていった。'; },
    [['「おれも好きや。付き合ってほしい」', {}, function (S) { if (like(S) >= 55) { H.date(S, '後輩からの告白'); return 'ミヤコは、しばらく固まっていた。\n「……了解、しました。……了解しました」\n二回言った。たぶん、動揺している。'; } if (KL.chk(S, like(S) + S.st.com / 3, 55, 8)) { H.date(S, '後輩に告白'); return 'ミヤコはノートを落とした。\n「……先輩。それは、反則です」\n拾い上げた手が、少し震えていた。'; } H.aff(S, -10); return '「……すみません、先輩。今は、まだ」\nミヤコは深く頭を下げた。'; }, 'life', null, 2],
     ['「ありがとう。これからも頑張りや」', { like: { who: 'hero', v: -10 } }, function (S) { if (like(S) < 40) H.fade(S); return 'ミヤコは「……はい」とだけ答えた。\n' + (like(S) < 40 ? 'それきり、連絡を取ることはなくなった。' : 'ノートの最後のページは、白紙のままだった。'); }, 'soccer']], 'school');
  Ev('my_date', 'miyako', { step: 4, gap: 2, c: function (S) { return H.dating(S); } }, 'はじめてのデート', '🐇',
    '初めてのデート。待ち合わせ場所に、私服のミヤコがいた。\n「……15分前到着です。先輩は8分前。合格です」\n行き先は、ミヤコが決めた「うさぎカフェ」だった。',
    [['うさぎと戯れるミヤコを眺める', { like: { who: 'hero', v: 10 }, men: 2 }, 'うさぎを膝にのせたミヤコは、見たことのない顔で笑っていた。\n「……先輩、写真を撮るのは禁止です。……一枚だけなら、許可します」', 'life'],
     ['自分もうさぎに夢中になる', { like: { who: 'hero', v: 7 } }, '「……先輩、うさぎに好かれていますね。データにない結果です」\nミヤコが少しむくれていた。うさぎに嫉妬していた。', 'b']], 'base');
  Ev('my_staff', 'miyako', { step: 5, gap: 3, c: function (S) { return H.together(S) && age(S) >= 20 && pro(S); } }, 'ミヤコの進路', '💼',
    function (S) { return 'ミヤコは大学でスポーツデータを学び、プロのクラブから分析スタッフの誘いを受けていた。\n「……先輩。' + KL.Soccer.club(S).n + 'の分析部門にも、応募できます」\n「ですが、私情が入ると判断されるかもしれません」'; },
    [['「来てほしい。ミヤコの分析が一番信頼できる」', { like: { who: 'hero', v: 10 }, form: 2 }, function (S) { var n = H.npc(S); if (n) n.job = 'クラブの分析スタッフ'; return 'ミヤコは採用された。\n初日のミーティングで、ミヤコは誰よりも厳しく、自分のプレーを分析した。\n「……私情は、入れていません。入れていませんから」'; }, 'soccer'],
     ['「ミヤコのやりたいとこに行き」', { like: { who: 'hero', v: 6 } }, function (S) { var n = H.npc(S); if (n) n.job = 'Jクラブの分析スタッフ'; return '「……了解しました。では、敵として分析します。覚悟してください、先輩」'; }, 'life']], 'base');
  Ev('my_jealous', 'miyako', { gap: 3, sched: false, w: 2, repeat: true, max: 2, cool: 8, c: function (S) { return H.together(S) && KL.mote(S) >= 55; } }, '……どういったご関係ですか', '🖤',
    function (S) { return (pro(S) ? '番組の収録で、女子アナと楽しそうに話している写真がネットに出回った。' : '練習のあと、他校の女子に差し入れをもらった。') + '\n\n' + H.react(S, 'jealous'); },
    [['「ミヤコが一番やから」とまっすぐ言う', { like: { who: 'hero', v: 9 } }, '「……データとして、記録しておきます」\nミヤコはノートに何か書いて、それをこっそり見せてくれた。\n「先輩：言動に誤差なし」', 'life'],
     ['「仕事やから仕方ないやろ」', { like: { who: 'hero', v: -9 } }, '「……了解しました」\nその日の夜、ミヤコからの連絡は一言だけだった。', 'soccer']], 'dark');
  Ev('my_abroad', 'miyako', { step: 6, gap: 2, c: function (S) { return H.together(S) && abroad(S); } }, '海外移籍', '✈️',
    function (S) { return KL.Soccer.club(S).n + 'への移籍が決まった夜。ミヤコは長いこと黙っていた。\n「……ウサギは、住む場所が変わると、しばらく食事をしなくなるそうです」\n「……先輩は、大丈夫ですか」'; },
    [['「ミヤコが一緒なら大丈夫」', { like: { who: 'hero', v: 12 } }, function (S) { var n = H.npc(S); if (n) { n.city = KL.ph(S, 'city'); n.job = '現地クラブのデータアナリスト'; } return '「……了解しました。ついていきます」\n三日後、ミヤコは語学の教材を山ほど買ってきた。'; }, 'life'],
     ['「待っててくれるか」', { like: { who: 'hero', v: 2 } }, '「……ウサギは、待つのが得意ではありません」\n「でも、私はウサギではないので。……待ちます」', 'soccer']], 'closed');
  Ev('my_propose', 'miyako', { step: 7, gap: 3, imp: 2, c: function (S) { return H.dating(S) && age(S) >= 21 && like(S) >= 65 && S.t - (S.hero.dateT || S.t) >= 4; } }, '夜景のレストラン', '💍',
    '大人になったミヤコは、ネイビーのドレスで現れた。\n夜景の見えるレストラン。ミヤコはずっと、指先で髪をいじっている。\n「……先輩。今日、なにか隠していますね。データで分かります」',
    [['「ミヤコ。結婚してください」', {}, function (S) { H.marry(S); return 'ミヤコは、指輪の箱を見つめたまま動かなかった。\n「……分析、できません。……想定外、です」\n頬を涙が伝った。\n「……了解しました。……喜んで、{mei}さん」\n\n初めて、名前で呼ばれた。'; }, 'life'],
     ['まだ言えなかった', { like: { who: 'hero', v: -6 } }, '「……そうですか。データは、保存しておきます」\nミヤコは少しだけ寂しそうに笑った。', 'soccer']], 'adult');
  Ev('my_wed', 'miyako', { step: 8, gap: 1, c: function (S) { return H.married(S); } }, '結婚式', '💒',
    '結婚式の日。白いドレスのミヤコは、誓いの言葉の前に深呼吸をした。\n「……ウサギは、生涯ひとりのパートナーと添い遂げることも多いそうです」\n「私は、ウサギではありませんが。……そうします」',
    [['「おれもや」', { like: { who: 'hero', v: 10 }, men: 3 }, '式のあと、ミヤコは新しいノートを買っていた。表紙には「{mei}さん・観察記録（第2巻）」。', 'life']], 'adult');
  Ev('my_life', 'miyako', { gap: 6, sched: false, w: 2, repeat: true, max: 3, cool: 10, c: function (S) { return H.married(S); } }, 'ミヤコのいる毎日', '🏠',
    ['「{mei}さん、今週の睡眠時間が規定値を下回っています。今夜は22時就寝です。異論は認めません」', 'ミヤコがうさぎを飼い始めた。名前は「先輩」。……紛らわしい。', '夜、ソファで隣に座ったミヤコが、小さな声で言った。「……今日は、甘える日です。データ上の根拠は、ありません」', 'ミヤコが試合の分析資料を作ってくれた。最後のページに、小さく「いつも見ています」。'],
    [['一緒に過ごす', { like: { who: 'hero', v: 6 }, men: 2, care: 2 }, ['今日も、ミヤコの管理のおかげで体が軽い。', 'ミヤコは満足そうにノートを閉じた。', 'うさぎの「先輩」が、二人の間で丸くなって寝た。'], 'life']], 'base');

  // ======================================================
  //  小鳥遊 ホシノ（高校の先輩・1つ上）
  // ======================================================
  Ev('ho_meet', 'hoshino', { meet: true, how: '高校の先輩', step: 0, gap: 0, c: function (S) { return H.window(S, 'hoshino') === 'open'; } }, '屋上の先輩', '🌸',
    function (S) { return '昼休み、静かな場所を探して屋上に出た。\nベンチに、ピンクの髪の小柄な先輩が寝転がっていた。\n\n「うへ〜……新入生くん？ ここ、おじさんの昼寝場所なんだけどな〜」\n\n先輩は片目だけ開けて、こっちを見た。左右で色の違う目だった。\n「……まぁいっか〜。適当に、適当に〜。隣、空いてるよ〜」'; },
    [['隣に座って、一緒にぼーっとする', { like: { who: 'hero', v: 10 }, men: 1 }, '「うへ〜、わかってるねぇ〜、新入生くん」\n小鳥遊ホシノ、2年生。それから昼休みは、ここが定位置になった。', 'life'],
     ['「おじさんって……先輩、女の子ですよね？」', { like: { who: 'hero', v: 6 }, com: 1 }, '「うへへ〜、細かいことはいいんだよ〜」\n先輩はまた目を閉じた。口元が笑っていた。', 'b'],
     ['邪魔しないように戻る', { like: { who: 'hero', v: 1 } }, '「あれ〜、行っちゃうの〜？」\n振り返ると、先輩はもう寝ていた。', 'soccer']], 'school');
  Ev('ho_spring', 'hoshino', { step: 1, gap: 1, c: function (S) { return true; } }, '桜の下で', '🌸',
    '休日。駅前で私服のホシノ先輩とばったり会った。\n「うへっ！？ な、なんでここに〜！？」\nいつも眠そうな先輩が、めずらしく慌てている。手には、スポーツ用品店の袋。',
    [['「何買ったんですか？」と聞く', { like: { who: 'hero', v: 8 } }, '「……べ、別に〜？ 後輩くんが使ってるスパイクと同じやつとか、見てないよ〜？」\n袋の中身は、テーピングと、サッカーの雑誌だった。', 'life'],
     ['「先輩の私服、新鮮ですね」', { like: { who: 'hero', v: 10 }, com: 1 }, '「うへ〜……そういうこと、さらっと言うんだ〜……」\n先輩は帽子を目深にかぶって、そっぽを向いた。', 'life'],
     ['軽く会釈して通り過ぎる', { like: { who: 'hero', v: -2 } }, '「……ちぇ〜」\n背中で、小さな声が聞こえた気がした。', 'soccer']], 'spring');
  Ev('ho_watch', 'hoshino', { step: 2, gap: 2, c: function (S) { return true; } }, '見てないふり', '👀',
    function (S) { return (soc(S) ? '練習試合' : '体育祭') + 'の日。スタンドの一番上で、ホシノ先輩が寝ていた。……ように見えた。\n終わったあと、先輩がふらっと近づいてきた。\n「うへ〜、さっきの' + (soc(S) ? '右に切り返したやつ' : 'リレー') + '、よかったよ〜。……あ、いや、寝てたけどね〜？」'; },
    [['「寝てたのに見てたんですか」とツッコむ', { like: { who: 'hero', v: 9 } }, '「うへっ……。……適当に、適当に〜」\n先輩は早足で去っていった。耳が真っ赤だった。', 'life'],
     ['「次も見ててください」', { like: { who: 'hero', v: 8 }, men: 1 }, '「……しょうがないなぁ〜。おじさん、暇だからね〜」\nそれから、先輩はいつもスタンドにいた。', 'soccer']], 'school');
  Ev('ho_serious', 'hoshino', { step: 3, gap: 2, c: function (S) { return true; } }, '本気のホシノ', '🛡️',
    '帰り道。上級生に絡まれて、面倒なことになりかけた。\nその時、ホシノ先輩が間に入った。\nいつもの間延びした声じゃない。低くて、静かな声だった。\n\n「――その子、うちの後輩なんだけど。何か用？」\n\n相手は、なぜか一歩下がった。',
    [['「先輩……かっこよかったです」', { like: { who: 'hero', v: 10 } }, '先輩はすぐにいつもの顔に戻った。\n「うへ〜、おじさん疲れちゃった〜。……アイス、おごってね〜？」', 'life'],
     ['「自分でなんとかできました」と強がる', { like: { who: 'hero', v: 3 }, ego: 2 }, '「うへ〜、知ってる知ってる〜」\n先輩は頭をぽんぽんとたたいた。……全部、見抜かれている気がした。', 'b']], 'spring');
  Ev('ho_confess', 'hoshino', { step: 4, gap: 2, imp: 2, c: function (S) { return !S.spouseId && age(S) >= 16; } }, '先輩の卒業', '🌸',
    function (S) { return like(S) >= 55 ? '卒業式の日。屋上のベンチに、ホシノ先輩が寝転がっていた。\n「うへ〜、最後の昼寝〜」\n\n隣に座ると、先輩は目を閉じたまま言った。\n「……ねぇ、後輩くん。おじさんね、適当に生きてきたんだけど」\n「……{mei}くんのことだけは、適当にできなかったんだよね〜」\n\n目を開けた先輩の顔は、見たことがないほど真剣だった。' : '卒業式の日。ホシノ先輩は、屋上のベンチで最後の昼寝をしていた。\n「うへ〜、元気でね〜、後輩くん」\nそれだけ言って、先輩は手をひらひらと振った。'; },
    [['「先輩が好きです」', {}, function (S) { if (like(S) >= 55) { H.date(S, '屋上で'); return '「……うへ〜。言わせちゃった〜」\n先輩は顔を隠して、ベンチの上で丸くなった。\n「……よろしくね、{mei}くん。……ほんとに、よろしくね」'; } if (KL.chk(S, like(S) + S.st.com / 3, 55, 8)) { H.date(S, '先輩に告白'); return '先輩は目を丸くした。\n「……うへ〜。おじさん、そういうの弱いんだよね〜……」\n小さな手が、袖をつかんだ。'; } H.aff(S, -10); return '「……ごめんね〜。今は、まだかな〜」\n先輩は困ったように笑った。'; }, 'life', null, 2],
     ['「卒業おめでとうございます」とだけ言う', { like: { who: 'hero', v: -10 } }, function (S) { if (like(S) < 40) H.fade(S); return '「うへ〜、ありがと〜」\n' + (like(S) < 40 ? '先輩はそれきり、屋上に来ることはなかった。' : '先輩は少しだけ、さみしそうに笑った。'); }, 'soccer']], 'spring');
  Ev('ho_date', 'hoshino', { step: 5, gap: 2, c: function (S) { return H.dating(S); } }, 'のんびりデート', '☁️',
    '「うへ〜、デートって何するの〜？」\nホシノの提案は「公園で昼寝」だった。\n芝生に寝転がると、ホシノはすぐに寝息を立てた。',
    [['自分も隣で昼寝する', { like: { who: 'hero', v: 9 }, fat: -8, men: 2 }, '目を覚ますと、夕方だった。ホシノがこっちの顔をのぞきこんでいた。\n「うへへ〜、よだれ出てたよ〜」', 'life'],
     ['こっそりボールを蹴って練習する', { like: { who: 'hero', v: 2 }, sk: { dri: 1 } }, '目を覚ましたホシノが、ぼそっと言った。\n「……デート中も練習とか、まじめだねぇ〜。……そういうとこ、好きだけどさ〜」', 'soccer']], 'spring');
  Ev('ho_jealous', 'hoshino', { gap: 3, sched: false, w: 2, repeat: true, max: 2, cool: 8, c: function (S) { return H.together(S) && KL.mote(S) >= 55; } }, '……で、あの子だれ？', '🖤',
    function (S) { return (pro(S) ? 'パーティーで、モデルの女性と話しているところを撮られた。' : '文化祭で、後輩の女の子に写真をせがまれた。') + '\n\n' + H.react(S, 'jealous'); },
    [['正直に話して、ホシノだけだと伝える', { like: { who: 'hero', v: 9 } }, '「……うん。知ってるよ〜」\nホシノはいつもの顔に戻って、腕にしがみついてきた。\n「……でも、たまにはこうやって、ちゃんと言ってほしいんだよね〜」', 'life'],
     ['「ただの知り合いやって」と軽く流す', { like: { who: 'hero', v: -10 } }, '「ふ〜ん」\n笑顔のまま、ホシノは言った。\n「……ねぇ。次はないよ？」', 'soccer']], 'dark');
  Ev('ho_resort', 'hoshino', { step: 6, gap: 2, c: function (S) { return H.together(S) && age(S) + 1 >= 21; } }, '南の島', '🌺',
    '二人で南の島に旅行した。ハンモックに揺られながら、ホシノがこっちを見て笑っている。\n「うへ〜、ここ天国だよ〜。……ねぇ、ずっとこうしてたいなぁ〜」',
    [['「ずっと、こうしてよう」', { like: { who: 'hero', v: 10 }, men: 3, fat: -15 }, 'ホシノは目を閉じて、小さくうなずいた。\n波の音だけが聞こえる。', 'life'],
     ['「次の試合が終わったらな」', { like: { who: 'hero', v: 2 }, form: 1 }, '「うへ〜、仕事人間〜。……まぁ、そういうとこも含めて、だけどね〜」', 'soccer']], 'resort');
  Ev('ho_propose', 'hoshino', { step: 7, gap: 3, imp: 2, c: function (S) { return H.dating(S) && age(S) >= 21 && like(S) >= 65 && S.t - (S.hero.dateT || S.t) >= 4; } }, '屋上の約束', '💍',
    '久しぶりに、母校の屋上に来た。\nホシノは、昔と同じベンチに寝転がった。\n「うへ〜、懐かしいねぇ〜。……ここで、{mei}くんに会ったんだよねぇ〜」',
    [['「ホシノ。結婚しよう」', {}, function (S) { H.marry(S); return 'ホシノは起き上がって、指輪とこっちの顔を何度も見比べた。\n「……うへ〜。……うへぇ……」\n声が震えていた。\n「……適当に、なんて言えないよ、こんなの。……はい。よろしくね、{mei}」'; }, 'life'],
     ['昔話だけして帰る', { like: { who: 'hero', v: -6 } }, '「……うへ〜、そっか〜」\n帰り道、ホシノはいつもより少しだけ静かだった。', 'soccer']], 'closed');
  Ev('ho_wed', 'hoshino', { step: 8, gap: 1, c: function (S) { return H.married(S); } }, '結婚式', '💒',
    '結婚式。ドレス姿のホシノは、ずっとそわそわしていた。\n「うへ〜、おじさんにドレスとか、似合わないって〜……」\n誓いの言葉で、ホシノは一度だけ、まっすぐこっちを見た。',
    [['「世界一似合ってる」', { like: { who: 'hero', v: 10 }, men: 3 }, '「……うへ〜。……ばか」\n披露宴の最後、ホシノは泣きすぎて言葉にならなかった。', 'life']], 'closed');
  Ev('ho_life', 'hoshino', { gap: 6, sched: false, w: 2, repeat: true, max: 3, cool: 10, c: function (S) { return H.married(S); } }, 'ホシノのいる毎日', '🏠',
    ['休日の朝。ホシノはまだ布団の中だった。「うへ〜、あと5分〜……{mei}も、おいで〜」', '「今日はおじさんがごはん作るよ〜」。出てきたのは、カップ麺に高級な卵がのったものだった。', '夜、ホシノがぽつりと言った。「……ねぇ、{mei}。おじさんね、今が一番しあわせかも〜」', '試合から帰ると、ホシノはソファで寝ていた。テレビには、試合のリプレイが流れたままだった。'],
    [['一緒に過ごす', { like: { who: 'hero', v: 6 }, men: 2, fat: -6 }, ['何もしない一日。でも、それがいい。', 'ホシノのいびきが、意外と大きかった。', 'ホシノが「うへへ〜」と笑うと、家の中が明るくなる。'], 'life']], 'closed');

  // ======================================================
  //  星見 雅（フィジカルコーチ・5つ上・武家の娘）
  // ======================================================
  Ev('mb_meet', 'miyabi', { meet: true, how: function () { return 'クラブのフィジカルコーチ'; }(), step: 0, gap: 0, c: function (S) { return H.window(S, 'miyabi') === 'open'; } }, '新しいフィジカルコーチ', '⚔️',
    function (S) { return pro(S) ? '新しく招かれたフィジカルコーチは、黒髪の若い女性だった。\n武家の流れをくむ「星見家」の娘で、古武術の師範代だという。\n\n「星見雅だ。今日から体の使い方を叩き直す。――全員、並べ」\n\n凛とした声に、ベテランまで背筋を伸ばした。' : '会社帰りに通い始めた道場の師範代は、黒髪の若い女性だった。\n「星見雅だ。……お前、良い体をしているな。何かやっていたか」'; },
    [['「よろしくお願いします、星見さん」と頭を下げる', { like: { who: 'hero', v: 8 }, men: 1 }, '「……うむ。良い返事だ」\n練習後、雅はなぜかチームバスではなく、自分の車に乗り込もうとしていた。逆方向の。', 'b'],
     ['「若いですね」と軽口をたたく', { like: { who: 'hero', v: 2 }, ego: 1 }, '「年は関係ない。……腕立て、50回追加だ」', 'soccer']], 'work');
  Ev('mb_spar', 'miyabi', { step: 1, gap: 1, c: function (S) { return true; } }, '手合わせ', '🗡️',
    '居残りでトレーニングしていると、雅に呼び止められた。\n「お前の体幹は、まだ伸びる。……少し付き合え」\n連れて行かれたのは、クラブハウスの裏にある小さな道場だった。\n雅は木刀を一本、こっちに放った。',
    [['本気で打ち込む', { like: { who: 'hero', v: 10 }, sk: { phy: 2 }, fat: 8 }, '十本打ち込んで、十本とも流された。\n「……悪くない。体の芯がぶれていない」\n雅はほんの少しだけ口元をゆるめた。', 'soccer'],
     ['動きをよく見て、真似をする', { like: { who: 'hero', v: 8 }, sk: { iq: 1, spd: 1 } }, '「……見て盗むか。それもまた武だ」\n雅は一つひとつの所作を、ゆっくりと見せてくれた。', 'b']], 'sword');
  Ev('mb_tennen', 'miyabi', { step: 2, gap: 2, c: function (S) { return true; } }, '天然の師範代', '🍵',
    '遠征先のホテル。ロビーで、雅が地図を逆さに持って立ち尽くしていた。\n「……この街は、地図と道が逆になっているな」\n「なっていません」\n「……そうか」',
    [['一緒に目的地まで行く', { like: { who: 'hero', v: 10 }, com: 1 }, '目的地は、ホテルの真向かいのカフェだった。\n「……助かった。礼に、団子をおごろう」\n雅は真剣な顔で、三本注文した。全部自分で食べた。', 'life'],
     ['笑いをこらえきれない', { like: { who: 'hero', v: 5 } }, '「……笑うな」\n雅は少し頬を赤くして、地図をきちんと持ち直した。', 'b']], 'work');
  Ev('mb_house', 'miyabi', { step: 3, gap: 2, c: function (S) { return like(S) >= 35; } }, '星見家', '🏯',
    '雅に誘われて、星見家の屋敷を訪れた。長い廊下、手入れされた庭。\n雅は着物姿で、静かに茶を点てていた。\n「……我が家は、武を重んじる。だが、父は今、私の縁談のことばかり言う」',
    [['「雅さんは、どうしたいんですか」', { like: { who: 'hero', v: 10 } }, '雅は茶筅の手を止めた。\n「……自分で選んだ者と、生きたい。……それだけだ」\nその目が、こっちを見ていた気がした。', 'life'],
     ['「立派なお家ですね」と話をそらす', { like: { who: 'hero', v: 1 } }, '「……そうだな」\n雅は、それ以上何も言わなかった。', 'b']], 'formal');
  Ev('mb_confess', 'miyabi', { step: 4, gap: 2, imp: 2, c: function (S) { return !S.spouseId; } }, '雅の言葉', '🌙',
    function (S) { return like(S) >= 55 ? '練習後の道場。雅は木刀を置いて、まっすぐこっちを見た。\n\n「{mei}。単刀直入に言う」\n「お前を好いている。……返事は、急がない」\n\nそれだけ言って、雅は正座したまま動かなくなった。耳まで真っ赤だった。' : '練習後の道場。雅は木刀を磨きながら言った。\n「来月から、別のクラブに招かれることになった。……世話になったな」'; },
    [['「おれも、雅さんが好きです」', {}, function (S) { if (like(S) >= 55) { H.date(S, '道場で'); return '雅は、長いこと目を閉じていた。\n「……そうか」\n「……そうか。……嬉しいものだな」\n凛とした声が、少しだけ震えていた。'; } if (KL.chk(S, like(S) + S.st.men / 3, 55, 8)) { H.date(S, '道場で告白'); return '「……っ」\n雅は木刀を取り落とした。\n「……不意打ちは、卑怯だぞ」'; } H.aff(S, -10); return '「……すまない。今は、受け取れない」\n雅は深く頭を下げた。'; }, 'life', null, 2],
     ['「これからも指導をお願いします」', { like: { who: 'hero', v: -10 } }, function (S) { if (like(S) < 40) H.fade(S); return '「……承知した」\n' + (like(S) < 40 ? '次のシーズン、雅は別のクラブへ移っていった。' : '雅は小さく息をついて、木刀を構え直した。'); }, 'soccer']], 'sword');
  Ev('mb_date', 'miyabi', { step: 5, gap: 2, c: function (S) { return H.dating(S); } }, '雅との初デート', '🍡',
    '初めてのデート。雅は待ち合わせ時間の二時間前に来ていたらしい。\n「……早く着きすぎた。団子を六本食べた」\n行き先は、雅の希望で「刀剣の博物館」だった。',
    [['雅の解説を真剣に聞く', { like: { who: 'hero', v: 10 }, int: 1 }, '雅は展示の前で一時間しゃべり続けた。普段の三倍は話していた。\n帰り道、雅が小さく言った。\n「……退屈ではなかったか」', 'life'],
     ['途中で雅を連れ出してカフェに行く', { like: { who: 'hero', v: 6 } }, '「……そうか、普通はこういう場所に来るのか」\n雅はパフェを前に、真剣な顔で作戦を練っていた。', 'b']], 'work');
  Ev('mb_jealous', 'miyabi', { gap: 3, sched: false, w: 2, repeat: true, max: 2, cool: 8, c: function (S) { return H.together(S) && KL.mote(S) >= 55; } }, '……楽しそうだったな', '🖤',
    function (S) { return 'ファンイベントで、女性ファンに抱きつかれる写真が出回った。\n\n' + H.react(S, 'jealous'); },
    [['「雅さんしか見てへん」とまっすぐ伝える', { like: { who: 'hero', v: 9 } }, '「……そうか」\n刀を置いた雅は、こっちの肩に額を預けた。\n「……知っている。だが、言葉は、良いものだな」', 'life'],
     ['「仕事やし、しゃあないやろ」', { like: { who: 'hero', v: -10 } }, '「……」\nその夜、道場から竹刀の音が朝まで響いていた。', 'soccer']], 'dark');
  Ev('mb_father', 'miyabi', { step: 6, gap: 3, imp: 2, c: function (S) { return H.dating(S) && like(S) >= 60 && S.t - (S.hero.dateT || S.t) >= 3; } }, '星見家当主', '🏯',
    '星見家の当主――雅の父に呼び出された。道場の中央。\n「娘をくれと言うなら、一本取ってみせよ」\n木刀を渡された。雅が、道場の隅で正座して見ている。',
    [['正面から打ち込む', { sk: { phy: 1 } }, function (S) { if (KL.chk(S, (S.st.ath + S.st.men) / 2, 55, 8)) { H.aff(S, 10); S.hero.f.father = 1; return '一瞬の隙に、木刀が当主の胴をかすめた。\n「……ほう」\n当主は、初めて笑った。\n「雅を、頼む」'; } H.aff(S, 6); S.hero.f.father = 1; return '十本、全部はじき返された。\nそれでも最後まで立っていた。\n当主は木刀を収めて言った。\n「……折れぬ心は、見せてもらった」'; }, 'soccer'],
     ['「一本は取れません。でも、雅さんを幸せにする覚悟はあります」', { like: { who: 'hero', v: 12 } }, function (S) { S.hero.f.father = 1; return '当主はしばらく黙っていた。\n「……武人に、口で勝負を挑むか」\n「……面白い。気に入った」\n雅が、隅でそっと目元をぬぐっていた。'; }, 'life']], 'formal');
  Ev('mb_propose', 'miyabi', { step: 7, gap: 2, imp: 2, c: function (S) { return H.dating(S) && age(S) >= 21 && like(S) >= 65 && S.hero.f.father; } }, '月の夜', '💍',
    '星見家の庭。満月の夜。\n白い装いの雅が、縁側に座っていた。\n「……今宵の月は、美しいな」',
    [['「雅さん。結婚してください」', {}, function (S) { H.marry(S); return '雅は、指輪を両手で受け取った。\n「……承知した」\n「……いや。違うな。こういう時は――」\n雅は少しだけうつむいて、言い直した。\n「……喜んで、{mei}」'; }, 'life'],
     ['月を見上げて、何も言えなかった', { like: { who: 'hero', v: -6 } }, '「……そうだな。月が、きれいだ」\n雅は、それ以上何も言わなかった。', 'soccer']], 'formal');
  Ev('mb_wed', 'miyabi', { step: 8, gap: 1, c: function (S) { return H.married(S); } }, '祝言', '💒',
    '星見家の伝統に従った祝言。白無垢の雅は、凛として美しかった。\n三々九度の盃を交わしたあと、雅が小さく言った。\n「……緊張で、団子が喉を通らん」',
    [['「あとで一緒に食べよう」', { like: { who: 'hero', v: 10 }, men: 3 }, '式のあと、二人で縁側に座って団子を食べた。\n雅は三本食べてから、ふっと笑った。\n「……良い日だ」', 'life']], 'formal');
  Ev('mb_life', 'miyabi', { gap: 6, sched: false, w: 2, repeat: true, max: 3, cool: 10, c: function (S) { return H.married(S); } }, '雅のいる毎日', '🏠',
    ['朝5時。「起きろ、{mei}。稽古の時間だ」。……休日なのに。', '雅が料理に挑戦した。「……焦げた。だが、気合いは入っている」', '夜、雅が肩に頭をのせてきた。「……少し、このままでいさせろ」', '雅が、また逆方向の電車に乗った。迎えに行くと「……この線路が悪い」と言った。'],
    [['一緒に過ごす', { like: { who: 'hero', v: 6 }, men: 2, sk: { phy: 1 } }, ['雅の稽古のおかげで、体がよく動く。', '雅は真顔で「……悪くない一日だった」と言った。最大級の褒め言葉だ。', '二人で縁側に並んで、月を見た。'], 'life']], 'base');

  // 付き合っている間のデート（くり返し・文章は使い切るまで重複なし）
  H.DATE = {
    chisa: ['千咲と、古い喫茶店で向かい合って本を読んだ。会話は少ない。でも、それがいい。', '千咲が「……観たい映画がある」と言った。恋愛映画だった。終わったあと、千咲は少しだけ泣いていた。', '夜の公園。千咲が、小さい頃に二人で埋めたタイムカプセルの場所を覚えていた。', '千咲の手作りのお弁当。卵焼きが、ちょっとだけ甘かった。「……昔、甘いのが好きって言ってたから」'],
    miyako: ['ミヤコと水族館へ。ペンギンの前で、ミヤコが真剣にメモを取っていた。「……先輩、ペンギンの歩行効率についてですが」', 'ミヤコが手作りのスポーツドリンクを持ってきた。「配合比率は最適化済みです。……味の保証は、ありません」', '雨の日、ミヤコの部屋で一緒に試合映像を見た。いつの間にか、肩に頭がのっていた。', 'ミヤコがうさぎのぬいぐるみを買った。「……先輩が遠征でいない日の、代理です」'],
    hoshino: ['ホシノと河原で昼寝。目を覚ますと、ホシノがこっちの寝顔を撮っていた。「うへへ〜、保存〜」', 'ホシノとゲームセンターへ。クレーンゲームが異常にうまかった。「おじさん、昔取った杵柄だよ〜」', '夜、ホシノがふいに真面目な顔で言った。「……ねぇ。どこにも行かないでね」', 'ホシノの作ったカレー。具が全部大きかった。「適当に、適当に〜。……おいしい？」'],
    miyabi: ['雅と団子屋めぐり。五軒目で、雅が真剣な顔で言った。「……次で最後にする。たぶん」', '雅と夜の散歩。雅はなぜか、ずっと半歩前を歩いて周りを警戒していた。「……癖だ」', '雅が朝の稽古に誘ってくれた。日の出の中の素振りは、思ったより気持ちよかった。', '雅が手料理をふるまってくれた。焦げた魚を前に、「……気合いは入っている」と言い張った。']
  };
  KL.sc('hero_date', { cat: 'hero', w: 3, repeat: true, max: 12, cool: 2, cond: function (S) { return H.dating(S) && S.hero && !S.hero.gone; }, img: function (S) { return H.img(S, S.hero.cur === 'hoshino' ? 'resort' : S.hero.cur === 'miyabi' ? 'work' : 'base'); } }, 'デート', '💕',
    function (S) { return ST.pick(S, 'hdate_' + S.hero.cur, H.DATE[S.hero.cur]); },
    [['ゆっくり一緒に過ごす', { like: { who: 'hero', v: 9 }, men: 2, fat: -4 }, function (S) { return H.v(S, 'happy'); }, 'life'],
     ['次の試合の話をする', { like: { who: 'hero', v: 4 }, form: 1 }, function (S) { return H.v(S, 'yes'); }, 'soccer']]);

  // ======================================================
  //  幼稚園のころ、一度だけすれ違う（千咲は隣の家で出会うので無し）
  // ======================================================
  H.KINDER = {
    miyako: { title: 'うさぎのキーホルダー', icon: '🐰', text: '公園の砂場のそばで、小さな女の子が泣いていた。\n足もとに、うさぎのキーホルダーが落ちている。\n「……う、うさぎさん……」',
      a: ['拾って、手のひらにのせてあげる', '女の子は泣きやんで、キーホルダーをぎゅっと握った。\n「……ありがとう、ございます」\n小さいのに、ていねいな話し方をする子だった。名前は聞きそびれた。'],
      b: ['お母さんを呼んでくる', 'お母さんが来ると、女の子はうさぎを抱えて帰っていった。\n振り返って、小さく頭を下げていた。'],
      recall: '……ミヤコのカバンに、色のあせたうさぎのキーホルダーが揺れていた。\n「……それ」\n「……これは、昔、公園で拾っていただいたものです」\nミヤコは、少しだけ目を伏せた。\n「……やっぱり、先輩だったんですね」' },
    hoshino: { title: '迷子のふたり', icon: '🎈', text: 'ショッピングモールで、お母さんとはぐれた。\nベンチに、ぼーっと座っている年上の女の子がいた。\n「うへ〜……きみも迷子〜？ おじさんもなんだよね〜」',
      a: ['となりに座って一緒に待つ', '女の子は、ずっとのんびり話してくれた。\n「だいじょうぶだよ〜。適当に待ってれば、だれか来るから〜」\n本当に、すぐにお母さんが来た。'],
      b: ['ひとりで探しに行く', '「あ〜、行っちゃうの〜？ 気をつけてね〜」\n振り返ると、女の子は手をひらひら振っていた。'],
      recall: '「……ねえ〜。きみ、昔ショッピングモールで迷子になってなかった〜？」\n先輩は、目を細めてこっちを見た。\n「うへ〜、やっぱり〜。……おじさん、覚えてたんだよね〜。ずっと」' },
    miyabi: { title: '夏祭りのお姉さん', icon: '🏮', text: '夏祭りの人混みで、走っていたら誰かにぶつかった。\n浴衣に木刀を下げた、背の高いお姉さんだった。\n「……走るな。危ないだろう」',
      a: ['「ごめんなさい」とちゃんと謝る', 'お姉さんは少しだけ目を丸くして、それから頭をぽんと叩いた。\n「……よし。素直なのはいいことだ」\nりんご飴を一本、くれた。'],
      b: ['びっくりして逃げ出す', '「おい、待て――」\n振り返ると、お姉さんは人混みの中で、ちょっと困った顔をしていた。'],
      recall: '「……待て。お前、昔、夏祭りでぶつかってきた子供か」\n雅は、まじまじとこっちの顔を見た。\n「……そうか。あの子供が、こうなったか」\n凛とした顔が、ほんの少しだけゆるんだ。' }
  };
  KL.sc('hero_kinder', { cat: 'hero', sched: true, imp: 2, pri: 4, cond: function (S) { var h = S.hero; return !!h && !h.met && !h.kinder && h.mode === 'main' && !!H.KINDER[h.cur] && KL.age(S) >= 4 && KL.age(S) <= 6; },
    fx: function (S) { S.hero.kinder = S.hero.cur; } },
    function (S) { return H.KINDER[S.hero.kinder || S.hero.cur].title; }, '🌱',
    function (S) { return H.KINDER[S.hero.kinder || S.hero.cur].text; },
    [[function (S) { return H.KINDER[S.hero.kinder || S.hero.cur].a[0]; }, { com: 1 }, function (S) { S.hero.kindA = true; return H.KINDER[S.hero.kinder || S.hero.cur].a[1]; }, 'life'],
     [function (S) { return H.KINDER[S.hero.kinder || S.hero.cur].b[0]; }, {}, function (S) { return H.KINDER[S.hero.kinder || S.hero.cur].b[1]; }, 'b']]);
  // 出会ったとき、幼稚園の子と同じなら思い出す
  var meet0 = H.meet;
  H.meet = function (S, how) {
    var was = S.hero.met, n = meet0(S, how);
    if (!was && n && S.hero.kinder && S.hero.kinder === S.hero.cur && H.KINDER[S.hero.cur]) {
      var id = S.hero.cur;
      KL.push(S, { id: 'hero_recall', cat: 'hero', imp: 2, title: 'あのときの', icon: H.KINDER[id].icon, text: KL.fill(S, H.KINDER[id].recall), img: H.img(S, 'base'),
        choices: [{ t: '「覚えてたんだ」', ok: true, fx: function (S) { H.aff(S, S.hero.kindA ? 12 : 6); H.mark(S, 'あのときの', H.img(S, 'base')); return '不思議な縁だと思った。'; } }] });
    }
    return n;
  };

  // ======================================================
  //  共通：切り替わったときの千咲（再会）・別れたあとの再会
  // ======================================================
  Ev('ch_reunion_meet', 'chisa', { meet: true, how: '昔、近所に住んでいたお姉さん', step: 0, gap: 0, c: function (S) { return S.hero.mode === 'switch' && H.window(S, 'chisa') === 'open'; } }, '思い出のお姉さん', '🎀',
    '地元の駅のホーム。黒い髪に赤いリボンの女性が、こっちを見ていた。\n「……{mei}くん？」\n\n思い出した。小さい頃、少しだけ近所に住んでいた、2つ年上のお姉さん。\n「……朽葉、千咲。覚えてない、よね」',
    [['「千咲ちゃん！？ 覚えてるよ」', { like: { who: 'hero', v: 14 } }, '千咲は小さく目を見開いて、それから、ほんの少しだけ笑った。\n「……そっか。よかった」\n連絡先を交換した。', 'life'],
     ['「えっと……すみません」', { like: { who: 'hero', v: 4 } }, '「……ううん。いいの」\n千咲は少しさみしそうに笑って、電車に乗っていった。', 'soccer']], 'base');
  // 再会：switchモードの千咲は step 5（手紙）から始まる
  KL.EVENTS.forEach(function (e) { if (e.id === 'ch_reunion_meet') { var f0 = e.fx; e.fx = function (S) { f0(S); S.hero.step = 5; }; } });
  // 別れたあと、一度だけの復縁チャンス
  KL.sc('hero_reunion', { cat: 'hero', sched: true, imp: 2, cond: function (S) { var h = S.hero; return !!h && h.gone && !h.reunion && h.npc && S.t - (h.goneT || 0) >= 8 && H.single(S) && KL.age(S) <= 50; },
    fx: function (S) { S.hero.reunion = true; H.mark(S, '再会', H.img(S, 'base')); }, img: function (S) { return H.img(S, 'base'); } }, '再会', '🌙',
    function (S) { var id = S.hero.cur, d = H.D[id]; return '何年ぶりだろう。' + ({ chisa: '地元の夏祭りで', miyako: '代表戦のスタジアムの通路で', hoshino: '母校の近くの公園で', miyabi: '遠征先の駅のホームで' })[id] + '、' + d.mei + 'と再会した。\n\n' + ({ chisa: '「……{mei}くん。久しぶり」\n赤いリボンは、昔のままだった。', miyako: '「……先輩。お久しぶりです」\n手には、あの頃と同じノートを持っていた。', hoshino: '「うへ〜……久しぶりだねぇ〜」\nいつもの調子なのに、声が少しだけ震えていた。', miyabi: '「……{mei}か。……変わらんな」\n雅は、少しだけ視線をそらした。' })[id]; },
    [['「もう一度、やり直したい」', {}, function (S) { var n = H.npc(S); S.hero.gone = false; if (n) { n.hidden = false; n.like = Math.max(n.like, 50); } if (KL.chk(S, (n ? n.like : 40) + S.st.com / 3, 52, 8)) { H.date(S, '再会'); return KL.fill(S, H.v(S, 'yes')) + '\n\n止まっていた時間が、また動き出した。'; } if (n) n.hidden = true; S.hero.gone = true; return '「……ごめん。あの頃には、戻れない」\nそれでも、最後に笑ってくれた。'; }, 'life'],
     ['「元気そうでよかった」とだけ言う', {}, '少しだけ昔話をして、別れた。\nそれで、よかったのだと思う。', 'soccer']]);

  // 恋人がいるときの告白には一言そえる
  ['ch_confess', 'my_confess', 'ho_confess', 'mb_confess'].forEach(function (id) {
    var e = KL.EVENTS.filter(function (x) { return x.id === id; })[0]; if (!e) return;
    var t0 = e.text; e.text = function (S) { var p = KL.partner(S); return t0(S) + (p && !p.hero && H.like(S) >= 55 ? '\n\n――恋人の' + ST.first(p) + 'がいることは、彼女も知っている。それでも、言わずにはいられなかったのだろう。' : ''); };
  });
  // ヒロインの「最近」
  H.NOW = {
    chisa: { pre: ['図書館で、また分厚い本を借りていた', '最近、手紙用の便箋を集めているらしい', 'リボンの色を、ほんの少しだけ変えた'], date: ['{mei}くんの試合の日は、カレンダーに赤丸がついている', '新しい便箋で、また手紙を書いているらしい', '最近、料理を練習している。……味は、まだ秘密らしい'], wife: ['毎朝、玄関で「いってらっしゃい」の手紙をくれる', '庭に小さな花壇を作った', '{mei}くんの試合の切り抜きを、アルバムにしている'] },
    miyako: { pre: ['新しい分析ソフトを使いこなしている', 'うさぎの動画を見て、こっそり和んでいるらしい', '「先輩のデータ」と書かれたファイルが、また増えた'], date: ['先輩の睡眠時間を、勝手に管理し始めた', '最近、うさぎの抱き枕を買ったらしい', '試合の前日は、必ず「了解しました」とだけ連絡が来る'], wife: ['家計簿まで分析している', '{mei}さんの体調を毎朝チェックしている', 'うさぎの「先輩」と、毎日昼寝している'] },
    hoshino: { pre: ['今日もどこかで昼寝しているらしい', '最近、クジラのぬいぐるみを集めている', '「うへ〜、面倒くさいねぇ〜」が口ぐせ'], date: ['デートの行き先は、だいたい昼寝スポット', '{mei}くんの試合だけは、絶対に寝ないで見ている', '最近、料理を覚えようとしている。……カップ麺のアレンジから'], wife: ['休日は、ほぼ一日中ソファで丸くなっている', '{mei}の試合の日だけは、早起きする', '「うへへ〜、しあわせ〜」が口ぐせになった'] },
    miyabi: { pre: ['道場で、若い門下生を鍛えている', '団子屋の新作を、制覇しようとしている', 'また逆方向の電車に乗ったらしい'], date: ['刀の手入れの時間が、少しだけ減った。……連絡の時間が増えた', '{mei}のための栄養計画を、勝手に作っている', 'デートの行き先は、だいたい団子屋'], wife: ['毎朝5時に稽古をしている', '料理の腕が、少しずつ上がってきた', '夜、縁側で月を見るのが日課になった'] }
  };
  var nowOrig = KL.Love.nowOf;
  KL.Love.nowOf = function (S, n) {
    if (!n || !n.hero || !H.NOW[n.hero]) return nowOrig(S, n);
    var k = H.married(S) ? 'wife' : H.dating(S) ? 'date' : 'pre', arr = H.NOW[n.hero][k];
    var seed = Math.abs(Math.sin(S.t * 13 + 7)), job = KL.npcJob(S, n);
    return (KL.npcAge(S, n) >= 22 && job ? job + '。' : '') + KL.fill(S, arr[Math.floor(seed * arr.length)]);
  };
  var jobOrig = KL.npcJob;
  KL.npcJob = function (S, n) {
    if (n && n.hero && !n.job) {
      var a = KL.npcAge(S, n);
      if (n.hero === 'miyabi') return a >= 22 ? (S.stage === 'pro' ? 'クラブのフィジカルコーチ' : '古武術の師範代') : '大学生';
      if (a >= 22) return { chisa: '出版社の編集者', miyako: 'スポーツデータアナリスト', hoshino: 'のんびり働く会社員' }[n.hero];
    }
    return jobOrig(S, n);
  };

  // ---------- 一般の恋愛イベントとかち合わないように ----------
  var BLOCK = ['l_date', 'l_bday', 'l_jealous', 'l_tempt', 'l_ldr', 'l_parents', 'r_propose', 'r_fight', 'r_breakup', 's_firstdate', 'ro_jealous'];
  H.patch = function () {
    (KL.EVENTS || []).forEach(function (e) {
      if (BLOCK.indexOf(e.id) < 0 || e._heroPatched) return;
      var c0 = e.cond; e._heroPatched = true;
      e.cond = function (S) { var p = KL.partner(S); if (p && p.hero) return false; return c0(S); };
    });
  };
  // 半年ごと（core.js の halfCommon から）
  H.halfTurn = H.half;
  // 年齢の合う時期を過ぎた出来事は飛ばす（話が止まらないように）
  H.STEPMAX = { chisa: { 1: 8, 2: 11, 3: 12, 4: 15, 5: 16 } };
  H.half = function (S) {
    H.halfTurn(S);
    var h = S.hero, n = H.npc(S), a = KL.age(S);
    if (h && h.met && !h.gone && h.mode === 'main' && H.STEPMAX[h.cur]) { var mx = H.STEPMAX[h.cur][h.step]; while (mx !== undefined && a > mx) { h.step++; mx = H.STEPMAX[h.cur][h.step]; } }
    if (h && h.met && !h.gone && h.cur === 'chisa' && h.mode === 'main' && h.step === 6 && a > 20) H.fade(S);
    if (h && h.met && !h.gone && h.cur === 'chisa' && h.step === 7 && !H.together(S) && (a > 24 || (a > 21 && !abroad(S)))) H.fade(S);
    // 付き合っていて冷めきったら別れ
    if (n && H.together(S) && n.like < 12) {
      KL.push(S, { id: 'hero_break', cat: 'hero', imp: 2, title: '別れ', icon: '💔', text: KL.fill(S, H.react(S, 'caught') || '気づけば、すれ違ってばかりだった。'), img: H.img(S, 'dark'),
        choices: [{ t: '引き止める', ok: true, fx: function (S) { var n2 = H.npc(S); if (n2 && KL.chk(S, n2.like + S.st.com / 2, 40, 8)) { KL.likeAdd(n2, 15); return '何度も話し合って、もう一度だけ、と言ってもらえた。'; } H.part(S, 'すれ違い'); return '止められなかった。'; } },
          { t: '受け入れる', ok: true, fx: function (S) { H.part(S, 'すれ違い'); return '静かに、終わった。'; } }] });
    }
  };
})();
