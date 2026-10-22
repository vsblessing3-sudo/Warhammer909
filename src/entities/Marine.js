import { Physics } from '../engine/Physics.js';
import { Projectile } from './Projectile.js';

export class Marine {
  constructor(x, y, spriteFrames = {}) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.spriteFrames = spriteFrames;

    // Dimensions & Hitbox (standard standing)
    this.normalWidth = 28;
    this.normalHeight = 58;
    this.crouchHeight = 36;
    this.isCrouching = false;

    // Movement Parameters
    this.moveSpeed = 195;
    this.crouchSpeed = 100;
    this.accel = 1200;
    this.friction = 1400;
    this.gravity = 980;
    this.jumpForce = -420;

    // Facing & Aiming
    this.facing = 1; // 1 = right, -1 = left
    this.isAiming = false;
    this.aimAngle = 0; // in radians

    // Grounding & Jump assistance
    this.isGrounded = false;
    this.isCollidingWall = false;
    this.coyoteTime = 0.12;
    this.coyoteTimer = 0;
    this.jumpBufferTime = 0.12;
    this.jumpBufferTimer = 0;

    // Health & Combat stats (as specified)
    this.maxHealth = 20;
    this.health = 20;
    this.gunDamage = 3;
    this.punchDamage = 2;

    // Ammunition (5 rounds per magazine, 60 reserve)
    this.magazineCapacity = 5;
    this.magazineAmmo = 5;
    this.maxReserveAmmo = 60;
    this.reserveAmmo = 60;

    // Reloading (2.0 seconds)
    this.reloadDuration = 2.0;
    this.isReloading = false;
    this.reloadTimer = 0;

    // Fire rate
    this.fireCooldown = 0.22;
    this.fireTimer = 0;

    // Melee Punch
    this.isPunching = false;
    this.punchDuration = 0.35;
    this.punchTimer = 0;
    this.punchCooldown = 0.45;
    this.punchCooldownTimer = 0;
    this.punchHitDealt = false;

    // Invulnerability & Damage
    this.invulnDuration = 0.8;
    this.invulnTimer = 0;
    this.isDead = false;

