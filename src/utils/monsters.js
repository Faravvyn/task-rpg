// Katalog aller verfügbaren Attacken/Moves
// Moves haben nun Typen und Einschränkungen, wer sie lernen kann.
export const MOVES = {
  tackle: { 
    name: 'Tackle', type: 'neutral', power: 15, accuracy: 0.95, critChance: 0.05,
    learnableTypes: ['fire', 'water', 'earth', 'air', 'light', 'dark', 'neutral'],
    desc: 'Ein einfacher Rempler.' 
  },
  fire_breath: { 
    name: 'Feuerodem', type: 'fire', power: 25, accuracy: 0.85, critChance: 0.1,
    learnableTypes: ['fire', 'neutral'],
    desc: 'Speit glühende Hitze.' 
  },
  water_jet: { 
    name: 'Wasserstrahl', type: 'water', power: 20, accuracy: 0.9, critChance: 0.05,
    learnableTypes: ['water', 'neutral'],
    desc: 'Ein harter Strahl aus Wasser.' 
  },
  leaf_blade: { 
    name: 'Blattklinge', type: 'earth', power: 22, accuracy: 0.9, critChance: 0.15,
    learnableTypes: ['earth', 'neutral'],
    desc: 'Scharfe Blätter schneiden den Gegner.' 
  },
  spark: { 
    name: 'Funke', type: 'air', power: 18, accuracy: 0.95, critChance: 0.1,
    learnableTypes: ['air', 'neutral'],
    desc: 'Ein elektrischer Schlag.' 
  },
  bite: { 
    name: 'Biss', type: 'dark', power: 20, accuracy: 0.9, critChance: 0.1,
    learnableTypes: ['dark', 'neutral'],
    desc: 'Ein kräftiger Biss.' 
  },
  holy_light: { 
    name: 'Heiliges Licht', type: 'light', power: 20, accuracy: 0.9, critChance: 0.05,
    learnableTypes: ['light', 'neutral'],
    desc: 'Gleißendes Licht blendet den Feind.' 
  },
  
  // Task-basierte Moves
  pushup_punch: { 
    name: 'Liegestütz-Punch', type: 'neutral', power: 45, accuracy: 1.0, critChance: 0.2,
    taskReq: '10 Liegestütze', learnableTypes: ['fire', 'earth', 'neutral'],
    desc: 'Erfordert 10 Liegestütze. Enorme Wucht.' 
  },
  sprint_strike: { 
    name: 'Sprint-Schlag', type: 'air', power: 40, accuracy: 0.9, critChance: 0.1,
    taskReq: 'Auf der Stelle laufen (30s)', learnableTypes: ['air', 'light', 'neutral'],
    desc: 'Schneller Angriff durch hohe Geschwindigkeit.' 
  },
  squat_slam: { 
    name: 'Kniebeugen-Schlag', type: 'earth', power: 50, accuracy: 0.85, critChance: 0.1,
    taskReq: '10 Kniebeugen', learnableTypes: ['earth', 'fire', 'neutral'],
    desc: 'Nutzt die Beinkraft für einen schweren Treffer.' 
  }
}

