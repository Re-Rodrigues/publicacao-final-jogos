import { Container, Graphics, Rectangle, Sprite, Texture } from "pixi.js";
import {
  ENEMY_HEALTH,
  ENEMY_DAMAGE,
  ENEMY_SIZE,
  ENEMY_SPEED,
  GAME_WIDTH,
  GAME_HEIGHT,
  ARENA_INSET
} from "../config.js";
const ENEMY_SPRITE_FRAMES = {
  melee: { x: 368, y: 64 },
  ranged: { x: 368, y: 304 },
  large: { x: 368, y: 320 },
  boss: { x: 368, y: 112 }
};

export class Enemy {
  constructor(x, y, type = "melee", options = {}) {
    this.container = new Container();
    this.container.x = x;
    this.container.y = y;
    this.type = type;
    this.size = options.size ?? (type === "large" ? 40 : type === "boss" ? 64 : ENEMY_SIZE);
    this.health = options.health ?? (type === "large" ? 40 : type === "boss" ? 160 : ENEMY_HEALTH);
    this.maxHealth = this.health;
    this.speed = options.speed ?? (type === "ranged" ? 58 : type === "large" ? 42 : type === "boss" ? 40 : ENEMY_SPEED);
    this.damage = options.damage ?? ENEMY_DAMAGE;
    this.attackRange = type === "boss" ? 400 : type === "ranged" ? 280 : 34;
    this.attackCooldown = 0;
    this.projectiles = options.projectiles ?? null;
    this.bossAttack = options.bossAttack ?? "tripleShot";
    this.bossAttackInterval = options.attackInterval ?? 2.5;
    this.bossAttackElapsed = Math.min(1.2, this.bossAttackInterval);
    this.bossAttackCount = 0;
    this.bossState = "approach";
    this.bossStateElapsed = 0;
    this.bossChargeDirection = { x: 0, y: 0 };
    this.bossChargeHitPlayer = false;
    this.dead = false;
    this.hitFlashDuration = 0.14;
    this.hitFlashElapsed = 0;
    this.stunDuration = 0.5;
    this.stunElapsed = 0;
    this.animationFrames = options.animationFrames ?? null;
    this.animationName = "idle";
    this.animationElapsed = 0;

    if (this.animationFrames) {
      this.body = new Sprite(this.animationFrames.idle[0]);
      this.body.anchor.set(0.5);
      const frameWidth = this.body.texture.width;
      const frameHeight = this.body.texture.height;
      const displayScale = this.size / Math.max(frameWidth, frameHeight);
      this.body.width = frameWidth * displayScale;
      this.body.height = frameHeight * displayScale;
    } else if (options.enemyTexture) {
      const frame = options.spriteFrame ??
        ENEMY_SPRITE_FRAMES[type] ??
        ENEMY_SPRITE_FRAMES.melee;
      const texture = new Texture({
        source: options.enemyTexture.source,
        frame: new Rectangle(frame.x, frame.y, 16, 16)
      });
      this.body = new Sprite(texture);
      this.body.anchor.set(0.5);
      this.body.width = this.size;
      this.body.height = this.size;
    } else {
      const color = type === "boss"
        ? 0x8f2e63
        : type === "large"
          ? 0x76513a
          : type === "ranged"
            ? 0x4f78a8
            : 0xb84a50;
      this.body = new Graphics()
        .rect(-this.size / 2, -this.size / 2, this.size, this.size)
        .fill(color);
    }
    this.baseBodyScale = { x: this.body.scale.x, y: this.body.scale.y };
    this.container.addChild(this.body);

    this.healthBar = new Graphics();
    this.container.addChild(this.healthBar);
    this.drawHealthBar();
  }

  getHitbox() {
    const halfSize = this.size / 2;
    return {
      x: this.container.x - halfSize,
      y: this.container.y - halfSize,
      width: this.size,
      height: this.size
    };
  }

  takeDamage(amount) {
    if (this.dead) {
      return;
    }
    this.health -= amount;
    this.hitFlashElapsed = this.hitFlashDuration;
    if (this.type !== "boss") {
      this.stunElapsed = this.stunDuration;
    }
    this.body.scale.set(this.baseBodyScale.x * 1.18, this.baseBodyScale.y * 1.18);
    this.body.alpha = 0.55;
    this.drawHealthBar();
    if (this.health <= 0) {
      this.dead = true;
    }
  }

