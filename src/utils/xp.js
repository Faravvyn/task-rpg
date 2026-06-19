export function xpForLevel(level) { return level * 100 }
export function totalXpForLevel(level) {
  let total = 0; for (let i=1;i<level;i++) total+=xpForLevel(i); return total
}
export function calculateLevel(totalXp) {
  let level=1, remainingXp=totalXp
  while(remainingXp>=xpForLevel(level)){remainingXp-=xpForLevel(level);level++}
  return{level,currentXpInLevel:remainingXp,xpNeededForNextLevel:xpForLevel(level),
    progressPercent:(remainingXp/xpForLevel(level))*100}
}
export function getXpReward(difficulty) {
  return{leicht:10,mittel:25,schwer:50,episch:100}[difficulty]||10
}
export function getGoldReward(difficulty) {
  return{leicht:2,mittel:8,schwer:20,episch:50}[difficulty]||2
}

// Skill-Tree Definitionen
export const SKILL_TREE = {
  master_crafter: { name: 'Meister-Schmied', desc: 'Schmieden kostet 20% weniger XP.', icon: '⚒️', cost: 1, reqLevel: 5 },
  night_owl: { name: 'Nachtwache', desc: 'Aufgaben nach 22 Uhr geben +25% Gold.', icon: '🦉', cost: 1, reqLevel: 8 },
  dungeon_scout: { name: 'Dungeon-Pfadfinder', desc: 'Chance auf doppelte Dungeon-Fortschritt.', icon: '🗺️', cost: 1, reqLevel: 3 },
  treasure_hunter: { name: 'Schatzsucher', desc: 'Erhöht Gold von allen Quellen um 15%.', icon: '💰', cost: 1, reqLevel: 10 },
  frenzy_master: { name: 'Rausch-Meister', desc: 'Der Frenzy-Modus hält doppelt so lange.', icon: '🔥', cost: 2, reqLevel: 12 }
}

export function getStreakMultiplier(streakDays) {
  return 1+Math.min(streakDays*10,50)/100
}
export function calculateFinalXp(baseXp,streakDays=0,equippedArtifacts=[]) {
  let xp=Math.round(baseXp*getStreakMultiplier(streakDays))
  if(equippedArtifacts?.length>0){
    for(const ca of equippedArtifacts){
      const art=ca.artifacts; if(!art) continue
      if(art.effect_type==='xp_boost'&&art.effect_value?.percent)
        xp=Math.round(xp*(1+art.effect_value.percent/100))
      if(art.effect_type==='multiplier'&&art.effect_value?.streak_multiplier)
        xp=Math.round(xp*art.effect_value.streak_multiplier)
    }
  }
  return xp
}
export const categoryStatMap={haushalt:'ausdauer',gesundheit:'ausdauer',
  lernen:'intelligenz',sport:'staerke',arbeit:'willenskraft'}
export const classDefinitions={
  krieger:{name:'Krieger',icon:'⚔️',description:'Stark und ausdauernd',
    baseStats:{staerke:5,ausdauer:4,intelligenz:2,willenskraft:3,glueck:1}},
  magier:{name:'Magier',icon:'🧙',description:'Weise und willenstark',
    baseStats:{staerke:2,ausdauer:3,intelligenz:5,willenskraft:4,glueck:2}},
  schurke:{name:'Schurke',icon:'🗡️',description:'Flink und glücklich',
    baseStats:{staerke:3,ausdauer:3,intelligenz:3,willenskraft:2,glueck:5}},
  heiler:{name:'Heiler',icon:'✨',description:'Einfühlsam und willenstark',
    baseStats:{staerke:2,ausdauer:3,intelligenz:4,willenskraft:5,glueck:2}}
}
export const avatars=['🧙‍♂️','⚔️','🛡️','🏹','🎭','🐉','🗡️','👑']
export const statNames={staerke:'Stärke',ausdauer:'Ausdauer',intelligenz:'Intelligenz',willenskraft:'Willenskraft',glueck:'Glück'}
export const statColors={staerke:'bg-red-500',ausdauer:'bg-green-500',intelligenz:'bg-blue-500',willenskraft:'bg-purple-500',glueck:'bg-yellow-400'}
