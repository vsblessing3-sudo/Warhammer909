export class Camera {
  constructor(viewportWidth = 960, viewportHeight = 540) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    // Bounds of the level
    this.minX = 0;
    this.maxX = 4800;
    this.minY = -400;
    this.maxY = 400;

    // Shake
    this.trauma = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.shakeEnabled = true;

    // Lookahead
    this.lookaheadDist = 80;
    this.currentLookahead = 0;
  }

  addTrauma(amount) {
    if (!this.shakeEnabled) return;
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  update(dt, target, facingDirection, isAiming, aimAngle) {
    // Lookahead calculation
    let desiredLookahead = facingDirection * this.lookaheadDist;
    if (isAiming) {
      desiredLookahead = Math.cos(aimAngle) * (this.lookaheadDist * 1.4);
    }
    this.currentLookahead += (desiredLookahead - this.currentLookahead) * Math.min(1.0, dt * 4);

    // Target center
    this.targetX = target.x + this.currentLookahead - this.viewportWidth / 2;
    this.targetY = target.y - this.viewportHeight / 2 - 30; // slight upward lead for platforming

    // Smooth lerp
    const lerpSpeed = 7.0;
    this.x += (this.targetX - this.x) * Math.min(1.0, dt * lerpSpeed);
    this.y += (this.targetY - this.y) * Math.min(1.0, dt * lerpSpeed);

    // Clamp to level bounds
    this.x = Math.max(this.minX, Math.min(this.maxX - this.viewportWidth, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));

    // Screen Shake (quadratic trauma)
    if (this.trauma > 0 && this.shakeEnabled) {
      const shakeMag = this.trauma * this.trauma * 18;
      const angle = Math.random() * Math.PI * 2;
      this.shakeOffsetX = Math.cos(angle) * shakeMag;
      this.shakeOffsetY = Math.sin(angle) * shakeMag;

      this.trauma = Math.max(0, this.trauma - dt * 2.2);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  // World to screen coordinate transformation for rendering
  worldToScreen(wx, wy) {
    return {
      x: wx - this.x + this.shakeOffsetX,
      y: wy - this.y + this.shakeOffsetY
    };
  }

  // Screen to world transformation
  screenToWorld(sx, sy) {
    return {
      x: sx + this.x - this.shakeOffsetX,
      y: sy + this.y - this.shakeOffsetY
    };
  }
}