  drawHealthBar() {
    this.healthBar.clear();
    const width = Math.max(32, this.size + (this.type === "boss" ? 16 : 10));
    const height = this.type === "boss" ? 9 : this.type === "large" ? 8 : 7;
    const x = -width / 2;
    const y = -this.size / 2 - height - 5;
    const innerWidth = width - 4;
    const innerHeight = height - 4;
    const healthRatio = Math.min(1, Math.max(0, this.health / this.maxHealth));
    const healthColor = healthRatio > 0.55
      ? 0x63d17c
      : healthRatio > 0.25
        ? 0xf1ba4c
        : 0xe85b5b;

    this.healthBar
      .roundRect(x - 1, y + 1, width + 2, height + 2, 3)
      .fill({ color: 0x0b0910, alpha: 0.8 })
      .roundRect(x, y, width, height, 3)
      .fill(this.type === "boss" ? 0xd6ac60 : 0x9890a5)
      .roundRect(x + 1, y + 1, width - 2, height - 2, 2)
      .fill(0x211c29)
      .roundRect(x + 2, y + 2, innerWidth, innerHeight, 1)
      .fill(0x372d38);

    const fillWidth = innerWidth * healthRatio;
    if (fillWidth > 0) {
      this.healthBar
        .roundRect(x + 2, y + 2, fillWidth, innerHeight, 1)
        .fill(healthColor)
        .roundRect(
          x + 3,
          y + 2,
          Math.max(0, fillWidth - 2),
          Math.max(1, Math.floor(innerHeight / 3)),
          1
        )
        .fill({ color: 0xffffff, alpha: 0.22 });
    }
  }

  update(deltaTime, target) {
    if (this.dead) {
      return;
    }

    this.hitFlashElapsed = Math.max(0, this.hitFlashElapsed - deltaTime);
    const hitFlashProgress = this.hitFlashElapsed / this.hitFlashDuration;
    this.body.scale.set(
      this.baseBodyScale.x * (1 + 0.18 * hitFlashProgress),
      this.baseBodyScale.y * (1 + 0.18 * hitFlashProgress)
    );
    this.body.alpha = 1 - 0.45 * hitFlashProgress;

    if (this.stunElapsed > 0) {
      this.stunElapsed = Math.max(0, this.stunElapsed - deltaTime);
      this.updateAnimation(deltaTime, false);
      return;
    }

    const dx = target.container.x - this.container.x;
    const dy = target.container.y - this.container.y;
    const distance = Math.hypot(dx, dy);

    if (this.type === "boss") {
      const previousX = this.container.x;
      const previousY = this.container.y;
      this.updateBoss(deltaTime, target, dx, dy, distance);
      this.updateAnimation(
        deltaTime,
        this.container.x !== previousX || this.container.y !== previousY
      );
      return;
    }

    const previousX = this.container.x;
    const previousY = this.container.y;
    this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);

    if (distance > this.attackRange) {
      this.moveTowards(dx, dy, distance, deltaTime, this.speed);
    }

    if (this.type === "ranged" &&
        distance <= this.attackRange &&
        this.attackCooldown <= 0 &&
        this.projectiles) {
      this.attackCooldown = 2;
      this.projectiles.push({
        x: this.container.x,
        y: this.container.y,
        dx: dx / Math.max(1, distance),
        dy: dy / Math.max(1, distance),
        speed: 150,
        damage: this.damage,
        size: 7,
        color: 0xe8d38a
      });
    }

    if (this.type === "melee" || this.type === "large") {
      if (distance <= this.attackRange && this.attackCooldown <= 0) {
        this.attackCooldown = this.type === "large" ? 1.4 : 1;
        target.takeDamage(this.damage);
      }
    }

