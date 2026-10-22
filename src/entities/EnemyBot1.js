import { Physics } from '../engine/Physics.js';

export class EnemyBot1 {
  constructor(x, y, spriteFrames = {}) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.spriteFrames = spriteFrames;

    // Dimensions
    this.width = 46;
    this.height = 72;

    // Health (20 HP as specified)
    this.maxHealth = 20;
    this.health = 20;
    this.isDead = false;

    // Movement (Slow & heavy, cannot jump)
    this.walkSpeed = 58;
    this.facing = -1; // -1 = left, 1 = right
    this.patrolStartX = x - 120;
    this.patrolEndX = x + 120;
    this.isGrounded = false;
    this.gravity = 980;

    // Combat Stats
    this.sweepDamage = 2; // Normal sweep: 2 HP
    this.chargeDamage = 5; // Charged attack: 5 HP
    this.detectionRange = 360;
    this.meleeRange = 60;

    // State Machine
    // 'idle', 'patrol', 'alert', 'pursue', 'sweep_windup', 'sweep_attack', 'charge_windup', 'charge_attack', 'recovery'
    this.state = 'patrol';
    this.stateTimer = 0;
    this.attackCooldownTimer = 1.0;
    this.hasHitPlayer = false;

    // Footstep audio timer
    this.stepTimer = 0;

