'use strict';

const D = {

  // ===== エリア =====
  AREAS: [
    { id: 'plains',     name: '旅路の草原',   skyA: 0x0a1020, skyB: 0x1a2840, ground: 0x1a3a10, fog: 0x0a1a08,  minDist: 0     },
    { id: 'forest',     name: '古エルフの森', skyA: 0x080c10, skyB: 0x101820, ground: 0x0a2008, fog: 0x050e05,  minDist: 300   },
    { id: 'mountains',  name: '北の山脈',     skyA: 0x101018, skyB: 0x202030, ground: 0x303040, fog: 0x181820,  minDist: 800   },
    { id: 'desert',     name: '砂塵の荒野',   skyA: 0x201810, skyB: 0x402a18, ground: 0x50401a, fog: 0x281808,  minDist: 1600  },
    { id: 'swamp',      name: '瘴気の沼地',   skyA: 0x080c08, skyB: 0x101808, ground: 0x0a1808, fog: 0x040804,  minDist: 2800  },
    { id: 'volcano',    name: '炎の峡谷',     skyA: 0x180808, skyB: 0x301008, ground: 0x200808, fog: 0x100404,  minDist: 4500  },
    { id: 'tundra',     name: '果ての凍土',   skyA: 0x0a1420, skyB: 0x182a3a, ground: 0x203040, fog: 0x0a1828,  minDist: 6500  },
    { id: 'ruins',      name: '魔族の廃城',   skyA: 0x0c0c10, skyB: 0x181820, ground: 0x282820, fog: 0x0c0c08,  minDist: 9000  },
    { id: 'demon_realm',name: '魔王の残滓',   skyA: 0x0a0010, skyB: 0x180020, ground: 0x100010, fog: 0x080008,  minDist: 13000 },
  ],

  getArea(dist) {
    const areas = [...D.AREAS].reverse();
    return areas.find(a => dist >= a.minDist) || D.AREAS[0];
  },

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
    slime:        { id:'slime',        name:'泥の魔物',              hp:20,  atk:3,  def:1,  exp:10,  gold:[2,5],    rarity:'common',    types:['beast'],              areas:['plains','forest'],          shape:'blob',   color:0x44aa44 },
    goblin:       { id:'goblin',       name:'盗賊の小鬼',            hp:30,  atk:5,  def:2,  exp:15,  gold:[3,8],    rarity:'common',    types:['humanoid'],           areas:['plains','forest'],          shape:'small',  color:0x88cc44 },
    bat:          { id:'bat',          name:'夜行の翼鬼',            hp:15,  atk:4,  def:1,  exp:12,  gold:[1,4],    rarity:'common',    types:['beast','swift'],      areas:['forest','swamp'],           shape:'fly',    color:0x664466 },
    wolf:         { id:'wolf',         name:'牙狼の魔物',            hp:45,  atk:8,  def:3,  exp:25,  gold:[5,12],   rarity:'common',    types:['beast','swift'],      areas:['plains','forest'],          shape:'quad',   color:0x886644 },
    skeleton:     { id:'skeleton',     name:'骸骨の亡者',            hp:35,  atk:7,  def:4,  exp:20,  gold:[4,10],   rarity:'common',    types:['undead'],             areas:['ruins','swamp'],            shape:'human',  color:0xddddbb },
    treant:       { id:'treant',       name:'古木の精霊',            hp:80,  atk:10, def:8,  exp:40,  gold:[8,15],   rarity:'common',    types:['beast'],              areas:['forest'],                   shape:'large',  color:0x226622 },
    spider:       { id:'spider',       name:'毒蜘蛛の魔物',          hp:40,  atk:9,  def:3,  exp:30,  gold:[5,12],   rarity:'common',    types:['beast','swift'],      areas:['forest','swamp'],           shape:'multi',  color:0x332222 },
    sand_worm:    { id:'sand_worm',    name:'砂中の大蛇',            hp:70,  atk:12, def:5,  exp:45,  gold:[10,20],  rarity:'common',    types:['beast'],              areas:['desert'],                   shape:'large',  color:0xaa8833 },
    ice_wolf:     { id:'ice_wolf',     name:'凍土の牙狼',            hp:60,  atk:11, def:5,  exp:40,  gold:[8,18],   rarity:'common',    types:['beast','swift'],      areas:['tundra'],                   shape:'quad',   color:0x88aacc },
    lava_lizard:  { id:'lava_lizard',  name:'炎石の爬虫鬼',          hp:65,  atk:13, def:7,  exp:45,  gold:[10,20],  rarity:'common',    types:['beast'],              areas:['volcano'],                  shape:'quad',   color:0xcc4422 },

    orc:          { id:'orc',          name:'山岳の岩鬼',            hp:100, atk:15, def:10, exp:60,  gold:[15,30],  rarity:'uncommon',  types:['physical','humanoid'],areas:['plains','mountains'],       shape:'large',  color:0x44aa44 },
    harpy:        { id:'harpy',        name:'嵐羽の魔鳥',            hp:60,  atk:18, def:5,  exp:70,  gold:[12,25],  rarity:'uncommon',  types:['beast','swift'],      areas:['mountains','desert'],       shape:'fly',    color:0xddaa44 },
    lizardman:    { id:'lizardman',    name:'沼の鱗鬼',              hp:90,  atk:14, def:12, exp:65,  gold:[14,28],  rarity:'uncommon',  types:['physical','humanoid'],areas:['swamp','desert'],           shape:'human',  color:0x22aa22 },
    skeleton_mage:{ id:'skeleton_mage',name:'骸の術師',              hp:50,  atk:25, def:3,  exp:80,  gold:[18,35],  rarity:'uncommon',  types:['undead','magic'],     areas:['ruins','swamp'],            shape:'human',  color:0xaaaaff },
    troll:        { id:'troll',        name:'岩橋の怪物',            hp:150, atk:20, def:15, exp:90,  gold:[20,40],  rarity:'uncommon',  types:['physical','beast'],   areas:['mountains','forest'],       shape:'large',  color:0x668844 },
    dark_elf:     { id:'dark_elf',     name:'堕ちた森人',            hp:70,  atk:22, def:8,  exp:85,  gold:[20,40],  rarity:'uncommon',  types:['humanoid','swift','magic'],areas:['ruins','demon_realm'],shape:'human',  color:0x8844aa },
    frost_knight: { id:'frost_knight', name:'凍てつく騎士の霊',      hp:120, atk:18, def:20, exp:100, gold:[25,50],  rarity:'uncommon',  types:['physical','humanoid'],areas:['tundra'],                   shape:'human',  color:0x66aacc },
    fire_imp:     { id:'fire_imp',     name:'炎の悪鬼',              hp:55,  atk:28, def:4,  exp:90,  gold:[18,38],  rarity:'uncommon',  types:['magic','swift'],      areas:['volcano','demon_realm'],    shape:'small',  color:0xff6622 },

    minotaur:     { id:'minotaur',     name:'鉄角の巨獣',            hp:250, atk:35, def:20, exp:200, gold:[50,100], rarity:'rare',      types:['physical','beast'],   areas:['mountains','ruins'],        shape:'large',  color:0xaa6622, drop:['iron_sword','iron_armor','minotaur_axe'] },
    wyvern:       { id:'wyvern',       name:'翼竜の魔物',            hp:300, atk:40, def:15, exp:250, gold:[60,120], rarity:'rare',      types:['beast','swift'],      areas:['mountains','volcano'],      shape:'fly',    color:0x226688, drop:['wind_amulet','wyvern_scale','wyvern_fang'] },
    vampire:      { id:'vampire',      name:'不死の吸血魔',          hp:200, atk:45, def:18, exp:280, gold:[80,150], rarity:'rare',      types:['undead','magic','swift'],areas:['ruins','swamp'],         shape:'human',  color:0x880044, drop:['blood_ring','dark_robe','vampire_cloak'] },
    golem:        { id:'golem',        name:'石造りの番人',          hp:500, atk:25, def:40, exp:300, gold:[70,130], rarity:'rare',      types:['physical'],           areas:['ruins','volcano'],          shape:'large',  color:0x888888, drop:['stone_shield','earth_ring','golem_core'] },
    frost_dragon: { id:'frost_dragon', name:'氷霧の龍',              hp:400, atk:45, def:25, exp:400, gold:[100,200],rarity:'rare',      types:['beast','magic'],      areas:['tundra'],                   shape:'fly',    color:0x44aaff, drop:['frost_scale','ice_fang','mithril_sword'] },
    demon_knight: { id:'demon_knight', name:'魔族の戦士',            hp:350, atk:50, def:30, exp:380, gold:[90,180], rarity:'rare',      types:['physical','humanoid'],areas:['demon_realm'],              shape:'large',  color:0xaa2244, drop:['demon_sword','demon_armor','dark_ring'] },

    dragon:       { id:'dragon',       name:'古の大龍',              hp:800, atk:80, def:50, exp:1000,gold:[200,500],rarity:'legendary', types:['beast','magic'],      areas:['volcano','demon_realm'],    shape:'fly',    color:0xff2200, drop:['dragon_sword','dragon_shield','dragon_scale'] },
    lich:         { id:'lich',         name:'不死の大魔術師',        hp:600, atk:100,def:30, exp:1200,gold:[300,600],rarity:'legendary', types:['undead','magic'],     areas:['ruins','demon_realm'],      shape:'large',  color:0x6600aa, drop:['lich_staff','cursed_crown','death_ring'] },
    chimera:      { id:'chimera',      name:'合成の魔獣',            hp:900, atk:90, def:45, exp:1100,gold:[250,550],rarity:'legendary', types:['beast','magic'],      areas:['demon_realm'],              shape:'large',  color:0xff6600, drop:['chimera_claw','beast_ring','chimera_horn'] },
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
  },

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

    let pool = all.filter(m => !m.areas || m.areas.includes(area));
    if (pool.length === 0) pool = all.filter(m => m.rarity === 'common');

    const biasTypes = guild ? guild.monsterBias : [];
    const weights = pool.map(m => {
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
};
