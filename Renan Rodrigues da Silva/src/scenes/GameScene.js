import {
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  TextStyle,
  Texture
} from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, ARENA_INSET } from "../config.js";
import { Player } from "../entities/Player.js";
import { Enemy } from "../entities/Enemy.js";
import { InputSystem } from "../systems/InputSystem.js";
import { HUD } from "../ui/HUD.js";
import { PHASES } from "../config/phases.js";
import { UPGRADES } from "../config/upgrades.js";
import { ENEMY_VISUAL_VARIANTS } from "../config/enemyVisuals.js";

const WAVE_BREAK_DURATION = 8;

export class GameScene {
  constructor({
    onMenu,
    onRestart,
    onPauseChange,
    isMuted = false,
    onToggleMute,
    dungeonTexture,
    enemyTexture,
    enemyAnimations,
    paperUiTexture,
    playerTextures,
    playerFlipTextures,
    npcTextures = {}
  }) {
    this.container = new Container();
    this.onMenu = onMenu;
    this.onRestart = onRestart;
    this.onPauseChange = onPauseChange ?? (() => {});
    this.onToggleMute = onToggleMute ?? (() => {});
    this.soundtrackMuted = isMuted;
    this.input = new InputSystem();
    this.started = false;
    this.paused = false;
    this.phaseIndex = 0;
    this.currentWave = 0;
    this.waveElapsed = 0;
    this.waveSpawnElapsed = 0;
    this.waveQueue = [];
    this.boss = null;
    this.upgradeOverlay = null;
    this.gameCompleted = false;
    this.gameOver = false;
    this.projectiles = [];
    this.playerProjectiles = [];
    this.projectileGraphics = new Graphics();
    this.damageNumbers = [];
    this.enemies = [];
    this.enemyDeathSound = new Audio("/assets/audio/impactPlank_medium_001.ogg");
    this.enemyDeathSound.volume = 0.55;
    this.enemyTexture = enemyTexture;
    this.enemyAnimations = enemyAnimations;
    this.lastEnemyVisuals = new Map();
    this.paperUiTexture = paperUiTexture;
    this.npcTextures = npcTextures;
    this.cheatSequence = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
    this.cheatSequenceIndex = 0;
    this.cheatActivated = false;
    this.cheatStatus = null;

    this.drawRoom(dungeonTexture);

    this.player = new Player(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      playerTextures,
      this.playerProjectiles,
      playerFlipTextures,
      () => this.soundtrackMuted
    );
    this.container.addChild(this.player.container);

    this.hud = new HUD(enemyTexture);
    this.hud.setPhase(`${PHASES[0].name} - Onda 1/3`);
    this.container.addChild(this.hud.container);
    this.container.addChild(this.projectileGraphics);

    this.createPauseButton();
    this.createMuteButton();
    this.createIntro();
  }