    // Animation Controller
    this.animState = 'idle';
    this.animFrame = 0;
    this.animTimer = 0;
  }

  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height,
      offsetX: this.width / 2,
      offsetY: this.height
    };
  }

  takeDamage(dmg, knockbackDir = 1, particles, sound) {
    if (this.isDead) return;

    this.health = Math.max(0, this.health - dmg);

    // Heavy bot has poise, slight knockback
    this.vx = knockbackDir * 50;

    particles.spawnDamageText(this.x, this.y - 50, `-${dmg}`, '#00e5ff');
    particles.spawnHitSparks(this.x, this.y - 35, '#00e5ff');

    // If damaged from idle/patrol, alert immediately
    if (this.state === 'patrol' || this.state === 'idle') {
      this.state = 'alert';
      this.stateTimer = 0.5;
      sound.playEnemySteam();
      particles.spawnSteam(this.x, this.y - 40, 8);
    }

    if (this.health <= 0) {
      this.die(particles, sound);
    }
  }

  die(particles, sound) {
    if (this.isDead) return;
    this.isDead = true;
    this.vx = 0;
    this.vy = 0;

    sound.playExplosion();
    particles.spawnExplosion(this.x, this.y - 35, 110);
  }

  update(dt, player, platforms, particles, sound, camera) {
    if (this.isDead) return;

    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= dt;
    }

    // Gravity (remains strictly grounded)
    this.vy += this.gravity * dt;
    Physics.moveAndCollide(this, dt, platforms);

    const distToPlayer = player && !player.isDead ? Math.hypot(player.x - this.x, player.y - this.y) : 9999;
    const dirToPlayer = player ? Math.sign(player.x - this.x) : this.facing;

    // State Machine
    switch (this.state) {
      case 'idle':
        this.vx = 0;
        this.stateTimer -= dt;
        if (distToPlayer < this.detectionRange) {
          this.triggerAlert(particles, sound);
        } else if (this.stateTimer <= 0) {
          this.state = 'patrol';
          this.facing *= -1;
        }
        break;

      case 'patrol':
        this.vx = this.facing * (this.walkSpeed * 0.6);
        if (this.facing > 0 && this.x >= this.patrolEndX) {
          this.state = 'idle';
          this.stateTimer = 1.2;
        } else if (this.facing < 0 && this.x <= this.patrolStartX) {
          this.state = 'idle';
          this.stateTimer = 1.2;
        }

        if (distToPlayer < this.detectionRange) {
          this.triggerAlert(particles, sound);
        }
        break;

      case 'alert':
        this.vx = 0;
        this.facing = dirToPlayer;
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'pursue';
        }
        break;

      case 'pursue':
        this.facing = dirToPlayer;
        this.vx = this.facing * this.walkSpeed;

        // Footstep sounds
        this.stepTimer += dt;
        if (this.stepTimer >= 0.38) {
          this.stepTimer = 0;
          sound.playRobotStep();
          camera.addTrauma(0.06);
        }

        // Check if within melee range
        if (distToPlayer <= this.meleeRange && Math.abs(player.y - this.y) < 50 && this.attackCooldownTimer <= 0) {
          // Choose between normal sweep (70%) and charged attack (30%)
          if (Math.random() < 0.35) {
            this.startChargedAttack(sound);
          } else {
            this.startSweepAttack();
          }
        }
        break;

      case 'sweep_windup':
        this.vx = 0;
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'sweep_attack';
          this.stateTimer = 0.25;
          this.hasHitPlayer = false;
        }
        break;

      case 'sweep_attack':
        this.vx = this.facing * 30; // slight forward lunge
        this.stateTimer -= dt;

        // Damage window
        if (!this.hasHitPlayer) {
          this.checkAttackHit(player, this.sweepDamage, 160, particles, sound, camera);
        }

        if (this.stateTimer <= 0) {
          this.state = 'recovery';
          this.stateTimer = 0.55;
          this.attackCooldownTimer = 1.2;
        }
        break;

      case 'charge_windup':
        this.vx = 0;
        this.stateTimer -= dt;
        particles.spawnCyanCharge(this.x, this.y - 40, 2);

        if (this.stateTimer <= 0) {
          this.state = 'charge_attack';
          this.stateTimer = 0.3;
          this.hasHitPlayer = false;
        }
        break;

      case 'charge_attack':
        this.vx = this.facing * 70; // heavy charge forward
        this.stateTimer -= dt;

        if (!this.hasHitPlayer) {
          this.checkAttackHit(player, this.chargeDamage, 280, particles, sound, camera, true);
        }

        if (this.stateTimer <= 0) {
          this.state = 'recovery';
          this.stateTimer = 0.85; // longer recovery after heavy attack
          this.attackCooldownTimer = 1.8;
        }
        break;

      case 'recovery':
        this.vx = 0;
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'pursue';
        }
        break;
    }

    // Animation update
    this.updateAnimation(dt);
  }

  triggerAlert(particles, sound) {
    this.state = 'alert';
    this.stateTimer = 0.6;
    sound.playEnemySteam();
    particles.spawnSteam(this.x, this.y - 45, 12);
  }

  startSweepAttack() {
    this.state = 'sweep_windup';
    this.stateTimer = 0.25;
  }

  startChargedAttack(sound) {
    this.state = 'charge_windup';
    this.stateTimer = 0.75; // longer warning windup as specified
    sound.playEnemyCharge();
  }

  checkAttackHit(player, damage, knockbackForce, particles, sound, camera, isCharged = false) {
    if (!player || player.isDead) return;

    const hitReach = isCharged ? 65 : 50;
    const hitBox = {
      x: this.facing > 0 ? this.x : this.x - hitReach,
      y: this.y - this.height * 0.85,
      width: hitReach,
      height: this.height * 0.7
    };

    if (Physics.intersects(hitBox, player.getHitbox())) {
      this.hasHitPlayer = true;
      player.takeDamage(damage, this.facing, particles, sound);
      camera.addTrauma(isCharged ? 0.45 : 0.2);

      if (isCharged) {
        particles.spawnHitSparks(player.x, player.y - 25, '#00e5ff');
        particles.spawnExplosion(player.x, player.y - 25, 40);
      }
    }
  }

  updateAnimation(dt) {
    let target = 'idle';

    if (this.state === 'charge_windup' || this.state === 'charge_attack') {
      target = 'charge';
    } else if (this.state === 'sweep_windup' || this.state === 'sweep_attack') {
      target = this.facing > 0 ? 'punch_right' : 'punch_left';
    } else if (Math.abs(this.vx) > 10) {
      target = 'walk';
    } else {
      target = this.facing > 0 ? 'turn_right' : 'turn_left';
    }

    if (this.animState !== target) {
      this.animState = target;
      this.animFrame = 0;
      this.animTimer = 0;
    } else {
      this.animTimer += dt;
      const speed = this.animState === 'charge' ? 0.12 : (this.animState.startsWith('punch') ? 0.08 : 0.1);
      if (this.animTimer >= speed) {
        this.animTimer = 0;
        const frames = this.spriteFrames[this.animState] || [];
        if (frames.length > 0) {
          if (this.animState.startsWith('punch') || this.animState === 'charge') {
            this.animFrame = Math.min(frames.length - 1, this.animFrame + 1);
          } else {
            this.animFrame = (this.animFrame + 1) % frames.length;
          }
        }
      }
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;

    const screen = camera.worldToScreen(this.x, this.y);

    ctx.save();
    ctx.translate(screen.x, screen.y);

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sprite frame
    const frames = this.spriteFrames[this.animState] || this.spriteFrames['turn_left'] || [];
    const frameImg = frames[this.animFrame] || frames[0];

    if (frameImg && frameImg.complete) {
      // Enemybot1 frame is 160x160 with anchor at bottom
      // Facing flip if needed
      if (this.facing > 0 && this.animState === 'walk') {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(frameImg, -80, -146);
    } else {
      // Procedural fallback
      ctx.fillStyle = '#3d4f3b'; // Olive green armor
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);

      // Cyan visor
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(this.facing > 0 ? 6 : -14, -this.height * 0.85, 8, 4);

      // Power Core
      if (this.state.startsWith('charge')) {
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.55, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Alert '!' Icon above head
    if (this.state === 'alert') {
      ctx.fillStyle = '#ff2222';
      ctx.font = 'bold 18px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -this.height - 12);
    }

    ctx.restore();
  }
}
