export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.justPressed = {};

    // Spacebar jump option (configurable in settings)
    this.spaceJumpEnabled = true;
    const savedSpaceJump = localStorage.getItem('w909_space_jump');
    if (savedSpaceJump !== null) {
      this.spaceJumpEnabled = savedSpaceJump === '1';
    }

    this.mouse = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      leftDown: false,
      leftPressed: false,
      rightDown: false,
      rightPressed: false
    };

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys[code]) {
        this.keys[code] = true;
        this.justPressed[code] = true;
      }
      // Prevent browser scrolling and default actions on game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.justPressed[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.justPressed = {};
      this.mouse.leftDown = false;
      this.mouse.leftPressed = false;
      this.mouse.rightDown = false;
      this.mouse.rightPressed = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.leftDown = true;
        this.mouse.leftPressed = true;
      } else if (e.button === 2) {
        this.mouse.rightDown = true;
        this.mouse.rightPressed = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.leftDown = false;
      } else if (e.button === 2) {
        this.mouse.rightDown = false;
      }
    });

    // Prevent context menu globally on the game window to allow uninterrupted right-click aiming
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  update(camera) {
    // Convert screen coordinates to world coordinates
    this.mouse.worldX = this.mouse.x + camera.x;
    this.mouse.worldY = this.mouse.y + camera.y;
  }

  // Called at the end of each fixedUpdate tick to reset single-frame trigger flags
  clearJustPressed() {
    this.justPressed = {};
    this.mouse.leftPressed = false;
    this.mouse.rightPressed = false;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  isJustPressed(code) {
    return !!this.justPressed[code];
  }

  // Convenient control getters
  get moveLeft() {
    return this.isDown('KeyA') || this.isDown('ArrowLeft');
  }

  get moveRight() {
    return this.isDown('KeyD') || this.isDown('ArrowRight');
  }

  get jump() {
    return this.isDown('KeyW') || this.isDown('ArrowUp') || (this.spaceJumpEnabled && this.isDown('Space'));
  }

  get jumpJustPressed() {
    return this.isJustPressed('KeyW') || this.isJustPressed('ArrowUp') || (this.spaceJumpEnabled && this.isJustPressed('Space'));
  }

  get crouch() {
    return this.isDown('KeyS') || this.isDown('ArrowDown');
  }

  get aim() {
    return this.mouse.rightDown;
  }

  get shoot() {
    return this.mouse.leftDown;
  }

  get shootJustPressed() {
    return this.mouse.leftPressed;
  }

  get reload() {
    return this.isJustPressed('KeyR');
  }

  get punch() {
    return this.isJustPressed('KeyQ');
  }

  get interact() {
    return this.isJustPressed('KeyE');
  }

  get pause() {
    return this.isJustPressed('Escape');
  }
}
