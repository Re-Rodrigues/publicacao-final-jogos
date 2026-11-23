export class InputSystem {
  constructor() {
    this.keys = new Set();
    this.pressedKeys = new Set();

    this.handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      this.keys.add(key);
      if (!event.repeat) {
        this.pressedKeys.add(key);
      }
    };

    this.handleKeyUp = (event) => {
      this.keys.delete(event.key.toLowerCase());
    };

    this.handleBlur = () => {
      this.keys.clear();
    };

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
  }

  isDown(key) {
    return this.keys.has(key);
  }

  consumePressed(key) {
    if (!this.pressedKeys.has(key)) {
      return false;
    }
    this.pressedKeys.delete(key);
    return true;
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
    this.keys.clear();
    this.pressedKeys.clear();
  }
}
