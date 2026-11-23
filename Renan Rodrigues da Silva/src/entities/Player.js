import { Container, Graphics, Sprite } from "pixi.js";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_SPEED,
  MAGIC_PROJECTILE_DAMAGE,
  MAGIC_PROJECTILE_SPEED,
  COLORS,
  ARENA_INSET
} from "../config.js";

const PLAYER_SIZE = 24;
const PLAYER_RENDER_SIZE = 32;
const DAMAGE_INVULNERABILITY_DURATION = 1;
const ANIMATION_FRAME_DURATION = 0.12;

export class Player {
  constructor(x, y, playerTextures = [], projectiles = [], playerFlipTextures = [], isMuted = () => false) {
    this.container = new Container();
    this.container.x = x;
    this.container.y = y;
    this.facing = { x: 0, y: -1 };
    this.attackCooldown = 0.4;
    this.attackCooldownElapsed = 0;
    this.damage = MAGIC_PROJECTILE_DAMAGE;
    this.health = 5;
    this.maxHealth = 5;
    this.damageMultiplier = 1;
    this.moveSpeed = PLAYER_SPEED;
    this.attackSpeedMultiplier = 1;
    this.criticalChance = 0;
    this.criticalDamageMultiplier = 2;
    this.playerTextures = playerTextures;
    this.playerFlipTextures = playerFlipTextures;
    this.facingLeft = false;
    this.projectiles = projectiles;
    this.animationElapsed = 0;
    this.animationFrame = 0;
    this.damageReduction = 0;
    this.regenerationPercent = 0;
    this.regenerationElapsed = 0;
    this.vampirismPercent = 0;
    this.invulnerableElapsed = 0;
    this.isMuted = isMuted;
    this.footstepElapsed = 0;
    this.footstepInterval = 0.36;
    this.footstepSound = new Audio("/assets/audio/footstep_concrete_004.ogg");
    this.footstepSound.volume = 0.45;
    this.shotSound = new Audio("/assets/audio/impactMetal_medium_001.ogg");
    this.shotSound.volume = 0.55;

    this.body = this.playerTextures.length > 0
      ? new Sprite(this.playerTextures[0])
      : new Graphics()
        .rect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE)
        .fill(COLORS.player);
    if (this.body instanceof Sprite) {
      this.body.anchor.set(0.5);
      this.body.width = PLAYER_RENDER_SIZE;
      this.body.height = PLAYER_RENDER_SIZE;
    }