export const MONSTERS = [
  { id: 'ember_fox', name: 'Glutfuchs', icon: '🦊', type: 'fire', rarity: 'common', image: '/assets/monsters/ember_fox.jpg', baseStats: { hp: 45, atk: 12, def: 8 }, moves: ['tackle', 'fire_breath'] },
  { id: 'aqua_turtle', name: 'Panzerkröte', icon: '🐢', type: 'water', rarity: 'common', image: '/assets/monsters/aqua_turtle.jpg', baseStats: { hp: 60, atk: 8, def: 15 }, moves: ['tackle', 'water_jet'] },
  { id: 'leaf_owl', name: 'Laubkauz', icon: '🦉', type: 'earth', rarity: 'common', image: '/assets/monsters/leaf_owl.jpg', baseStats: { hp: 50, atk: 10, def: 10 }, moves: ['tackle', 'leaf_blade'] },
  { id: 'shock_bat', name: 'Blitzfledermaus', icon: '🦇', type: 'air', rarity: 'common', image: '/assets/monsters/shock_bat.jpg', baseStats: { hp: 40, atk: 14, def: 6 }, moves: ['tackle', 'spark'] },
  { id: 'shadow_rat', name: 'Schattenratte', icon: '🐀', type: 'dark', rarity: 'common', image: '/assets/monsters/shadow_rat.jpg', baseStats: { hp: 35, atk: 15, def: 5 }, moves: ['tackle', 'bite'] },
  
  { id: 'magma_golem', name: 'Magmahüne', icon: '🗿', type: 'fire', rarity: 'rare', image: '/assets/monsters/magma_golem.jpg', baseStats: { hp: 80, atk: 18, def: 20 }, moves: ['fire_breath', 'squat_slam'] },
  { id: 'crystal_deer', name: 'Kristallhirsch', icon: '🦌', type: 'light', rarity: 'rare', image: '/assets/monsters/crystal_deer.jpg', baseStats: { hp: 65, atk: 22, def: 12 }, moves: ['holy_light', 'pushup_punch'] },
  { id: 'venom_snake', name: 'Giftviper', icon: '🐍', type: 'earth', rarity: 'rare', image: '/assets/monsters/venom_snake.jpg', baseStats: { hp: 55, atk: 25, def: 8 }, moves: ['bite', 'sprint_strike'] },
  { id: 'storm_eagle', name: 'Sturmadler', icon: '🦅', type: 'air', rarity: 'rare', image: '/assets/monsters/storm_eagle.jpg', baseStats: { hp: 60, atk: 24, def: 10 }, moves: ['spark', 'sprint_strike'] },
  { id: 'deep_whale', name: 'Tiefenwal', icon: '🐋', type: 'water', rarity: 'rare', image: '/assets/monsters/deep_whale.jpg', baseStats: { hp: 100, atk: 15, def: 18 }, moves: ['water_jet', 'squat_slam'] },
  
  { id: 'phoenix_spirit', name: 'Phönixgeist', icon: '🐦‍🔥', type: 'fire', rarity: 'epic', image: '/assets/monsters/phoenix_spirit.jpg', baseStats: { hp: 85, atk: 32, def: 15 }, moves: ['fire_breath', 'pushup_punch', 'holy_light'] },
  { id: 'void_stalker', name: 'Leerenpirscher', icon: '👾', type: 'dark', rarity: 'epic', image: '/assets/monsters/void_stalker.jpg', baseStats: { hp: 75, atk: 38, def: 12 }, moves: ['bite', 'sprint_strike', 'spark'] },
  { id: 'forest_guardian', name: 'Waldwächter', icon: '🌳', type: 'earth', rarity: 'epic', image: '/assets/monsters/forest_guardian.jpg', baseStats: { hp: 120, atk: 25, def: 25 }, moves: ['leaf_blade', 'squat_slam', 'water_jet'] },
  { id: 'sun_lion', name: 'Sonnenlöwe', icon: '🦁', type: 'light', rarity: 'epic', image: '/assets/monsters/sun_lion.jpg', baseStats: { hp: 90, atk: 35, def: 20 }, moves: ['tackle', 'holy_light', 'pushup_punch'] },
  { id: 'ice_wolf', name: 'Frostwolf', icon: '🐺', type: 'water', rarity: 'epic', image: '/assets/monsters/ice_wolf.jpg', baseStats: { hp: 80, atk: 34, def: 18 }, moves: ['bite', 'water_jet', 'sprint_strike'] },

  { id: 'lava_crab', name: 'Lavakrabbe', icon: '🦀', type: 'fire', rarity: 'common', image: '/assets/monsters/lava_crab.jpg', baseStats: { hp: 50, atk: 11, def: 14 }, moves: ['tackle', 'fire_breath'] },
  { id: 'sand_scorp', name: 'Wüstenskorpion', icon: '🦂', type: 'earth', rarity: 'common', image: '/assets/monsters/sand_scorp.jpg', baseStats: { hp: 45, atk: 16, def: 9 }, moves: ['bite', 'leaf_blade'] },
  { id: 'mist_jelly', name: 'Nebelqualle', icon: '🪼', type: 'water', rarity: 'common', image: '/assets/monsters/mist_jelly.jpg', baseStats: { hp: 70, atk: 7, def: 7 }, moves: ['water_jet', 'spark'] },
  { id: 'iron_boar', name: 'Eiseneber', icon: '🐗', type: 'neutral', rarity: 'common', image: '/assets/monsters/iron_boar.jpg', baseStats: { hp: 65, atk: 13, def: 13 }, moves: ['tackle', 'squat_slam'] },
  { id: 'spirit_cat', name: 'Geisterkatze', icon: '🐈‍⬛', type: 'dark', rarity: 'rare', image: '/assets/monsters/spirit_cat.jpg', baseStats: { hp: 50, atk: 28, def: 10 }, moves: ['bite', 'spark'] },
  { id: 'gold_bug', name: 'Goldkäfer', icon: '🪲', type: 'light', rarity: 'rare', image: '/assets/monsters/gold_bug.jpg', baseStats: { hp: 55, atk: 18, def: 25 }, moves: ['tackle', 'holy_light'] },
  { id: 'cloud_dragon', name: 'Wolkenflieger', icon: '🐲', type: 'air', rarity: 'epic', image: '/assets/monsters/cloud_dragon.jpg', baseStats: { hp: 110, atk: 40, def: 20 }, moves: ['spark', 'sprint_strike', 'fire_breath'] },
  { id: 'gaia_titan', name: 'Gaia-Titan', icon: '🌍', type: 'earth', rarity: 'legendary', image: '/assets/monsters/gaia_titan.jpg', baseStats: { hp: 200, atk: 45, def: 45 }, moves: ['squat_slam', 'leaf_blade', 'pushup_punch'] },
  { id: 'nebula_ray', name: 'Nebularochen', icon: '🛰️', type: 'light', rarity: 'legendary', image: '/assets/monsters/nebula_ray.jpg', baseStats: { hp: 150, atk: 60, def: 30 }, moves: ['holy_light', 'spark', 'sprint_strike'] },
  { id: 'inferno_reaper', name: 'Infernoreaper', icon: '🔥', type: 'fire', rarity: 'legendary', image: '/assets/monsters/inferno_reaper.jpg', baseStats: { hp: 160, atk: 55, def: 35 }, moves: ['fire_breath', 'pushup_punch', 'bite'] },
  { id: 'abyss_serpent', name: 'Abyssschlange', icon: '🐍', type: 'dark', rarity: 'legendary', image: '/assets/monsters/abyss_serpent.jpg', baseStats: { hp: 170, atk: 50, def: 40 }, moves: ['bite', 'water_jet', 'sprint_strike'] }
]

export const MONSTER_MAP = Object.fromEntries(MONSTERS.map(m => [m.id, m]))

export const TYPE_CHART = {
  fire: { strong: 'earth', weak: 'water' },
  water: { strong: 'fire', weak: 'air' },
  earth: { strong: 'air', weak: 'fire' },
  air: { strong: 'water', weak: 'earth' },
  light: { strong: 'dark', weak: 'neutral' },
  dark: { strong: 'light', weak: 'neutral' },
  neutral: { strong: '', weak: '' }
}

export function calculateMonsterXpForLevel(level) {
  return level * 50; // Einfache Skalierung: 50, 100, 150...
}

export function getMonsterImageUrl(monster) {
  const id = monster.monster_id || monster.id;
  const meta = MONSTER_MAP[id];
  if (meta && meta.image) return meta.image;
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${id}&backgroundColor=10121a`;
}
