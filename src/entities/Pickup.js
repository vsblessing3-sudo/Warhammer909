import { Physics } from '../engine/Physics.js';

export class Pickup {
  constructor(x, y, type = 'ammo', image = null) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.type = type; // 'ammo' or 'health'
    this.image = image;
    this.width = 24;
    this.height = 24;
    this.isCollected = false;
    this.bobTimer = Math.random() * Math.PI * 2;
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

  update(dt, player, particles, sound) {
    if (this.isCollected) return;

    this.bobTimer += dt * 3.5;
    this.y = this.baseY + Math.sin(this.bobTimer) * 4;

    if (player && !player.isDead) {
      if (Physics.intersects(this.getHitbox(), player.getHitbox())) {
        this.collect(player, particles, sound);
      }
    }
  }

  collect(player, particles, sound) {
    if (this.isCollected) return;

    if (this.type === 'ammo') {
      if (player.reserveAmmo >= player.maxReserveAmmo) return;
      player.addAmmo(15);
      particles.spawnDamageText(this.x + 12, this.y, '+15 AMMO', '#ffe066');
    } else if (this.type === 'health') {
      if (player.health >= player.maxHealth) return;
      player.heal(6);
      particles.spawnDamageText(this.x + 12, this.y, '+6 HP', '#00ffaa');
    }

    this.isCollected = true;
    sound.playPickup();
    particles.spawnHitSparks(this.x + 12, this.y + 12, '#00e5ff');
  }

  render(ctx, camera) {
    if (this.isCollected) return;
    const screen = camera.worldToScreen(this.x, this.y);

    ctx.save();
    // Halo glow
    ctx.fillStyle = this.type === 'ammo' ? 'rgba(255, 204, 0, 0.25)' : 'rgba(0, 229, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(screen.x + this.width / 2, screen.y + this.height / 2, 14, 0, Math.PI * 2);
    ctx.fill();

    if (this.image && this.image.complete) {
      ctx.drawImage(this.image, screen.x, screen.y, this.width, this.height);
    } else {
      ctx.fillStyle = this.type === 'ammo' ? '#ffcc00' : '#00e5ff';
      ctx.fillRect(screen.x + 2, screen.y + 2, this.width - 4, this.height - 4);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(screen.x + 2, screen.y + 2, this.width - 4, this.height - 4);

      // Icon
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.type === 'ammo' ? 'A' : '+', screen.x + this.width / 2, screen.y + 16);
    }
    ctx.restore();
  }
}