    this.container.addChild(this.body);
  }

  update(deltaTime, input) {
    this.invulnerableElapsed = Math.max(0, this.invulnerableElapsed - deltaTime);
    this.body.alpha = this.invulnerableElapsed > 0 &&
      Math.floor(this.invulnerableElapsed * 12) % 2 === 0
      ? 0.35
      : 1;
    this.attackCooldownElapsed = Math.max(0, this.attackCooldownElapsed - deltaTime);
    if (this.regenerationPercent > 0) {
      this.regenerationElapsed += deltaTime;
      while (this.regenerationElapsed >= 5) {
        this.regenerationElapsed -= 5;
        this.heal(this.maxHealth * this.regenerationPercent);
      }
    }

    let xDirection = 0;
    let yDirection = 0;

    if (input.isDown("w") || input.isDown("arrowup")) yDirection -= 1;
    if (input.isDown("s") || input.isDown("arrowdown")) yDirection += 1;
    if (input.isDown("a") || input.isDown("arrowleft")) xDirection -= 1;
    if (input.isDown("d") || input.isDown("arrowright")) xDirection += 1;

    if (xDirection !== 0 && yDirection !== 0) {
      xDirection *= Math.SQRT1_2;
      yDirection *= Math.SQRT1_2;
    }

    const isMoving = xDirection !== 0 || yDirection !== 0;
    if (isMoving) {
      this.facing.x = xDirection;
      this.facing.y = yDirection;
    }
    if (xDirection !== 0) {
      this.facingLeft = xDirection < 0;
    }

    const nextX = this.container.x + xDirection * this.moveSpeed * deltaTime;
    const nextY = this.container.y + yDirection * this.moveSpeed * deltaTime;
    const halfSize = PLAYER_SIZE / 2;

    const minX = ARENA_INSET + halfSize;
    const maxX = GAME_WIDTH - ARENA_INSET - halfSize;
    const minY = ARENA_INSET + halfSize;
    const maxY = GAME_HEIGHT - ARENA_INSET - halfSize;

    if (nextX >= minX && nextX <= maxX) {
      this.container.x = nextX;
    }

    if (nextY >= minY && nextY <= maxY) {
      this.container.y = nextY;
    }

    this.updateFootsteps(deltaTime, isMoving);
    this.updateAnimation(deltaTime, isMoving);

    if (input.consumePressed("j") || input.consumePressed(" ")) {
      if (this.attackCooldownElapsed <= 0) {
        this.castSpell();
      }
    }
  }

  updateFootsteps(deltaTime, isMoving) {
    if (!isMoving || this.isMuted()) {
      this.footstepElapsed = 0;
      return;
    }

    this.footstepElapsed += deltaTime;
    if (this.footstepElapsed < this.footstepInterval) {
      return;
    }

    this.footstepElapsed -= this.footstepInterval;
    this.footstepSound.currentTime = 0;
    this.footstepSound.play().catch((error) => {
      console.error("Não foi possível reproduzir o som de passos.", error);
    });
  }

  updateAnimation(deltaTime, isMoving) {
    if (this.playerTextures.length === 0 || !(this.body instanceof Sprite)) {
      return;
    }

    if (!isMoving) {
      this.animationElapsed = 0;
      this.animationFrame = 0;
    } else {
      this.animationElapsed += deltaTime;
      while (this.animationElapsed >= ANIMATION_FRAME_DURATION) {
        this.animationElapsed -= ANIMATION_FRAME_DURATION;
        this.animationFrame = (this.animationFrame + 1) % this.playerTextures.length;
      }
    }

    const textures = this.facingLeft &&
      this.playerFlipTextures.length === this.playerTextures.length
      ? this.playerFlipTextures
      : this.playerTextures;
    this.body.texture = textures[this.animationFrame];
  }

  castSpell() {
    this.attackCooldownElapsed = this.attackCooldown / this.attackSpeedMultiplier;
    if (!this.isMuted()) {
      this.shotSound.currentTime = 0;
      this.shotSound.play().catch((error) => {
        console.error("Não foi possível reproduzir o som de tiro.", error);
      });
    }
    const isCritical = Math.random() < this.criticalChance;
    const directionLength = Math.hypot(this.facing.x, this.facing.y) || 1;
    const directionX = this.facing.x / directionLength;
    const directionY = this.facing.y / directionLength;
    const damage = this.getAttackDamage(isCritical);

    this.projectiles.push({
      x: this.container.x + directionX * (PLAYER_SIZE / 2 + 5),
      y: this.container.y + directionY * (PLAYER_SIZE / 2 + 5),
      dx: directionX,
      dy: directionY,
      speed: MAGIC_PROJECTILE_SPEED,
      damage,
      size: 6,
      color: isCritical ? 0xffd166 : 0xb47cff,
      critical: isCritical
    });
  }

  getAttackDamage(isCritical = false) {
    return this.damage * this.damageMultiplier *
      (isCritical ? this.criticalDamageMultiplier : 1);
  }

  applyUpgrade(upgradeId) {
    switch (upgradeId) {
      case "strength":
        this.damageMultiplier *= 1.1;
        break;
      case "vitality": {
        this.maxHealth += 1;
        this.heal(1);
        break;
      }
      case "agility":
        this.moveSpeed *= 1.1;
        break;
      case "speed":
        this.attackSpeedMultiplier *= 1.1;
        break;
      case "precision":
        this.criticalChance = Math.min(1, this.criticalChance + 0.05);
        break;
      case "criticalDamage":
        this.criticalDamageMultiplier += 0.25;
        break;
      case "resistance":
        this.damageReduction = Math.min(0.9, this.damageReduction + 0.1);
        break;
      case "regeneration":
        this.regenerationPercent += 0.01;
        break;
      case "vampirism":
        this.vampirismPercent += 0.02;
        break;
      default:
        throw new Error(`Upgrade desconhecido: ${upgradeId}`);
    }
  }

  onEnemyDefeated() {
    this.heal(this.maxHealth * this.vampirismPercent);
  }

  heal(amount) {
    const previousHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health > previousHealth;
  }

  destroy() {
    this.footstepSound.pause();
    this.shotSound.pause();
  }

  takeDamage(amount) {
    if (this.invulnerableElapsed > 0) {
      return false;
    }
    this.health = Math.max(0, this.health - amount * (1 - this.damageReduction));
    this.invulnerableElapsed = DAMAGE_INVULNERABILITY_DURATION;
    return true;
  }
}
