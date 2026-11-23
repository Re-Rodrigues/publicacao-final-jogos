export const PHASES = [
  {
    name: "Fase 1",
    waves: [
      { melee: 3 },
      { melee: 4 },
      { melee: 4, ranged: 1 }
    ]
  },
  {
    name: "Fase 2",
    waves: [
      { melee: 3, ranged: 1 },
      { melee: 4, ranged: 1 },
      { melee: 4, ranged: 2 }
    ],
    boss: {
      name: "Bruto da Caverna",
      health: 170,
      size: 60,
      speed: 46,
      attack: "charge",
      attackInterval: 2.8,
      visual: "big_demon"
    }
  },
  {
    name: "Fase 3",
    waves: [
      { melee: 4, ranged: 1 },
      { melee: 4, ranged: 2 },
      { melee: 5, ranged: 1, large: 1 }
    ]
  },
  {
    name: "Fase 4",
    waves: [
      { melee: 4, ranged: 2 },
      { melee: 5, ranged: 2 },
      { melee: 5, ranged: 2, large: 1 }
    ],
    boss: {
      name: "Lorde das Setas",
      health: 190,
      size: 58,
      speed: 50,
      attack: "tripleShot",
      attackInterval: 2.4,
      visual: "orc_shaman"
    }
  },
  {
    name: "Fase 5",
    waves: [
      { melee: 5, ranged: 2 },
      { melee: 5, ranged: 2, large: 1 },
      { melee: 6, ranged: 2, large: 1 }
    ]
  },
  {
    name: "Fase 6",
    waves: [
      { melee: 5, ranged: 2, large: 1 },
      { melee: 6, ranged: 2, large: 1 },
      { melee: 6, ranged: 3, large: 1 }
    ],
    boss: {
      name: "Golem Carmesim",
      health: 220,
      size: 62,
      speed: 44,
      attack: "radialBurst",
      attackInterval: 3,
      visual: "ogre"
    }
  },
  {
    name: "Fase 7",
    waves: [
      { melee: 6, ranged: 2, large: 1 },
      { melee: 6, ranged: 3, large: 1 },
      { melee: 7, ranged: 3, large: 1 }
    ]
  },
  {
    name: "Fase 8",
    waves: [
      { melee: 6, ranged: 3, large: 1 },
      { melee: 7, ranged: 3, large: 1 },
      { melee: 7, ranged: 3, large: 2 }
    ],
    boss: {
      name: "Titã das Chamas",
      health: 250,
      size: 64,
      speed: 44,
      attack: "crossfire",
      attackInterval: 2.8,
      visual: "pumpkin_dude"
    }
  },
  {
    name: "Fase 9",
    waves: [
      { melee: 6, ranged: 3, large: 1 },
      { melee: 7, ranged: 3, large: 1 },
      { melee: 7, ranged: 4, large: 2 }
    ],
    boss: {
      name: "Rei da Masmorra",
      health: 290,
      size: 66,
      speed: 42,
      attack: "fanVolley",
      attackInterval: 2.7,
      visual: "wogol"
    }
  },
  {
    name: "Fase 10",
    waves: [
      { melee: 7, ranged: 3, large: 1 },
      { melee: 7, ranged: 4, large: 1 },
      { melee: 8, ranged: 4, large: 2 }
    ],
    boss: {
      name: "Guardião Final",
      health: 340,
      size: 70,
      speed: 44,
      attack: "finalSequence",
      attackInterval: 2.5,
      visual: "big_zombie"
    }
  }
];
