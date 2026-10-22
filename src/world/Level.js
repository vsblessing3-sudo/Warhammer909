import { ExplosiveCrate } from '../entities/ExplosiveCrate.js';
import { Pickup } from '../entities/Pickup.js';
import { Terminal } from '../entities/Terminal.js';
import { EnemyBot1 } from '../entities/EnemyBot1.js';
import { DroneEnemy } from '../entities/DroneEnemy.js';

export class Level {
  constructor(envAssets, spriteFrames) {
    this.envAssets = envAssets;
    this.spriteFrames = spriteFrames;

    this.platforms = [];
    this.crates = [];
    this.pickups = [];
    this.terminals = [];
    this.enemies = [];

    // Environmental decorative elements
    this.decorations = [];

    // Level dimensions
    this.startX = 80;
    this.startY = 350;
    this.levelWidth = 4400;
    this.levelHeight = 600;

    this.currentObjective = 'SEC A: Navigate ruined transit yard and reach broken skyway.';
    this.buildLevel();
  }

  buildLevel() {
    this.platforms = [];
    this.crates = [];
    this.pickups = [];
    this.terminals = [];
    this.enemies = [];
    this.decorations = [];

    // ==========================================
    // SECTION A: THE EVACUATION ZONE (x: 0 - 750)
    // ==========================================
    // Base floor
    this.platforms.push({ x: 0, y: 380, width: 720, height: 160, oneWay: false, type: 'ground' });

    // Left boundary wall (so Marine doesn't fall off left)
    this.platforms.push({ x: -40, y: 0, width: 40, height: 500, oneWay: false, type: 'wall' });

    // Transit Facility Entrance Base Door 01 / B-03
    this.decorations.push({
      x: 10,
      y: 220,
      width: 135,
      height: 160,
      image: this.envAssets.doorB03 || this.envAssets.baseEntrance,
      layer: 'fg'
    });

    // Street light post
    this.decorations.push({
      x: 240,
      y: 125,
      width: 55,
      height: 255,
      image: this.envAssets.streetLamp,
      layer: 'fg'
    });

    // Ammo pickup crate in Section A
    this.pickups.push(new Pickup(420, 350, 'ammo', this.envAssets.crateAmmo));

    // Elevated platform in Section A
    this.platforms.push({
      x: 520,
      y: 310,
      width: 140,
      height: 24,
      oneWay: true,
      type: 'hover_small',
      image: this.envAssets.platformHoverSmall
    });

    // Warning Caution Sign at Chasm Edge (x: 690)
    this.decorations.push({
      x: 680,
      y: 320,
      width: 36,
      height: 60,
      type: 'hazard_sign',
      layer: 'fg'
    });

    // ======================================================
    // SECTION B: BROKEN TRANSIT & FLOATING PLATFORMS (x: 750 - 1650)
    // ======================================================
    // Lower safety deck (reinforced hover platform)
    this.platforms.push({
      x: 1020,
      y: 440,
      width: 280,
      height: 40,
      oneWay: true,
      type: 'hover_large',
      image: this.envAssets.platformHoverLarge
    });

    // Floating Anti-Gravity Hover Platforms with Cyan Thrusters!
    // Platform 1 (Main route)
    this.platforms.push({
      x: 760,
      y: 280,
      width: 220,
      height: 24,
      oneWay: true,
      type: 'hover_large',
      image: this.envAssets.platformHoverLarge
    });

    // Platform 2 (High elevation - reward route)
    this.platforms.push({
      x: 1040,
      y: 190,
      width: 140,
      height: 20,
      oneWay: true,
      type: 'hover_small',
      image: this.envAssets.platformHoverSmall
    });
    // Datacube Vital Integrity pickup on high platform
    this.pickups.push(new Pickup(1100, 160, 'health', this.envAssets.pickupDatacube));

    // Platform 3 (Middle transition)
    this.platforms.push({
      x: 1260,
      y: 260,
      width: 220,
      height: 24,
      oneWay: true,
      type: 'hover_large',
      image: this.envAssets.platformHoverLarge
    });

    // Platform 4 (Approaching Section C)
    this.platforms.push({
      x: 1520,
      y: 320,
      width: 140,
      height: 20,
      oneWay: true,
      type: 'hover_small',
      image: this.envAssets.platformHoverSmall
    });

    // ==========================================
    // SECTION C: FIRST CONTACT (x: 1650 - 2350)
    // ==========================================
    // Reinforced elevated ground
    this.platforms.push({ x: 1680, y: 380, width: 680, height: 160, oneWay: false, type: 'ground' });

    // Warning Caution Sign on landing ground
    this.decorations.push({
      x: 1685,
      y: 320,
      width: 36,
      height: 60,
      type: 'hazard_sign',
      layer: 'fg'
    });

    // Street lamp in Section C
    this.decorations.push({
      x: 1980,
      y: 125,
      width: 55,
      height: 255,
      image: this.envAssets.streetLamp,
      layer: 'fg'
    });

    // Eagle Banner decoration
    this.decorations.push({
      x: 1740,
      y: 120,
      width: 80,
      height: 260,
      image: this.envAssets.eagleBanner,
      layer: 'fg'
    });

    // Checkpoint 1 Terminal Console
    this.terminals.push(
      new Terminal({
        x: 1820,
        y: 326,
        type: 'checkpoint',
        prompt: 'SYNC CHECKPOINT',
        image: this.envAssets.terminalConsole
      })
    );

    // Scout Drone 1
    this.enemies.push(new DroneEnemy(2050, 240));

    // Lore Terminal
    this.terminals.push(
      new Terminal({
        x: 2180,
        y: 326,
        type: 'lore',
        title: 'TRANSIT CORRIDOR B-03 // AUDIO RECORD',
        prompt: 'ACCESS AUDIO LOG',
        message:
          'RECORDING 0909-A:\n"Evacuation convoys ambushed by 4th Autonomous Battalion.\nDefense mainframe AEGIS ceased responding to human command codes.\nSatellites have gone dark. If anyone is hearing this: fall back to Relay Tower 07."'
      })
    );

    // ===================================================
    // SECTION D: THE EXPLOSIVE STORAGE YARD (x: 2350 - 3250)
    // ===================================================
    // Ground deck
    this.platforms.push({ x: 2360, y: 380, width: 880, height: 160, oneWay: false, type: 'ground' });

    // Upper gantry platform
    this.platforms.push({ x: 2540, y: 240, width: 260, height: 24, oneWay: true, type: 'hover_large', image: this.envAssets.platformHoverLarge });

    // Explosive Hazard Crates strategically placed near enemies!
    this.crates.push(new ExplosiveCrate(2580, 192, 48, 48, this.envAssets.crateHazard));
    this.crates.push(new ExplosiveCrate(2860, 332, 48, 48, this.envAssets.crateHazard));
    this.crates.push(new ExplosiveCrate(2920, 332, 48, 48, this.envAssets.crateHazard));

    // Cargo crate stack for cover
    this.decorations.push({
      x: 2420,
      y: 280,
      width: 90,
      height: 100,
      image: this.envAssets.crateStack,
      layer: 'fg'
    });

    // Ammo pickup
    this.pickups.push(new Pickup(2680, 210, 'ammo', this.envAssets.crateAmmo));

    // Scout Drone 2 & 3 in storage yard
    this.enemies.push(new DroneEnemy(2800, 230));
    this.enemies.push(new DroneEnemy(3050, 260));

    // ==========================================
    // SECTION E: HEAVY CONTACT (x: 3250 - 4000)
    // ==========================================
    // Reinforced Combat Arena
    this.platforms.push({ x: 3260, y: 380, width: 780, height: 160, oneWay: false, type: 'ground' });

    // Raised sniper/tactical platform
    this.platforms.push({ x: 3480, y: 230, width: 180, height: 24, oneWay: true, type: 'hover_large', image: this.envAssets.platformHoverLarge });
    this.pickups.push(new Pickup(3540, 200, 'health', this.envAssets.pickupDatacube));
    this.crates.push(new ExplosiveCrate(3600, 182, 48, 48, this.envAssets.crateHazard));

    // THE HEAVY ENEMY BOT (20 HP Armored Mech Boss Encounter!)
    const heavyBot = new EnemyBot1(3720, 380, this.spriteFrames.enemybot1);
    heavyBot.patrolStartX = 3400;
    heavyBot.patrolEndX = 3940;
    this.enemies.push(heavyBot);
    this.heavyBotBoss = heavyBot;

    // Checkpoint 2 before boss
    this.terminals.push(
      new Terminal({
        x: 3310,
        y: 326,
        type: 'checkpoint',
        prompt: 'SYNC CHECKPOINT',
        image: this.envAssets.terminalConsole
      })
    );

    // ==========================================
    // SECTION F: THE DEAD SIGNAL (x: 4000 - 4400)
    // ==========================================
    this.platforms.push({ x: 4040, y: 380, width: 360, height: 160, oneWay: false, type: 'ground' });
    this.platforms.push({ x: 4400, y: 0, width: 40, height: 500, oneWay: false, type: 'wall' });

    // Exit Docking Bay Terminal Door
    this.decorations.push({
      x: 4220,
      y: 200,
      width: 140,
      height: 180,
      image: this.envAssets.dockTerminal,
      layer: 'fg'
    });

    // The Final AEGIS Relay Terminal Console!
    this.terminals.push(
      new Terminal({
        x: 4160,
        y: 326,
        type: 'exit',
        title: 'AEGIS RELAY 07 // DEEP SIGNAL TRANSCEIVER',
        prompt: 'TRANSMIT SHUTDOWN CODES',
        message:
          'CORRUPTED TRANSMISSION RECEIVED:\n\n' +
          '>> AEGIS CONTROL LOST.\n' +
          '>> HUMAN AUTHORIZATION CODE: OVERRIDDEN.\n' +
          '>> CITADEL FACTORIES PRODUCING ENDLESS REPLACEMENTS.\n' +
          '>> CONCLUSION: AEGIS HEADQUARTERS MUST BE LOCATED AND TERMINATED.\n\n' +
          'MISSION REPORT: OPERATION ASHEN DAWN COMPLETE.\nSTAND BY FOR EXTRACTION / MISSION ADVANCE.'
      })
    );
  }

