/* Kani Life - サッカーの場面（試合と試合のあいだ・学生時代）
   ※1回の人生で1回きりが基本。くり返す場面は文章を使い切るまで同じものを出さない */
(function () {
  'use strict';
  var KL = window.KL, U = KL.U, ST = KL.Story, sc = KL.sc, SO = KL.Soccer;
  function age(S) { return KL.age(S); }
  function pro(S) { return S.stage === 'pro' && S.soccer && S.soccer.club && !S.soccer.retired; }
  function abroad(S) { return pro(S) && !KL.LEAGUES[SO.club(S).l].japan; }
  function youth(S) { return S.track === 'soccer' && S.soccer && !S.soccer.club && !S.soccer.retired; }
  function eo(S) { return SO.eovr(S); }
  function cs(S) { return SO.club(S).s; }
  function star(S) { return pro(S) && eo(S) >= cs(S) + 3; }
  function O(cat) { return { cat: 'soccer' }; }

  // ======================================================
  //  監督
  // ======================================================
  sc('c_meet', { cat: 'soccer', imp: 0, sched: true, repeat: true, cond: function (S) { var so = S.soccer; return pro(S) && so.coach && so.coach.met !== so.coach.name; },
    fx: function (S) { S.soccer.coach.met = S.soccer.coach.name; } }, '新しい監督', '🧢',
    function (S) { var c = S.soccer.coach; return '{coach}との初めてのミーティング。\n掲げたのは「' + c.style + '」のサッカーだった。\n「お前には期待している。だが、ポジションは自分でつかめ」'; },
    [['「全部出し切ります」', { trust: 4 }, '監督は小さく頷いた。', 'soccer'],
     ['自分の得意なプレーを売り込む', { trust: 2, ego: 2 }, '「口よりピッチで見せてくれ」と返された。', 'b']]);
  sc('c_role', { cat: 'soccer', imp: 1, w: 3, cond: function (S) { return pro(S) && S.soccer.trust < 45 && S.soccer.proApps >= 3; } }, '起用法の面談', '🗣️',
    '最近、出場時間が減っている。監督室のドアをノックした。\n{coach}は書類から目を上げずに言った。「理由を聞きに来たのか」',
    [['「何が足りないか教えてください」', { trust: 8, ego: -3, men: 2 }, '監督は初めて顔を上げた。「守備の切り替えだ。それができれば使う」\n具体的な言葉が、むしろありがたかった。', 'soccer'],
     ['「使ってくれないなら出ていきます」', { trust: -10, ego: 6 }, '監督は眉一つ動かさなかった。「好きにしろ」\nその週末、ベンチ外になった。', 'x', null, -3],
     ['何も言わずに練習で見返す', { trust: 4, sk: { iq: 1 } }, '誰よりも早く来て、誰よりも遅く帰った。', 'b']]);
  sc('c_praise', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && S.soccer.trust >= 72; } }, '監督の言葉', '👏',
    '練習後、{coach}に呼び止められた。\n「お前は、うちの戦術の中心だ。来季もそのつもりでいろ」',
    [['「はい！」と力強く返す', { men: 3, form: 2 }, 'ロッカーに戻ると、自然と顔がにやけていた。', 'soccer'],
     ['「チームのみんながいるからです」', { team: 3, ego: -2 }, '監督は少しだけ笑った。「そういうところだ」', 'life']]);
  sc('c_scold', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && (S.form || 0) <= -4; } }, '雷', '⚡',
    'ハーフタイム。{coach}の声がロッカールームに響いた。\n「今日のお前は何だ！ 才能だけでやってるつもりか！」',
    [['悔しさを後半にぶつける', { form: 3, trust: 3, men: 2 }, '後半は、別人のように走った。試合後、監督は何も言わずに肩をたたいた。', 'soccer'],
     ['言い返す', { trust: -6, ego: 4, team: -2 }, 'ロッカールームが凍りついた。', 'x', null, -3]]);
  sc('c_tactic', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && S.soccer.coach; } }, '新しい役割', '📋',
    function (S) { var c = S.soccer.coach, so = S.soccer; return '{coach}が戦術ボードを指した。\n「' + c.style + 'で行く。お前には' + (['ST', 'WG', 'OM'].indexOf(so.pos) >= 0 ? '前線からのプレス' : so.pos === 'GK' ? 'ビルドアップの起点' : '攻撃の組み立て') + 'を任せたい」'; },
    [['新しい役割に挑戦する', { trust: 5, sk: { iq: 2 }, fat: 5 }, '慣れない動きに最初は戸惑った。でも、プレーの幅が広がった。', 'soccer'],
     ['自分の持ち味を活かす形にしてほしいと交渉する', { trust: -1, ego: 2 }, '監督は少し考えて、「半分だけ聞いてやる」と言った。', 'b']]);
  sc('c_convert', { cat: 'soccer', imp: 1, w: 2, cond: function (S) { if (!pro(S) && !youth(S)) return false; var so = S.soccer, b = SO.bestAlt(S); return b && SO.eovr(S, b) >= SO.eovr(S) + 2 && age(S) >= 13 && age(S) <= 30; } }, 'コンバートの打診', '🔄',
    function (S) { var b = SO.bestAlt(S), so = S.soccer; S._cv = b; return '{coach}「お前、' + SO.POS[b].jp + 'のほうが活きるんじゃないか」\n（今：' + SO.POS[so.pos].jp + ' 実力' + SO.eovr(S) + '・適性' + SO.aptGrade(SO.apt(so)) + '　→　' + SO.POS[b].jp + ' 実力' + SO.eovr(S, b) + '・適性' + SO.aptGrade(SO.apt(so, b)) + '）'; },
    [['コンバートを受け入れる', {}, function (S) { SO.setPos(S, S._cv); S.soccer.trust = U.clamp(S.soccer.trust + 5, 0, 100); return SO.POS[S._cv].jp + 'として、新しい挑戦が始まった。'; }, 'soccer'],
     ['今のポジションで勝負する', { men: 2, trust: -4 }, '自分のこだわりを貫く。結果で証明するしかない。', 'b']]);
  sc('c_fired', { cat: 'soccer', imp: 0, w: 1.2, repeat: true, max: 3, cool: 8, cond: function (S) { return pro(S) && S.soccer.coach && S.t - S.soccer.coach.since >= 4 && S.sea && SE() && KL.Season.myPos(S) >= 6; } }, '監督解任', '📉',
    function (S) { var c = SO.club(S), old = S.soccer.coach.name; S.soccer.coach = SO.newCoach(S, c); return '成績不振で、' + old + 'の解任が発表された。\n後任は{coach}。チームの空気が、がらりと変わった。'; },
    [['新監督にアピールする', { trust: 2, fat: 4 }, '最初の練習で、誰よりも声を出した。', 'soccer'],
     ['前監督にお礼の連絡をする', { men: 2, com: 1 }, '「お前は大丈夫だ」。短い返信が来た。', 'life']]);
  function SE() { return KL.Season; }
  sc('c_captain', { cat: 'soccer', imp: 1, w: 3, cond: function (S) { var so = S.soccer; return pro(S) && (so.clubYears || 0) >= 2 && so.trust >= 72 && S.st.com >= 50 && !so['cap_' + so.club]; } }, 'キャプテン', '©️',
    function (S) { S.soccer['cap_' + S.soccer.club] = 1; return '{coach}に呼ばれた。「来季から、キャプテンマークを巻いてくれ」\nロッカールームの視線が、一斉にこっちを向いた。'; },
    [['引き受ける', { team: 5, com: 2, men: 2 }, function (S) { if (S.soccer.badges.indexOf('captain') < 0) S.soccer.badges.push('captain'); KL.title(S, SO.club(S).n + 'のキャプテン'); KL.log(S, SO.club(S).n + 'のキャプテンに就任。', 2); return '腕に巻いたキャプテンマークは、思っていたより重かった。'; }, 'soccer'],
     ['「まだ早いです」と辞退する', { ego: -3 }, '監督は「わかった。だが、いずれ頼むぞ」と言った。', 'b']]);
  sc('c_rest', { cat: 'soccer', w: 3, cond: function (S) { return pro(S) && S.fat >= 72; } }, '休め', '🛑',
    '{coach}に言われた。「顔色が悪い。次の試合は休め」',
    [['素直に休む', { fat: -25, trust: 1 }, '一日中寝た。体が嘘みたいに軽くなった。', 'b'],
     ['「出られます」と食い下がる', { fat: 5, trust: 2, care: -3 }, '監督はため息をついて「後半からだ」と言った。', 'soccer']]);
  sc('c_free', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && eo(S) >= cs(S) + 4 && S.soccer.trust >= 60; } }, '好きにやれ', '🕊️',
    '戦術ミーティングの最後に、{coach}が言った。\n「お前だけは、ピッチの上で好きにやっていい。責任は俺が取る」',
    [['その信頼に応える', { form: 3, men: 2, trust: 3 }, '自由を与えられた天才は、恐ろしい。次の試合、相手は誰もついてこられなかった。', 'soccer'],
     ['「チームのやり方で行きます」', { team: 3, ego: -2 }, '監督は少し驚いて、それから笑った。', 'life']]);

  // ======================================================
  //  ロッカールーム・チームメイト
  // ======================================================
  sc('t_rookie', { cat: 'soccer', w: 3, cond: function (S) { return pro(S) && (S.soccer.proYears || 0) === 0; } }, '新人の洗礼', '🎤',
    'プロ1年目の恒例行事。チームの食事会で、新人は一人ずつ歌を披露しなければならないらしい。\n先輩たちがニヤニヤしている。',
    [['全力で熱唱する', { team: 6, com: 2 }, '音程は外れまくった。でも、拍手は一番大きかった。', 'life'],
     ['ダンスでごまかす', { team: 4, art: 1 }, '予想外のキレに、会場がどよめいた。', 'b'],
     ['恥ずかしくて小声で歌う', { team: 1 }, '「聞こえへんぞー！」とヤジが飛んだ。', 'soccer']]);
  sc('t_dinner', { cat: 'soccer', w: 2, repeat: true, max: 3, cool: 6, cond: pro }, 'チームメイトと食事', '🍽️',
    ['{mate}に誘われて、二人でステーキを食べに行った。「お前、試合中は怖い顔してるけど、普段は全然ちゃうな」', '練習後、何人かでラーメン屋へ。{mate}がスープまで完飲していた。', '{mate}の家でホームパーティー。子どもたちに囲まれて、ボール遊びをした。'],
    [['腹を割って話す', { team: 4, com: 1 }, ['好きな選手、子どもの頃の夢。気づけば終電を逃していた。', 'ピッチでの連携が、少しよくなった気がした。'], 'life'],
     ['サッカーの話ばかりする', { team: 2, sk: { iq: 1 } }, ['戦術談義が止まらなかった。'], 'soccer']]);
  sc('t_fight', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && (S.ego || 0) >= 35; } }, '小競り合い', '💢',
    '紅白戦で、{mate}と激しくぶつかった。胸ぐらをつかまれる。\n「パス出せや！ 一人でサッカーやってんちゃうぞ」',
    [['「……悪かった」と手を差し出す', { team: 5, ego: -6 }, '練習後、{mate}がジュースを投げてよこした。「次は出せよ」', 'life'],
     ['「決めたやつが正義や」と言い返す', { team: -6, ego: 5 }, 'チームの空気が、ぴりついた。', 'x', null, -3]]);
  sc('t_mentor', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && age(S) <= 23; } }, 'ベテランの助言', '🧓',
    '30代半ばのベテランが、練習後に話しかけてきた。\n「お前の才能は本物や。でもな、才能があるやつほど、早く壊れる。体だけは大事にせえよ」',
    [['ケアのやり方を教わる', { care: 10, men: 2 }, '翌日から、練習後のストレッチの時間が倍になった。', 'b'],
     ['「まだ若いんで大丈夫です」', { ego: 3 }, 'ベテランは苦笑いして「そう言うと思った」と言った。', 'soccer']]);
  sc('t_young', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && age(S) >= 27; } }, '若手の相談', '🌱',
    '入団したばかりの18歳が、緊張した顔で近づいてきた。\n「あの……どうしたら、あなたみたいになれますか」',
    [['居残り練習に付き合う', { team: 4, com: 2, ego: -3, fat: 4 }, '数年後、その若手は代表に選ばれ、インタビューで自分の名前を挙げた。', 'life'],
     ['「誰の真似もするな」とだけ言う', { team: 2, men: 1 }, '若手は、その言葉をスマホのメモに保存していた。', 'soccer']]);
  sc('t_rivalpos', { cat: 'soccer', w: 3, cond: function (S) { if (!pro(S)) return false; var so = S.soccer; return SO.teammates(S).some(function (p) { return p.pos === so.pos && p.ovr >= eo(S) + 1; }); } }, 'ポジション争い', '⚔️',
    function (S) { var so = S.soccer, r = SO.teammates(S).filter(function (p) { return p.pos === so.pos && p.ovr >= eo(S) + 1; })[0]; S._rp = r.name; return '同じポジションの' + r.name + '（実力' + r.ovr + '）が、今日も先発の位置に立っている。\n練習でマッチアップするたびに、差を思い知らされる。'; },
    [['個人練習を倍にする', { fat: 10, sk: { iq: 1, phy: 1 }, form: 1 }, function (S) { return S._rp + 'が帰ったあとも、一人でボールを蹴り続けた。'; }, 'soccer'],
     ['あえて話しかけて、盗めるものを盗む', { team: 3, sk: { iq: 2 } }, function (S) { return S._rp + 'は意外と気さくだった。「ポジショニングは、こう考えてる」。惜しみなく教えてくれた。'; }, 'life']]);
  sc('t_vet_retire', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && (S.soccer.clubYears || 0) >= 2; } }, '先輩の引退', '🌅',
    'ずっと面倒を見てくれた先輩が、今季限りでの引退を発表した。\n最後の試合のあと、先輩がスパイクを差し出してきた。\n「お前に、もらってほしい」',
    [['受け取って、涙をこらえる', { men: 4, team: 3 }, 'そのスパイクは、今も部屋の一番いい場所に飾ってある。', 'life'],
     ['「先輩の分まで、点を取ります」', { form: 2, men: 2 }, '先輩は笑って、拳を合わせてきた。', 'soccer']]);
  sc('t_newstar', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && cs(S) >= 80; } }, '大物の加入', '🌟',
    function (S) { var st = SO.worldStars(S)[U.ri(3, 9)]; S._ns = st ? st.name : '世界的なスター'; return '移籍市場の最終日。チームに世界的なスター、' + S._ns + 'が加入した。\n練習初日、全員の視線がそっちに向いている。'; },
    [['積極的に連携を深める', { team: 3, sk: { iq: 1 } }, function (S) { return S._ns + 'から「お前の動き、好きだ」と言われた。'; }, 'soccer'],
     ['「こっちが主役や」と火がつく', { form: 2, ego: 3 }, '次の紅白戦は、いつも以上に本気だった。', 'b']]);
  sc('t_prank', { cat: 'soccer', w: 1.5, cond: pro }, 'ロッカールームのいたずら', '😂',
    '誕生日。ロッカーを開けると、中が風船でぎゅうぎゅうだった。\n後ろで、チームメイトたちが腹を抱えて笑っている。',
    [['全員にケーキで仕返しする', { team: 5, com: 2 }, 'クラブの公式SNSに動画が上がり、100万回再生された。', 'life'],
     ['笑って写真を撮る', { team: 3 }, '一生の思い出になった。', 'b']]);
  sc('t_bus', { cat: 'soccer', w: 1.5, cond: pro }, '遠征のバス', '🚌',
    '長い遠征のバス。隣の席の{mate}が、急に真面目な顔で言った。\n「なぁ。お前、なんでサッカー続けてるん？」',
    [['子どもの頃の話をする', { team: 3, men: 2 }, '話しているうちに、初めてボールを蹴った日のことを思い出した。', 'life'],
     ['「勝つのが好きやから」', { form: 1 }, '{mate}は「シンプルやな」と笑った。', 'soccer']]);

  // ======================================================
  //  メディア・ファン
  // ======================================================
  sc('m_interview', { cat: 'soccer', w: 2, repeat: true, max: 3, cool: 6, cond: function (S) { return pro(S) && S.rep.nat >= 20; } }, '取材', '🎙️',
    ['スポーツ誌の単独インタビュー。「目標は？」と聞かれた。', '試合後のミックスゾーン。記者に囲まれて、マイクが十本以上向けられた。', 'テレビのスポーツ番組で、プレーの解説をすることになった。'],
    [['「世界一の選手になります」', { ego: 4, fans: 8000, nat: 1 }, ['見出しは「{sei}、世界一宣言」。賛否が巻き起こった。', 'SNSで「ビッグマウス」と話題になった。'], 'soccer'],
     ['「チームが勝つことだけ考えてます」', { team: 2, ego: -2 }, ['「優等生コメント」と書かれた。まあいい。'], 'b'],
     ['笑いを交えて答える', { fans: 5000, com: 1 }, ['記者たちが笑った。「話のうまい選手」として、取材が増えた。'], 'life']]);
  sc('m_cover', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && S.rep.nat >= 45; } }, '表紙', '📕',
    '有名サッカー雑誌の表紙に、自分の写真が載った。\n本屋に並んでいるのを見て、なんとも言えない気分になった。',
    [['こっそり10冊買う', { men: 2 }, '1冊は母に、1冊は{best}に送った。残りは押し入れの中だ。', 'life'],
     ['見なかったことにする', { ego: -1 }, 'チームメイトにさっそくいじられた。', 'b']]);
  sc('m_game', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && eo(S) >= 85; } }, 'ゲームの能力値', '🎮',
    function (S) { return '人気サッカーゲームの最新作。自分の能力値は「' + SO.ovr(S.soccer) + '」だった。\nチームメイトが画面を見ながら言った。「お前のドリブル、ゲームの中でも反則やな」'; },
    [['自分で自分を使ってみる', { men: 2, fans: 3000 }, 'ゲームの中の自分は、思ったより強かった。', 'life'],
     ['「低すぎる」と運営に冗談で抗議する', { fans: 8000, ego: 2 }, 'SNSでの抗議が大バズり。次のアップデートで数値が1上がった。', 'b']]);
  sc('m_flame', { cat: 'soccer', w: function (S) { return (S.ego || 0) >= 45 ? 2.5 : 0.6; }, cond: function (S) { return pro(S) && (S.fans || 0) >= 20000; } }, '炎上', '🔥',
    '試合後、何気なく投稿した一言が切り取られて、大炎上した。\nコメント欄は罵詈雑言で埋め尽くされている。',
    [['すぐに謝罪文を出す', { ego: -6, fans: -3000 }, '騒ぎは三日で収まった。', 'b'],
     ['反論する', { ego: 6, fans: -15000, team: -3 }, '火に油を注いだ。一週間、トレンドに名前が残った。', 'x', null, -3],
     ['黙ってピッチで結果を出す', { form: 2 }, '次の試合で2ゴール。手のひらは、くるりと返った。', 'soccer']]);
  sc('m_viral', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && (S.soccer.tech || []).length >= 2; } }, 'バズったゴール', '📈',
    function (S) { var t = SO.techById(S.soccer.tech[S.soccer.tech.length - 1]); return '先週の試合の【' + (t ? t.n : '神業') + '】の動画が、世界中で拡散されている。\n再生回数は、もう5000万回を超えた。'; },
    [['ファンに感謝を伝える', { fans: 50000, com: 1 }, '海外の有名選手までが、その動画に反応していた。', 'life'],
     ['「まだまだ」と気を引き締める', { men: 2, ego: -2 }, '浮かれる暇はない。次の試合がある。', 'soccer']]);
  sc('m_hospital', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && S.rep.nat >= 25; } }, '病院の子どもたち', '🏥',
    'クラブの社会貢献活動で、小児病棟を訪れた。\n一人の男の子が、ベッドの上でユニフォームを抱きしめていた。背番号は、{num}。',
    [['「次の試合、君のためにゴールする」と約束する', { men: 4, fans: 10000, form: 2 }, '次の試合。ゴールを決めたあと、カメラに向かって男の子の名前を叫んだ。\n病室のテレビの前で、男の子が飛び跳ねていたと、あとで聞いた。', 'life'],
     ['ゆっくり話を聞く', { men: 3, com: 2 }, '男の子は退院したら、サッカーを始めるんだと言った。', 'b']]);
  sc('m_banner', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && (S.soccer.clubYears || 0) >= 1 && S.soccer.trust >= 60; } }, '横断幕', '🚩',
    function (S) { return 'ホームスタジアムのゴール裏に、新しい横断幕が掲げられた。\n「' + (KL.Rec && KL.Rec.nick(S) ? KL.Rec.nick(S) : '{sei}') + '　俺たちの誇り」'; },
    [['試合後、ゴール裏に挨拶に行く', { fans: 5000, loc: 4, men: 3 }, 'チャントが、いつまでも鳴りやまなかった。', 'life'],
     ['結果で応える', { form: 2 }, '横断幕の前で決めたゴールは、特別だった。', 'soccer']]);
  sc('m_boo', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && (S.form || 0) <= -5; } }, 'ブーイング', '😡',
    '交代でピッチを退くとき、スタンドからブーイングが聞こえた。\n自分に向けられたものだと、すぐにわかった。',
    [['拍手でサポーターに応える', { men: 3, fans: 2000, ego: -2 }, '次の週、ブーイングは激励のチャントに変わった。', 'life'],
     ['耳をふさいで、ロッカーに直行する', { men: -2 }, '悔しさで、眠れなかった。', 'soccer']]);
  sc('m_doc', { cat: 'soccer', w: 1, cond: function (S) { return pro(S) && S.rep.nat >= 60; } }, 'ドキュメンタリー', '🎥',
    '動画配信サービスから、1年間密着のドキュメンタリーのオファーが来た。',
    [['受ける', { fans: 80000, nat: 5, fat: 6 }, '配信が始まると、世界中で視聴ランキング1位になった。\n普段の自分を見るのは、思ったより恥ずかしかった。', 'life'],
     ['断る', { form: 1 }, 'サッカーに集中したい、と伝えた。', 'soccer']]);
  sc('m_hometown', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && S.rep.nat >= 40; } }, '凱旋', '🎌',
    function (S) { return 'オフに、地元の' + S.pref + 'で凱旋イベントが開かれた。\n商店街には「おかえり！」の横断幕。小学校の先生まで来ていた。'; },
    [['全員と握手する', { loc: 15, com: 2, fans: 5000 }, '握手は3時間続いた。右手の感覚がなくなった。', 'life'],
     ['少しだけ顔を出して、母校にも寄る', { loc: 8, men: 3 }, '母校のグラウンドで、後輩たちとボールを蹴った。', 'b']]);

  // ======================================================
  //  代理人・契約・ビジネス
  // ======================================================
  sc('a_agent', { cat: 'soccer', imp: 1, w: 4, cond: function (S) { return pro(S) && !S.agent; } }, '代理人選び', '🤝',
    'プロとしてやっていくなら、代理人が必要だ。三人の候補と面談した。',
    [['大手の敏腕代理人（手数料高め）', {}, function (S) { S.agent = { name: U.pick(KL.NAMES.fFirst) + '・' + U.pick(KL.NAMES.fLast), type: 'big' }; return S.agent.name + '。世界中のクラブにパイプを持つ男だ。\n「君を世界一の選手にする。それが私の仕事だ」'; }, 'soccer'],
     ['地元出身の、誠実な代理人', {}, function (S) { S.agent = { name: U.pick(KL.NAMES.sei) + '（代理人）', type: 'local' }; return S.agent.name + 'は、小さい頃の試合映像まで全部見てきていた。\n「お金より、君が幸せにプレーできる場所を探します」'; }, 'life'],
     ['父に任せる', {}, function (S) { S.agent = { name: '父', type: 'family' }; return '父は契約書を虫眼鏡で読んでいた。……大丈夫だろうか。'; }, 'b']]);
  sc('a_spike', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && S.rep.nat >= 25 && !S.flags.spike; } }, 'スパイク契約', '👟',
    '世界的なスポーツブランドから、スパイク契約のオファーが届いた。',
    [['大手ブランドと契約する', { money: 3e7, flag: 'spike', fans: 5000 }, '自分の名前が入った、専用のスパイクが届いた。', 'soccer'],
     ['子どもの頃から履いているブランドにこだわる', { money: 1e7, flag: 'spike', men: 2 }, 'ブランドの担当者が泣いて喜んだ。', 'life']]);
  sc('a_cm', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && S.rep.nat >= 45; } }, 'CM出演', '📺',
    'テレビCMのオファー。商品は、スポーツドリンク。',
    [['出演する', { money: 5e7, fans: 30000, fat: 4 }, 'CMが流れ始めると、コンビニの売り場に自分の等身大パネルが立った。', 'life'],
     ['シーズン中は断る', { trust: 1 }, '「オフなら」と伝えると、先方は「待ちます」と言った。', 'soccer']]);
  sc('a_extend', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && S.soccer.trust >= 70 && S.soccer.contract >= 1 && eo(S) >= cs(S); } }, '契約延長', '📝',
    function (S) { var w = SO.wage(S, SO.club(S), SO.ovr(S.soccer)); S._ext = Math.max(S.soccer.salary * 1.25, w); return 'クラブから契約延長の提示。年俸' + U.yen(S._ext) + '・4年契約。\n「君は、このクラブの未来だ」'; },
    [['サインする', {}, function (S) { S.soccer.salary = Math.round(S._ext); S.soccer.contract = 4; S.soccer.trust = Math.min(100, S.soccer.trust + 5); return '契約延長。サポーターがSNSで歓喜していた。'; }, 'soccer'],
     ['いったん保留する', { ego: 2 }, '代理人は「良い判断です。もっと良い話が来ますよ」と言った。', 'b']]);
  sc('a_rumor', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && eo(S) >= cs(S) + 2; } }, '移籍の噂', '🗞️',
    function (S) { var big = KL.CLUBS.filter(function (c) { return c.s >= cs(S) + 2 && c.id !== S.soccer.club; }); var c = big.length ? U.pick(big) : null; S._rum = c ? c.n : 'ビッグクラブ'; return '海外メディアが「' + S._rum + 'が{sei}獲得に動く」と報じた。\nサポーターがざわついている。'; },
    [['「今はこのクラブに集中しています」', { team: 4, loc: 3 }, 'ゴール裏から、名前を呼ぶチャントが一段と大きくなった。', 'life'],
     ['「光栄です」と含みを持たせる', { ego: 3, nat: 2, team: -2 }, '翌日のスポーツ紙は、その話題一色だった。', 'soccer']]);
  sc('a_mideast', { cat: 'soccer', imp: 1, w: 1.5, cond: function (S) { return pro(S) && age(S) >= 29 && !S.flags.mideast; } }, '巨額オファー', '💰',
    '中東のクラブから、とんでもない額のオファーが届いた。年俸100億円。',
    [['断る。まだ世界のトップで戦いたい', { flag: 'mideast', men: 3, form: 2 }, '代理人は肩をすくめた。「あなたらしい」', 'soccer'],
     ['気持ちが揺れる', { flag: 'mideast', ego: 2 }, 'その夜、計算機を何度も叩いた。……結局、断った。', 'b']]);
  sc('a_charity', { cat: 'soccer', w: 1, cond: function (S) { return pro(S) && S.money >= 3e7 && S.rep.nat >= 30; } }, '財団', '🌏',
    '子どもたちにサッカーの機会を届ける財団を作らないか、という話が来た。',
    [['自分の財団を立ち上げる', { money: -2e7, fans: 20000, ego: -5, loc: 10 }, function (S) { KL.title(S, '子ども支援財団を設立'); return '最初のサッカー教室には、200人の子どもが集まった。'; }, 'life'],
     ['今は寄付だけにしておく', { money: -3e6, ego: -1 }, '静かに寄付をした。誰にも言わなかった。', 'b']]);

  // ======================================================
  //  体
  // ======================================================
  sc('b_pain', { cat: 'soccer', imp: 1, w: 2, cond: function (S) { return pro(S) && S.fat >= 55; } }, '小さな痛み', '🩹',
    '練習中、太ももの裏にピリッとした痛みが走った。\n次は大事な試合だ。トレーナーが「どうする？」と聞いてくる。',
    [['大事をとって休む', { fat: -15, care: 3, trust: -1 }, 'チームは勝った。ベンチで見ているのはもどかしかったけど、痛みは消えた。', 'b'],
     ['痛み止めを飲んで出る', { form: 1, care: -6 }, function (S) { if (U.chance(0.3)) { S.soccer.injDays = U.ri(20, 40); return '試合中に、痛みが爆発した。……全治1か月。'; } return '何とか90分もった。でも、体の奥に違和感が残っている。'; }, 'soccer']]);
  sc('b_weight', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && (S.care || 50) <= 35; } }, '体重計', '⚖️',
    'トレーナーに、体重計の数字を見せられた。\n「2キロ増えてる。キレがなくなってるのは、これだ」',
    [['食事を見直す', { care: 10, form: 1 }, '一か月で体重は戻った。スプリントの数値も戻ってきた。', 'soccer'],
     ['「筋肉です」と言い張る', { ego: 2 }, 'トレーナーは無言で体脂肪計を指さした。', 'life']]);

  // ======================================================
  //  日本代表
  // ======================================================
  sc('n_camp', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && S.soccer.caps >= 1 && S.soccer.caps <= 15; } }, '代表合宿', '🇯🇵',
    function (S) { var m = KL.Rec ? KL.Rec.ntMates(S) : []; return '代表合宿。食堂で、' + (m[0] || '代表の先輩') + 'と' + (m[1] || 'エース') + 'が同じテーブルにいた。\nテレビで見ていた人たちと、同じご飯を食べている。'; },
    [['積極的に話しかける', { com: 2, men: 2 }, '「お前のプレー、ずっと見てたで」と言われた。信じられなかった。', 'life'],
     ['練習で存在感を示す', { form: 2, sk: { iq: 1 } }, '紅白戦で一本決めると、空気が変わった。', 'soccer']]);
  sc('n_anthem', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && S.soccer.caps >= 5; } }, '国歌', '🎌',
    '代表戦の前。肩を組んで国歌を聴いた。\nスタンドの青いユニフォームが、波のように揺れている。',
    [['目を閉じて、家族の顔を思い浮かべる', { men: 4 }, 'この景色のために、ずっとボールを蹴ってきた。', 'life'],
     ['相手の選手をにらみつける', { form: 2 }, '集中力が研ぎ澄まされていく。', 'soccer']]);
  sc('n_ten', { cat: 'soccer', imp: 1, w: 2, cond: function (S) { var so = S.soccer; return pro(S) && so.caps >= 12 && SO.eovr(S) >= 84 && so.ntNum !== 10 && ['OM', 'WG', 'ST', 'CM'].indexOf(so.pos) >= 0; } }, '代表の10番', '🔟',
    '代表スタッフから告げられた。「次の招集から、背番号10を任せたい」',
    [['受け取る', { men: 3, nat: 5 }, function (S) { S.soccer.ntNum = 10; KL.title(S, '日本代表の10番'); KL.log(S, '日本代表の背番号10を託された。', 2); if (KL.Rec) KL.Rec.addHL(S, { title: '日本代表の10番を背負う', text: '', kind: 'record' }); return '日本代表の10番。その重みを、誰よりも知っている。'; }, 'soccer'],
     ['「今の番号で結果を出したい」', { ego: -2 }, 'スタッフは少し驚いて、「わかった」と頷いた。', 'b']]);
  sc('n_captain', { cat: 'soccer', imp: 1, w: 2, cond: function (S) { var so = S.soccer; return pro(S) && so.caps >= 30 && age(S) >= 25 && S.st.com >= 50 && !S.flags.ntCap; } }, '代表キャプテン', '©️',
    '代表監督に呼ばれた。「キャプテンを任せたい。お前の背中で、チームを引っ張ってくれ」',
    [['引き受ける', { flag: 'ntCap', men: 3, nat: 6 }, function (S) { KL.title(S, '日本代表キャプテン'); KL.log(S, '日本代表のキャプテンに就任。', 2); return '日の丸のキャプテンマーク。腕に巻いた瞬間、身が引き締まった。'; }, 'soccer'],
     ['辞退する', { ego: -2 }, '「今はプレーに集中したい」。監督は理解してくれた。', 'b']]);

  // ======================================================
  //  生涯のライバル
  // ======================================================
  sc('r_news', { cat: 'soccer', w: 2, repeat: true, max: 3, cool: 8, cond: function (S) { return pro(S) && S.rival && S.rival.met && !S.rival.retired && S.rival.cur; } }, 'ライバルの活躍', '📺',
    function (S) { var rv = S.rival; return 'ニュースで、' + rv.name + 'のハイライトが流れた。' + KL.clubById(rv.club).n + 'で今季' + rv.cur.g + '得点ペースらしい。\n画面の中のあいつが、こっちを挑発しているように見えた。'; },
    [['すぐにグラウンドへ向かう', { form: 2, fat: 6, sk: { sht: 1 } }, ['負けていられない。'], 'soccer'],
     ['素直にすごいと思う', { men: 2, ego: -2 }, ['あいつがいるから、ここまで来られた。'], 'life']]);
  sc('r_msg', { cat: 'soccer', w: 2, cond: function (S) { return pro(S) && S.rival && S.rival.met && age(S) >= 19; } }, 'ライバルからのメッセージ', '📩',
    function (S) { return S.rival.name + 'から、SNSでメッセージが届いた。\n「次に会うときは、もっと強くなってろよ。じゃないと、つまらない」'; },
    [['「そっちこそ」と返す', { form: 2, ego: 1 }, '既読がついて、親指のスタンプが返ってきた。', 'soccer'],
     ['スクショして、待ち受けにする', { men: 2 }, 'ちょっと恥ずかしいので、誰にも言っていない。', 'life']]);
  sc('r_dinner', { cat: 'soccer', w: 1.5, cond: function (S) { return pro(S) && S.rival && S.rival.met && age(S) >= 26; } }, 'ライバルと食事', '🍷',
    function (S) { return 'バロンドールの授賞式のあと。' + S.rival.name + 'に誘われて、二人で食事をした。\n「なぁ。俺たち、同じ年に生まれてよかったと思わないか」'; },
    [['「おかげで、ここまで来れた」', { men: 4, ego: -3 }, 'グラスを合わせた。言葉はいらなかった。', 'life'],
     ['「次は、おれが勝つ」', { form: 3 }, 'あいつは笑って、「楽しみにしてる」と言った。', 'soccer']]);

  // ======================================================
  //  学生時代のサッカー
  // ======================================================
  sc('y_scout', { cat: 'soccer', w: 3, cond: function (S) { return youth(S) && age(S) >= 10 && age(S) <= 16 && SO.ovr(S.soccer) - SO.E(age(S)) >= 9; } }, 'スカウト', '🕵️',
    '練習を見に来ていた大人が、帰り際に母へ名刺を渡していた。Jクラブのスカウトらしい。\n「息子さん、とんでもない才能です。ぜひ一度、話をさせてください」',
    [['話を聞いてみる', { nat: 3, ego: 3 }, function (S) { S.soccer.scout = (S.soccer.scout || 0) + 15; return '帰りの車で、母がずっとにこにこしていた。'; }, 'soccer'],
     ['「今のチームの仲間と頑張りたい」', { men: 3, ego: -2 }, 'スカウトは「その気持ちも大事です」と笑った。', 'life']]);
  sc('y_strict', { cat: 'soccer', w: 2, cond: function (S) { return youth(S) && age(S) >= 12 && age(S) <= 17; } }, '鬼コーチ', '😤',
    '新しく来たコーチは、鬼のように厳しかった。\n「才能に甘えるな。お前が一番走れ」',
    [['歯を食いしばって走る', { hp: 2, sk: { phy: 1 }, fat: 10, ego: -2 }, '一か月後、試合の最後の10分でも足が止まらなくなった。', 'soccer'],
     ['「なんでおれだけ」と反発する', { ego: 3, men: -1 }, 'コーチは「一番期待してるからだ」と言った。……ずるい。', 'b']]);
  sc('y_kit', { cat: 'soccer', w: 2, cond: function (S) { return youth(S) && age(S) <= 11; } }, '初めてのスパイク', '👟',
    '誕生日。父が、ずっと欲しかったスパイクを買ってきてくれた。',
    [['その日の夜、スパイクを抱いて寝る', { men: 3 }, '次の日、誰よりも早くグラウンドに着いた。', 'life'],
     ['すぐに公園で試し履きする', { sk: { dri: 1 }, ath: 1 }, '暗くなるまでボールを蹴った。', 'soccer']]);
  sc('y_dribble_video', { cat: 'soccer', w: 2, cond: function (S) { return youth(S) && age(S) >= 9 && age(S) <= 16; } }, '動画で研究', '📱',
    '世界のスター選手のドリブル集の動画を、何度も見返した。\n「これ、どうやってるんやろ」',
    [['公園で何百回も真似する', { sk: { dri: 2 }, art: 1, fat: 6 }, '暗くなっても、ボールを蹴り続けた。ある日、ふっと体が覚えた。', 'soccer'],
     ['友達と一緒に練習する', { sk: { dri: 1 }, com: 2 }, '一緒にやると、上達が二倍楽しかった。', 'life']]);
  sc('y_captain', { cat: 'soccer', w: 2, cond: function (S) { return youth(S) && (age(S) === 14 || age(S) === 17) && S.st.com >= 40; } }, 'キャプテン', '©️',
    function (S) { return '監督に呼ばれた。「最後の一年、' + S.soccer.team + 'のキャプテンを任せたい」'; },
    [['引き受ける', { com: 3, men: 2, sch: 5 }, function (S) { KL.title(S, S.soccer.team + ' キャプテン'); return '腕章の重さを、初めて知った。'; }, 'soccer'],
     ['「プレーで引っ張ります」と辞退する', { form: 1 }, 'キャプテンは親友に決まった。それでよかった。', 'life']]);
  sc('y_rival_school', { cat: 'soccer', w: 2, cond: function (S) { return youth(S) && age(S) >= 13 && age(S) <= 17; } }, 'もう一人の天才', '⚡',
    '県大会で、同い年の怪物FWと当たった。\n試合後、向こうから話しかけてきた。「お前、名前は？ ……覚えとくわ」',
    [['「次は全国で会おう」', { form: 2, men: 2 }, '数年後、そいつとは日本代表のロッカールームで再会することになる。', 'soccer'],
     ['連絡先を交換する', { com: 2 }, 'それから、しょっちゅう練習動画を送り合うようになった。', 'life']]);
  sc('y_injury_scare', { cat: 'soccer', imp: 1, w: 1.5, cond: function (S) { return youth(S) && age(S) >= 12 && S.fat >= 50; } }, '成長痛', '🦵',
    '膝の下が、じんじん痛む。医者には「成長期の使いすぎ」と言われた。',
    [['しっかり休む', { fat: -20, care: 5 }, '二週間ボールに触れなかった。復帰した日、ボールの感触がやけに新鮮だった。', 'b'],
     ['テーピングでごまかして続ける', { care: -6, form: 1 }, '痛みは、なかなか引かなかった。', 'soccer']]);
  sc('y_tengu', { cat: 'soccer', w: 3, cond: function (S) { return youth(S) && age(S) >= 12 && (S.ego || 0) >= 35; } }, '天才の落とし穴', '🌀',
    '最近、練習が退屈に感じる。誰と1対1をしても、負ける気がしない。\nコーチが言った。「今のままやと、どこかで必ず止まるぞ」',
    [['基礎練習に戻る', { ego: -10, sk: { iq: 2 }, men: 2 }, '基礎の中に、まだ知らないことが山ほどあった。', 'soccer'],
     ['「止まるわけない」と聞き流す', { ego: 5 }, 'その言葉の意味がわかるのは、ずっと後になってからだった。', 'b']]);
  sc('y_parents_sacrifice', { cat: 'soccer', w: 1.5, cond: function (S) { return youth(S) && age(S) >= 13 && age(S) <= 17; } }, '親の背中', '🌃',
    '夜中、トイレに起きると、台所で母が電卓を叩いていた。遠征費、スパイク代、合宿費。\n気づかれないように、そっと部屋に戻った。',
    [['絶対にプロになると誓う', { men: 4, form: 2 }, 'いつか、全部返す。', 'soccer'],
     ['次の日、「ありがとう」とだけ言う', { men: 3, com: 1 }, '母は「なにが？」ととぼけていた。', 'life']]);
})();
