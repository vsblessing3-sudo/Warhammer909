export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Clear all particles
  clear() {
    this.particles = [];
  }

  // Update all particles with physics, life decay
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;

      if (p.rotationSpeed) {
        p.rotation = (p.rotation || 0) + p.rotationSpeed * dt;
      }

      // Size scale decay
      if (p.scaleDecay) {
        p.size = Math.max(0, p.size - p.scaleDecay * dt);
      }
    }
  }

  // Render all active particles
  render(ctx, camera) {
    for (const p of this.particles) {
      const screen = camera.worldToScreen(p.x, p.y);
      if (
        screen.x < -40 || screen.x > camera.viewportWidth + 40 ||
        screen.y < -40 || screen.y > camera.viewportHeight + 40
      ) {
        continue;
      }

      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'circle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.lineTo(screen.x - p.vx * 0.04, screen.y - p.vy * 0.04);
        ctx.stroke();
      } else if (p.type === 'shell') {
        ctx.translate(screen.x, screen.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(-2, -1, 4, 2);
      } else if (p.type === 'smoke') {
        ctx.fillStyle = p.color || 'rgba(120, 140, 160, 0.4)';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'text') {
        ctx.font = 'bold 12px "Orbitron", sans-serif';
        ctx.fillStyle = p.color || '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, screen.x, screen.y);
      }

      ctx.restore();
    }
  }

  // --- SPAWN HELPERS ---

  // Muzzle flash sparks + ejected brass shell
  spawnMuzzleFlash(x, y, angle, facing) {
    // Ejected casing
    this.particles.push({
      type: 'shell',
      x: x - facing * 8,
      y: y - 2,
      vx: -facing * (80 + Math.random() * 40),
      vy: -(120 + Math.random() * 60),
      gravity: 500,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 20,
      life: 0.6,
      maxLife: 0.6
    });

    // Muzzle sparks
    for (let i = 0; i < 6; i++) {
      const spd = 120 + Math.random() * 140;
      const spread = (Math.random() - 0.5) * 0.5;
      this.particles.push({
        type: 'spark',
        x: x + Math.cos(angle) * 12,
        y: y + Math.sin(angle) * 12,
        vx: Math.cos(angle + spread) * spd,
        vy: Math.sin(angle + spread) * spd,
        color: Math.random() > 0.3 ? '#ffe680' : '#ff9900',
        size: 1.5,
        life: 0.08 + Math.random() * 0.06,
        maxLife: 0.14
      });
    }
  }

  // Hit impact sparks
  spawnHitSparks(x, y, color = '#ffcc00') {
    for (let i = 0; i < 8; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      this.particles.push({
        type: 'spark',
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color,
        size: 1.5,
        life: 0.15 + Math.random() * 0.1,
        maxLife: 0.25
      });
    }
  }

  // Steam pressure release puff (Enemybot detection)
  spawnSteam(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'smoke',
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 60,
        vy: -(60 + Math.random() * 70),
        size: 4 + Math.random() * 6,
        color: Math.random() > 0.4 ? 'rgba(220, 245, 255, 0.6)' : 'rgba(100, 220, 255, 0.4)',
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        scaleDecay: -4 // Expands as it rises
      });
    }
  }

  // Cyan core charge particles converging towards chest
  spawnCyanCharge(targetX, targetY, count = 6) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 30;
      const px = targetX + Math.cos(ang) * dist;
      const py = targetY + Math.sin(ang) * dist;
      this.particles.push({
        type: 'circle',
        x: px, y: py,
        vx: -Math.cos(ang) * (dist * 2.5),
        vy: -Math.sin(ang) * (dist * 2.5),
        color: '#00e5ff',
        size: 2.5,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  // Massive explosion (Explosive crates, robot destruction)
  spawnExplosion(x, y, radius = 90) {
    // 1. Fireball blast
    for (let i = 0; i < 24; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * (radius * 1.8);
      this.particles.push({
        type: 'smoke',
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 30,
        size: 10 + Math.random() * 16,
        color: Math.random() > 0.5 ? 'rgba(255, 80, 20, 0.8)' : 'rgba(255, 180, 40, 0.8)',
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        scaleDecay: -8
      });
    }

    // 2. Lingering dark smoke
    for (let i = 0; i < 15; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 60;
      this.particles.push({
        type: 'smoke',
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 50,
        size: 14 + Math.random() * 14,
        color: 'rgba(30, 35, 40, 0.6)',
        life: 0.7 + Math.random() * 0.5,
        maxLife: 1.2,
        scaleDecay: -5
      });
    }

    // 3. Shrapnel & debris
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 220;
      this.particles.push({
        type: 'spark',
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: Math.random() > 0.4 ? '#ffaa00' : '#ffffff',
        size: 2,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6
      });
    }
  }

  // Floating combat text / damage number
  spawnDamageText(x, y, text, color = '#ff3333') {
    this.particles.push({
      type: 'text',
      text: text,
      x: x + (Math.random() - 0.5) * 10,
      y: y - 10,
      vx: (Math.random() - 0.5) * 20,
      vy: -50,
      color: color,
      life: 0.7,
      maxLife: 0.7
    });
  }
}