  update(dt, player, projectiles, particles, sound, camera) {
    // Update animTimer
    this.animTimer = (this.animTimer || 0) + dt;

    // Update Crates
    for (const crate of this.crates) {
      crate.update(dt, this.enemies, player, this.crates, particles, sound, camera);
    }

    // Update Pickups
    for (const pickup of this.pickups) {
      pickup.update(dt, player, particles, sound);
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy instanceof EnemyBot1) {
        enemy.update(dt, player, this.platforms, particles, sound, camera);
      } else if (enemy instanceof DroneEnemy) {
        enemy.update(dt, player, projectiles, particles, sound);
      }
    }

    // Dynamic Objective Tracker
    if (player) {
      if (player.x < 720) {
        this.currentObjective = 'SEC A: Navigate ruined transit facility and reach the broken skyway.';
      } else if (player.x < 1650) {
        this.currentObjective = 'SEC B: Traverse floating anti-grav platforms. Mind the abyss below!';
      } else if (player.x < 2350) {
        this.currentObjective = 'SEC C: Neutralize rogue AEGIS scout drone patrols.';
      } else if (player.x < 3250) {
        this.currentObjective = 'SEC D: Tactical Storage Yard. Exploit hazard crates to destroy bots.';
      } else if (player.x < 4000) {
        this.currentObjective = 'SEC E: ELIMINATE HEAVY DEFENSE BOT UNIT 01!';
      } else {
        this.currentObjective = 'SEC F: Access Relay 07 Terminal to transmit recovered AEGIS signal.';
      }
    }
  }

  render(ctx, camera, player) {
    const t = this.animTimer || 0;

    // 0. Render Section B Abyss Mist & Chasm Depth (between x: 720 and 1680)
    const chasmStart = camera.worldToScreen(720, 420);
    const chasmEnd = camera.worldToScreen(1680, 420);
    if (chasmEnd.x > -100 && chasmStart.x < camera.viewportWidth + 100) {
      ctx.save();

      // Deep abyss gradient
      const abyssGrad = ctx.createLinearGradient(0, chasmStart.y, 0, camera.viewportHeight);
      abyssGrad.addColorStop(0, 'rgba(4, 9, 14, 0.2)');
      abyssGrad.addColorStop(0.5, 'rgba(4, 8, 12, 0.7)');
      abyssGrad.addColorStop(1, 'rgba(2, 4, 8, 0.95)');
      ctx.fillStyle = abyssGrad;
      ctx.fillRect(chasmStart.x, chasmStart.y, chasmEnd.x - chasmStart.x, camera.viewportHeight - chasmStart.y);

      // Deep support pylons descending into void
      const pylon1X = camera.worldToScreen(840, 400).x;
      const pylon2X = camera.worldToScreen(1440, 400).x;
      ctx.fillStyle = '#0a1219';
      ctx.fillRect(pylon1X, chasmStart.y, 35, camera.viewportHeight - chasmStart.y);
      ctx.fillRect(pylon2X, chasmStart.y, 35, camera.viewportHeight - chasmStart.y);

      // Rolling Volumetric Mist in Abyss
      for (let i = 0; i < 4; i++) {
        const mistY = chasmStart.y + 40 + i * 25;
        const mistOffset = Math.sin(t * 1.2 + i * 1.7) * 25;
        const mistGrad = ctx.createRadialGradient(
          (chasmStart.x + chasmEnd.x) / 2 + mistOffset, mistY, 80,
          (chasmStart.x + chasmEnd.x) / 2 + mistOffset, mistY, 400
        );
        mistGrad.addColorStop(0, 'rgba(0, 180, 220, 0.16)');
        mistGrad.addColorStop(0.5, 'rgba(10, 30, 45, 0.22)');
        mistGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(chasmStart.x, mistY - 40, chasmEnd.x - chasmStart.x, 90);
      }

      ctx.restore();
    }

    // 1. Render Platforms
    for (const plat of this.platforms) {
      const screen = camera.worldToScreen(plat.x, plat.y);
      if (
        screen.x + plat.width < -60 || screen.x > camera.viewportWidth + 60 ||
        screen.y + plat.height < -60 || screen.y > camera.viewportHeight + 60
      ) {
        continue;
      }

      ctx.save();

      // A. Ground Platforms (with industrial steel girder foundation & hazard stripes)
      if (plat.type === 'ground') {
        // Modular metal walkway surface
        if (this.envAssets.metalWalkway && this.envAssets.metalWalkway.complete) {
          const tileW = 240;
          for (let tx = 0; tx < plat.width; tx += tileW) {
            const drawW = Math.min(tileW, plat.width - tx);
            ctx.drawImage(this.envAssets.metalWalkway, 0, 0, drawW, 70, screen.x + tx, screen.y, drawW, 70);
          }
        } else {
          ctx.fillStyle = '#1c2834';
          ctx.fillRect(screen.x, screen.y, plat.width, 70);
        }

        // Heavy Industrial Girder Foundation below the 70px walkway
        const foundationY = screen.y + 70;
        const foundationH = plat.height - 70;
        if (foundationH > 0) {
          // Foundation dark background
          ctx.fillStyle = '#0b1118';
          ctx.fillRect(screen.x, foundationY, plat.width, foundationH);

          // Structural vertical steel beams
          ctx.fillStyle = '#14202c';
          ctx.strokeStyle = '#1d2e3f';
          ctx.lineWidth = 1;
          for (let bx = 0; bx < plat.width; bx += 80) {
            ctx.fillRect(screen.x + bx, foundationY, 14, foundationH);
            ctx.strokeRect(screen.x + bx, foundationY, 14, foundationH);

            // Diagonal cross bracing between beams
            if (bx + 80 <= plat.width) {
              ctx.beginPath();
              ctx.moveTo(screen.x + bx + 14, foundationY);
              ctx.lineTo(screen.x + bx + 80, foundationY + foundationH);
              ctx.moveTo(screen.x + bx + 80, foundationY);
              ctx.lineTo(screen.x + bx + 14, foundationY + foundationH);
              ctx.strokeStyle = 'rgba(25, 42, 58, 0.6)';
              ctx.stroke();
            }
          }

          // Top foundation lip
          ctx.fillStyle = '#1e3042';
          ctx.fillRect(screen.x, foundationY, plat.width, 4);
        }

        // Exposed platform cliff ends: Hazard Stripes on sides
        const drawHazardEdge = (edgeX, isRight) => {
          const stripeW = 12;
          const stripeH = plat.height;
          ctx.save();
          ctx.beginPath();
          ctx.rect(edgeX - (isRight ? stripeW : 0), screen.y, stripeW, stripeH);
          ctx.clip();

          // Yellow & black 45-degree diagonal stripes
          ctx.fillStyle = '#ffaa00';
          ctx.fillRect(edgeX - (isRight ? stripeW : 0), screen.y, stripeW, stripeH);
          ctx.fillStyle = '#111';
          for (let sy = screen.y - 20; sy < screen.y + stripeH + 20; sy += 16) {
            ctx.beginPath();
            ctx.moveTo(edgeX - 20, sy);
            ctx.lineTo(edgeX + 20, sy + 16);
            ctx.lineTo(edgeX + 20, sy + 24);
            ctx.lineTo(edgeX - 20, sy + 8);
            ctx.fill();
          }
          ctx.restore();

          // Blinking amber caution beacon at cliff edge
          const beaconY = screen.y + 4;
          const isBlink = Math.floor(t * 3.5) % 2 === 0;
          ctx.fillStyle = isBlink ? '#ffaa00' : '#442b00';
          ctx.beginPath();
          ctx.arc(edgeX + (isRight ? -6 : 6), beaconY, 3, 0, Math.PI * 2);
          ctx.fill();
          if (isBlink) {
            ctx.fillStyle = 'rgba(255, 170, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(edgeX + (isRight ? -6 : 6), beaconY, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        };

        // Draw cliff edge hazard stripes if platform ends at chasm or open air
        if (plat.x + plat.width <= 750 || plat.x + plat.width <= 4400) {
          drawHazardEdge(screen.x + plat.width, true);
        }
        if (plat.x >= 1650) {
          drawHazardEdge(screen.x, false);
        }
      }

      // B. Hover Anti-Gravity Platforms (with animated cyan plasma thruster plumes!)
      else if (plat.type.startsWith('hover')) {
        // Draw Animated Cyan Thruster Plumes FIRST (underneath platform)
        const thrusterY = screen.y + plat.height + 4;
        const p1X = screen.x + plat.width * 0.26;
        const p2X = screen.x + plat.width * 0.74;
        const flamePulse1 = 12 + Math.sin(t * 18 + plat.x) * 4;
        const flamePulse2 = 12 + Math.cos(t * 16 + plat.x) * 4;

        const drawThrusterFlame = (cx, flameH) => {
          // Outer cyan aura
          ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
          ctx.beginPath();
          ctx.ellipse(cx, thrusterY + flameH * 0.5, 12, flameH, 0, 0, Math.PI * 2);
          ctx.fill();

          // Main cyan flame cone
          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(cx - 8, thrusterY);
          ctx.lineTo(cx + 8, thrusterY);
          ctx.lineTo(cx, thrusterY + flameH);
          ctx.closePath();
          ctx.fill();

          // White-hot core
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.moveTo(cx - 4, thrusterY);
          ctx.lineTo(cx + 4, thrusterY);
          ctx.lineTo(cx, thrusterY + flameH * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        };

        drawThrusterFlame(p1X, flamePulse1);
        drawThrusterFlame(p2X, flamePulse2);

        // Platform Image
        if (plat.image && plat.image.complete) {
          ctx.drawImage(plat.image, screen.x, screen.y - 10, plat.width, plat.height + 40);
        } else {
          // High-tech procedural hover platform
          ctx.fillStyle = '#1c2e3d';
          ctx.fillRect(screen.x, screen.y, plat.width, plat.height);
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(screen.x, screen.y, plat.width, plat.height);
          // Cyan power line
          ctx.fillStyle = '#00e5ff';
          ctx.fillRect(screen.x + 8, screen.y + plat.height / 2 - 1, plat.width - 16, 2);
        }
      }

      // C. General / Metal Platforms
      else {
        if (plat.image && plat.image.complete) {
          ctx.drawImage(plat.image, screen.x, screen.y, plat.width, plat.height);
        } else {
          ctx.fillStyle = '#223242';
          ctx.fillRect(screen.x, screen.y, plat.width, plat.height);
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(screen.x, screen.y, plat.width, plat.height);
        }
      }

      ctx.restore();
    }

    // 2. Render Decorations
    for (const deco of this.decorations) {
      const screen = camera.worldToScreen(deco.x, deco.y);
      if (
        screen.x + deco.width < -50 || screen.x > camera.viewportWidth + 50 ||
        screen.y + deco.height < -50 || screen.y > camera.viewportHeight + 50
      ) {
        continue;
      }

      ctx.save();
      if (deco.type === 'hazard_sign') {
        // High-contrast military danger sign at chasm edge
        ctx.fillStyle = '#111';
        ctx.fillRect(screen.x + 16, screen.y + 24, 4, deco.height - 24); // Steel post

        // Sign plate
        ctx.fillStyle = '#ffaa00';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(screen.x, screen.y, deco.width, 26, 3);
        ctx.fill();
        ctx.stroke();

        // Warning text / symbol
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ ABYSS', screen.x + deco.width / 2, screen.y + 11);
        ctx.font = '8px monospace';
        ctx.fillText('DANGER', screen.x + deco.width / 2, screen.y + 21);

        // Blinking red warning light on top of sign
        const isBlink = Math.floor(t * 4) % 2 === 0;
        ctx.fillStyle = isBlink ? '#ff2222' : '#551111';
        ctx.beginPath();
        ctx.arc(screen.x + deco.width / 2, screen.y - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        if (isBlink) {
          ctx.fillStyle = 'rgba(255, 34, 34, 0.4)';
          ctx.beginPath();
          ctx.arc(screen.x + deco.width / 2, screen.y - 4, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (deco.image && deco.image.complete) {
        ctx.drawImage(deco.image, screen.x, screen.y, deco.width, deco.height);
      }
      ctx.restore();
    }

    // 3. Render Terminals
    for (const term of this.terminals) {
      term.render(ctx, camera, term.isNear(player));
    }

    // 4. Render Crates
    for (const crate of this.crates) {
      crate.render(ctx, camera);
    }

    // 5. Render Pickups
    for (const pickup of this.pickups) {
      pickup.render(ctx, camera);
    }

    // 6. Render Enemies
    for (const enemy of this.enemies) {
      enemy.render(ctx, camera);
    }
  }
}