  createIntro() {
    this.intro = new Container();

    const shade = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: 0x100e17, alpha: 0.86 });
    this.intro.addChild(shade);

    const panel = new Container();
    panel.x = 70;
    panel.y = 90;
    panel.addChild(
      new Graphics()
        .roundRect(0, 0, 660, 420, 10)
        .fill(0x211c29)
        .roundRect(0, 0, 660, 420, 10)
        .stroke({ width: 3, color: 0xa1845d })
        .roundRect(10, 10, 640, 400, 7)
        .stroke({ width: 1, color: 0x756047 })
    );

    const chapter = new Text({
      text: "PRÓLOGO",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 14,
        fill: 0xc3a978,
        letterSpacing: 5
      })
    });
    chapter.anchor.set(0.5);
    chapter.x = 330;
    chapter.y = 52;
    panel.addChild(chapter);

    const title = new Text({
      text: "O CHAMADO DA MASMORRA",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 30,
        fontWeight: "bold",
        fill: 0xffe6a8
      })
    });
    title.anchor.set(0.5);
    title.x = 330;
    title.y = 98;
    panel.addChild(title);

    const story = new Text({
      text:
        "A vila vivia sob a luz das tochas, até que uma noite elas se apagaram. " +
        "Das profundezas da montanha, um sino antigo voltou a tocar.\n\n" +
        "Desde então, criaturas rondam os campos. Dizem que ninguém jamais " +
        "voltou da masmorra escondida sob a montanha.\n\n" +
        "Você cruza o portão para descobrir o que despertou. As pedras se " +
        "fecham atrás de você. Só resta descer.",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 17,
        fill: 0xe9dfcc,
        wordWrap: true,
        wordWrapWidth: 520,
        lineHeight: 24,
        align: "center"
      })
    });
    story.anchor.set(0.5);
    story.x = 330;
    story.y = 220;
    panel.addChild(story);

    const startButton = new Container();
    startButton.x = 190;
    startButton.y = 344;
    startButton.eventMode = "static";
    startButton.cursor = "pointer";

    const buttonBackground = new Graphics();
    const drawStartButton = (hovered) => {
      buttonBackground.clear()
        .roundRect(0, 3, 280, 48, 7)
        .fill(0x493522)
        .roundRect(0, 0, 280, 48, 7)
        .fill(hovered ? 0x718854 : 0x60764a)
        .roundRect(0, 0, 280, 48, 7)
        .stroke({ width: 2, color: 0xc3ca91 });
    };
    drawStartButton(false);
    startButton.addChild(buttonBackground);

    const startText = new Text({
      text: "ENTRAR NA MASMORRA",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 18,
        fontWeight: "bold",
        fill: 0xfff1cf,
        letterSpacing: 1
      })
    });
    startText.anchor.set(0.5);
    startText.x = 140;
    startText.y = 24;
    startButton.addChild(startText);
    startButton.on("pointerover", () => drawStartButton(true));
    startButton.on("pointerout", () => drawStartButton(false));
    startButton.on("pointertap", () => this.startIntro());
    panel.addChild(startButton);

    const hint = new Text({
      text: "ENTER ou ESPAÇO para continuar",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 12,
        fill: 0xb6afc6,
        letterSpacing: 1
      })
    });
    hint.anchor.set(0.5);
    hint.x = 330;
    hint.y = 401;
    panel.addChild(hint);

    this.intro.addChild(panel);

    this.container.addChild(this.intro);
  }

  startIntro() {
    if (this.started) {
      return;
    }

    this.started = true;
    this.container.removeChild(this.intro);
    this.intro.destroy({ children: true });
    this.startDialogue([
      { speaker: "Aldric", name: "Mestre Aldric", text: "Então você realmente decidiu ir?" },
      { speaker: "Heroi", name: "Herói", text: "Não podemos continuar esperando. As criaturas estão cada vez mais próximas da vila." },
      { speaker: "Aldric", name: "Mestre Aldric", text: "Aquela masmorra guarda poderes que você sequer consegue imaginar. A magia que existe lá dentro é antiga e extremamente perigosa." },
      { speaker: "Heroi", name: "Herói", text: "Passei anos estudando e treinando. Estou preparado." },
      { speaker: "Aldric", name: "Mestre Aldric", text: "Conhecimento e poder não são a mesma coisa, meu aprendiz. Não deixe que a magia daquela masmorra consuma você." },
      { speaker: "Heroi", name: "Herói", text: "Vou acabar com essa ameaça, mestre." },
      { speaker: "Aldric", name: "Mestre Aldric", text: "Então vá. E lembre-se: até a magia mais poderosa pode se tornar uma maldição nas mãos erradas." },
      { speaker: "Heroi", name: "Herói", text: "Voltarei quando tudo isso acabar." }
    ]);
  }

  drawRoom(dungeonTexture) {
    const background = new Sprite(dungeonTexture);
    background.width = GAME_WIDTH;
    background.height = GAME_HEIGHT;
    this.container.addChild(background);
  }

  updateCheatCode() {
    const cheatKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", "b", "a"];

    for (const key of cheatKeys) {
      if (!this.input.consumePressed(key)) {
        continue;
      }

      if (key === this.cheatSequence[this.cheatSequenceIndex]) {
        this.cheatSequenceIndex += 1;
        if (this.cheatSequenceIndex === this.cheatSequence.length) {
          this.activateDamageCheat();
          this.cheatSequenceIndex = 0;
        }
      } else {
        this.cheatSequenceIndex =
          key === this.cheatSequence[0] ? 1 : 0;
      }
    }
  }

  activateDamageCheat() {
    if (!this.cheatActivated) {
      this.player.damageMultiplier *= 500;
      this.cheatActivated = true;
    }

    if (this.cheatStatus) {
      this.container.removeChild(this.cheatStatus.container);
      this.cheatStatus.container.destroy({ children: true });
    }

    const container = new Container();
    container.x = GAME_WIDTH / 2;
    container.y = 60;

    container.addChild(
      new Graphics()
        .roundRect(-190, -18, 380, 44, 8)
        .fill({ color: 0x17141b, alpha: 0.94 })
        .roundRect(-190, -18, 380, 44, 8)
        .stroke({ width: 2, color: 0xffd166 })
    );

    const text = new Text({
      text: this.cheatActivated ? "CHEAT ATIVADO: DANO 500x" : "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 18,
        fontWeight: "bold",
        fill: 0xffd166,
        letterSpacing: 1
      })
    });
    text.anchor.set(0.5);
    text.y = 4;
    container.addChild(text);

    this.cheatStatus = { container, elapsed: 0, duration: 3 };
    this.container.addChild(container);
  }

  updateCheatStatus(deltaTime) {
    if (!this.cheatStatus) {
      return;
    }

    this.cheatStatus.elapsed += deltaTime;
    this.cheatStatus.container.alpha = this.cheatStatus.elapsed < 2.4
      ? 1
      : Math.max(0, 1 - (this.cheatStatus.elapsed - 2.4) / 0.6);

    if (this.cheatStatus.elapsed >= this.cheatStatus.duration) {
      this.container.removeChild(this.cheatStatus.container);
      this.cheatStatus.container.destroy({ children: true });
      this.cheatStatus = null;
    }
  }

  update(deltaTime) {
    this.updateCheatCode();
    this.updateCheatStatus(deltaTime);

    if (this.gameOver) {
      if (this.input.isDown("r") && this.input.consumePressed("r")) {
        this.onRestart();
      } else if (this.input.isDown("escape") && this.input.consumePressed("escape")) {
        this.onMenu();
      }
      return;
    }

    if (this.gameCompleted) {
      return;
    }

    if (this.dialogue) {
      this.updateDialogue(deltaTime);
      if (this.input.consumePressed(" ") || this.input.consumePressed("enter")) {
        this.advanceDialogue();
      }
      return;
    }

    if (this.upgradeOverlay) {
      if (this.input.consumePressed("1")) this.selectUpgrade(0);
      else if (this.input.consumePressed("2")) this.selectUpgrade(1);
      else if (this.input.consumePressed("3")) this.selectUpgrade(2);
      return;
    }

    if (!this.started) {
      const advanceWithEnter = this.input.consumePressed("enter");
      const advanceWithSpace = this.input.consumePressed(" ");
      if (advanceWithEnter || advanceWithSpace) {
        this.startIntro();
      }
      return;
    }

    if (this.input.consumePressed("escape") || this.input.consumePressed("p")) {
      this.togglePause();
    }

    if (this.paused) {
      return;
    }

    this.player.update(deltaTime, this.input);
    this.updateDamageNumbers(deltaTime);
    this.updateEnemies(deltaTime);
  }

  createPauseButton() {
    this.pauseButton = new Container();
    this.pauseButton.x = GAME_WIDTH - 54;
    this.pauseButton.y = 8;
    this.pauseButton.eventMode = "static";
    this.pauseButton.cursor = "pointer";

    const paperTexture = new Texture({
      source: this.paperUiTexture.source,
      frame: new Rectangle(8, 8, 88, 88)
    });
    const paper = new Sprite(paperTexture);
    paper.width = 42;
    paper.height = 42;
    this.pauseButton.addChild(paper);

    this.pauseButton.addChild(
      new Graphics()
        .roundRect(13, 12, 4, 17, 1)
        .fill(0x493522)
        .roundRect(23, 12, 4, 17, 1)
        .fill(0x493522)
    );

    this.pauseButton.on("pointerover", () => {
      this.pauseButton.scale.set(1.08);
    });
    this.pauseButton.on("pointerout", () => {
      this.pauseButton.scale.set(1);
    });
    this.pauseButton.on("pointertap", () => this.togglePause());
    this.container.addChild(this.pauseButton);
  }

  createMuteButton() {
    this.muteButton = new Container();
    this.muteButton.x = GAME_WIDTH - 102;
    this.muteButton.y = 8;
    this.muteButton.eventMode = "static";
    this.muteButton.cursor = "pointer";

    const paperTexture = new Texture({
      source: this.paperUiTexture.source,
      frame: new Rectangle(8, 8, 88, 88)
    });
    const paper = new Sprite(paperTexture);
    paper.width = 42;
    paper.height = 42;
    this.muteButton.addChild(paper);

    this.muteIcon = new Graphics();
    this.muteButton.addChild(this.muteIcon);
    this.drawMuteIcon();

    this.muteButton.on("pointerover", () => {
      this.muteButton.scale.set(1.08);
    });
    this.muteButton.on("pointerout", () => {
      this.muteButton.scale.set(1);
    });
    this.muteButton.on("pointertap", () => {
      this.soundtrackMuted = !this.soundtrackMuted;
      this.onToggleMute(this.soundtrackMuted);
      this.drawMuteIcon();
    });
    this.container.addChild(this.muteButton);
  }

  drawMuteIcon() {
    this.muteIcon.clear()
      .rect(10, 16, 6, 10)
      .fill(0x493522)
      .moveTo(16, 16)
      .lineTo(25, 10)
      .lineTo(25, 32)
      .lineTo(16, 26)
      .closePath()
      .fill(0x493522);

    if (this.soundtrackMuted) {
      this.muteIcon
        .moveTo(28, 17)
        .lineTo(34, 25)
        .moveTo(34, 17)
        .lineTo(28, 25)
        .stroke({ width: 2, color: 0x9b443c });
      return;
    }

    this.muteIcon
      .moveTo(28, 17)
      .lineTo(31, 21)
      .lineTo(28, 25)
      .stroke({ width: 2, color: 0x493522 });
  }

  togglePause() {
    if (this.upgradeOverlay || this.gameCompleted || this.gameOver) {
      return;
    }

    this.paused = !this.paused;
    this.onPauseChange(this.paused);

    if (this.paused) {
      this.createPauseOverlay();
      return;
    }

    this.pauseOverlay.destroy({ children: true });
    this.pauseOverlay = null;
  }

  createPauseOverlay() {
    this.pauseOverlay = new Container();

    const shade = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: 0x100d17, alpha: 0.76 });
    shade.eventMode = "static";
    this.pauseOverlay.addChild(shade);

    const panel = new Container();
    panel.x = (GAME_WIDTH - 448) / 2;
    panel.y = (GAME_HEIGHT - 396) / 2;

    panel.addChild(
      new Graphics()
        .roundRect(5, 8, 448, 396, 12)
        .fill({ color: 0x09080d, alpha: 0.72 })
    );

    const paper = new Sprite(new Texture({
      source: this.paperUiTexture.source,
      frame: new Rectangle(8, 144, 112, 84)
    }));
    paper.width = 448;
    paper.height = 396;
    panel.addChild(paper);

    panel.addChild(
      new Graphics()
        .roundRect(8, 8, 432, 380, 8)
        .stroke({ width: 2, color: 0xa1845d, alpha: 0.65 })
    );

    const title = new Text({
      text: "PAUSADO",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 38,
        fontWeight: "bold",
        fill: 0x493522,
        letterSpacing: 3
      })
    });
    title.anchor.set(0.5);
    title.x = 224;
    title.y = 58;
    panel.addChild(title);

    const subtitle = new Text({
      text: "A masmorra espera por você",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 18,
        fill: 0x756047
      })
    });
    subtitle.anchor.set(0.5);
    subtitle.x = 224;
    subtitle.y = 100;
    panel.addChild(subtitle);

    panel.addChild(
      new Graphics()
        .moveTo(100, 127)
        .lineTo(348, 127)
        .stroke({ width: 2, color: 0xa1845d, alpha: 0.55 })
    );

    const createPauseActionButton = (label, y, palette, action) => {
      const button = new Container();
      button.x = 98;
      button.y = y;
      button.eventMode = "static";
      button.cursor = "pointer";

      const buttonBackground = new Graphics();
      const drawButton = (hovered) => {
        buttonBackground.clear()
          .roundRect(0, 4, 252, 50, 8)
          .fill(0x493522)
          .roundRect(0, 0, 252, 50, 8)
          .fill(hovered ? palette.hover : palette.base)
          .roundRect(0, 0, 252, 50, 8)
          .stroke({ width: 3, color: palette.border })
          .roundRect(6, 6, 240, 38, 5)
          .stroke({ width: 1, color: palette.highlight, alpha: 0.7 });
      };
      drawButton(false);
      button.addChild(buttonBackground);

      const text = new Text({
        text: label,
        style: new TextStyle({
          fontFamily: "Georgia",
          fontSize: 18,
          fontWeight: "bold",
          fill: 0xfff1cf,
          letterSpacing: 1
        })
      });
      text.anchor.set(0.5);
      text.x = 126;
      text.y = 25;
      button.addChild(text);

      button.on("pointerover", () => drawButton(true));
      button.on("pointerout", () => drawButton(false));
      button.on("pointertap", action);
      panel.addChild(button);
    };

    createPauseActionButton(
      "VOLTAR A JOGAR",
      144,
      { base: 0x60764a, hover: 0x718854, border: 0x465338, highlight: 0xc3ca91 },
      () => this.togglePause()
    );
    createPauseActionButton(
      "REINICIAR JOGO",
      203,
      { base: 0x8b7044, hover: 0xa18450, border: 0x6d5635, highlight: 0xd7c18a },
      this.onRestart
    );
    createPauseActionButton(
      "VOLTAR AO MENU",
      262,
      { base: 0x925941, hover: 0xa96a4d, border: 0x744634, highlight: 0xd7b08a },
      this.onMenu
    );

    const hint = new Text({
      text: "ESC ou P para continuar",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 15,
        fill: 0x756047
      })
    });
    hint.anchor.set(0.5);
    hint.x = 224;
    hint.y = 350;
    panel.addChild(hint);

    this.pauseOverlay.addChild(panel);
    this.container.addChild(this.pauseOverlay);
  }

  playEnemyDeathSound() {
    if (this.soundtrackMuted) {
      return;
    }

    this.enemyDeathSound.currentTime = 0;
    this.enemyDeathSound.play().catch((error) => {
      console.error("Não foi possível reproduzir o som de morte.", error);
    });
  }

  updateEnemies(deltaTime) {
    this.waveElapsed += deltaTime;
    this.waveSpawnElapsed += deltaTime;

    if (this.currentWave < 3 && this.waveQueue.length === 0 &&
        this.enemies.length === 0 &&
        this.waveElapsed >= (this.currentWave === 0 ? 1 : WAVE_BREAK_DURATION)) {
      this.startWave();
      this.waveElapsed = 0;
    }

    if (this.waveQueue.length > 0 && this.waveSpawnElapsed >= 0.45) {
      this.waveSpawnElapsed = 0;
      this.spawnEnemy(this.waveQueue.shift());
    }

    for (const enemy of this.enemies) {
      const previousHealth = this.player.health;
      enemy.update(deltaTime, this.player);
      if (this.player.health !== previousHealth) {
        this.updateHudHealth();
        this.spawnDamageNumber(
          `-${this.formatDamage(previousHealth - this.player.health)}`,
          this.player.container.x,
          this.player.container.y - 20,
          0xff7777
        );
      }

    }

    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];
      if (enemy.dead) {
        this.playEnemyDeathSound();
        enemy.destroy();
        this.enemies.splice(index, 1);
      }
    }

    this.updateProjectiles(deltaTime);
    if (this.player.health <= 0) {
      this.createGameOverOverlay();
      return;
    }
    this.checkBossAndPhase();
  }

  startWave() {
    const phase = PHASES[this.phaseIndex];
    const wave = phase.waves[this.currentWave];
    for (let count = 0; count < (wave.melee ?? 0); count += 1) {
      this.waveQueue.push("melee");
    }
    for (let count = 0; count < (wave.ranged ?? 0); count += 1) {
      this.waveQueue.push("ranged");
    }
    for (let count = 0; count < (wave.large ?? 0); count += 1) {
      this.waveQueue.push("large");
    }

    this.currentWave += 1;
    this.waveSpawnElapsed = 0;
    this.hud.setPhase(`${phase.name} - Onda ${this.currentWave}/3`);
  }

  spawnEnemy(type) {
    const size = type === "large" ? 40 : type === "boss" ? 64 : 24;
    const halfSize = size / 2;
    const minX = ARENA_INSET + halfSize;
    const maxX = GAME_WIDTH - ARENA_INSET - halfSize;
    const minY = ARENA_INSET + halfSize;
    const maxY = GAME_HEIGHT - ARENA_INSET - halfSize;
    const side = Math.floor(Math.random() * 4);
    let x;
    let y;

    if (side === 0) {
      x = minX + Math.random() * (maxX - minX);
      y = minY;
    } else if (side === 1) {
      x = maxX;
      y = minY + Math.random() * (maxY - minY);
    } else if (side === 2) {
      x = minX + Math.random() * (maxX - minX);
      y = maxY;
    } else {
      x = minX;
      y = minY + Math.random() * (maxY - minY);
    }

    const variants = ENEMY_VISUAL_VARIANTS[type];
    const previousVisual = this.lastEnemyVisuals.get(type);
    const availableVisuals = variants.filter((visual) => visual !== previousVisual);
    const visual = availableVisuals[Math.floor(Math.random() * availableVisuals.length)];
    this.lastEnemyVisuals.set(type, visual);

    const enemy = new Enemy(x, y, type, {
      animationFrames: this.enemyAnimations[visual],
      enemyTexture: this.enemyTexture,
      projectiles: this.projectiles
    });
    this.enemies.push(enemy);
    this.container.addChild(enemy.container);
  }

  spawnBoss() {
    const phase = PHASES[this.phaseIndex];
    this.projectiles.length = 0;
    this.playerProjectiles.length = 0;
    this.projectileGraphics.clear();
    this.player.container.x = GAME_WIDTH / 2;
    this.player.container.y = GAME_HEIGHT - 96;

    const boss = new Enemy(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      "boss",
      {
        health: phase.boss.health,
        size: phase.boss.size,
        speed: phase.boss.speed,
        bossAttack: phase.boss.attack,
        attackInterval: phase.boss.attackInterval,
        animationFrames: this.enemyAnimations[phase.boss.visual],
        enemyTexture: this.enemyTexture,
        projectiles: this.projectiles
      }
    );
    boss.name = phase.boss.name;
    this.boss = boss;
    this.enemies.push(boss);
    this.container.addChild(boss.container);
    this.hud.setPhase(`${phase.name} - Boss: ${boss.name}`);

    if (this.phaseIndex === 9) {
      this.startDialogue([
        { speaker: "Gruk", name: "Gruk", text: "Então é isso... chegamos ao fim." },
        { speaker: "Heroi", name: "Herói", text: "Você não precisa continuar comigo, Gruk." },
        { speaker: "Gruk", name: "Gruk", text: "E perder a chance de ver aquele desgraçado cair? Nem pensar!" },
        { speaker: "Heroi", name: "Herói", text: "Depois de tudo que passamos, acho que você merece voltar para casa." },
        { speaker: "Gruk", name: "Gruk", text: "Casa? HA! Talvez eu finalmente possa ter uma vida normal depois disso." },
        { speaker: "Gruk", name: "Gruk", text: "Vá lá, maguinho. Acabe com ele por todos nós." },
        { speaker: "Heroi", name: "Herói", text: "Pode deixar. Isso termina agora." },
        { speaker: "Guardiao", name: "Guardião Final", text: "Mais um mortal... buscando o poder que não compreende." },
        { speaker: "Heroi", name: "Herói", text: "Seu domínio sobre esta masmorra termina hoje." },
        { speaker: "Guardiao", name: "Guardião Final", text: "Você sente essa energia, não sente?" },
        { speaker: "Heroi", name: "Herói", text: "Sinto apenas a corrupção que você espalhou por este lugar." },
        { speaker: "Guardiao", name: "Guardião Final", text: "A fonte me pertence! Eu sou o coração desta masmorra!" },
        { speaker: "Heroi", name: "Herói", text: "Você deveria protegê-la, não destruir tudo ao seu redor." },
        { speaker: "Guardiao", name: "Guardião Final", text: "SILÊNCIO! Você não tomará de mim aquilo que conquistei!" }
      ]);
    }
  }

  updateProjectiles(deltaTime) {
    this.projectileGraphics.clear();

    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      projectile.x += projectile.dx * projectile.speed * deltaTime;
      projectile.y += projectile.dy * projectile.speed * deltaTime;

      this.projectileGraphics
        .circle(projectile.x, projectile.y, projectile.size)
        .fill(projectile.color ?? 0xe8d38a);

      const dx = projectile.x - this.player.container.x;
      const dy = projectile.y - this.player.container.y;
      if (Math.hypot(dx, dy) <= projectile.size + 12) {
        const previousHealth = this.player.health;
        if (this.player.takeDamage(projectile.damage)) {
          this.updateHudHealth();
          this.spawnDamageNumber(
            `-${this.formatDamage(previousHealth - this.player.health)}`,
            this.player.container.x,
            this.player.container.y - 20,
            0xff7777
          );
        }
        this.projectiles.splice(index, 1);
        continue;
      }

      if (projectile.x < ARENA_INSET || projectile.x > GAME_WIDTH - ARENA_INSET ||
          projectile.y < ARENA_INSET || projectile.y > GAME_HEIGHT - ARENA_INSET) {
        this.projectiles.splice(index, 1);
      }
    }

    for (let index = this.playerProjectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.playerProjectiles[index];
      projectile.x += projectile.dx * projectile.speed * deltaTime;
      projectile.y += projectile.dy * projectile.speed * deltaTime;

      this.projectileGraphics
        .circle(projectile.x, projectile.y, projectile.size + 3)
        .fill({ color: 0xb47cff, alpha: 0.35 })
        .circle(projectile.x, projectile.y, projectile.size)
        .fill(projectile.color)
        .circle(projectile.x, projectile.y, 2)
        .fill(0xffffff);

      let hitEnemy = false;
      for (const enemy of this.enemies) {
        if (enemy.dead) {
          continue;
        }

        const hitbox = enemy.getHitbox();
        if (projectile.x + projectile.size < hitbox.x ||
            projectile.x - projectile.size > hitbox.x + hitbox.width ||
            projectile.y + projectile.size < hitbox.y ||
            projectile.y - projectile.size > hitbox.y + hitbox.height) {
          continue;
        }

        enemy.takeDamage(projectile.damage);
        this.spawnDamageNumber(
          projectile.critical
            ? `CRÍTICO ${this.formatDamage(projectile.damage)}`
            : this.formatDamage(projectile.damage),
          enemy.container.x,
          enemy.container.y - enemy.size / 2,
          projectile.critical ? 0xffd166 : 0xe2c8ff
        );
        if (enemy.dead) {
          this.player.onEnemyDefeated();
          this.updateHudHealth();
        }
        hitEnemy = true;
        break;
      }

      if (hitEnemy ||
          projectile.x < ARENA_INSET || projectile.x > GAME_WIDTH - ARENA_INSET ||
          projectile.y < ARENA_INSET || projectile.y > GAME_HEIGHT - ARENA_INSET) {
        this.playerProjectiles.splice(index, 1);
      }
    }
  }

  checkBossAndPhase() {
    if (this.gameCompleted || this.gameOver || this.upgradeOverlay) {
      return;
    }

    if (this.currentWave < 3 || this.waveQueue.length > 0 || this.enemies.length > 0) {
      return;
    }

    const phase = PHASES[this.phaseIndex];
    if (!phase.boss) {
      this.finishPhase();
      return;
    }

    if (!this.boss) {
      this.spawnBoss();
      return;
    }

    if (this.boss.dead) {
      this.playEnemyDeathSound();
      this.container.removeChild(this.boss.container);
      this.boss.destroy();
      this.boss = null;
      this.projectiles.length = 0;
      this.playerProjectiles.length = 0;
      this.projectileGraphics.clear();
      this.finishPhase(true);
    }
  }

  finishPhase(bossDefeated = false) {
    this.projectiles.length = 0;
    this.playerProjectiles.length = 0;
    this.projectileGraphics.clear();

    const dialogue = this.getPhaseCompletionDialogue(bossDefeated);
    if (dialogue) {
      this.startDialogue(dialogue, () => this.finishPhaseWithoutDialogue());
      return;
    }

    this.finishPhaseWithoutDialogue();
  }

  finishPhaseWithoutDialogue() {
    if (this.phaseIndex < PHASES.length - 1) {
      this.createUpgradeSelection();
      return;
    }

    this.gameCompleted = true;
    this.paused = true;
    this.hud.setPhase("Todas as fases concluídas!");
    this.createCompletionOverlay();
  }

  getPhaseCompletionDialogue(bossDefeated) {
    const dialogues = {
      0: [
        { speaker: "Gruk", name: "Gruk", text: "Ei! Humano! Espere!" },
        { speaker: "Heroi", name: "Herói", text: "Um orc?!", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Calma, calma! Não quero lutar com você." },
        { speaker: "Heroi", name: "Herói", text: "O que faz aqui?", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Vivo neste buraco há muitos anos. E posso dizer uma coisa... essa masmorra está cada vez pior." },
        { speaker: "Heroi", name: "Herói", text: "Pior? Pensei que monstros gostassem de viver aqui.", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Gostavam! Mas desde que o Guardião Final tomou o controle, tudo mudou." },
        { speaker: "Heroi", name: "Herói", text: "Então você também quer acabar com ele?", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Eu? Enfrentar aquela coisa? HA! Não sou tão maluco assim." },
        { speaker: "Gruk", name: "Gruk", text: "Mas posso ajudar você. Conheço alguns caminhos e talvez consiga encontrar coisas úteis pelo caminho." },
        { speaker: "Heroi", name: "Herói", text: "Por que deveria confiar em você?", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Porque, maguinho, parece que somos os únicos dois aqui que querem ver este lugar destruído!" }
      ],
      1: [
        { speaker: "Gruk", name: "Gruk", text: "Pelas pedras da montanha! Você realmente derrotou o Bruto!" },
        { speaker: "Heroi", name: "Herói", text: "Ele era muito mais forte do que parecia.", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Aquele grandalhão costumava proteger esta caverna. Era meio estúpido, mas tinha um bom coração." },
        { speaker: "Heroi", name: "Herói", text: "Então por que me atacou?", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "A corrupção do Guardião. Ela transforma até os mais pacíficos em criaturas violentas." },
        { speaker: "Heroi", name: "Herói", text: "Então todos aqui podem estar sofrendo com isso...", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Exatamente. Continue seguindo. Quanto mais fundo você chegar, mais forte será a influência dele." }
      ],
      2: [
        { speaker: "Arakne", name: "Arakne", text: "Ora, ora... um humano passeando pelas minhas teias." },
        { speaker: "Heroi", name: "Herói", text: "Quem está aí?!", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Que falta de educação! Não é assim que se cumprimenta uma dama." },
        { speaker: "Heroi", name: "Herói", text: "Uma aranha falante?!", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "E você é um humano que fala sozinho. Estamos quites." },
        { speaker: "Heroi", name: "Herói", text: "Você vai me atacar?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Se quisesse, já teria feito isso. Não sou muito fã dos servos daquele monstro." },
        { speaker: "Heroi", name: "Herói", text: "Você conhece o Guardião Final?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Conheço o suficiente para saber que ninguém deveria chegar perto dele." },
        { speaker: "Heroi", name: "Herói", text: "Então por que ainda vive aqui?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Digamos que nem todos temos o luxo de escolher onde morar." },
        { speaker: "Arakne", name: "Arakne", text: "Mas você parece determinado demais para desistir. Talvez possamos fazer um acordo..." }
      ],
      3: [
        { speaker: "Arakne", name: "Arakne", text: "Impressionante! O famoso Lorde das Setas finalmente caiu." },
        { speaker: "Heroi", name: "Herói", text: "Você conhece esse também?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Ele já foi um grande arqueiro. Protegia as passagens superiores da masmorra." },
        { speaker: "Heroi", name: "Herói", text: "Mais uma criatura corrompida...", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Está começando a entender. O Guardião não precisa de aliados. Precisa de escravos." },
        { speaker: "Heroi", name: "Herói", text: "Então vou libertar todos eles.", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Que discurso bonito! Só espero que sua magia seja tão poderosa quanto suas palavras." }
      ],
      4: [
        { speaker: "Gruk", name: "Gruk", text: "Estamos chegando perto das profundezas..." },
        { speaker: "Heroi", name: "Herói", text: "Você parece preocupado.", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "E estou! Sabe, eu já tentei chegar até aqui antes. Mas fui obrigado a voltar." },
        { speaker: "Heroi", name: "Herói", text: "O que aconteceu?", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "O Guardião está ficando mais forte. Quanto mais perto chegamos dele, mais a masmorra parece ganhar vida." },
        { speaker: "Heroi", name: "Herói", text: "Então é aqui que tudo termina.", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Não se empolgue, humano. Ainda temos muita coisa tentando nos matar pela frente." },
        { speaker: "Heroi", name: "Herói", text: "Não vou desistir agora.", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "É bom mesmo! Já estou começando a gostar de ter você por perto." }
      ],
      5: [
        { speaker: "Gruk", name: "Gruk", text: "Não acredito... O Golem Carmesim também caiu!" },
        { speaker: "Heroi", name: "Herói", text: "Ele parecia estar protegendo alguma coisa.", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "E estava. Dizem que seu núcleo mantém parte da energia da masmorra." },
        { speaker: "Heroi", name: "Herói", text: "Senti uma energia estranha quando ele caiu.", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Aquilo era parte do poder que mantém essa masmorra viva." },
        { speaker: "Heroi", name: "Herói", text: "Então a magia daqui está ligada ao Guardião?", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Exatamente. E tenho a impressão de que ele já percebeu sua presença." },
        { speaker: "Heroi", name: "Herói", text: "Que perceba. Estou chegando para acabar com isso.", noNpcHighlight: true }
      ],
      6: [
        { speaker: "Arakne", name: "Arakne", text: "Finalmente chegou até aqui..." },
        { speaker: "Heroi", name: "Herói", text: "O que está acontecendo neste lugar?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "A masmorra não é apenas uma construção. Ela foi criada para guardar uma antiga fonte de poder." },
        { speaker: "Heroi", name: "Herói", text: "E o Guardião?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Ele era o protetor dessa fonte. Mas, com o passar dos anos, começou a absorver seu poder." },
        { speaker: "Heroi", name: "Herói", text: "E acabou sendo corrompido?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Exatamente. Agora ele não protege mais nada. Quer apenas consumir tudo que existe." },
        { speaker: "Heroi", name: "Herói", text: "Então preciso acabar com isso.", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Existe algo que você precisa saber, humano." },
        { speaker: "Heroi", name: "Herói", text: "O quê?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Sua magia é diferente. A fonte de poder está reagindo à sua presença." },
        { speaker: "Heroi", name: "Herói", text: "O que isso significa?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Talvez você tenha mais em comum com este lugar do que imagina." },
        { speaker: "Arakne", name: "Arakne", text: "Mas não importa. Se quiser sobreviver, terá que continuar." }
      ],
      7: [
        { speaker: "Arakne", name: "Arakne", text: "Você realmente conseguiu... O Titã das Chamas foi derrotado!" },
        { speaker: "Heroi", name: "Herói", text: "O caminho está livre agora?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Livre? HA! Você ainda não entendeu?" },
        { speaker: "Arakne", name: "Arakne", text: "Aquele titã era a última barreira antes do antigo salão do trono." },
        { speaker: "Heroi", name: "Herói", text: "Então o Guardião está logo à frente?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Não exatamente. Primeiro você terá que enfrentar aquele que tentou tomar seu lugar." },
        { speaker: "Heroi", name: "Herói", text: "Quem?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "O Rei da Masmorra." },
        { speaker: "Heroi", name: "Herói", text: "Outro servo do Guardião?", noNpcHighlight: true },
        { speaker: "Arakne", name: "Arakne", text: "Não. Alguém que tentou controlar o poder que existe aqui muito antes de você chegar." }
      ],
      8: [
        { speaker: "Heroi", name: "Herói", text: "Mestre?! Como você chegou até aqui?!", noNpcHighlight: true },
        { speaker: "Aldric", name: "Mestre Aldric", text: "Segui seus passos desde a entrada. Não poderia deixar meu último aprendiz enfrentar tudo isso sozinho." },
        { speaker: "Heroi", name: "Herói", text: "Você sabia que havia algo tão terrível aqui?", noNpcHighlight: true },
        { speaker: "Aldric", name: "Mestre Aldric", text: "Conhecia as antigas histórias. O Rei da Masmorra foi um grande feiticeiro que tentou controlar a fonte de poder." },
        { speaker: "Heroi", name: "Herói", text: "Ele também buscava essa energia?", noNpcHighlight: true },
        { speaker: "Aldric", name: "Mestre Aldric", text: "Sim. Mas seu desejo por poder acabou consumindo sua humanidade." },
        { speaker: "Heroi", name: "Herói", text: "E o Guardião?", noNpcHighlight: true },
        { speaker: "Aldric", name: "Mestre Aldric", text: "O Guardião o derrotou e tomou seu lugar como senhor absoluto da masmorra." },
        { speaker: "Heroi", name: "Herói", text: "Então ele também foi corrompido...", noNpcHighlight: true },
        { speaker: "Aldric", name: "Mestre Aldric", text: "Sim. E agora essa mesma energia está reagindo à sua magia." },
        { speaker: "Heroi", name: "Herói", text: "O que isso significa?", noNpcHighlight: true },
        { speaker: "Aldric", name: "Mestre Aldric", text: "Que você precisa ter cuidado. Não deixe que o poder que procura destruir acabe destruindo você." },
        { speaker: "Aldric", name: "Mestre Aldric", text: "Atrás daquela porta está a criatura responsável por tudo isso." },
        { speaker: "Aldric", name: "Mestre Aldric", text: "Termine o que começou, meu aprendiz." }
      ],
      9: [
        { speaker: "Guardiao", name: "Guardião Final", text: "Impossível... Como um simples mortal..." },
        { speaker: "Guardiao", name: "Guardião Final", text: "Eu sou... o coração desta masmorra..." },
        { speaker: "Heroi", name: "Herói", text: "Seu reinado acabou.", noNpcHighlight: true },
        { speaker: "Guardiao", name: "Guardião Final", text: "Você não entende... Sem mim... tudo isso desaparecerá..." },
        { speaker: "Gruk", name: "Gruk", text: "Você conseguiu... REALMENTE CONSEGUIU!" },
        { speaker: "Heroi", name: "Herói", text: "Acabou, Gruk.", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Depois de tantos anos... finalmente estamos livres." },
        { speaker: "Heroi", name: "Herói", text: "A energia da masmorra desapareceu. Acho que os outros também estão livres agora.", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "Então talvez seja hora de encontrar um lugar melhor para morar." },
        { speaker: "Heroi", name: "Herói", text: "Acho que conheço uma vila que poderia receber um orc como você.", noNpcHighlight: true },
        { speaker: "Gruk", name: "Gruk", text: "HAHAHA! Espero que eles gostem de mim!" },
        { speaker: "Heroi", name: "Herói", text: "Vamos. Acho que temos uma vila esperando por nós.", noNpcHighlight: true }
      ]
    };
    return dialogues[this.phaseIndex] ?? null;
  }

  startDialogue(lines, onComplete = null) {
    if (!lines || lines.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    this.dialoguePausedBefore = this.paused;
    this.paused = true;
    this.dialogue = {
      lines,
      index: 0,
      visibleCharacters: 0,
      elapsed: 0,
      onComplete,
      container: null
    };
    this.dialogue.container = new Container();

    const shade = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: 0x080711, alpha: 0.62 });
    this.dialogue.container.addChild(shade);

    const bottomPanel = new Container();
    bottomPanel.x = 30;
    bottomPanel.y = 390;

    bottomPanel.addChild(
      new Graphics()
        .roundRect(0, 10, 740, 180, 12)
        .fill({ color: 0x0d0b18, alpha: 0.96 })
        .roundRect(0, 10, 740, 180, 12)
        .stroke({ width: 3, color: 0xa1845d })
        .roundRect(10, 20, 720, 160, 8)
        .stroke({ width: 1, color: 0x756047 })
    );

    const leftPortrait = new Container();
    leftPortrait.x = 32;
    leftPortrait.y = 0;
    bottomPanel.addChild(leftPortrait);

    const rightPortrait = new Container();
    rightPortrait.x = 686;
    rightPortrait.y = 0;
    bottomPanel.addChild(rightPortrait);

    this.dialogue.leftPortrait = leftPortrait;
    this.dialogue.rightPortrait = rightPortrait;
    this.dialogue.nameText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 20,
        fontWeight: "bold",
        fill: 0xffe6a8
      })
    });
    this.dialogue.nameText.x = 168;
    this.dialogue.nameText.y = 44;
    bottomPanel.addChild(this.dialogue.nameText);

    this.dialogue.dialogueText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 18,
        fill: 0xf2e5c4,
        wordWrap: true,
        wordWrapWidth: 440,
        lineHeight: 25
      })
    });
    this.dialogue.dialogueText.x = 168;
    this.dialogue.dialogueText.y = 82;
    bottomPanel.addChild(this.dialogue.dialogueText);

    const hint = new Text({
      text: "ESPAÇO",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 12,
        fill: 0xc3a978,
        letterSpacing: 2
      })
    });
    hint.anchor.set(1, 1);
    hint.x = 710;
    hint.y = 165;
    bottomPanel.addChild(hint);

    this.dialogue.container.addChild(bottomPanel);
    this.container.addChild(this.dialogue.container);
    this.renderDialogueLine();
  }

  renderDialogueLine() {
    if (!this.dialogue) return;
    const line = this.dialogue.lines[this.dialogue.index];
    this.dialogue.visibleCharacters = 0;
    this.dialogue.elapsed = 0;
    this.dialogue.nameText.text = line.name;
    this.dialogue.dialogueText.text = "";

    this.dialogue.leftPortrait.removeChildren();
    this.dialogue.rightPortrait.removeChildren();

    const addPortrait = (container, texture, highlight) => {
      container.removeChildren();
      container.addChild(
        new Graphics()
          .roundRect(-72, 12, 144, 176, 10)
          .fill({ color: 0x100d17, alpha: 0.82 })
          .roundRect(-72, 12, 144, 176, 10)
          .stroke({ width: highlight ? 3 : 1, color: highlight ? 0xd7c18a : 0x756047 })
      );
      if (texture) {
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.width = 130;
        sprite.height = 150;
        sprite.y = 88;
        sprite.alpha = highlight ? 1 : 0.45;
        container.addChild(sprite);
      }
    };

    const isHero = line.speaker === "Heroi";
    addPortrait(this.dialogue.leftPortrait, this.npcTextures.Heroi, isHero);
    addPortrait(this.dialogue.rightPortrait, this.npcTextures[line.speaker], !isHero);
  }

  updateDialogue(deltaTime) {
    if (!this.dialogue) return;
    const line = this.dialogue.lines[this.dialogue.index];
    if (this.dialogue.visibleCharacters < line.text.length) {
      this.dialogue.elapsed += deltaTime;
      const nextCharacters = Math.floor(this.dialogue.elapsed * 38);
      this.dialogue.visibleCharacters = Math.min(line.text.length, nextCharacters);
      this.dialogue.dialogueText.text = line.text.slice(0, this.dialogue.visibleCharacters);
    }
  }

  advanceDialogue() {
    if (!this.dialogue) return;
    const line = this.dialogue.lines[this.dialogue.index];
    if (this.dialogue.visibleCharacters < line.text.length) {
      this.dialogue.visibleCharacters = line.text.length;
      this.dialogue.dialogueText.text = line.text;
      return;
    }

    if (this.dialogue.index < this.dialogue.lines.length - 1) {
      this.dialogue.index += 1;
      this.renderDialogueLine();
      return;
    }

    const onComplete = this.dialogue.onComplete;
    this.container.removeChild(this.dialogue.container);
    this.dialogue.container.destroy({ children: true });
    this.dialogue = null;
    this.paused = this.dialoguePausedBefore;
    if (onComplete) onComplete();
  }

  createUpgradeSelection() {
    this.paused = true;
    this.upgradeOptions = Array.from({ length: 3 }, () =>
      UPGRADES[Math.floor(Math.random() * UPGRADES.length)]
    );
    this.upgradeOverlay = new Container();
    const shade = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: 0x100d17, alpha: 0.88 });
    shade.eventMode = "static";
    this.upgradeOverlay.addChild(shade);

    const panel = new Container();
    panel.x = 50;
    panel.y = 125;
    panel.addChild(
      new Graphics()
        .roundRect(0, 0, 700, 350, 12)
        .fill(0xe7d5b3)
        .roundRect(0, 0, 700, 350, 12)
        .stroke({ width: 4, color: 0x755b3b })
        .roundRect(8, 8, 684, 334, 8)
        .stroke({ width: 1, color: 0xa1845d })
    );

    const title = new Text({
      text: "ESCOLHA UM APRIMORAMENTO",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 28,
        fontWeight: "bold",
        fill: 0x493522,
        letterSpacing: 1
      })
    });
    title.anchor.set(0.5);
    title.x = 350;
    title.y = 42;
    panel.addChild(title);

    const subtitle = new Text({
      text: "A masmorra fica em pausa enquanto você escolhe",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 16,
        fill: 0x756047
      })
    });
    subtitle.anchor.set(0.5);
    subtitle.x = 350;
    subtitle.y = 76;
    panel.addChild(subtitle);

    this.upgradeOptions.forEach((upgrade, index) => {
      const card = new Container();
      card.x = 27 + index * 222;
      card.y = 112;
      card.eventMode = "static";
      card.cursor = "pointer";

      const background = new Graphics();
      const drawCard = (hovered) => {
        background.clear()
          .roundRect(0, 0, 202, 205, 8)
          .fill(hovered ? 0xfff0cf : 0xf6e8cd)
          .roundRect(0, 0, 202, 205, 8)
          .stroke({ width: hovered ? 4 : 2, color: hovered ? 0x60764a : 0x9b7952 });
      };
      drawCard(false);
      card.addChild(background);

      const number = new Text({
        text: `${index + 1}`,
        style: new TextStyle({
          fontFamily: "Georgia",
          fontSize: 16,
          fontWeight: "bold",
          fill: 0xfff1cf
        })
      });
      number.anchor.set(0.5);
      number.x = 20;
      number.y = 20;
      card.addChild(
        new Graphics().circle(20, 20, 13).fill(0x755b3b)
      );
      card.addChild(number);

      const name = new Text({
        text: upgrade.name,
        style: new TextStyle({
          fontFamily: "Georgia",
          fontSize: 20,
          fontWeight: "bold",
          fill: 0x493522,
          wordWrap: true,
          wordWrapWidth: 170
        })
      });
      name.anchor.set(0.5);
      name.x = 101;
      name.y = 71;
      card.addChild(name);

      const description = new Text({
        text: upgrade.description,
        style: new TextStyle({
          fontFamily: "Georgia",
          fontSize: 15,
          fill: 0x756047,
          wordWrap: true,
          wordWrapWidth: 164,
          align: "center",
          lineHeight: 21
        })
      });
      description.anchor.set(0.5);
      description.x = 101;
      description.y = 137;
      card.addChild(description);

      card.on("pointerover", () => drawCard(true));
      card.on("pointerout", () => drawCard(false));
      card.on("pointertap", () => this.selectUpgrade(index));
      panel.addChild(card);
    });

    this.upgradeOverlay.addChild(panel);
    this.container.addChild(this.upgradeOverlay);
  }

  selectUpgrade(index) {
    const upgrade = this.upgradeOptions[index];
    if (!upgrade) {
      return;
    }

    this.player.applyUpgrade(upgrade.id);
    this.container.removeChild(this.upgradeOverlay);
    this.upgradeOverlay.destroy({ children: true });
    this.upgradeOverlay = null;
    this.phaseIndex += 1;
    this.currentWave = 0;
    this.waveElapsed = 0;
    this.waveSpawnElapsed = 0;
    this.waveQueue = [];
    this.paused = false;
    this.hud.setHealthAndPhase(
      this.player.health,
      `${PHASES[this.phaseIndex].name} - Onda 1/3`,
      this.player.maxHealth
    );
  }

  createCompletionOverlay() {
    const overlay = new Container();
    const shade = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: 0x100d17, alpha: 0.86 });
    shade.eventMode = "static";
    overlay.addChild(shade);

    const title = new Text({
      text: "Masmorra concluída!",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 42,
        fontWeight: "bold",
        fill: 0xffe6a8
      })
    });
    title.anchor.set(0.5);
    title.x = GAME_WIDTH / 2;
    title.y = 245;
    overlay.addChild(title);

    const subtitle = new Text({
      text: "Você derrotou todos os guardiões.",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 20,
        fill: COLORS.text
      })
    });
    subtitle.anchor.set(0.5);
    subtitle.x = GAME_WIDTH / 2;
    subtitle.y = 300;
    overlay.addChild(subtitle);

    const menuButton = new Container();
    menuButton.x = GAME_WIDTH / 2 - 126;
    menuButton.y = 355;
    menuButton.eventMode = "static";
    menuButton.cursor = "pointer";
    menuButton.addChild(
      new Graphics()
        .roundRect(0, 0, 252, 50, 8)
        .fill(0x60764a)
        .roundRect(0, 0, 252, 50, 8)
        .stroke({ width: 3, color: 0x465338 })
    );
    const menuText = new Text({
      text: "VOLTAR AO MENU",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 18,
        fontWeight: "bold",
        fill: 0xfff1cf
      })
    });
    menuText.anchor.set(0.5);
    menuText.x = 126;
    menuText.y = 25;
    menuButton.addChild(menuText);
    menuButton.on("pointertap", this.onMenu);
    overlay.addChild(menuButton);
    this.completionOverlay = overlay;
    this.container.addChild(overlay);
  }

  createGameOverOverlay() {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.paused = true;
    this.projectiles.length = 0;
    this.playerProjectiles.length = 0;
    this.projectileGraphics.clear();
    this.gameOverOverlay = new Container();

    const shade = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: 0x160b12, alpha: 0.84 });
    shade.eventMode = "static";
    this.gameOverOverlay.addChild(shade);

    const panel = new Container();
    panel.x = (GAME_WIDTH - 448) / 2;
    panel.y = (GAME_HEIGHT - 336) / 2;
    panel.addChild(
      new Graphics()
        .roundRect(5, 8, 448, 336, 12)
        .fill({ color: 0x09080d, alpha: 0.72 })
    );

    const paper = new Sprite(new Texture({
      source: this.paperUiTexture.source,
      frame: new Rectangle(8, 144, 112, 84)
    }));
    paper.width = 448;
    paper.height = 336;
    panel.addChild(paper);
    panel.addChild(
      new Graphics()
        .roundRect(8, 8, 432, 320, 8)
        .stroke({ width: 2, color: 0x9a6659, alpha: 0.75 })
    );

    const title = new Text({
      text: "FIM DE JOGO",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 38,
        fontWeight: "bold",
        fill: 0x7d302e,
        letterSpacing: 3
      })
    });
    title.anchor.set(0.5);
    title.x = 224;
    title.y = 68;
    panel.addChild(title);

    const subtitle = new Text({
      text: "A masmorra venceu desta vez...",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 18,
        fill: 0x756047
      })
    });
    subtitle.anchor.set(0.5);
    subtitle.x = 224;
    subtitle.y = 113;
    panel.addChild(subtitle);

    const createGameOverButton = (label, y, palette, action) => {
      const button = new Container();
      button.x = 98;
      button.y = y;
      button.eventMode = "static";
      button.cursor = "pointer";

      const background = new Graphics();
      const drawButton = (hovered) => {
        background.clear()
          .roundRect(0, 4, 252, 50, 8)
          .fill(0x493522)
          .roundRect(0, 0, 252, 50, 8)
          .fill(hovered ? palette.hover : palette.base)
          .roundRect(0, 0, 252, 50, 8)
          .stroke({ width: 3, color: palette.border })
          .roundRect(6, 6, 240, 38, 5)
          .stroke({ width: 1, color: palette.highlight, alpha: 0.7 });
      };
      drawButton(false);
      button.addChild(background);

      const text = new Text({
        text: label,
        style: new TextStyle({
          fontFamily: "Georgia",
          fontSize: 18,
          fontWeight: "bold",
          fill: 0xfff1cf,
          letterSpacing: 1
        })
      });
      text.anchor.set(0.5);
      text.x = 126;
      text.y = 25;
      button.addChild(text);

      button.on("pointerover", () => drawButton(true));
      button.on("pointerout", () => drawButton(false));
      button.on("pointertap", action);
      panel.addChild(button);
    };

    createGameOverButton(
      "TENTAR DE NOVO",
      156,
      { base: 0x60764a, hover: 0x718854, border: 0x465338, highlight: 0xc3ca91 },
      this.onRestart
    );
    createGameOverButton(
      "VOLTAR AO MENU",
      216,
      { base: 0x925941, hover: 0xa96a4d, border: 0x744634, highlight: 0xd7b08a },
      this.onMenu
    );

    const hint = new Text({
      text: "R para tentar novamente  |  Esc para menu",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 14,
        fill: 0x756047
      })
    });
    hint.anchor.set(0.5);
    hint.x = 224;
    hint.y = 295;
    panel.addChild(hint);

    this.gameOverOverlay.addChild(panel);
    this.container.addChild(this.gameOverOverlay);
  }

  updateHudHealth() {
    const phase = PHASES[this.phaseIndex];
    const phaseLabel = this.boss
      ? `${phase.name} - Boss: ${this.boss.name}`
      : `${phase.name} - Onda ${Math.min(this.currentWave, 3)}/3`;
    this.hud.setHealthAndPhase(
      this.player.health,
      phaseLabel,
      this.player.maxHealth
    );
  }

  formatDamage(amount) {
    const rounded = Math.round(amount * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  }

  spawnDamageNumber(text, x, y, color) {
    const label = new Text({
      text,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: text.startsWith("CRÍTICO") ? 14 : 18,
        fontWeight: "bold",
        fill: color,
        stroke: { color: 0x17141b, width: 3 }
      })
    });
    label.anchor.set(0.5);
    label.x = x;
    label.y = y;
    this.container.addChild(label);
    this.damageNumbers.push({ label, elapsed: 0, duration: 0.65 });
  }

  updateDamageNumbers(deltaTime) {
    for (let index = this.damageNumbers.length - 1; index >= 0; index -= 1) {
      const effect = this.damageNumbers[index];
      effect.elapsed += deltaTime;
      effect.label.y -= 36 * deltaTime;
      effect.label.alpha = Math.max(0, 1 - effect.elapsed / effect.duration);

      if (effect.elapsed >= effect.duration) {
        this.container.removeChild(effect.label);
        effect.label.destroy();
        this.damageNumbers.splice(index, 1);
      }
    }
  }

  destroy() {
    this.input.destroy();
    this.player.destroy();
    this.enemyDeathSound.pause();
    this.container.destroy({ children: true });
  }
}
