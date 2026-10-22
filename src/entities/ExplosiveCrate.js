import { Physics } from '../engine/Physics.js';

export class ExplosiveCrate {
  constructor(x, y, width = 48, height = 48, image = null) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;

    this.isTriggered = false;
    this.isExploded = false;
    this.fuseTime = 1.0;
    this.fuseTimer = 0;
    this.flashRate = 0.15;
    this.flashTimer = 0;
    this.flashState = false;

    this.explosionRadius = 130;
    this.enemyDamage = 16;
    this.playerDamage = 6;
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      offsetX: 0,
      offsetY: 0
    };
  }

  onHit(damage, particles, sound) {
    if (this.isTriggered || this.isExploded) return;
    this.isTriggered = true;
    this.fuseTimer = this.fuseTime;
    sound.playTerminalBeep();
  }

  update(dt, enemies, player, crates, particles, sound, camera) {
    if (this.isExploded) return;

    if (this.isTriggered) {
      this.fuseTimer -= dt;
      this.flashTimer += dt;

      // Faster flashing as fuse nears 0
      const currentRate = Math.max(0.04, this.fuseTimer * 0.12);
      if (this.flashTimer >= currentRate) {
        this.flashTimer = 0;
        this.flashState = !this.flashState;
        if (this.flashState) {
          particles.spawnHitSparks(this.x + this.width / 2, this.y + 4, '#ff2222');
        }
      }

      if (this.fuseTimer <= 0) {
        this.detonate(enemies, player, crates, particles, sound, camera);
      }
    }
  }

  detonate(enemies, player, crates, particles, sound, camera) {
    this.isExploded = true;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    sound.playExplosion();
    camera.addTrauma(0.7);
    particles.spawnExplosion(centerX, centerY, this.explosionRadius);

    // 1. Damage & Knockback to Enemies
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const eBox = enemy.getHitbox();
      const eCenterX = eBox.x + eBox.width / 2;
      const eCenterY = eBox.y + eBox.height / 2;
      const dx = eCenterX - centerX;
      const dy = eCenterY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist < this.explosionRadius) {
        const falloff = 1 - (dist / this.explosionRadius) * 0.4;
        const dmg = Math.round(this.enemyDamage * falloff);
        const knockDir = dx >= 0 ? 1 : -1;
        enemy.takeDamage(dmg, knockDir, particles, sound);
      }
    }

    // 2. Damage & Knockback to Marine
    if (player && !player.isDead) {
      const pBox = player.getHitbox();
      const pCenterX = pBox.x + pBox.width / 2;
      const pCenterY = pBox.y + pBox.height / 2;
      const dx = pCenterX - centerX;
      const dy = pCenterY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist < this.explosionRadius) {
        const falloff = 1 - (dist / this.explosionRadius) * 0.5;
        const dmg = Math.round(this.playerDamage * falloff);
        const knockDir = dx >= 0 ? 1 : -1;
        player.takeDamage(dmg, knockDir, particles, sound);
      }
    }

    // 3. Chain reaction to other nearby explosive crates
    if (crates) {
      for (const other of crates) {
        if (other !== this && !other.isExploded && !other.isTriggered) {
          const oBox = other.getHitbox();
          const oCenterX = oBox.x + oBox.width / 2;
          const oCenterY = oBox.y + oBox.height / 2;
          const dist = Math.hypot(oCenterX - centerX, oCenterY - centerY);
          if (dist < this.explosionRadius * 0.85) {
            other.onHit(10, particles, sound);
          }
        }
      }
    }
  }

  render(ctx, camera) {
    if (this.isExploded) return;
    const screen = camera.worldToScreen(this.x, this.y);

    ctx.save();
    if (this.image && this.image.complete) {
      ctx.drawImage(this.image, screen.x, screen.y, this.width, this.height);
    } else {
      // Procedural pixel hazard crate
      ctx.fillStyle = '#1e2832';
      ctx.fillRect(screen.x, screen.y, this.width, this.height);
      ctx.strokeStyle = '#3b4e60';
      ctx.lineWidth = 2;
      ctx.strokeRect(screen.x, screen.y, this.width, this.height);

      // Yellow hazard chevrons
      ctx.fillStyle = '#ffaa00';
      for (let i = 4; i < this.width - 8; i += 12) {
        ctx.beginPath();
        ctx.moveTo(screen.x + i, screen.y + this.height - 6);
        ctx.lineTo(screen.x + i + 6, screen.y + this.height - 6);
        ctx.lineTo(screen.x + i + 10, screen.y + this.height - 18);
        ctx.lineTo(screen.x + i + 4, screen.y + this.height - 18);
        ctx.fill();
      }
    }

    // Warning Beacon on top
    if (this.isTriggered && this.flashState) {
      ctx.fillStyle = '#ff2222';
      ctx.shadowColor = '#ff2222';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(screen.x + this.width / 2, screen.y + 6, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#551111';
      ctx.beginPath();
      ctx.arc(screen.x + this.width / 2, screen.y + 6, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
