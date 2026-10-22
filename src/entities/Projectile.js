import { Physics } from '../engine/Physics.js';

export class Projectile {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.vx = options.vx;
    this.vy = options.vy;
    this.damage = options.damage || 3;
    this.owner = options.owner || 'marine'; // 'marine' or 'enemy'
    this.color = options.color || '#ffcc00';
    this.length = options.length || 14;
    this.life = options.life || 1.8;
    this.maxLife = this.life;
    this.radius = options.radius || 3;
    this.isDead = false;
  }

  getHitbox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
      offsetX: 0,
      offsetY: 0
    };
  }

  update(dt, platforms, enemies, player, crates, particles, sound) {
    if (this.isDead) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
      return;
    }

    const prevX = this.x;
    const prevY = this.y;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const box = this.getHitbox();

    // 1. Check solid platform collision
    for (const plat of platforms) {
      if (plat.oneWay) continue; // Bullets pass through thin hover rails or hit top
      if (Physics.intersects(box, plat)) {
        this.isDead = true;
        particles.spawnHitSparks(this.x, this.y, this.color);
        return;
      }
    }

    // 2. Check Explosive Crates
    if (crates) {
      for (const crate of crates) {
        if (!crate.isExploded && Physics.intersects(box, crate.getHitbox())) {
          this.isDead = true;
          crate.onHit(this.damage, particles, sound);
          particles.spawnHitSparks(this.x, this.y, '#ffaa00');
          return;
        }
      }
    }

    // 3. Player bullet vs Enemies
    if (this.owner === 'marine') {
      for (const enemy of enemies) {
        if (!enemy.isDead && Physics.intersects(box, enemy.getHitbox())) {
          this.isDead = true;
          const knockbackDir = this.vx > 0 ? 1 : -1;
          enemy.takeDamage(this.damage, knockbackDir, particles, sound);
          particles.spawnHitSparks(this.x, this.y, '#00e5ff');
          return;
        }
      }
    }

    // 4. Enemy bullet vs Player
    if (this.owner === 'enemy' && player && !player.isDead) {
      if (Physics.intersects(box, player.getHitbox())) {
        this.isDead = true;
        const knockbackDir = this.vx > 0 ? 1 : -1;
        player.takeDamage(this.damage, knockbackDir, particles, sound);
        particles.spawnHitSparks(this.x, this.y, '#ff3333');
        return;
      }
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;
    const screen = camera.worldToScreen(this.x, this.y);

    // Calculate bullet angle
    const angle = Math.atan2(this.vy, this.vx);

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.rotate(angle);

    if (this.owner === 'marine') {
      // Golden/amber tracer line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-this.length, 0);
      ctx.stroke();

      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-this.length * 0.7, 0);
      ctx.stroke();
    } else {
      // Cyan glowing plasma bolt
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
