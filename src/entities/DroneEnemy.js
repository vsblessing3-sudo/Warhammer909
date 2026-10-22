import { Physics } from '../engine/Physics.js';
import { Projectile } from './Projectile.js';

export class DroneEnemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.width = 30;
    this.height = 20;

    this.maxHealth = 6;
    this.health = 6;
    this.isDead = false;

    this.hoverTimer = Math.random() * Math.PI * 2;
    this.detectionRange = 380;
    this.fireRange = 320;
    this.fireCooldown = 2.2;
    this.fireTimer = Math.random() * 1.5;

    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
  }

  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
      offsetX: this.width / 2,
      offsetY: this.height / 2
    };
  }

  takeDamage(dmg, knockbackDir = 1, particles, sound) {
    if (this.isDead) return;

    this.health = Math.max(0, this.health - dmg);
    this.vx = knockbackDir * 70;
    this.vy = -40;

    particles.spawnDamageText(this.x, this.y - 15, `-${dmg}`, '#00e5ff');
    particles.spawnHitSparks(this.x, this.y, '#00e5ff');

    if (this.health <= 0) {
      this.die(particles, sound);
    }
  }

  die(particles, sound) {
    if (this.isDead) return;
    this.isDead = true;

    sound.playExplosion();
    particles.spawnExplosion(this.x, this.y, 60);
  }

  update(dt, player, projectiles, particles, sound) {
    if (this.isDead) return;

    this.hoverTimer += dt * 3;
    const hoverOffset = Math.sin(this.hoverTimer) * 6;

    // Decelerate knockback
    this.vx *= Math.max(0, 1 - dt * 4);
    this.vy *= Math.max(0, 1 - dt * 4);

    this.x += this.vx * dt;
    this.y = this.baseY + hoverOffset + this.vy * dt;

    if (!player || player.isDead) return;

    const dx = player.x - this.x;
    const dy = (player.y - 25) - this.y;
    const dist = Math.hypot(dx, dy);

    this.facing = dx >= 0 ? 1 : -1;

    // AI combat firing
    if (dist <= this.detectionRange) {
      // Gentle patrol drift toward preferred range
      if (dist > 180) {
        this.baseX = (this.baseX || this.x) + Math.sign(dx) * 35 * dt;
        this.x += Math.sign(dx) * 35 * dt;
      }

      this.fireTimer += dt;
      if (this.fireTimer >= this.fireCooldown && dist <= this.fireRange) {
        this.fireTimer = 0;
        this.shoot(dx, dy, dist, projectiles, sound);
      }
    }
  }

  shoot(dx, dy, dist, projectiles, sound) {
    const angle = Math.atan2(dy, dx);
    const speed = 280;

    projectiles.push(
      new Projectile({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: 2,
        owner: 'enemy',
        radius: 3,
        color: '#00e5ff'
      })
    );

    sound.playDroneShot();
  }

  render(ctx, camera) {
    if (this.isDead) return;

    const screen = camera.worldToScreen(this.x, this.y);

    ctx.save();
    ctx.translate(screen.x, screen.y);

    // Drone Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 45, 12, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Drone Body (Metallic dark grey + glowing cyan eye)
    ctx.fillStyle = '#222e38';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.strokeStyle = '#445b70';
    ctx.lineWidth = 1;
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Glowing Cyan Optical Sensor
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.facing * 5, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Drone Thruster Jet
    ctx.fillStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(-4, this.height / 2);
    ctx.lineTo(4, this.height / 2);
    ctx.lineTo(0, this.height / 2 + 6 + Math.random() * 4);
    ctx.fill();

    ctx.restore();
  }
}
