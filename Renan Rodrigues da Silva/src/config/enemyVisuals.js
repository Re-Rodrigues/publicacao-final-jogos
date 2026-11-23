export const ENEMY_VISUAL_VARIANTS = {
  melee: [
    "goblin",
    "chort",
    "imp",
    "skelet",
    "tiny_zombie",
    "orc_warrior",
    "masked_orc",
    "wogol",
    "lizard_m",
    "lizard_f"
  ],
  ranged: [
    "wizzard_m",
    "wizzard_f",
    "orc_shaman",
    "angel"
  ],
  large: [
    "ogre",
    "big_demon",
    "big_zombie",
    "pumpkin_dude"
  ]
};

export const ENEMY_ANIMATION_NAMES = [
  ...new Set(Object.values(ENEMY_VISUAL_VARIANTS).flat())
];