    this.updateAnimation(
      deltaTime,
      this.container.x !== previousX || this.container.y !== previousY
    );
  }

  updateAnimation(deltaTime, moving) {
    if (!this.animationFrames) {
      return;
    }

    const animationName = moving ? "run" : "idle";
    if (this.animationName !== animationName) {
      this.animationName = animationName;
      this.animationElapsed = 0;
    }

    const frames = this.animationFrames[animationName];
    if (!moving) {
      this.body.texture = frames[0];
      return;
    }

    this.animationElapsed += deltaTime;
    const frameIndex = Math.floor(this.animationElapsed / 0.12) % frames.length;
    this.body.texture = frames[frameIndex];
  }

  updateBoss(deltaTime, target, dx, dy, distance) {
    if (this.bossState === "windup") {
      this.bossStateElapsed -= deltaTime;
      this.body.alpha = 0.45 + (Math.sin(this.bossStateElapsed * 28) + 1) * 0.2;
      if (this.bossStateElapsed > 0) {
        return;
      }

      this.body.alpha = 1;
      if (this.bossAttack === "charge") {
        this.bossState = "charge";
        this.bossStateElapsed = 0.42;
        this.bossChargeHitPlayer = false;
      } else {
        this.fireBossAttack(target);
        this.bossAttackElapsed = this.bossAttackInterval;
        this.bossState = "approach";
      }
      return;
    }

    if (this.bossState === "charge") {
      this.bossStateElapsed -= deltaTime;
      const minX = ARENA_INSET + this.size / 2;
      const maxX = GAME_WIDTH - ARENA_INSET - this.size / 2;
      const minY = ARENA_INSET + this.size / 2;
      const maxY = GAME_HEIGHT - ARENA_INSET - this.size / 2;
      const nextX = this.container.x + this.bossChargeDirection.x * 340 * deltaTime;
      const nextY = this.container.y + this.bossChargeDirection.y * 340 * deltaTime;
      const clampedX = Math.max(minX, Math.min(maxX, nextX));
      const clampedY = Math.max(minY, Math.min(maxY, nextY));
      const hitWall = clampedX !== nextX || clampedY !== nextY;

      this.container.x = clampedX;
      this.container.y = clampedY;

      if (!this.bossChargeHitPlayer &&
          Math.hypot(target.container.x - clampedX, target.container.y - clampedY) <=
            this.size / 2 + 12) {
        target.takeDamage(this.damage);
        this.bossChargeHitPlayer = true;
      }

      if (this.bossStateElapsed <= 0 || hitWall) {
        this.bossState = "approach";
        this.bossAttackElapsed = this.bossAttackInterval;
      }
      return;
    }

    this.bossAttackElapsed = Math.max(0, this.bossAttackElapsed - deltaTime);
    if (distance <= this.attackRange && this.bossAttackElapsed <= 0) {
      this.bossState = "windup";
      this.bossStateElapsed = this.bossAttack === "charge" ? 0.65 : 0.45;
      const directionLength = Math.max(1, distance);
      this.bossChargeDirection = {
        x: dx / directionLength,
        y: dy / directionLength
      };
      return;
    }

    if (distance > this.attackRange) {
      this.moveTowards(dx, dy, distance, deltaTime, this.speed);
    }
  }

  fireBossAttack(target) {
    switch (this.bossAttack) {
      case "tripleShot":
        this.fireBossProjectiles(target, [-0.2, 0, 0.2], 190, 7, 0xffd166);
        break;
      case "radialBurst":
        this.fireBossProjectiles(
          target,
          Array.from({ length: 8 }, (_, index) => index * Math.PI / 4),
          145,
          8,
          0xe85b5b,
          false
        );
        break;
      case "crossfire":
        this.fireBossProjectiles(
          target,
          [0, Math.PI / 2, Math.PI, Math.PI * 1.5],
          175,
          9,
          0xff8a4c,
          false
        );
        break;
      case "fanVolley":
        this.fireBossProjectiles(target, [-0.5, -0.25, 0, 0.25, 0.5], 185, 7, 0xa977ff);
        break;
      case "finalSequence":
        if (this.bossAttackCount % 2 === 0) {
          this.fireBossProjectiles(target, [-0.5, -0.25, 0, 0.25, 0.5], 200, 8, 0xff7a4c);
        } else {
          this.fireBossProjectiles(
            target,
            Array.from({ length: 10 }, (_, index) => index * Math.PI / 5),
            155,
            8,
            0xffd166,
            false
          );
        }
        break;
      default:
        this.fireBossProjectiles(target, [0], 180, 8, 0xffd166);
        break;
    }
    this.bossAttackCount += 1;
  }

  fireBossProjectiles(target, angles, speed, size, color, aimed = true) {
    if (!this.projectiles) {
      return;
    }

    const baseAngle = aimed
      ? Math.atan2(target.container.y - this.container.y, target.container.x - this.container.x)
      : 0;
    for (const offset of angles) {
      const angle = baseAngle + offset;
      this.projectiles.push({
        x: this.container.x,
        y: this.container.y,
        dx: Math.cos(angle),
        dy: Math.sin(angle),
        speed,
        damage: this.damage,
        size,
        color
      });
    }
  }

  moveTowards(dx, dy, distance, deltaTime, speed) {
    if (distance === 0) {
      return;
    }

    const halfSize = this.size / 2;
    const nextX = this.container.x + (dx / distance) * speed * deltaTime;
    const nextY = this.container.y + (dy / distance) * speed * deltaTime;
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
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
