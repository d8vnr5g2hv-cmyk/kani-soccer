/* Kani Life - 毎年ある学校行事（学年ごとに中身を変える） */
(function () {
  'use strict';
  var KL = window.KL, U = KL.U, ST = KL.Story;
  function age(S) { return KL.age(S); }
  function B(S) { return KL.isB(S); }
  function grade(S) { var a = age(S); return S.stage === 'elem' ? a - 5 : S.stage === 'jhs' ? a - 11 : S.stage === 'hs' ? a - 14 : S.stage === 'univ' ? a - 17 : 0; }
  function soc(S) { return S.track === 'soccer' && S.soccer && !S.soccer.retired; }
  function genius(S) { return soc(S) && KL.Soccer.ovr(S.soccer) - KL.Soccer.E(age(S)) >= 8; }
  function crush(S) { return KL.partner(S) || KL.crush(S); }
  function heroHere(S) { var n = KL.Hero && KL.Hero.npc(S); return n && !S.hero.gone && !n.hidden && Math.abs(n.ad || 0) <= 2 && KL.isStudent(S) ? n : null; }
  function first(n) { return ST.first(n); }
  function rep(arr, S) { return arr[Math.min(arr.length - 1, Math.max(0, grade(S) - 1))]; }
  var R = function (ev) { return KL.replaceEvent(ev); };

  // ---------- 運動会（幼稚園・小学校） ----------
  R({ id: 'k_undokai', sched: true, pri: 6, repeat: true, cond: function (S) { return S.stage === 'kinder' && !B(S); }, title: function (S) { return ['', '', '', '年少さんの運動会', '年中さんの運動会', '年長さんの運動会'][age(S)] || '運動会'; }, icon: '🏃',
    text: function (S) { return ({ 3: 'はじめての運動会。スタートの合図にびっくりして、立ち止まってしまった。父がビデオを構えている。', 4: '年中さんのかけっこ。去年より、ちょっとだけ速くなった気がする。', 5: '年長さん最後の運動会。クラス対抗リレーのアンカーに選ばれた！' })[age(S)] || 'かけっこの番が回ってきた。'; },
    choices: [{ t: '全力で走る！', fx: function (S) { var r = KL.chk(S, 'ath', 20 + (age(S) - 3) * 4, 6); KL.add(S, 'ath', 1); if (r) { KL.repAdd(S, 'sch', 5); return ({ 3: '泣きながら走って、なぜか1等賞。', 4: '1等賞！ メダルをもらってご満悦。', 5: 'アンカーで逆転！ 園長先生が拍手していた。' })[age(S)] || '1等賞！'; } return ({ 3: '途中でママを見つけて、そっちに走っていった。', 4: 'ゴール直前で転んだけど、最後まで走りきった。', 5: '2等賞。悔しくて、帰りの車で泣いた。' })[age(S)] || '最後まで走りきった。'; } }] });
  R({ id: 'e_undokai', sched: true, pri: 6, repeat: true, cond: function (S) { return S.stage === 'elem' && !B(S); }, title: function (S) { return '運動会（' + grade(S) + '年生）'; }, icon: '🏁',
    text: function (S) { return rep(['1年生の運動会。玉入れとかけっこ。おうちの人がシートを広げて場所取りをしている。', '2年生。今年は「ダンス」がある。振り付けを全然覚えられていない。', '3年生。クラス対抗リレーの選手を決めることになった。', '4年生。組体操のピラミッド。一番下か、一番上か。', '5年生。騎馬戦で、隣のクラスの「最強の騎馬」とぶつかる。', '小学校最後の運動会。6年生全員でのソーラン節と、代表リレー。'], S) + (genius(S) ? '\n「サッカーのうまいあいつがいるクラスが勝つ」と、みんなが噂している。' : ''); },
    choices: [
      { t: function (S) { return rep(['かけっこで1番を目指す', 'ダンスで目立つ', 'リレーの選手に立候補', 'ピラミッドのてっぺんに立つ', '騎馬の上に乗る', '代表リレーのアンカーに立候補'], S); }, fx: function (S) { if (KL.chk(S, (S.st.ath + (grade(S) === 2 ? S.st.art : S.st.ath)) / 2, 20 + grade(S) * 6, 6)) { KL.repAdd(S, 'sch', 6 + grade(S)); KL.add(S, 'men', 1); return rep(['ぶっちぎりの1番！ 先生にほめられた。', '最前列で踊りきった。保護者席から「あの子うまい！」と声が。', 'アンカーで2人抜き！ 一躍クラスのヒーローに。', 'てっぺんで両手を広げた。景色が、全部見えた。', '最強の騎馬のハチマキを奪い取った！', 'アンカーでゴールテープを切った。小学校最後の、最高の瞬間。'], S); } KL.add(S, 'men', -1); return rep(['転んじゃったけど、最後まで走った。', '振り付けを一個間違えた。誰も気づいていなかった。', '抜かれてしまった…。でも応援の声がうれしかった。', 'ぐらついて、崩れた。でもみんなで笑った。', 'ハチマキを取られた。悔しい。', '2位。6年生のみんなで泣いた。'], S); } },
      { t: '応援団で盛り上げる', fx: function (S) { KL.add(S, 'com', 2); KL.repAdd(S, 'sch', 3); return rep(['ぽんぽんを振りまくった。', '声がかれるまで応援した。', '応援合戦でクラスが表彰された。', '下級生に「かっこいい」と言われた。', '応援団の副団長になった。', '応援団長として、最後の応援を叫んだ。'], S); } }
    ] });
  // ---------- 体育祭（中高・毎年） ----------
  R({ id: 'j_taiikusai', sched: true, pri: 6, repeat: true, cond: function (S) { return (S.stage === 'jhs' || S.stage === 'hs') && !B(S); }, title: function (S) { return '体育祭（' + (S.stage === 'jhs' ? '中' : '高') + grade(S) + '）'; }, icon: '🏃',
    text: function (S) { var g = grade(S), h = S.stage === 'hs';
      var t = h ? ['高校最初の体育祭。上級生の気合いがすごい。クラスTシャツのデザインで揉めている。', '高2の体育祭。縦割りの団で、応援団の衣装を手作りすることに。', '高校最後の体育祭。3年生は全員、目が本気だ。'][g - 1] : ['中学最初の体育祭。小学校の運動会とは、空気がまるで違う。', '中2の体育祭。クラス対抗リレーで、去年負けたクラスにリベンジしたい。', '中学最後の体育祭。部活の後輩たちが応援に来ている。'][g - 1];
      return t + (genius(S) ? '\n「' + S.sei + 'がいるから、リレーは勝ちだろ」とクラスメイトが言っている。' : ''); },
    choices: [
      { t: 'アンカーに立候補', fx: function (S) { if (KL.chk(S, 'ath', 40 + (age(S) - 12) * 4, 6)) { KL.repAdd(S, 'sch', 10); var c = crush(S); if (c) KL.likeAdd(c, 5); return ST.say(S, 'tai_ok', ['ゴール前でごぼう抜き！ ほかのクラスの子にまで名前を知られた。', '最後のコーナーで2人を抜いて1位！ クラス全員が飛び出してきた。', 'バトンを受けた時点で最下位。そこから全員抜いた。伝説になった。']); } return ST.say(S, 'tai_ng', ['健闘したが2位。それでも拍手をもらった。', 'あと少し届かなかった。でも、悔しいって思えたのがよかった。']); } },
      { t: function (S) { return S.stage === 'hs' && grade(S) === 2 ? '応援団の衣装づくりを仕切る' : '応援団長になる'; }, fx: function (S) { KL.add(S, 'com', 2); KL.repAdd(S, 'sch', 5); return S.stage === 'hs' && grade(S) === 2 ? '徹夜で縫った衣装が、応援賞をとった。' : '学ランで声を張り上げた。'; } },
      { t: function (S) { var n = heroHere(S); return n ? first(n) + 'と一緒にいる' : ''; }, req: function (S) { return !!heroHere(S); }, fx: function (S) { var n = heroHere(S); if (!n) return ''; KL.likeAdd(n, 8); return ({ chisa: '千咲は木陰で本を読みながら、こっちの出番だけ顔を上げていた。', miyako: 'ミヤコは全種目の記録をとっていた。「……先輩の100m、自己ベストです」', hoshino: '「うへ〜、体育祭とかだるいよね〜」と言いながら、ホシノはずっと隣にいた。', miyabi: '' })[n.hero] || first(n) + 'と一緒に過ごした。'; } }
    ] });
  // ---------- 文化祭（中高・毎年） ----------
  R({ id: 'j_bunkasai', sched: true, pri: 6, repeat: true, cond: function (S) { return (S.stage === 'jhs' || S.stage === 'hs') && !B(S); }, title: function (S) { return '文化祭（' + (S.stage === 'jhs' ? '中' : '高') + grade(S) + '）'; }, icon: '🎪',
    text: function (S) { var g = grade(S), h = S.stage === 'hs';
      return h ? ['高1の文化祭。クラスの出し物はお化け屋敷。右も左もわからないまま、準備が始まった。', '高2の文化祭。今年は模擬店！ クラスの売上目標は学年1位。', '高校最後の文化祭。後夜祭のキャンプファイヤーで告白する、というのがこの学校の伝統らしい。'][g - 1]
        : ['中1の文化祭。クラス展示の「地域の歴史」。地味だ。', '中2の文化祭。クラス劇をやることになった。', '中学最後の文化祭。合唱コンクールの自由曲を決める。'][g - 1]; },
    choices: [
      { t: function (S) { var g = grade(S), h = S.stage === 'hs'; return h ? ['お化け役で驚かせまくる', '模擬店の店長になる', 'ステージでバンドをやる'][g - 1] : ['展示の看板を描く', '劇の主役に立候補', '指揮者に立候補'][g - 1]; },
        fx: function (S) { var g = grade(S), h = S.stage === 'hs', ok = KL.chk(S, (S.st.art + S.st.com) / 2, 38 + g * 4, 7);
          if (ok) { KL.repAdd(S, 'sch', 8 + g * 2); KL.add(S, 'art', 1); var c = crush(S); if (c) KL.likeAdd(c, 6); }
          if (h) return ok ? ['お客さんの悲鳴が廊下まで響いた。「怖すぎる」と行列ができた。', '焼きそばが飛ぶように売れて、売上学年1位！', '体育館が揺れるほどの盛り上がり。翌日から廊下で声をかけられるようになった。'][g - 1] : ['驚かせようとして、自分が一番驚いた。', '材料を仕入れすぎて、最終日は半額セールになった。', '緊張でグダグダ。でも、最高の思い出になった。'][g - 1];
          return ok ? ['看板が「一番目を引く」と校長先生にほめられた。', '主役を演じきった。保護者席がスタンディングオベーション。', 'クラスがひとつになって、まさかの金賞！'][g - 1] : ['看板の文字がはみ出した。味がある、と言われた。', 'じゃんけんで負けて、木の役になった。立派な木だった。', '銀賞。打ち上げで泣いた。'][g - 1]; } },
      { t: '裏方で準備を支える', fx: function (S) { KL.add(S, 'com', 2); return ST.say(S, 'bunka_ura', ['段ボールまみれになって、みんなと笑った。', '前日の夜まで残って、教室を飾りつけた。', '誰にも見えないところで頑張るのも、悪くない。']); } },
      { t: function (S) { var n = heroHere(S), c = crush(S); return n ? first(n) + 'と校内を回る' : c ? first(c) + 'と校内を回る' : ''; }, req: function (S) { return !!(heroHere(S) || crush(S)); }, fx: function (S) { var n = heroHere(S) || crush(S); if (!n) return ''; KL.likeAdd(n, 10); var last = S.stage === 'hs' && grade(S) === 3;
        if (n.hero) return ({ chisa: '千咲は、クラスの出し物の写真を一枚だけ撮っていた。写っていたのは、出し物じゃなくてこっちの横顔だった。', miyako: '「……先輩、お化け屋敷の所要時間は平均4分です。……手、つないでもいいですか。データのためです」', hoshino: '「うへ〜、射的やろうよ〜」。ホシノは景品を総なめにした。「おじさん、こういうの得意なんだよね〜」', miyabi: '' })[n.hero] + (last ? '\n後夜祭の火が、二人の影を長く伸ばしていた。' : '');
        return first(n) + 'と一緒に回った。' + (last ? '後夜祭の花火がきれいだった。' : 'クレープを半分こした。'); } }
    ] });
  // ---------- 球技大会（高校・毎年） ----------
  R({ id: 's_kyugi', w: 2, repeat: true, max: 3, cool: 2, cond: function (S) { return S.stage === 'hs' && B(S); }, title: function (S) { return '球技大会（高' + grade(S) + '）'; }, icon: '🏐',
    text: function (S) { return ['球技大会。種目はバレーとドッジボール。サッカーは「部員は出場禁止」らしい。', '球技大会。今年の種目はバスケ。身長の高いやつが有利だ。', '最後の球技大会。3年生チームには、なぜか先生も混ざっている。'][Math.max(0, grade(S) - 1)]; },
    choices: [{ t: 'エースとして出る', fx: function (S) { if (KL.chk(S, 'ath', 45, 6)) { KL.repAdd(S, 'sch', 6); var c = crush(S); if (c) KL.likeAdd(c, 6); return ST.say(S, 'kyugi_ok', ['クラスを優勝に導いた！ 応援席が湧いた。', '決勝でブザービーター。教室がお祭り騒ぎになった。', '先生チームを倒した。先生が一番悔しがっていた。']); } return '初戦敗退。応援係に回った。'; } }, { t: '応援に徹する', fx: function (S) { KL.add(S, 'com', 1); return ST.say(S, 'kyugi_cheer', ['クラスTシャツがかわいかった。', 'メガホンを持って叫びまくった。', 'のんびり日向ぼっこしながら応援した。']); } }] });
  // ---------- クリスマス（毎年） ----------
  R({ id: 's_xmas', w: 2, repeat: true, max: 4, cool: 2, cond: function (S) { return age(S) >= 13 && age(S) <= 22 && !B(S) && KL.isStudent(S); }, title: 'クリスマス', icon: '🎄',
    text: function (S) { var p = KL.partner(S); return p ? 'クリスマスイブ。' + first(p) + 'と過ごす予定だ。' : ST.say(S, 'xmas_tx', ['クリスマスイブ。街はカップルだらけだ。', '12月24日。クラスのグループLINEが「誰か暇な人〜」で盛り上がっている。', 'イブなのに、部活の練習が入っていた。', 'サンタを信じていた頃が、少しだけ懐かしい。']); },
    choices: [
      { t: 'イルミネーションを見に行く', req: function (S) { return !!S.partnerId; }, fx: function (S) { var p = KL.partner(S); if (!p) return '一人でイルミネーションを眺めた。'; KL.likeAdd(p, 12); KL.moneyAdd(S, -8000); if (p.hero) return ({ chisa: '千咲がくれたのは、手紙と、手編みの赤いマフラーだった。', miyako: 'ミヤコがくれたのは、うさぎ柄の手袋。「……防寒対策です。他意はありません」', hoshino: 'ホシノがくれたのは、ふかふかの抱き枕。「うへ〜、これで一緒に昼寝できるね〜」', miyabi: '雅がくれたのは、手作りの団子だった。三つ。「……二つは私の分だ」' })[p.hero]; return 'プレゼントを交換した。' + first(p) + 'がくれたのは、' + U.pick(['手編みのマフラー', 'おそろいのキーホルダー', '手紙', 'ペアのマグカップ']) + 'だった。'; } },
      { t: '友達とクリぼっち会', fx: function (S) { KL.add(S, 'com', 2); S.npcs.forEach(function (n) { if (n.rel === 'friend' || n.rel === 'best') KL.likeAdd(n, 4); }); return ST.say(S, 'xmas_f', ['ケーキをホールで食べた。これはこれで最高。', 'カラオケでクリスマスソングを全部歌った。', 'ファミレスで夜まで語り合った。']); } },
      { t: function (S) { return soc(S) ? 'グラウンドでボールを蹴る' : '家で勉強'; }, fx: function (S) { if (soc(S)) { KL.Soccer.skAdd(S, 'dri', 1); return '誰もいないグラウンド。白い息を吐きながら、一人でボールを蹴った。'; } KL.add(S, 'int', 2); return 'サンタは来なかった。'; } }
    ] });
  // ---------- 初詣 ----------
  R({ id: 's_hatsumoude', w: 1, repeat: true, max: 4, cool: 2, cond: function (S) { return age(S) >= 8 && !B(S) && KL.isStudent(S); }, title: '初詣', icon: '⛩️',
    text: function (S) { return ST.say(S, 'hatsu_tx', ['新年の初詣。おみくじを引いた。', '家族で近所の神社へ。屋台の甘酒がおいしい。', '友達と、朝から初詣。人混みがすごい。', '受験の合格祈願に、学問の神様へ。']); },
    choices: [{ t: 'おみくじを開く', fx: function (S) { var r = U.pick(['大吉', '中吉', '小吉', '吉', '末吉', '凶']); if (r === '大吉') KL.add(S, 'men', 3); if (r === '凶') KL.add(S, 'men', -1); return '「' + r + '」。' + (r === '大吉' ? '今年はいい年になりそうだ。' : r === '凶' ? '木に結んで帰った。' : ST.say(S, 'mikuji', ['恋愛運は「焦らず待て」だった。', '勝負運は「己を信じよ」。', '健康運は「無理をするな」。……耳が痛い。'])); } },
      { t: function (S) { return soc(S) ? '「全国に行けますように」と祈る' : '「いい一年になりますように」と祈る'; }, fx: function (S) { KL.add(S, 'men', 2); return '手を合わせて、目を閉じた。'; } }] });
  // ---------- 席替え ----------
  R({ id: 's_sekigae', w: 2, repeat: true, max: 3, cool: 3, cond: function (S) { return ['elem', 'jhs', 'hs'].indexOf(S.stage) >= 0 && age(S) >= 10; }, title: '席替え', icon: '🪑',
    text: function (S) { var c = KL.crush(S); S._sg = c && U.chance(0.5) ? c.id : null; return 'くじ引きで席替え。' + (S._sg ? 'なんと隣の席は' + c.name + '！' : ST.say(S, 'seki_tx', ['窓際の一番後ろ、通称「主人公席」を引いた。', '教卓の真ん前。先生と目が合う。', 'クラスで一番うるさい男子の隣になった。'])); },
    choices: [
      { t: function (S) { return S._sg ? '話しかけるきっかけにする' : '授業中、窓の外を眺める'; }, fx: function (S) { var c = S._sg && KL.npc(S, S._sg); if (c) { KL.likeAdd(c, 8 + S.st.com / 15); return '消しゴムを貸したのをきっかけに、よく話すようになった。'; } KL.add(S, 'art', 1); return 'ぼーっとしていたら先生に当てられた。'; } },
      { t: 'まじめに授業を受ける', fx: function (S) { KL.add(S, 'int', 1); return 'ノートがきれいだと評判になった。'; } }
    ] });
  // ---------- 夏祭り ----------
  R({ id: 's_hanabi', w: 2, repeat: true, max: 4, cool: 2, cond: function (S) { return age(S) >= 10 && age(S) <= 22 && B(S) && KL.isStudent(S); }, title: '夏祭り', icon: '🎆',
    text: function (S) { return ST.say(S, 'matsuri_tx', ['地元の夏祭り。夜には花火も上がる。', '隣町の大きな花火大会。電車が満員だ。', '商店街の小さな夏祭り。毎年、同じ金魚すくいのおじさんがいる。', '夏休み最後の日の花火大会。']); },
    choices: [
      { t: function (S) { return S.partnerId ? first(KL.partner(S)) + 'と行く' : '気になる人を誘う'; }, req: function (S) { return !!S.partnerId || !!KL.crush(S); }, hint: true, fx: function (S) { var p = KL.partner(S); if (p) { KL.likeAdd(p, 10); return ST.say(S, 'matsuri_p', ['浴衣姿にドキッとした。花火の音で、言葉はいらなかった。', 'りんご飴を半分こした。', '人混みではぐれないように、手をつないだ。']); } var c = KL.crush(S); if (!c) return '結局、友達と行くことにした。'; if (KL.chk(S, c.like + S.st.com / 3, 55, 8)) { KL.likeAdd(c, 12); return c.name + 'がOKしてくれた！ りんご飴を半分こした。'; } KL.likeAdd(c, -2); return '「ごめん、友達と行く約束してて」と断られた。'; } },
      { t: '友達と屋台を食べ歩く', fx: function (S) { var f = S.npcs.filter(function (n) { return n.rel === 'friend' || n.rel === 'best'; }).slice(-1)[0]; if (f) KL.likeAdd(f, 8); KL.add(S, 'com', 1); return ST.say(S, 'matsuri_f', ['金魚すくいで3匹すくった。', '焼きそば、たこ焼き、かき氷。全部食べた。', '射的で、どうでもいいキーホルダーを当てた。宝物になった。']); } }
    ] });
  // ---------- テスト・マラソン・放課後 ----------
  R({ id: 'e_test100', w: 1, repeat: true, max: 2, cool: 4, cond: function (S) { return S.stage === 'elem'; }, title: 'テスト返却', icon: '💯', text: function (S) { return ST.say(S, 'test_e', ['算数のテストが返ってきた。', '漢字テストが返ってきた。', '理科のテストが返ってきた。']); },
    choices: [{ t: 'ドキドキしながら見る', fx: function (S) { if (KL.chk(S, 'int', 30 + age(S) * 2, 6)) { KL.repAdd(S, 'sch', 2); KL.add(S, 'men', 1); return '100点！ 家で冷蔵庫に貼られた。'; } return '…見なかったことにした。'; } }] });
  R({ id: 'j_teiki', w: 2, repeat: true, max: 3, cool: 3, cond: function (S) { return S.stage === 'jhs' || S.stage === 'hs'; }, title: '定期テスト', icon: '📝', text: function (S) { return ST.say(S, 'teiki', ['テスト一週間前。部屋の掃除がやたらはかどる。', '期末テスト。部活が休みになって、急に時間ができた。', '中間テスト。範囲表を見て、絶望した。']) + (soc(S) ? '\n（赤点をとると、試合に出られない）' : ''); },
    choices: [
      { t: '一夜漬けで乗り切る', fx: function (S) { if (KL.chk(S, 'int', 45, 8)) { KL.add(S, 'int', 1); return 'ギリギリ平均点を超えた。'; } KL.add(S, 'men', -2); return '赤点で補習になった…。'; } },
      { t: '計画的に勉強する', fx: function (S) { KL.grow(S, 'int', 2.5); KL.fatAdd(S, 8); if (KL.chk(S, 'int', 60, 8)) { KL.repAdd(S, 'sch', 4); return '学年10位以内に入った！'; } return '前回より順位が上がった。'; } },
      { t: function (S) { var n = heroHere(S); return n ? first(n) + 'に勉強を教わる' : ''; }, req: function (S) { return !!heroHere(S); }, fx: function (S) { var n = heroHere(S); if (!n) return ''; KL.likeAdd(n, 8); KL.grow(S, 'int', 2); return ({ chisa: '千咲は、要点だけをきれいなノートにまとめてくれた。字が、昔より大人っぽくなっていた。', miyako: '「……先輩、この問題の正答率は3%です。先輩の場合は0%です。一緒にやりましょう」', hoshino: '「うへ〜、おじさんが教えてあげよう〜」。ホシノの説明は、意外なほどわかりやすかった。', miyabi: '' })[n.hero] || '少しだけ点数が上がった。'; } }
    ] });
  R({ id: 'e_marathon', w: 1, repeat: true, max: 2, cool: 4, cond: function (S) { return (S.stage === 'elem' || S.stage === 'jhs') && !B(S); }, title: 'マラソン大会', icon: '🏃', text: function (S) { return ST.say(S, 'mara', ['寒空の下、校内マラソン大会のスタートラインに立った。', '河川敷のマラソン大会。去年の順位を超えたい。']) + (genius(S) ? '\n「どうせあいつが1位やろ」と、みんなが言っている。' : ''); },
    choices: [
      { t: '1位を狙う', fx: function (S) { if (KL.chk(S, (S.st.hp + S.st.ath) / 2, 30 + (age(S) - 6) * 4, 6)) { KL.repAdd(S, 'sch', 6); KL.add(S, 'men', 2); return '学年1位でゴール！ 朝礼で表彰された。'; } KL.add(S, 'hp', 1); return '途中で脇腹が痛くなったけど、最後まで走りきった。'; } },
      { t: '友達と一緒に走る約束をする', fx: function (S) { KL.add(S, 'com', 1); return ST.say(S, 'mara_f', ['…約束は、ゴール前で見事に裏切られた。', '本当に最後まで一緒に走った。ゴールで笑った。']); } }
    ] });
  R({ id: 's_karaoke', w: 2, repeat: true, max: 3, cool: 3, cond: function (S) { return (age(S) >= 13 && age(S) <= 22) && KL.isStudent(S); }, title: '放課後', icon: '🎤', text: function (S) { return ST.say(S, 'houkago', ['放課後、友達に「カラオケ行こうぜ」と誘われた。', '放課後。「駅前に新しいゲーセンできたらしいで」', '放課後の教室。なんとなく、みんな帰らずにだらだらしている。']); },
    choices: [
      { t: '行く', fx: function (S) { KL.add(S, 'com', 2); KL.add(S, 'art', 1); KL.moneyAdd(S, -1500); return ST.say(S, 'houkago_go', ['採点で82点。微妙。', 'クレーンゲームに3000円溶かした。', '気づけば日が暮れていた。']); } },
      { t: 'ファミレスで駄弁る', fx: function (S) { var f = S.npcs.filter(function (n) { return n.rel === 'friend' || n.rel === 'best'; }).slice(-1)[0]; if (f) KL.likeAdd(f, 6); return 'ドリンクバーで3時間粘った。'; } },
      { t: function (S) { return soc(S) ? '自主練に行く' : 'まっすぐ帰る'; }, fx: function (S) { if (soc(S)) { KL.Soccer.skAdd(S, 'sht', 0.8); return '公園の壁に向かって、シュートを打ち続けた。'; } KL.add(S, 'int', 1); return '家でゆっくりした。'; } }
    ] });
  // ---------- 卒業式（中学・高校） ----------
  R({ id: 's_button', sched: true, pri: 7, repeat: true, cond: function (S) { return (age(S) === 15 || age(S) === 18) && B(S) && S.flags.btnT !== age(S) && S.t > 20 && (S.stage === 'hs' || S.stage === 'univ' || S.stage === 'pro' || S.stage === 'work' || S.stage === 'free'); },
    title: function (S) { return age(S) === 15 ? '中学の卒業式' : '高校の卒業式'; }, icon: '🌸',
    text: function (S) { S.flags.btnT = age(S); var n = Math.max(0, Math.round((KL.mote(S) - 45) / 8 + U.gauss())); S._btn = n; return (age(S) === 15 ? '中学の卒業式。' : '高校の卒業式。' + (S.soccer && (S.soccer.club || S.soccer.pending) ? '春から、プロのサッカー選手だ。' : '')) + '\n' + (n >= 3 ? '式が終わると、制服の第二ボタンを求めて' + n + '人が並んでいた。' : n >= 1 ? '後輩の女の子に「第二ボタン、ください」と言われた。' : '校門の前で、友達と写真を撮った。'); },
    choices: [
      { t: function (S) { var c = KL.partner(S) || KL.crush(S); return c ? first(c) + 'に第二ボタンを渡す' : ''; }, req: function (S) { return !!(KL.partner(S) || KL.crush(S)); }, fx: function (S) { var c = KL.partner(S) || KL.crush(S); KL.likeAdd(c, 10); return first(c) + 'は、ボタンをぎゅっと握りしめた。'; } },
      { t: '友達と最後の写真を撮る', fx: function (S) { KL.add(S, 'com', 1); S.npcs.forEach(function (n) { if (n.rel === 'friend' || n.rel === 'best') KL.likeAdd(n, 4); }); return '「また会おうな」。何度も言った。'; } }
    ] });
  // ---------- 学園祭（大学） ----------
  R({ id: 'u_gakusai', sched: true, pri: 7, repeat: true, cond: function (S) { return S.stage === 'univ' && !B(S) && age(S) <= 20; }, title: function (S) { return '学園祭（' + grade(S) + '年）'; }, icon: '🎪',
    text: function (S) { return ['大学の学園祭。サークルで模擬店を出す。', '学園祭のミスコンの司会を頼まれた。', '最後の学園祭。'][Math.max(0, Math.min(2, grade(S) - 1))] + (soc(S) && S.rep.nat >= 20 ? '\n「サッカー部の' + S.sei + 'に会える」と、他大学から人が来ているらしい。' : ''); },
    choices: [{ t: '全力で楽しむ', fx: function (S) { KL.add(S, 'com', 2); KL.moneyAdd(S, 20000); return ST.say(S, 'gaku', ['唐揚げが売り切れた。', '司会が好評で、来年も頼まれた。', '最後の打ち上げで、みんなで泣いた。']); } }, { t: 'のんびり回る', fx: function (S) { KL.add(S, 'men', 2); return '屋台を全部制覇した。'; } }] });
  // ---------- 学芸会（小学校2回） ----------
  R({ id: 'e_gakugei', sched: true, pri: 6, repeat: true, cond: function (S) { return S.stage === 'elem' && B(S) && (age(S) === 8 || age(S) === 10); }, title: '学芸会', icon: '🎭', text: function (S) { return age(S) === 8 ? '学芸会の劇は「桃太郎」。役を決めることになった。' : '学芸会の劇は、オリジナルの冒険もの。台本はクラスで書いた。'; },
    choices: [
      { t: function (S) { return age(S) === 8 ? '桃太郎に立候補' : '主役の勇者に立候補'; }, fx: function (S) { if (KL.chk(S, (S.st.art + S.st.look) / 2, 30 + age(S) * 2, 6)) { KL.repAdd(S, 'sch', 10); KL.add(S, 'art', 2); return age(S) === 8 ? '堂々ときびだんごを配った。保護者席から拍手喝采！' : '剣を掲げるシーンで、体育館がわっと沸いた。'; } return age(S) === 8 ? 'じゃんけんで負けて「鬼C」の役になった。迫真の鬼だった。' : '「村人A」になった。セリフはひとつ。でも全力で言った。'; } },
      { t: '裏方で小道具づくり', fx: function (S) { KL.add(S, 'art', 2); return age(S) === 8 ? '段ボールの桃が、本物みたいだと言われた。' : '手作りの剣が先生にほめられた。'; } }
    ] });
  // ---------- 友達とケンカ ----------
  R({ id: 's_friendfight', w: 1, repeat: true, max: 2, cool: 6, cond: function (S) { return KL.isStudent(S) && age(S) >= 8 && S.npcs.some(function (n) { return n.rel === 'friend' || n.rel === 'best'; }); }, title: '友達とケンカ', icon: '💢',
    text: function (S) { var f = S.npcs.filter(function (n) { return n.rel === 'friend' || n.rel === 'best'; }).slice(-1)[0]; S._ff = f.id; return f.name + 'と、' + ST.say(S, 'ff', ['ささいなことで口ゲンカになった。', '貸した漫画を返してくれない件で揉めた。', '「お前、最近調子乗ってるよな」と言われて、言い返した。']); },
    choices: [
      { t: '自分から謝る', fx: function (S) { var f = KL.npc(S, S._ff); if (f) KL.likeAdd(f, 10); KL.add(S, 'com', 1); return '次の日には、何もなかったように笑い合っていた。'; } },
      { t: '向こうが謝るまで待つ', fx: function (S) { var f = KL.npc(S, S._ff); if (f) KL.likeAdd(f, -6); KL.add(S, 'men', 1); return '一週間、口をきかなかった。'; } }
    ] });
  // アイドルの夢は選べない（サッカー中心の人生）
  KL.EVENTS.forEach(function (e) {
    if (e.id === 'k_dream') e.choices = e.choices.map(function (c) { return c.t === 'アイドル' ? { t: 'ヒーロー', fx: function (S) { S.flags.dream = 'hero'; KL.add(S, 'men', 2); KL.add(S, 'ath', 1); return '毎朝、ヒーローごっこで家中を走り回るようになった。'; } } : c; });
  });
})();
