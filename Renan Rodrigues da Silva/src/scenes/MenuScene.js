import { Container, Graphics, Rectangle, Sprite, Text, TextStyle, Texture } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../config.js";

export class MenuScene {
  constructor({ onPlay, paperUiTexture, menuBackgroundTexture }) {
    this.container = new Container();
    this.paperUiTexture = paperUiTexture;
    this.menuButtons = [];

    const backdrop = new Sprite(menuBackgroundTexture);
    backdrop.anchor.set(0.5);
    backdrop.scale.set(Math.max(
      GAME_WIDTH / menuBackgroundTexture.width,
      GAME_HEIGHT / menuBackgroundTexture.height
    ));
    backdrop.x = GAME_WIDTH / 2;
    backdrop.y = GAME_HEIGHT / 2;
    this.container.addChild(backdrop);

    this.container.addChild(
      new Graphics()
        .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
        .fill({ color: 0x07101b, alpha: 0.24 })
    );

    const menuPanel = new Graphics()
      .roundRect(34, 38, 350, 524, 12)
      .fill({ color: 0x08111d, alpha: 0.82 })
      .roundRect(34, 38, 350, 524, 12)
      .stroke({ width: 2, color: 0xc3a978, alpha: 0.8 })
      .roundRect(43, 47, 332, 506, 8)
      .stroke({ width: 1, color: 0x7890a5, alpha: 0.5 });
    this.container.addChild(menuPanel);

    const title = new Text({
      text: "DUNGEONFALL",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 30,
        fontWeight: "bold",
        fill: 0xffe6a8,
        letterSpacing: 2,
        dropShadow: {
          color: 0x000000,
          alpha: 0.8,
          blur: 4,
          distance: 2
        }
      })
    });
    title.x = 62;
    title.y = 87;
    this.container.addChild(title);

    const subtitle = new Text({
      text: "A masmorra despertou",
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 17,
        fontStyle: "italic",
        fill: 0xc4d4dc,
        dropShadow: {
          color: 0x000000,
          alpha: 0.8,
          blur: 3,
          distance: 1
        }
      })
    });
    subtitle.x = 64;
    subtitle.y = 130;
    this.container.addChild(subtitle);

    this.container.addChild(
      new Graphics()
        .moveTo(62, 165)
        .lineTo(356, 165)
        .stroke({ width: 1, color: 0xc3a978, alpha: 0.7 })
    );

    this.createMenuButton("Jogar", 64, 205, onPlay);
    this.createMenuButton("História", 64, 275, () => {
      this.openModal(
        "História",
        "Há muitos anos, uma antiga masmorra surgiu nas profundezas de uma montanha " +
        "próxima a uma pequena vila.\n\n" +
        "Durante muito tempo, ela permaneceu adormecida. Porém, recentemente, criaturas " +
        "começaram a sair de suas profundezas e atacar os moradores. Plantações foram " +
        "destruídas, viajantes desapareceram e a vila passou a viver com medo.\n\n" +
        "Dizem que, no coração da masmorra, existe uma criatura conhecida como " +
        "Guardião Final, responsável por controlar tudo que vive naquele lugar.\n\n" +
        "Um jovem mago, treinado desde criança por um antigo mestre, decide enfrentar " +
        "a ameaça e descer até as profundezas para acabar com a maldição."
      );
    });
    this.createMenuButton("Como jogar", 64, 345, () => {
      this.openModal(
        "Como jogar",
        "Use WASD ou as setas do teclado para movimentar o personagem.\n\n" +
        "Pressione J ou Espaço para lançar magia na direção em que estiver olhando.\n\n" +
        "Você pode voltar ao menu usando o botão exibido durante o jogo."
      );
    });

    const footer = new Text({
      text: "DESÇA  •  LUTE  •  SOBREVIVA",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 11,
        fill: 0x9eb1bf,
        letterSpacing: 2
      })
    });
    footer.anchor.set(0.5);
    footer.x = 209;
    footer.y = 475;
    this.container.addChild(footer);

    this.handleKeyDown = (event) => {
      if ((event.key === "Enter" || event.key === " ") && !this.modal) {
        event.preventDefault();
        onPlay();
      }
      if (event.key === "Escape" && this.modal) {
        this.closeModal();
      }
    };
    window.addEventListener("keydown", this.handleKeyDown);
  }

  createMenuButton(label, x, y, action) {
    const width = 294;
    const height = 54;
    const button = new Container();
    button.eventMode = "static";
    button.cursor = "pointer";
    button.x = x;
    button.y = y;

    const background = new Graphics();
    const drawButton = (hovered, pressed = false) => {
      background.clear()
        .roundRect(0, 3, width, height, 7)
        .fill({ color: 0x03080e, alpha: 0.9 })
        .roundRect(0, 0, width, height, 7)
        .fill({
          color: pressed ? 0x183a50 : hovered ? 0x24516a : 0x142d40,
          alpha: 0.97
        })
        .roundRect(0, 0, width, height, 7)
        .stroke({
          width: hovered ? 3 : 2,
          color: hovered ? 0xffe6a8 : 0xc3a978
        })
        .roundRect(6, 6, width - 12, height - 12, 4)
        .stroke({ width: 1, color: 0x88a7b8, alpha: 0.55 });
    };
    drawButton(false);
    button.addChild(background);

    const rune = new Graphics()
      .moveTo(20, 27)
      .lineTo(27, 16)
      .lineTo(34, 27)
      .lineTo(27, 38)
      .closePath()
      .fill(0xc3a978)
      .circle(27, 27, 3)
      .fill(0xffe6a8);
    button.addChild(rune);

    const text = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: "Georgia",
        fontSize: 24,
        fontWeight: "bold",
        fill: 0xf2e5c4,
        letterSpacing: 1
      })
    });
    text.x = 52;
    text.y = 11;
    button.addChild(text);

    const state = {
      button,
      hovered: false,
      pressed: false,
      clickElapsed: 0,
      pendingAction: null
    };
    this.menuButtons.push(state);

    button.on("pointerover", () => {
      state.hovered = true;
      drawButton(true, state.pressed);
    });
    button.on("pointerout", () => {
      state.hovered = false;
      state.pressed = false;
      drawButton(false);
    });
    button.on("pointerdown", () => {
      state.pressed = true;
      drawButton(state.hovered, true);
    });
    button.on("pointerup", () => {
      state.pressed = false;
      drawButton(state.hovered);
    });
    button.on("pointerupoutside", () => {
      state.pressed = false;
      drawButton(state.hovered);
    });
    button.on("pointertap", () => {
      if (state.pendingAction) {
        return;
      }
      state.clickElapsed = 0;
      state.pendingAction = action;
    });
    this.container.addChild(button);
  }

  openModal(titleText, bodyText) {
    if (this.modal) {
      return;
    }

    this.modal = new Container();

    const shade = new Graphics()
      .rect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      .fill({ color: 0x000000, alpha: 0.72 });
    shade.eventMode = "static";
    this.modal.addChild(shade);

    const isStory = titleText === "História";
    const panelWidth = isStory ? 720 : 460;
    const panelHeight = isStory ? 552 : 290;

    const panel = new Container();
    panel.x = (GAME_WIDTH - panelWidth) / 2;
    panel.y = (GAME_HEIGHT - panelHeight) / 2;

    const panelBackground = new Sprite(new Texture({
      source: this.paperUiTexture.source,
      frame: new Rectangle(8, 144, 112, 84)
    }));
    panelBackground.width = panelWidth;
    panelBackground.height = panelHeight;
    panel.addChild(panelBackground);
    panel.addChild(
      new Graphics()
        .rect(0, 0, panelWidth, panelHeight)
        .stroke({ width: 3, color: 0x755b3b })
    );

    const title = new Text({
      text: titleText,
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: isStory ? 34 : 28,
        fill: 0x493522,
        fontWeight: "bold"
      })
    });
    title.anchor.set(isStory ? 0.5 : 0);
    title.x = isStory ? panelWidth / 2 : 24;
    title.y = isStory ? 42 : 20;
    panel.addChild(title);

    const body = new Text({
      text: bodyText,
      style: new TextStyle({
        fontFamily: isStory ? "Georgia" : "monospace",
        fontSize: isStory ? 17 : 18,
        fill: 0x493522,
        wordWrap: true,
        wordWrapWidth: isStory ? 620 : 412,
        lineHeight: isStory ? 24 : 27,
        align: isStory ? "center" : "left"
      })
    });
    body.anchor.set(isStory ? 0.5 : 0);
    body.x = isStory ? panelWidth / 2 : 24;
    body.y = isStory ? 280 : 70;
    panel.addChild(body);

    const closeButton = new Container();
    closeButton.eventMode = "static";
    closeButton.cursor = "pointer";
    closeButton.x = isStory ? panelWidth / 2 - 58 : 320;
    closeButton.y = isStory ? panelHeight - 68 : 225;

    const closeBackground = new Sprite(new Texture({
      source: this.paperUiTexture.source,
      frame: new Rectangle(96, 80, 112, 32)
    }));
    closeBackground.width = 116;
    closeBackground.height = 42;
    closeButton.addChild(closeBackground);
    closeButton.addChild(
      new Graphics()
        .rect(0, 0, 116, 42)
        .stroke({ width: 2, color: 0x755b3b })
    );

    const closeText = new Text({
      text: "Fechar",
      style: new TextStyle({
        fontFamily: "monospace",
        fontSize: 20,
        fill: 0x493522
      })
    });
    closeText.x = 20;
    closeText.y = 8;
    closeButton.addChild(closeText);

    closeButton.on("pointerover", () => {
      closeBackground.tint = 0xe7d2a6;
    });
    closeButton.on("pointerout", () => {
      closeBackground.tint = 0xffffff;
    });
    closeButton.on("pointertap", () => this.closeModal());
    panel.addChild(closeButton);

    this.modal.addChild(panel);
    this.container.addChild(this.modal);
  }

  closeModal() {
    if (!this.modal) {
      return;
    }
    this.container.removeChild(this.modal);
    this.modal.destroy({ children: true });
    this.modal = null;
  }

  update(deltaTime) {
    for (const state of this.menuButtons) {
      if (state.pendingAction) {
        state.clickElapsed += deltaTime;
        const pulse = Math.sin(Math.min(1, state.clickElapsed / 0.14) * Math.PI);
        state.button.scale.set(1 - pulse * 0.08);

        if (state.clickElapsed >= 0.14) {
          const action = state.pendingAction;
          state.pendingAction = null;
          action();
          return;
        }
        continue;
      }

      const targetScale = state.pressed ? 0.96 : state.hovered ? 1.04 : 1;
      const scale = state.button.scale.x +
        (targetScale - state.button.scale.x) * Math.min(1, deltaTime * 14);
      state.button.scale.set(scale);
    }
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.container.destroy({ children: true });
  }
}
