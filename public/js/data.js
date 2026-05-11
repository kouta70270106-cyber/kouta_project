'use strict';

const D = {

  // ===== エリア =====
  AREAS: [
    { id: 'plains',     name: '旅路の草原',   skyA: 0x44AAEE, skyB: 0x88CCFF, ground: 0x2A8A18, fog: 0x2A8A18,  minDist: 0,     bg: 'bg_grassland' },
    { id: 'forest',     name: '古エルフの森', skyA: 0x336699, skyB: 0x6699CC, ground: 0x1A6010, fog: 0x1A6010,  minDist: 300,   bg: 'bg_forest'    },
    { id: 'mountains',  name: '北の山脈',     skyA: 0x6699BB, skyB: 0xAADDEE, ground: 0x887766, fog: 0x887766,  minDist: 800,   bg: 'bg_grassland' },
    { id: 'desert',     name: '砂塵の荒野',   skyA: 0xDDAA44, skyB: 0xFFDD88, ground: 0xBB9944, fog: 0xBB9944,  minDist: 1600,  bg: 'bg_fullmoon'  },
    { id: 'swamp',      name: '瘴気の沼地',   skyA: 0x334422, skyB: 0x556633, ground: 0x1A3010, fog: 0x1A3010,  minDist: 2800,  bg: 'bg_forest'    },
    { id: 'volcano',    name: '炎の峡谷',     skyA: 0x663311, skyB: 0xAA4422, ground: 0x442211, fog: 0x442211,  minDist: 4500,  bg: 'bg_storm'     },
    { id: 'tundra',     name: '果ての凍土',   skyA: 0x99BBCC, skyB: 0xCCEEFF, ground: 0xC8DDE8, fog: 0xC8DDE8,  minDist: 6500,  bg: 'bg_night'     },
    { id: 'ruins',      name: '魔族の廃城',   skyA: 0x443344, skyB: 0x664466, ground: 0x443322, fog: 0x443322,  minDist: 9000,  bg: 'bg_fullmoon'  },
    { id: 'demon_realm',name: '魔王の残滓',   skyA: 0x220011, skyB: 0x440022, ground: 0x220011, fog: 0x220011,  minDist: 13000, bg: 'bg_night'     },
  ],

  getArea(dist) {
    const areas = [...D.AREAS].reverse();
    return areas.find(a => dist >= a.minDist) || D.AREAS[0];
  },

  // ===== 仲間 =====
  COMPANIONS: [
    { id: 'ern',   name: 'エルン', role: '戦士', color: 0xaa7755, atkRatio: 0.45, defRatio: 0.60, hpRatio: 0.90 },
    { id: 'saria', name: 'サリア', role: '術師', color: 0x8866cc, atkRatio: 0.35, defRatio: 0.40, hpRatio: 0.65 },
  ],

  // ===== ギルド =====
  GUILDS: {
    warriors: {
      id: 'warriors', name: '⚔️ 勇者の後継者',
      desc: '英雄の意志を継ぐ者たちの盟約。強力な魔物と戦い、大きな経験値を得られる。',
      bonus: { atk: 0.20, exp: 0.10 },
      bonusText: '攻撃力+20% / EXP+10%',
      monsterBias: ['physical', 'beast'],
      color: '#cc4444',
    },
    mages: {
      id: 'mages', name: '🔮 魔法使いの協会',
      desc: '魔法の探求を続ける者たちの会。魔法系の敵が多く出現するが経験値を多く得られる。',
      bonus: { exp: 0.30, gold: 0.10 },
      bonusText: 'EXP+30% / ゴールド+10%',
      monsterBias: ['magic', 'undead'],
      color: '#4444cc',
    },
    thieves: {
      id: 'thieves', name: '🗡️ 旅人の盟約',
      desc: '長い旅を続ける者たちの組合。素早い敵が多いが、ドロップ率とゴールドが増える。',
      bonus: { drop: 0.30, gold: 0.25 },
      bonusText: 'ドロップ率+30% / ゴールド+25%',
      monsterBias: ['swift', 'humanoid'],
      color: '#44cc44',
    },
  },

  // ===== モンスター =====
  MONSTERS: {
    slime:        { id:'slime',        name:'泥の魔物',              hp:20,  atk:3,  def:1,  exp:10,  gold:[2,5],    rarity:'common',    types:['beast'],              areas:['plains','forest'],          shape:'blob',   color:0x44aa44, desc:'草原や森に生息する緑色の魔物。弱いが群れで現れることが多く、冒険者が最初に出会う敵として知られている。' },
    goblin:       { id:'goblin',       name:'盗賊の小鬼',            hp:30,  atk:5,  def:2,  exp:15,  gold:[3,8],    rarity:'common',    types:['humanoid'],           areas:['plains','forest'],          shape:'small',  color:0x88cc44, desc:'旅人の荷物を狙う小柄な魔物。単体では弱いが、仲間を呼んで集団で行動することがある。' },
    bat:          { id:'bat',          name:'夜行の翼鬼',            hp:15,  atk:4,  def:1,  exp:12,  gold:[1,4],    rarity:'common',    types:['beast','swift'],      areas:['forest','swamp'],           shape:'fly',    color:0x664466, desc:'洞窟や森の暗がりに棲む翼を持つ魔物。素早く飛び回り、不意打ちを得意とする。' },
    wolf:         { id:'wolf',         name:'牙狼の魔物',            hp:45,  atk:8,  def:3,  exp:25,  gold:[5,12],   rarity:'common',    types:['beast','swift'],      areas:['plains','forest'],          shape:'quad',   color:0x886644, desc:'鋭い牙を持つ狼型の魔物。群れで狩りをする習性があり、素早い動きで獲物を追い詰める。' },
    skeleton:     { id:'skeleton',     name:'骸骨の亡者',            hp:35,  atk:7,  def:4,  exp:20,  gold:[4,10],   rarity:'common',    types:['undead'],             areas:['ruins','swamp'],            shape:'human',  color:0xddddbb, desc:'死者が邪気に操られて蘇った骸骨の兵士。廃墟や沼地に多く出没し、命尽きるまで戦い続ける。' },
    treant:       { id:'treant',       name:'古木の精霊',            hp:80,  atk:10, def:8,  exp:40,  gold:[8,15],   rarity:'common',    types:['beast'],              areas:['forest'],                   shape:'large',  color:0x226622, desc:'長い年月を生きた古木が魔力を帯びた存在。森を守護する番人として、侵入者を力強い枝で打ち払う。' },
    spider:       { id:'spider',       name:'毒蜘蛛の魔物',          hp:40,  atk:9,  def:3,  exp:30,  gold:[5,12],   rarity:'common',    types:['beast','swift'],      areas:['forest','swamp'],           shape:'multi',  color:0x332222, desc:'毒の糸を操る大型の蜘蛛。森や沼地に巣を張り、獲物が近づくと素早く飛びかかる。' },
    sand_worm:    { id:'sand_worm',    name:'砂中の大蛇',            hp:70,  atk:12, def:5,  exp:45,  gold:[10,20],  rarity:'common',    types:['beast'],              areas:['desert'],                   shape:'large',  color:0xaa8833, desc:'砂漠の砂中に潜む巨大な蛇型魔物。砂の波紋で位置を察知し、真下から突然飛び出して攻撃する。' },
    ice_wolf:     { id:'ice_wolf',     name:'凍土の牙狼',            hp:60,  atk:11, def:5,  exp:40,  gold:[8,18],   rarity:'common',    types:['beast','swift'],      areas:['tundra'],                   shape:'quad',   color:0x88aacc, desc:'極寒の地に棲む氷を纏った狼。その牙は触れた者を瞬く間に凍りつかせると言われる。' },
    lava_lizard:  { id:'lava_lizard',  name:'炎石の爬虫鬼',          hp:65,  atk:13, def:7,  exp:45,  gold:[10,20],  rarity:'common',    types:['beast'],              areas:['volcano'],                  shape:'quad',   color:0xcc4422, desc:'火山地帯に棲む炎を纏う蜥蜴型の魔物。溶岩の岩場に擬態し、気づかぬ旅人を不意に襲う。' },

    orc:          { id:'orc',          name:'山岳の岩鬼',            hp:100, atk:15, def:10, exp:60,  gold:[15,30],  rarity:'uncommon',  types:['physical','humanoid'],areas:['plains','mountains'],       shape:'large',  color:0x44aa44, desc:'山脈に生息する巨大な緑鬼。強靭な肉体と鈍器による圧倒的な破壊力を持ち、集団で村を荒らすこともある。' },
    harpy:        { id:'harpy',        name:'嵐羽の魔鳥',            hp:60,  atk:18, def:5,  exp:70,  gold:[12,25],  rarity:'uncommon',  types:['beast','swift'],      areas:['mountains','desert'],       shape:'fly',    color:0xddaa44, desc:'嵐を呼ぶ翼を持つ半人半鳥の魔物。上空から急降下して攻撃し、捕まえようとすると舞い上がって逃げる。' },
    lizardman:    { id:'lizardman',    name:'沼の鱗鬼',              hp:90,  atk:14, def:12, exp:65,  gold:[14,28],  rarity:'uncommon',  types:['physical','humanoid'],areas:['swamp','desert'],           shape:'human',  color:0x22aa22, desc:'沼地に棲む鱗に覆われた人型魔物。水中でも陸上でも素早く動け、部族を作って縄張りを守る。' },
    skeleton_mage:{ id:'skeleton_mage',name:'骸の術師',              hp:50,  atk:25, def:3,  exp:80,  gold:[18,35],  rarity:'uncommon',  types:['undead','magic'],     areas:['ruins','swamp'],            shape:'human',  color:0xaaaaff, desc:'死霊魔法を操る骸骨の術師。魔力は高いが守りは脆く、強力な呪文を詠唱する前に倒すことが鍵。' },
    troll:        { id:'troll',        name:'岩橋の怪物',            hp:150, atk:20, def:15, exp:90,  gold:[20,40],  rarity:'uncommon',  types:['physical','beast'],   areas:['mountains','forest'],       shape:'large',  color:0x668844, desc:'橋や峠を縄張りとする巨大な怪物。驚異的な再生能力を持ち、普通の攻撃ではなかなか倒せない。' },
    cave_guard:   { id:'cave_guard',   name:'岩窟の番兵',            hp:115, atk:16, def:18, exp:65,  gold:[18,38],  rarity:'uncommon',  types:['physical','humanoid'],areas:['mountains','ruins'],        shape:'human',  color:0x889988, desc:'山岳の洞窟や廃城の入口を守る石鎧の番兵。攻撃力は高くないが頑丈な鎧で攻撃を受け流し、侵入者を粘り強く食い止める。' },
    dark_elf:     { id:'dark_elf',     name:'堕ちた森人',            hp:70,  atk:22, def:8,  exp:85,  gold:[20,40],  rarity:'uncommon',  types:['humanoid','swift','magic'],areas:['ruins','demon_realm'],shape:'human',  color:0x8844aa, desc:'闇の力に堕ちた森のエルフ。魔法と素早い剣技で冒険者を翻弄し、暗殺も得意とする危険な存在。' },
    frost_knight: { id:'frost_knight', name:'凍てつく騎士の霊',      hp:120, atk:18, def:20, exp:100, gold:[25,50],  rarity:'uncommon',  types:['physical','humanoid'],areas:['tundra'],                   shape:'human',  color:0x66aacc, desc:'氷の鎧を纏った亡霊の騎士。無念の死を遂げた騎士が永遠の寒気の中で戦い続ける悲しき存在。' },
    fire_imp:     { id:'fire_imp',     name:'炎の悪鬼',              hp:55,  atk:28, def:4,  exp:90,  gold:[18,38],  rarity:'uncommon',  types:['magic','swift'],      areas:['volcano','demon_realm'],    shape:'small',  color:0xff6622, desc:'火山や魔界に棲む小柄な悪鬼。炎の魔法を操り、跳ね回りながら隙のない攻撃を仕掛けてくる。' },

    minotaur:     { id:'minotaur',     name:'鉄角の巨獣',            hp:250, atk:35, def:20, exp:200, gold:[50,100], rarity:'rare',      types:['physical','beast'],   areas:['mountains','ruins'],        shape:'large',  color:0xaa6622, drop:['iron_sword','iron_armor','minotaur_axe'],        desc:'鉄の角を持つ牛頭の怪物。廃墟や山岳の迷宮を縄張りとし、侵入者を大斧で叩き潰す。稀に精巧な武具を落とす。' },
    wyvern:       { id:'wyvern',       name:'翼竜の魔物',            hp:300, atk:40, def:15, exp:250, gold:[60,120], rarity:'rare',      types:['beast','swift'],      areas:['mountains','volcano'],      shape:'fly',    color:0x226688, drop:['wind_amulet','wyvern_scale','wyvern_fang'],      desc:'空を支配する翼竜。鋭い爪と毒の尾を持ち、高速で急降下しながら獲物に致命傷を与える。' },
    vampire:      { id:'vampire',      name:'不死の吸血魔',          hp:200, atk:45, def:18, exp:280, gold:[80,150], rarity:'rare',      types:['undead','magic','swift'],areas:['ruins','swamp'],         shape:'human',  color:0x880044, drop:['blood_ring','dark_robe','vampire_cloak'],        desc:'永遠の命を持つ吸血鬼の貴族。魔法と圧倒的な素早さを駆使し、血を吸いながら力を回復する。' },
    golem:        { id:'golem',        name:'石造りの番人',          hp:500, atk:25, def:40, exp:300, gold:[70,130], rarity:'rare',      types:['physical'],           areas:['ruins','volcano'],          shape:'large',  color:0x888888, drop:['stone_shield','earth_ring','golem_core'],        desc:'古代魔法で錬成された石の番人。感情を持たず命令に忠実に従い、守護の任務を永遠に遂行し続ける。' },
    frost_dragon: { id:'frost_dragon', name:'氷霧の龍',              hp:400, atk:45, def:25, exp:400, gold:[100,200],rarity:'rare',      types:['beast','magic'],      areas:['tundra'],                   shape:'fly',    color:0x44aaff, drop:['frost_scale','ice_fang','mithril_sword'],        desc:'極寒の地を棲み処とする氷属性の龍。吹き出す冷気は全てを凍てつかせ、接近する者を逃がさない。' },
    demon_knight: { id:'demon_knight', name:'魔族の戦士',            hp:350, atk:50, def:30, exp:380, gold:[90,180], rarity:'rare',      types:['physical','humanoid'],areas:['demon_realm'],              shape:'large',  color:0xaa2244, drop:['demon_sword','demon_armor','dark_ring'],         desc:'魔界から召喚された精鋭戦士。魔力を纏う漆黒の剣と鎧で武装し、無慈悲に敵を刈り取る。' },

    // ===== レアスライム（超低確率・スケールなし） =====
    gold_slime:   { id:'gold_slime',   name:'黄金のスライム王',      hp:50,  atk:3,  def:80, exp:50,   gold:[2000,5000], rarity:'legendary', types:['beast'],  areas:null, shape:'gold_blob',   color:0xFFD700, noScale:true, spawnWeight:4,
                    drop:['acc_life_amulet','acc_power_ring'],  desc:'黄金に輝く幻のスライム。極めて硬い体を持ち容易には倒せないが、討伐に成功すれば莫大な財宝を残していく。出会える確率は極めて低い。' },
    silver_slime: { id:'silver_slime', name:'白銀のスライム王',      hp:50,  atk:3,  def:80, exp:8000, gold:[5,20],      rarity:'legendary', types:['beast'],  areas:null, shape:'silver_blob', color:0xC0C0C0, noScale:true, spawnWeight:4,
                    drop:['spellbook_arcane','spellbook_thunder'], desc:'銀色に輝く伝説のスライム。倒せば膨大な経験値を与えてくれる。その出現は奇跡と呼ばれ、多くの冒険者が夢見る存在。' },

    dragon:       { id:'dragon',       name:'古の大龍',              hp:800, atk:80, def:50, exp:1000,gold:[200,500],rarity:'legendary', types:['beast','magic'],      areas:['volcano','demon_realm'],    shape:'fly',    color:0xff2200, drop:['dragon_sword','dragon_shield','dragon_scale'], desc:'大陸最強の古龍。その存在自体が災厄であり、炎の息吹は街一つを瞬く間に焼き尽くすと伝えられる。' },
    lich:         { id:'lich',         name:'不死の大魔術師',        hp:600, atk:100,def:30, exp:1200,gold:[300,600],rarity:'legendary', types:['undead','magic'],     areas:['ruins','demon_realm'],      shape:'large',  color:0x6600aa, drop:['lich_staff','cursed_crown','death_ring'],       desc:'不老不死を求めて死霊魔術師となった元大魔法使い。強力な呪文で世界の破壊を企み、死を超越した力を持つ。' },
    chimera:      { id:'chimera',      name:'合成の魔獣',            hp:900, atk:90, def:45, exp:1100,gold:[250,550],rarity:'legendary', types:['beast','magic'],      areas:['demon_realm'],              shape:'large',  color:0xff6600, drop:['chimera_claw','beast_ring','chimera_horn'],     desc:'複数の魔獣を合成して生み出された異形の存在。炎、毒、爪など多彩な攻撃手段で冒険者を苦しめる。' },
  },

  // ===== ボス =====
  BOSSES: [
    { id:'inferno',  name:'炎を操る大魔族 フラメル',   hp:3000, atk:120, def:60,  exp:8000, gold:[500,1200], color:0xff2200, drop:['inferno_blade','fire_crown']   },
    { id:'frost',    name:'氷を操る大魔族 グラシア',   hp:3000, atk:100, def:80,  exp:8000, gold:[500,1200], color:0x44ccff, drop:['frost_blade','ice_crown']      },
    { id:'shadow',   name:'闇を統べる大魔族 シャルテン',hp:3000, atk:130, def:50,  exp:8000, gold:[500,1200], color:0x440088, drop:['shadow_blade','dark_crown']    },
    { id:'storm',    name:'嵐を呼ぶ大魔族 ヴィルト',   hp:3000, atk:110, def:70,  exp:8000, gold:[500,1200], color:0x8888ff, drop:['storm_blade','thunder_crown']  },
    { id:'plague',   name:'瘴気を纏う大魔族 ゼスト',   hp:3000, atk:90,  def:90,  exp:8000, gold:[500,1200], color:0x44aa22, drop:['plague_scythe','poison_crown'] },
    { id:'void',     name:'魔王城の守護者 ヴォイド',   hp:4000, atk:150, def:80,  exp:12000,gold:[800,2000], color:0x220033, drop:['void_blade','void_crown','void_ring'] },
  ],

  // ===== 装備 =====
  EQUIPMENT: {
    // Starter
    wooden_sword:  { id:'wooden_sword',   name:'木の剣',           type:'weapon',    atk:5,             rarity:'common',    icon:'⚔️'  },
    cloth_robe:    { id:'cloth_robe',      name:'布のローブ',       type:'armor',     def:3,             rarity:'common',    icon:'🥋'  },
    leather_glove: { id:'leather_glove',   name:'革手袋',           type:'accessory', atk:2,def:2,       rarity:'common',    icon:'🧤'  },

    // Common drops
    iron_sword:    { id:'iron_sword',      name:'鉄の剣',           type:'weapon',    atk:18,            rarity:'common',    icon:'⚔️'  },
    iron_armor:    { id:'iron_armor',      name:'鉄の鎧',           type:'armor',     def:15,            rarity:'common',    icon:'🛡️'  },
    leather_armor: { id:'leather_armor',   name:'革の鎧',           type:'armor',     def:10,            rarity:'common',    icon:'🛡️'  },

    // Uncommon
    steel_sword:   { id:'steel_sword',     name:'鋼の剣',           type:'weapon',    atk:35,            rarity:'uncommon',  icon:'⚔️'  },
    steel_armor:   { id:'steel_armor',     name:'鋼の鎧',           type:'armor',     def:28,            rarity:'uncommon',  icon:'🛡️'  },
    mithril_sword: { id:'mithril_sword',   name:'ミスリルの剣',     type:'weapon',    atk:55,            rarity:'rare',      icon:'⚔️'  },
    mithril_armor: { id:'mithril_armor',   name:'ミスリルの鎧',     type:'armor',     def:45,hp:50,      rarity:'rare',      icon:'🛡️'  },

    // Monster drops
    minotaur_axe:  { id:'minotaur_axe',    name:'ミノタウロスの斧', type:'weapon',    atk:42,def:5,      rarity:'uncommon',  icon:'🪓'  },
    wind_amulet:   { id:'wind_amulet',     name:'風のアミュレット', type:'accessory', atk:8,def:8,       rarity:'uncommon',  icon:'💨'  },
    wyvern_scale:  { id:'wyvern_scale',    name:'ワイバーンの鱗',   type:'armor',     def:25,atk:5,      rarity:'rare',      icon:'🛡️'  },
    wyvern_fang:   { id:'wyvern_fang',     name:'ワイバーンの牙',   type:'weapon',    atk:48,            rarity:'uncommon',  icon:'🦷'  },
    blood_ring:    { id:'blood_ring',      name:'血の指輪',         type:'accessory', atk:12,hp:60,      rarity:'rare',      icon:'💍'  },
    dark_robe:     { id:'dark_robe',       name:'闇のローブ',       type:'armor',     def:18,atk:18,     rarity:'rare',      icon:'🥋'  },
    vampire_cloak: { id:'vampire_cloak',   name:'吸血鬼のマント',   type:'accessory', atk:10,hp:80,def:5,rarity:'rare',      icon:'🧥'  },
    stone_shield:  { id:'stone_shield',    name:'石の盾',           type:'armor',     def:30,hp:120,     rarity:'rare',      icon:'🛡️'  },
    earth_ring:    { id:'earth_ring',      name:'大地の指輪',       type:'accessory', def:18,hp:40,      rarity:'rare',      icon:'💍'  },
    golem_core:    { id:'golem_core',      name:'ゴーレムの核',     type:'accessory', def:22,hp:100,     rarity:'rare',      icon:'🔮'  },
    frost_scale:   { id:'frost_scale',     name:'フロストスケール', type:'armor',     def:35,hp:80,      rarity:'rare',      icon:'🧊'  },
    ice_fang:      { id:'ice_fang',        name:'氷牙',             type:'weapon',    atk:52,def:8,      rarity:'rare',      icon:'🦷'  },
    demon_sword:   { id:'demon_sword',     name:'デーモンソード',   type:'weapon',    atk:65,            rarity:'rare',      icon:'⚔️'  },
    demon_armor:   { id:'demon_armor',     name:'デーモンアーマー', type:'armor',     def:40,atk:10,     rarity:'rare',      icon:'🛡️'  },
    dark_ring:     { id:'dark_ring',       name:'闇の指輪',         type:'accessory', atk:20,def:5,      rarity:'rare',      icon:'💍'  },

    // Legendary
    dragon_sword:  { id:'dragon_sword',    name:'ドラゴンスレイヤー',type:'weapon',   atk:110,           rarity:'legendary', icon:'🗡️'  },
    dragon_shield: { id:'dragon_shield',   name:'ドラゴンシールド', type:'armor',     def:90,hp:200,     rarity:'legendary', icon:'🛡️'  },
    dragon_scale:  { id:'dragon_scale',    name:'ドラゴンスケール', type:'armor',     def:75,atk:20,     rarity:'legendary', icon:'🛡️'  },
    lich_staff:    { id:'lich_staff',      name:'リッチのスタッフ', type:'weapon',    atk:100,def:12,    rarity:'legendary', icon:'🪄'  },
    cursed_crown:  { id:'cursed_crown',    name:'呪われた王冠',     type:'accessory', atk:45,hp:-50,     rarity:'legendary', icon:'👑'  },
    death_ring:    { id:'death_ring',      name:'死の指輪',         type:'accessory', atk:28,def:8,      rarity:'legendary', icon:'💀'  },
    chimera_claw:  { id:'chimera_claw',    name:'キメラの爪',       type:'weapon',    atk:105,           rarity:'legendary', icon:'🦅'  },
    beast_ring:    { id:'beast_ring',      name:'獣王の指輪',       type:'accessory', atk:32,def:22,hp:150,rarity:'legendary',icon:'👑' },
    chimera_horn:  { id:'chimera_horn',    name:'キメラの角',       type:'accessory', atk:38,def:15,     rarity:'legendary', icon:'🦄'  },

    // Boss drops
    inferno_blade: { id:'inferno_blade',   name:'炎魔王の剣',       type:'weapon',    atk:160,           rarity:'legendary', icon:'🔥'  },
    fire_crown:    { id:'fire_crown',      name:'炎の王冠',         type:'accessory', atk:40,hp:120,     rarity:'legendary', icon:'👑'  },
    frost_blade:   { id:'frost_blade',     name:'氷魔王の剣',       type:'weapon',    atk:140,def:22,    rarity:'legendary', icon:'❄️'  },
    ice_crown:     { id:'ice_crown',       name:'氷の王冠',         type:'accessory', def:45,hp:250,     rarity:'legendary', icon:'👑'  },
    shadow_blade:  { id:'shadow_blade',    name:'闇魔王の剣',       type:'weapon',    atk:170,           rarity:'legendary', icon:'🌑'  },
    dark_crown:    { id:'dark_crown',      name:'闇の王冠',         type:'accessory', atk:50,def:10,     rarity:'legendary', icon:'👑'  },
    storm_blade:   { id:'storm_blade',     name:'嵐魔王の剣',       type:'weapon',    atk:155,           rarity:'legendary', icon:'⚡'  },
    thunder_crown: { id:'thunder_crown',   name:'雷の王冠',         type:'accessory', atk:35,def:35,     rarity:'legendary', icon:'⚡'  },
    plague_scythe: { id:'plague_scythe',   name:'瘴気の大鎌',       type:'weapon',    atk:145,def:12,    rarity:'legendary', icon:'☠️'  },
    poison_crown:  { id:'poison_crown',    name:'毒の王冠',         type:'accessory', def:55,hp:200,     rarity:'legendary', icon:'☠️'  },
    void_blade:    { id:'void_blade',      name:'虚無の剣',         type:'weapon',    atk:220,           rarity:'legendary', icon:'🌌'  },
    void_crown:    { id:'void_crown',      name:'虚無の王冠',       type:'accessory', atk:60,def:60,hp:350,rarity:'legendary',icon:'👑' },
    void_ring:     { id:'void_ring',       name:'虚無の指輪',       type:'accessory', atk:45,def:45,     rarity:'legendary', icon:'💍'  },

    // ===== ショップ専用アイテム =====
    // 盾
    shield_wood:     { id:'shield_wood',     name:'木の盾',           type:'shield',    def:8,             rarity:'common',    icon:'🛡️', desc:'村人が使う素朴な木盾。軽くて扱いやすい。' },
    shield_iron:     { id:'shield_iron',     name:'鉄の盾',           type:'shield',    def:22, hp:30,     rarity:'uncommon',  icon:'🛡️', desc:'頑丈な鉄製の丸盾。矢や刃を確実に受け止める。' },
    shield_dragon:   { id:'shield_dragon',   name:'龍盾',             type:'shield',    def:90, hp:200,    rarity:'legendary', icon:'🛡️', desc:'龍の鱗を素材にした究極の盾。炎すら弾く。' },
    // アクセサリ
    acc_charm:       { id:'acc_charm',       name:'幸運のお守り',     type:'accessory', atk:2,  def:2,     rarity:'common',    icon:'🍀', desc:'旅人が守護を願うお守り。運を少し上げてくれる。' },
    acc_power_ring:  { id:'acc_power_ring',  name:'力の指輪',         type:'accessory', atk:15,            rarity:'uncommon',  icon:'💍', desc:'装着すると力が漲る魔法の指輪。攻撃力が増す。' },
    acc_life_amulet: { id:'acc_life_amulet', name:'命のアミュレット', type:'accessory', hp:100, def:10,    rarity:'rare',      icon:'💎', desc:'生命力を高める古代のアミュレット。HP上限が増える。' },
    // ===== 魔法書（ショップ購入専用） =====
    // element スキル効果: fire=炎バースト, ice=被ダメ軽減, heal=戦闘後HP回復, thunder=雷撃, arcane=EXP増加
    spellbook_fire:    { id:'spellbook_fire',    name:'炎の魔法書',   type:'spellbook', atk:15,               rarity:'uncommon', icon:'📕', element:'fire',    elementLabel:'🔥炎',    desc:'炎魔法が刻まれた書。ATK+15 / 15%でバースト追加ダメージ。' },
    spellbook_ice:     { id:'spellbook_ice',     name:'氷の魔法書',   type:'spellbook', def:20,               rarity:'uncommon', icon:'📘', element:'ice',     elementLabel:'❄️氷',    desc:'氷魔法が刻まれた書。DEF+20 / 20%で被ダメージを50%カット。' },
    spellbook_heal:    { id:'spellbook_heal',    name:'回復の魔法書', type:'spellbook', hp:100,               rarity:'uncommon', icon:'📗', element:'heal',    elementLabel:'💚回復',   desc:'回復魔法が刻まれた書。MaxHP+100 / 戦闘勝利後にHPを回復。' },
    spellbook_thunder: { id:'spellbook_thunder', name:'雷の魔法書',   type:'spellbook', atk:25, def:10,       rarity:'rare',     icon:'📙', element:'thunder', elementLabel:'⚡雷',     desc:'雷撃魔法が刻まれた書。ATK+25 DEF+10 / 20%でダメージ2倍。' },
    spellbook_arcane:  { id:'spellbook_arcane',  name:'秘術の魔法書', type:'spellbook', atk:20, def:20,hp:120, rarity:'rare',    icon:'📓', element:'arcane',  elementLabel:'🌌秘術',   desc:'古代秘術が刻まれた書。全ステータス強化 / 獲得EXP+30%。' },
  },

  // ===== ショップ =====
  SHOP: [
    // 武器
    { itemId:'wooden_sword',      price:200,   category:'weapon'    },
    { itemId:'iron_sword',        price:800,   category:'weapon'    },
    { itemId:'steel_sword',       price:3000,  category:'weapon'    },
    { itemId:'mithril_sword',     price:12000, category:'weapon'    },
    // 盾
    { itemId:'shield_wood',       price:300,   category:'shield'    },
    { itemId:'shield_iron',       price:2500,  category:'shield'    },
    { itemId:'shield_dragon',     price:30000, category:'shield'    },
    // 鎧
    { itemId:'cloth_robe',        price:150,   category:'armor'     },
    { itemId:'leather_armor',     price:600,   category:'armor'     },
    { itemId:'iron_armor',        price:2500,  category:'armor'     },
    { itemId:'steel_armor',       price:6000,  category:'armor'     },
    { itemId:'mithril_armor',     price:15000, category:'armor'     },
    // アクセサリ
    { itemId:'leather_glove',     price:400,   category:'accessory' },
    { itemId:'acc_charm',         price:300,   category:'accessory' },
    { itemId:'acc_power_ring',    price:4000,  category:'accessory' },
    { itemId:'acc_life_amulet',   price:8000,  category:'accessory' },
    // 魔法書
    { itemId:'spellbook_fire',    price:1500,  category:'spellbook' },
    { itemId:'spellbook_ice',     price:2000,  category:'spellbook' },
    { itemId:'spellbook_heal',    price:2500,  category:'spellbook' },
    { itemId:'spellbook_thunder', price:5000,  category:'spellbook' },
    { itemId:'spellbook_arcane',  price:10000, category:'spellbook' },
  ],

  // ===== クエスト =====
  QUEST_TEMPLATES: [
    { id:'q_slime',    title:'泥の魔物の討伐',         targetId:'slime',    count:[5,15],  reward:{exp:80,  gold:50}  },
    { id:'q_goblin',   title:'盗賊小鬼の退治',         targetId:'goblin',   count:[4,10],  reward:{exp:100, gold:70}  },
    { id:'q_wolf',     title:'牙狼の討伐',             targetId:'wolf',     count:[3,8],   reward:{exp:140, gold:90}  },
    { id:'q_orc',      title:'岩鬼の討伐',             targetId:'orc',      count:[2,6],   reward:{exp:250, gold:150} },
    { id:'q_troll',    title:'岩橋の怪物退治',         targetId:'troll',    count:[1,4],   reward:{exp:400, gold:220} },
    { id:'q_skeleton', title:'骸の亡者成敗',           targetId:'skeleton', count:[3,8],   reward:{exp:120, gold:80}  },
    { id:'q_spider',   title:'毒蜘蛛の退治',           targetId:'spider',   count:[2,7],   reward:{exp:130, gold:85}  },
    { id:'q_vampire',  title:'不死の吸血魔討伐',       targetId:'vampire',  count:[1,3],   reward:{exp:600, gold:350} },
    { id:'q_dist',     title:'旅人の足跡',             targetId:'__dist__', count:[200,600],reward:{exp:200,gold:120}  },
  ],

  NPC_NAMES: ['老魔法使い', '旅の術師', '村の少女', '一級魔法使い', '農夫', '謎の賢者', '山岳の番人', '傷ついた旅人', '神官', '行商の旅人'],

  RARITY_WEIGHT: { common:60, uncommon:25, rare:12, legendary:3 },
  RARITY_EXP:    { common:1,  uncommon:2,  rare:5,  legendary:15 },
  RARITY_COLOR:  { common:'#d4c8a8', uncommon:'#44ff88', rare:'#4488ff', legendary:'#ffaa22' },

  /** モンスターの重み付きランダム選択 */
  pickMonster(area, guildId) {
    const all = Object.values(D.MONSTERS);
    const guild = guildId ? D.GUILDS[guildId] : null;

    // レアスライムは areas:null → 全エリアで出現可能
    let pool = all.filter(m => !m.areas || m.areas.includes(area));
    if (pool.length === 0) pool = all.filter(m => m.rarity === 'common');

    const biasTypes = guild ? guild.monsterBias : [];
    const weights = pool.map(m => {
      // spawnWeight が設定されている場合はそちらを優先（超低確率出現用）
      if (m.spawnWeight !== undefined) return m.spawnWeight;
      let w = D.RARITY_WEIGHT[m.rarity] || 10;
      if (biasTypes.some(t => m.types?.includes(t))) w *= 2;
      return w;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[0];
  },

  /** ランダムクエスト生成 */
  makeQuest(templateId) {
    const t = D.QUEST_TEMPLATES.find(q => q.id === templateId)
           || D.QUEST_TEMPLATES[Math.floor(Math.random() * D.QUEST_TEMPLATES.length)];
    const required = t.count[0] + Math.floor(Math.random() * (t.count[1] - t.count[0] + 1));
    const npcName = D.NPC_NAMES[Math.floor(Math.random() * D.NPC_NAMES.length)];
    return {
      id: templateId + '_' + Date.now(),
      templateId: t.id,
      title: t.title,
      desc: `${npcName}から依頼：${t.title}を${required}体/回`,
      targetId: t.targetId,
      required,
      progress: 0,
      reward: { ...t.reward },
      done: false,
      npcName,
    };
  },

  /** ランダムボス */
  pickBoss(monthNum) {
    const idx = monthNum % D.BOSSES.length;
    return D.BOSSES[idx];
  },

  SPELLS: [
    // ===== 🔥 炎属性 =====
    { id:'fire_1',    name:'ファイア',         element:'fire',    category:'attack', learnLevel:1,  power:10,  icon:'🔥', desc:'小さな炎弾を放つ。' },
    { id:'fire_2',    name:'ファイラ',         element:'fire',    category:'attack', learnLevel:8,  power:28,  icon:'🔥', desc:'中程度の火球で焼き払う。' },
    { id:'fire_3',    name:'ファイガ',         element:'fire',    category:'attack', learnLevel:20, power:60,  icon:'🔥', desc:'猛烈な炎の渦を放つ。' },
    // ===== ❄️ 氷属性 =====
    { id:'ice_1',     name:'ブリザド',         element:'ice',     category:'attack', learnLevel:3,  power:12,  icon:'❄️', desc:'鋭い氷の礫を飛ばす。' },
    { id:'ice_2',     name:'ブリザラ',         element:'ice',     category:'attack', learnLevel:12, power:32,  icon:'❄️', desc:'凍てつく吹雪を起こす。' },
    // ===== ⚡ 雷属性 =====
    { id:'thunder_1', name:'サンダー',         element:'thunder', category:'attack', learnLevel:5,  power:15,  icon:'⚡', desc:'稲妻を落として攻撃する。' },
    { id:'thunder_2', name:'サンダラ',         element:'thunder', category:'attack', learnLevel:15, power:38,  icon:'⚡', desc:'強力な雷撃を放つ。' },
    { id:'thunder_3', name:'サンダガ',         element:'thunder', category:'attack', learnLevel:30, power:75,  icon:'⚡', desc:'天を裂く超電磁嵐を呼ぶ。' },
    // ===== 💚 回復属性 =====
    { id:'heal_1',    name:'ケアル',           element:'heal',    category:'heal',   learnLevel:4,  power:20,  icon:'💚', desc:'小さな傷を癒す。' },
    { id:'heal_2',    name:'ケアルラ',         element:'heal',    category:'heal',   learnLevel:14, power:50,  icon:'💚', desc:'体の傷を大きく回復する。' },
    { id:'heal_3',    name:'ケアルガ',         element:'heal',    category:'heal',   learnLevel:25, power:120, icon:'💚', desc:'全ての傷を完全に回復する力。' },
    // ===== 💨 風属性 =====
    { id:'wind_1',    name:'エアロ',           element:'wind',    category:'attack', learnLevel:7,  power:18,  icon:'💨', desc:'鋭い風刃で敵を切り裂く。' },
    { id:'wind_2',    name:'ヘイスト',         element:'wind',    category:'buff',   learnLevel:18, power:0,   icon:'💨', desc:'風の加護で行動速度を高める。' },
    // ===== 🌌 秘術属性 =====
    { id:'arcane_1',  name:'アルカナ',         element:'arcane',  category:'buff',   learnLevel:10, power:0,   icon:'🌌', desc:'古代の秘術で能力を底上げする。' },
    { id:'arcane_2',  name:'グランドアルカナ', element:'arcane',  category:'buff',   learnLevel:40, power:0,   icon:'🌌', desc:'全属性を支配する究極の秘術。' },
  ],
};
