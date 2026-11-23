import {
  Container,
  Rectangle,
  Sprite,
  Text,
  TextStyle,
  Texture
} from "pixi.js";

export class HUD {
  constructor(heartAtlas) {
    this.container = new Container();
    this.health = 5;
    this.maxHealth = 5;
    this.phase = "";
    this.healthContainer = new Container();
    this.container.addChild(this.healthContainer);

    this.heartTextures = [
      new Texture({
        source: heartAtlas.source,
        frame: new Rectangle(288, 368, 16, 16)
      }),
      new Texture({
        source: heartAtlas.source,
        frame: new Rectangle(304, 368, 16, 16)
      }),
      new Texture({
        source: heartAtlas.source,
        frame: new Rectangle(320, 368, 16, 16)
      })
    ];

    this.phaseText = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 14,
        fill: 0xf0e9d8
      })
    });
    this.phaseText.x = 12;
    this.phaseText.y = 40;
    this.container.addChild(this.phaseText);
  }

  setEnemyCount(count) {
    this.phase = `INIMIGOS: ${count}/10`;
    this.render();
  }

  setPhase(text) {
    this.phase = text;
    this.render();
  }

  setHealthAndPhase(health, text, maxHealth = this.maxHealth) {
    this.health = health;
    this.maxHealth = maxHealth;
    this.phase = text;
    this.render();
  }

  render() {
    this.healthContainer.removeChildren();

    const heartSize = 24;
    const heartSpacing = 28;
    for (let index = 0; index < this.maxHealth; index += 1) {
      const healthInHeart = this.health - index;
      const texture = healthInHeart >= 1
        ? this.heartTextures[0]
        : healthInHeart >= 0.5
          ? this.heartTextures[1]
          : this.heartTextures[2];
      const heart = new Sprite(texture);
      heart.width = heartSize;
      heart.height = heartSize;
      heart.x = index * heartSpacing;
      this.healthContainer.addChild(heart);
    }

    this.healthContainer.x = 12;
    this.healthContainer.y = 10;
    this.phaseText.text = this.phase;
  }
}