    // Animation State
    this.animState = 'idle';
    this.animFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 0.1; // seconds per frame
  }

  getHitbox() {
    const h = this.isCrouching ? this.crouchHeight : this.normalHeight;
    const w = this.normalWidth;
    return {
      x: this.x - w / 2,
      y: this.y - h,
      width: w,
      height: h,
      offsetX: w / 2,
      offsetY: h
    };
  }

  // Check if headroom allows standing up safely
  canStandUp(platforms) {
    if (!this.isCrouching) return true;
    const standingBox = {
      x: this.x - this.normalWidth / 2,
      y: this.y - this.normalHeight,
      width: this.normalWidth,
      height: this.normalHeight
    };
    for (const plat of platforms) {
      if (!plat.oneWay && Physics.intersects(standingBox, plat)) {
        return false;
      }
    }
    return true;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  addAmmo(amount) {
    this.reserveAmmo = Math.min(this.maxReserveAmmo, this.reserveAmmo + amount);
  }

  takeDamage(dmg, knockbackDir = 1, particles, sound) {
    if (this.isDead || this.invulnTimer > 0) return;

    this.health = Math.max(0, this.health - dmg);
    this.invulnTimer = this.invulnDuration;

    // Knockback
    this.vx = knockbackDir * 180;
    this.vy = -160;

    sound.playHurt();
    particles.spawnDamageText(this.x, this.y - 40, `-${dmg} HP`, '#ff2222');
    particles.spawnHitSparks(this.x, this.y - 25, '#ff4444');

    if (this.health <= 0) {
      this.die(particles, sound, 'combat');
    }
  }

  die(particles, sound, cause = 'combat') {
    if (this.isDead) return;
    this.isDead = true;
    this.deathCause = cause;
    this.health = 0;
    this.vx = 0;
    this.vy = 0;

    if (cause === 'fall') {
      sound.playFallDeath();
      particles.spawnDamageText(this.x, this.y - 30, 'FATAL FALL // SIGNAL LOST', '#ff2222');
      particles.spawnExplosion(this.x, this.y - 20, 80);
    } else {
      // Explode on death as specified in Marine brief
      sound.playExplosion();
      particles.spawnExplosion(this.x, this.y - 25, 90);
    }
  }

  update(dt, input, platforms, projectiles, enemies, crates, particles, sound, camera) {
    if (this.isDead) return;

    // Timers
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.fireTimer > 0) this.fireTimer -= dt;
    if (this.punchCooldownTimer > 0) this.punchCooldownTimer -= dt;

    // 1. Aiming Logic (Right Mouse Button held or firing)
    this.isAiming = input.aim;
    const muzzleY = this.y - (this.isCrouching ? 20 : 34);

    // Calculate angle from character center to cursor to prevent feedback oscillation
    const toMouseX = input.mouse.worldX - this.x;
    const toMouseY = input.mouse.worldY - muzzleY;
    this.aimAngle = Math.atan2(toMouseY, toMouseX);

    // If aiming or shooting, orient facing direction toward mouse cursor (supports backward aiming)
    if (this.isAiming || input.shoot) {
      if (Math.abs(toMouseX) > 4) {
        this.facing = toMouseX >= 0 ? 1 : -1;
      }
    }

    // 2. Crouching Logic (S key)
    if (input.crouch) {
      this.isCrouching = true;
    } else {
      if (this.canStandUp(platforms)) {
        this.isCrouching = false;
      }
    }

    // 3. Horizontal Movement (A / D)
    const currentMaxSpeed = this.isCrouching ? this.crouchSpeed : this.moveSpeed;
    let moveDir = 0;
    if (input.moveLeft) moveDir -= 1;
    if (input.moveRight) moveDir += 1;

    if (moveDir !== 0) {
      if (!this.isAiming && !input.shoot) {
        this.facing = moveDir;
      }
      this.vx += moveDir * this.accel * dt;
      if (Math.abs(this.vx) > currentMaxSpeed) {
        this.vx = Math.sign(this.vx) * currentMaxSpeed;
      }
    } else {
      // Friction deceleration
      if (this.vx > 0) {
        this.vx = Math.max(0, this.vx - this.friction * dt);
      } else if (this.vx < 0) {
        this.vx = Math.min(0, this.vx + this.friction * dt);
      }
    }

    // 4. Jumping & Gravity (W key)
    if (this.isGrounded) {
      this.coyoteTimer = this.coyoteTime;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (input.jumpJustPressed) {
      this.jumpBufferTimer = this.jumpBufferTime;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // Execute jump if buffer and coyote are active, and not crouching
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.isCrouching) {
      this.vy = this.jumpForce;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.isGrounded = false;
      sound.playJump();
      particles.spawnSteam(this.x, this.y, 4);
    }

    // Apply gravity
    this.vy += this.gravity * dt;

    // 5. Physics Collision & Position Update
    Physics.moveAndCollide(this, dt, platforms);

    // 6. Reloading Logic (R key)
    if (input.reload && !this.isReloading && this.magazineAmmo < this.magazineCapacity && this.reserveAmmo > 0) {
      this.isReloading = true;
      this.reloadTimer = this.reloadDuration;
      sound.playReload();
    }

    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const needed = this.magazineCapacity - this.magazineAmmo;
        const transfer = Math.min(needed, this.reserveAmmo);
        this.magazineAmmo += transfer;
        this.reserveAmmo -= transfer;
        this.isReloading = false;
      }
    }

    // 7. Shooting Logic (Left Mouse Button)
    if (input.shoot && this.fireTimer <= 0 && !this.isReloading && !this.isPunching) {
      if (this.magazineAmmo > 0) {
        this.shoot(projectiles, particles, sound, camera);
      } else if (input.shootJustPressed) {
        // Auto-reload on empty trigger
        if (!this.isReloading && this.reserveAmmo > 0) {
          this.isReloading = true;
          this.reloadTimer = this.reloadDuration;
          sound.playReload();
        }
      }
    }

    // 8. Melee Punch (Q key)
    if (input.punch && !this.isPunching && this.punchCooldownTimer <= 0) {
      this.isPunching = true;
      this.punchTimer = this.punchDuration;
      this.punchCooldownTimer = this.punchCooldown;
      this.punchHitDealt = false;
      sound.playPunch();
    }

    if (this.isPunching) {
      this.punchTimer -= dt;

      // Active attack damage window (in the middle of the punch)
      if (!this.punchHitDealt && this.punchTimer < this.punchDuration * 0.7 && this.punchTimer > this.punchDuration * 0.2) {
        this.checkPunchHitbox(enemies, crates, particles, sound);
      }

      if (this.punchTimer <= 0) {
        this.isPunching = false;
      }
    }

    // 9. Update Animations
    this.updateAnimation(dt, moveDir);
  }

  shoot(projectiles, particles, sound, camera) {
    this.magazineAmmo -= 1;
    this.fireTimer = this.fireCooldown;

    const muzzleY = this.y - (this.isCrouching ? 20 : 34);
    const muzzleX = this.x + this.facing * 18;

    // Shot travels directly along aimAngle toward mouse cursor
    const shotAngle = this.aimAngle;

    // Small bolter recoil
    this.vx -= Math.cos(shotAngle) * 45;

    const bulletSpeed = 920;
    projectiles.push(
      new Projectile({
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(shotAngle) * bulletSpeed,
        vy: Math.sin(shotAngle) * bulletSpeed,
        damage: this.gunDamage,
        owner: 'marine',
        color: '#ffcc00'
      })
    );

    sound.playBolterShot();
    camera.addTrauma(0.18);
    particles.spawnMuzzleFlash(muzzleX, muzzleY, shotAngle, this.facing);
  }

  checkPunchHitbox(enemies, crates, particles, sound) {
    const punchBox = {
      x: this.facing > 0 ? this.x : this.x - 36,
      y: this.y - (this.isCrouching ? 32 : 46),
      width: 36,
      height: 32
    };

    // Damage enemies
    for (const enemy of enemies) {
      if (!enemy.isDead && Physics.intersects(punchBox, enemy.getHitbox())) {
        enemy.takeDamage(this.punchDamage, this.facing, particles, sound);
        this.punchHitDealt = true;
        sound.playPunch();
        particles.spawnHitSparks(punchBox.x + 18, punchBox.y + 16, '#ffcc00');
        break;
      }
    }

    // Damage crates
    if (crates) {
      for (const crate of crates) {
        if (!crate.isExploded && Physics.intersects(punchBox, crate.getHitbox())) {
          crate.onHit(this.punchDamage, particles, sound);
          this.punchHitDealt = true;
          break;
        }
      }
    }
  }

  updateAnimation(dt, moveDir) {
    let targetAnim = 'idle';

    if (this.isPunching) {
      targetAnim = 'punch';
    } else if (this.fireTimer > 0) {
      targetAnim = 'fire';
    } else if (this.isAiming) {
      targetAnim = 'aim';
    } else if (!this.isGrounded) {
      targetAnim = 'jump';
    } else if (this.isCrouching) {
      targetAnim = 'crouch';
    } else if (Math.abs(this.vx) > 15) {
      targetAnim = this.facing > 0 ? 'move_right' : 'move_left';
    } else {
      targetAnim = this.facing > 0 ? 'idle_right' : 'idle_left';
    }

    if (this.animState !== targetAnim) {
      this.animState = targetAnim;
      this.animFrame = 0;
      this.animTimer = 0;
    } else {
      this.animTimer += dt;
      const speed = this.animState === 'punch' ? 0.04 : (this.animState === 'fire' ? 0.04 : 0.09);
      if (this.animTimer >= speed) {
        this.animTimer = 0;
        const frames = this.spriteFrames[this.animState] || [];
        if (frames.length > 0) {
          if (this.animState === 'punch' || this.animState === 'fire') {
            this.animFrame = Math.min(frames.length - 1, this.animFrame + 1);
          } else if (this.animState === 'jump') {
            // Jump animation frame maps to vertical velocity arc
            if (this.vy < -200) this.animFrame = 2; // Rise
            else if (this.vy < 50) this.animFrame = 4; // Apex
            else this.animFrame = 6; // Descent
          } else if (this.animState === 'aim' || this.animState === 'fire') {
            // Map aim elevation angle (-pi/2 to pi/2) to the 8 directional frames
            // Frames 0..7 are sorted monotonically from steep up (-39 deg) to down (+33 deg)
            let normAngle = this.aimAngle;
            if (this.facing < 0) {
              normAngle = Math.PI - normAngle;
              if (normAngle > Math.PI) normAngle -= Math.PI * 2;
              if (normAngle < -Math.PI) normAngle += Math.PI * 2;
            }
            // normAngle < 0 is aiming up, normAngle > 0 is aiming down
            // Clamped to range [-0.7, 0.7] radians (~ -40 deg to +40 deg)
            const clamped = Math.max(-1, Math.min(1, normAngle / 0.7));
            // Map -1 (steep up) -> frame 0, 0 (horizontal) -> frame 5, +1 (steep down) -> frame 7
            this.animFrame = Math.max(0, Math.min(7, Math.round((clamped + 1) * 3.5)));
          } else {
            this.animFrame = (this.animFrame + 1) % frames.length;
          }
        }
      }
    }
  }

  render(ctx, camera) {
    if (this.isDead) return;

    // Invulnerability blink
    if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 16) % 2 === 0) {
      return;
    }

    const screen = camera.worldToScreen(this.x, this.y);

    ctx.save();
    ctx.translate(screen.x, screen.y);

    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Get active sprite image
    const frames = this.spriteFrames[this.animState] || this.spriteFrames['idle'] || [];
    const frameImg = frames[this.animFrame] || frames[0];

    if (frameImg && frameImg.complete) {
      // Draw Marine frame canvas (128x128 with anchor bottom at 114)
      // Isolate context scaling with ctx.save/restore so flip never leaks into subsequent rendering!
      ctx.save();
      if (this.facing < 0 && (this.animState !== 'move_left' && this.animState !== 'idle_left')) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(frameImg, -64, -114);
      ctx.restore();
    } else {
      // Fallback procedural marine if sprites are loading
      const h = this.isCrouching ? this.crouchHeight : this.normalHeight;
      ctx.fillStyle = '#2b5066'; // Power armor teal
      ctx.fillRect(-this.normalWidth / 2, -h, this.normalWidth, h);
      // Gold trim
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(-this.normalWidth / 2, -h, this.normalWidth, 4);
      // Gun barrel
      ctx.fillStyle = '#111';
      ctx.fillRect(0, -h * 0.6, this.facing * 20, 6);
    }

    // Aim Laser Guide Line (subtle tactical laser when aiming - perfectly aligns in world space)
    if (this.isAiming) {
      const muzzleY = -(this.isCrouching ? 20 : 34);
      const muzzleX = this.facing * 18;
      const targetDist = 180;
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(muzzleX, muzzleY);
      ctx.lineTo(
        muzzleX + Math.cos(this.aimAngle) * targetDist,
        muzzleY + Math.sin(this.aimAngle) * targetDist
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}
