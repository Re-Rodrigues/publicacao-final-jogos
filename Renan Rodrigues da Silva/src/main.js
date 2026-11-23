import { Application, Assets, Rectangle, Texture } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./config.js";
import { ENEMY_ANIMATION_NAMES } from "./config/enemyVisuals.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { GameScene } from "./scenes/GameScene.js";

const app = new Application();
const [
  dungeonTexture,
  enemyTexture,
  paperUiTexture,
  menuBackgroundTexture,
  playerTexture1,
  playerTexture2,
  playerTexture3,
  playerTexture4,
  playerFlipTexture1,
  playerFlipTexture2,
  playerFlipTexture3,
  playerFlipTexture4
] = await Promise.all([
  Assets.load("/assets/backgrounds/Masmorra.png"),
  Assets.load("/assets/atlases/DungeonTilesetII.png"),
  Assets.load("/assets/ui/PaperUI.png"),
  Assets.load("/assets/backgrounds/menu-background.png"),
  Assets.load("/assets/characters/player/priest1_v1_1.png"),
  Assets.load("/assets/characters/player/priest1_v1_2.png"),
  Assets.load("/assets/characters/player/priest1_v1_3.png"),
  Assets.load("/assets/characters/player/priest1_v1_4.png"),
  Assets.load("/assets/characters/player/priest1_v1_1_flip.png"),
  Assets.load("/assets/characters/player/priest1_v1_2_flip.png"),
  Assets.load("/assets/characters/player/priest1_v1_3_flip.png"),
  Assets.load("/assets/characters/player/priest1_v1_4_flip.png")
]);
const enemyAnimationSheets = await Promise.all(
  ENEMY_ANIMATION_NAMES.map((name) =>
    Assets.load(`/assets/enemies/animations/${name}.png`)
  )
);
enemyTexture.source.scaleMode = "nearest";
menuBackgroundTexture.source.scaleMode = "nearest";
const playerTextures = [playerTexture1, playerTexture2, playerTexture3, playerTexture4];
const playerFlipTextures = [
  playerFlipTexture1,
  playerFlipTexture2,
  playerFlipTexture3,
  playerFlipTexture4
];
for (const texture of [...playerTextures, ...playerFlipTextures]) {
  texture.source.scaleMode = "nearest";
}
const enemyAnimations = Object.fromEntries(
  enemyAnimationSheets.map((sheet, index) => {
    sheet.source.scaleMode = "nearest";
    const frameWidth = sheet.width / 4;
    const frameHeight = sheet.height / 2;
    const createFrames = (y) => Array.from({ length: 4 }, (_, frame) =>
      new Texture({
        source: sheet.source,
        frame: new Rectangle(frame * frameWidth, y, frameWidth, frameHeight)
      })
    );

    return [
      ENEMY_ANIMATION_NAMES[index],
      { idle: createFrames(0), run: createFrames(frameHeight) }
    ];
  })
);

const [
  heroiPortrait,
  aldricPortrait,
  grukPortrait,
  araknePortrait
] = await Promise.all([
  Assets.load("/assets/npc/Heroi.png"),
  Assets.load("/assets/npc/Aldric.png"),
  Assets.load("/assets/npc/Gruk.png"),
  Assets.load("/assets/npc/Arakne.png")
]);

const npcTextures = {
  Heroi: heroiPortrait,
  Aldric: aldricPortrait,
  Gruk: grukPortrait,
  Arakne: araknePortrait,
  Guardiao: enemyAnimations.big_zombie.idle[0]
};

await app.init({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  antialias: false
});

const gameElement = document.querySelector("#game");
gameElement.appendChild(app.canvas);
app.canvas.style.display = "block";
app.canvas.style.width = "min(100vw, 800px)";
app.canvas.style.height = "auto";
app.canvas.style.margin = "0 auto";
app.canvas.style.imageRendering = "pixelated";

const soundtrack = new Audio("/assets/audio/dungeon-rush-soundtrack.mp3");
soundtrack.loop = true;
soundtrack.volume = 0.35;

const menuMusic = new Audio("/assets/audio/song18.mp3");
menuMusic.loop = true;
menuMusic.volume = 0.08;

let currentScene = null;
let isMenuActive = false;

function changeScene(scene) {
  if (currentScene) {
    currentScene.destroy();
  }

  currentScene = scene;
  app.stage.removeChildren();
  app.stage.addChild(currentScene.container);
}

function playSoundtrack(restart = false) {
  if (restart) {
    soundtrack.currentTime = 0;
  }
  soundtrack.play().catch((error) => {
    console.error("Não foi possível reproduzir a trilha sonora.", error);
  });
}

function playMenuMusic(restart = false) {
  if (restart) {
    menuMusic.currentTime = 0;
  }
  menuMusic.play().catch((error) => {
    console.error("Não foi possível reproduzir a música do menu.", error);
  });
}

function stopMenuMusic() {
  menuMusic.pause();
  menuMusic.currentTime = 0;
}

function stopGameSoundtrack() {
  soundtrack.pause();
  soundtrack.currentTime = 0;
}

function unlockMenuMusic() {
  if (!isMenuActive || !menuMusic.paused) {
    return;
  }
  playMenuMusic();
}

function openMenu() {
  isMenuActive = true;
  stopGameSoundtrack();
  stopMenuMusic();
  changeScene(new MenuScene({
    onPlay: () => openGame(),
    paperUiTexture,
    menuBackgroundTexture
  }));
  playMenuMusic(true);
  window.addEventListener("pointerdown", unlockMenuMusic, { once: true });
  window.addEventListener("keydown", unlockMenuMusic, { once: true });
}

function openGame() {
  isMenuActive = false;
  window.removeEventListener("pointerdown", unlockMenuMusic);
  window.removeEventListener("keydown", unlockMenuMusic);
  stopMenuMusic();
  changeScene(new GameScene({
    onMenu: () => openMenu(),
    onRestart: () => openGame(),
    onPauseChange: (paused) => {
      if (paused) {
        soundtrack.pause();
      } else {
        playSoundtrack();
      }
    },
    isMuted: soundtrack.muted,
    onToggleMute: (muted) => {
      soundtrack.muted = muted;
    },
    playerTextures,
    playerFlipTextures,
    enemyAnimations,
    npcTextures,
    dungeonTexture,
    enemyTexture,
    paperUiTexture
  }));
  playSoundtrack(true);
}

app.ticker.add((ticker) => {
  if (currentScene) {
    currentScene.update(ticker.deltaTime / 60);
  }
});

openMenu();
