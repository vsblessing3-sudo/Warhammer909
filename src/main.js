import { Input } from './engine/Input.js';
import { Camera } from './engine/Camera.js';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { sound } from './engine/Audio.js';
import { Marine } from './entities/Marine.js';
import { Level } from './world/Level.js';
import { Parallax } from './world/Parallax.js';
import { HUD } from './ui/HUD.js';
import { Menu } from './ui/Menu.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.input = new Input(this.canvas);
    this.camera = new Camera(960, 540);
    this.particles = new ParticleSystem();
    this.sound = sound;

    this.hud = new HUD();
    this.menu = new Menu(this);

    // Game state: 'menu', 'playing', 'paused', 'gameover', 'victory'
    this.state = 'menu';

    this.projectiles = [];
    this.player = null;
    this.level = null;
    this.parallax = null;

    // Assets
    this.spriteFrames = { marine: {}, enemybot1: {} };
    this.envAssets = {};

    // Checkpoint
    this.checkpoint = { x: 80, y: 350 };
    this.hasActiveSave = false;

    // Mission Stats & Scoring
    this.stats = {
      score: 0,
      shotsFired: 0,
      shotsHit: 0,
      kills: 0,
      startTime: 0,
      endTime: 0
    };
    this.highScore = 10000;
    this.recentPlays = [];

    // Main menu cinematic backdrop
    this.cinematicImg = new Image();
    this.cinematicImg.src = '/assets/environment/scene_cinematic.png';

    // Fixed timestep loop
    this.lastTime = 0;
    this.fixedDt = 1 / 60;
    this.accumulator = 0;

    this.init();
  }

  async init() {
    await this.loadAssets();

    // Setup Parallax with Sky and Midground Skyline
    this.parallax = new Parallax(this.envAssets.bgSky, this.envAssets.bgSkyline);

    // Load High Score & Recent Plays Save Data
    const savedHighScore = localStorage.getItem('w909_high_score');
    if (savedHighScore !== null) {
      this.highScore = parseInt(savedHighScore, 10) || 10000;
    } else {
      this.highScore = 10000;
      localStorage.setItem('w909_high_score', '10000');
    }

    const savedPlays = localStorage.getItem('w909_recent_plays');
    if (savedPlays) {
      try {
        this.recentPlays = JSON.parse(savedPlays);
      } catch (e) {
        this.recentPlays = [];
      }
    }
    if (!this.recentPlays || this.recentPlays.length === 0) {
      // Default classified tactical records
      this.recentPlays = [
        { id: 'OP-909-03', date: '21:15', score: 12500, outcome: 'VICTORY', kills: 4, accuracy: '82%', time: '02:45' },
        { id: 'OP-909-02', date: '20:40', score: 7800, outcome: 'KIA (COMBAT)', kills: 2, accuracy: '75%', time: '01:50' },
        { id: 'OP-909-01', date: '19:20', score: 3200, outcome: 'KIA (FALL)', kills: 1, accuracy: '60%', time: '00:55' }
      ];
      localStorage.setItem('w909_recent_plays', JSON.stringify(this.recentPlays));
    }

    // Check saved checkpoint
    const savedCp = localStorage.getItem('w909_checkpoint');
    if (savedCp) {
      try {
        this.checkpoint = JSON.parse(savedCp);
        this.hasActiveSave = true;
      } catch (e) {
        this.hasActiveSave = false;
      }
    }
    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue && !this.hasActiveSave) {
      btnContinue.style.opacity = '0.5';
    }

    // Start loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  async loadAssets() {
    try {
      const res = await fetch('/assets/sprites/animations.json');
      const manifest = await res.json();

      // 1. Load Marine Sprites
      for (const animName in manifest.marine) {
        this.spriteFrames.marine[animName] = [];
        for (const fname of manifest.marine[animName]) {
          const img = new Image();
          img.src = `/assets/sprites/marine/${fname}`;
          this.spriteFrames.marine[animName].push(img);
        }
      }

      // 2. Load Enemybot1 Sprites
      for (const animName in manifest.enemybot1) {
        this.spriteFrames.enemybot1[animName] = [];
        for (const fname of manifest.enemybot1[animName]) {
          const img = new Image();
          img.src = `/assets/sprites/enemybot1/${fname}`;
          this.spriteFrames.enemybot1[animName].push(img);
        }
      }

      // 3. Load Environment Assets
      const loadImg = (path) => {
        const img = new Image();
        img.src = path;
        return img;
      };

      this.envAssets = {
        bgSky: loadImg('/assets/environment/bg_sky_panoramic.png'),
        bgSkyline: loadImg('/assets/environment/bg_city_skyline1.png'),
        platformHoverLarge: loadImg('/assets/environment/platform_hover_large.png'),
        platformHoverSmall: loadImg('/assets/environment/platform_hover_small.png'),
        metalWalkway: loadImg('/assets/environment/metal_walkway.png'),
        crateStack: loadImg('/assets/environment/crate_stack.png'),
        crateHazard: loadImg('/assets/environment/crate_hazard.png'),
        crateAmmo: loadImg('/assets/environment/crate_ammo.png'),
        pickupDatacube: loadImg('/assets/environment/pickup_datacube.png'),
        doorB03: loadImg('/assets/environment/door_b03_clean.png'),
        baseEntrance: loadImg('/assets/environment/base_entrance_01.png'),
        dockTerminal: loadImg('/assets/environment/dock_terminal.png'),
        streetLamp: loadImg('/assets/environment/street_lamp.png'),
        eagleBanner: loadImg('/assets/environment/eagle_banner.png')
      };
    } catch (e) {
      console.warn('Asset manifest loading warning:', e);
    }
  }

  addScore(points, x = null, y = null, label = null) {
    this.stats.score += points;
    if (x !== null && y !== null) {
      const text = label ? `+${points} ${label}` : `+${points} PTS`;
      this.particles.spawnDamageText(x, y - 20, text, '#ffcc00');
    }
  }

  startNewGame() {
    this.checkpoint = { x: 80, y: 350 };
    this.stats = {
      score: 0,
      shotsFired: 0,
      shotsHit: 0,
      kills: 0,
      startTime: performance.now(),
      endTime: 0
    };
    const fallBanner = document.getElementById('fall-gameover-banner');
    if (fallBanner) fallBanner.classList.add('hidden');

    this.initLevel(this.checkpoint.x, this.checkpoint.y);
    this.state = 'playing';
    this.menu.hideAll();
    this.hud.show();
    this.sound.playTerminalBeep();
  }

  continueGame() {
    this.stats = {
      score: 0,
      shotsFired: 0,
      shotsHit: 0,
      kills: 0,
      startTime: performance.now(),
      endTime: 0
    };
    const fallBanner = document.getElementById('fall-gameover-banner');
    if (fallBanner) fallBanner.classList.add('hidden');

    this.initLevel(this.checkpoint.x, this.checkpoint.y);
    this.state = 'playing';
    this.menu.hideAll();
    this.hud.show();
    this.sound.playTerminalBeep();
  }

  initLevel(spawnX, spawnY) {
    this.projectiles = [];
    this.particles.clear();

    this.level = new Level(this.envAssets, this.spriteFrames);
    this.player = new Marine(spawnX, spawnY, this.spriteFrames.marine);

    this.camera.x = spawnX - this.camera.viewportWidth / 2;
    this.camera.y = spawnY - this.camera.viewportHeight / 2;
  }

  setCheckpoint(x, y) {
    this.checkpoint = { x, y: y - 10 };
    this.hasActiveSave = true;
    localStorage.setItem('w909_checkpoint', JSON.stringify(this.checkpoint));
    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue) btnContinue.style.opacity = '1.0';
    this.addScore(500, x, y - 40, 'CHECKPOINT SYNC');
  }

  restartCheckpoint() {
    const fallBanner = document.getElementById('fall-gameover-banner');
    if (fallBanner) fallBanner.classList.add('hidden');

    this.stats.score = Math.max(0, this.stats.score - 500); // Small penalty on restart
    this.initLevel(this.checkpoint.x, this.checkpoint.y);
    this.state = 'playing';
    this.menu.hideAll();
    this.hud.show();
  }

  pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.menu.showScreen('pause');
      this.sound.playTerminalBeep();
    }
  }

  resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.menu.hideAll();
      this.sound.playTerminalBeep();
    }
  }

  returnToMainMenu() {
    const fallBanner = document.getElementById('fall-gameover-banner');
    if (fallBanner) fallBanner.classList.add('hidden');

    this.state = 'menu';
    this.menu.showScreen('main');
    this.hud.hide();
    this.hud.hideTerminal();
  }

  showTerminalDialog(title, message, callback) {
    this.hud.showTerminalDialog(title, message, callback);
  }

  handleGameOver(outcome, causeText) {
    if (this.state !== 'playing') return;
    this.state = 'gameover';
    this.sound.playGameOverSound();

    this.stats.endTime = performance.now();
    const durationSec = Math.max(1, Math.round((this.stats.endTime - this.stats.startTime) / 1000));
    const mins = String(Math.floor(durationSec / 60)).padStart(2, '0');
    const secs = String(durationSec % 60).padStart(2, '0');
    const timeStr = `${mins}:${secs}`;
    const acc = this.stats.shotsFired > 0 ? Math.round((this.stats.shotsHit / this.stats.shotsFired) * 100) : 100;

    // Check high score
    const isNewHigh = this.stats.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.stats.score;
      localStorage.setItem('w909_high_score', String(this.highScore));
      this.sound.playHighScoreChime();
    }

    // Save recent play record
    const runRecord = {
      id: `OP-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: this.stats.score,
      outcome: outcome,
      kills: this.stats.kills,
      accuracy: `${acc}%`,
      time: timeStr
    };
    this.recentPlays.unshift(runRecord);
    if (this.recentPlays.length > 10) this.recentPlays.pop();
    localStorage.setItem('w909_recent_plays', JSON.stringify(this.recentPlays));

    setTimeout(() => {
      const fallBanner = document.getElementById('fall-gameover-banner');
      if (fallBanner) fallBanner.classList.add('hidden');
      this.menu.showGameOverScreen(causeText, this.stats.score, this.highScore, isNewHigh, outcome);
    }, 1300);
  }

  completeMission() {
    this.state = 'victory';
    this.hud.hide();
    this.hud.hideTerminal();

    this.stats.endTime = performance.now();
    const durationSec = Math.max(1, Math.round((this.stats.endTime - this.stats.startTime) / 1000));
    const mins = String(Math.floor(durationSec / 60)).padStart(2, '0');
    const secs = String(durationSec % 60).padStart(2, '0');
    const timeStr = `${mins}:${secs}`;
    const acc = this.stats.shotsFired > 0 ? Math.round((this.stats.shotsHit / this.stats.shotsFired) * 100) : 100;

    // Award victory bonus points
    this.addScore(5000);

    const isNewHigh = this.stats.score > this.highScore;
    if (isNewHigh) {
      this.highScore = this.stats.score;
      localStorage.setItem('w909_high_score', String(this.highScore));
      this.sound.playHighScoreChime();
    }

    const runRecord = {
      id: `OP-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: this.stats.score,
      outcome: 'VICTORY',
      kills: this.stats.kills,
      accuracy: `${acc}%`,
      time: timeStr
    };
    this.recentPlays.unshift(runRecord);
    if (this.recentPlays.length > 10) this.recentPlays.pop();
    localStorage.setItem('w909_recent_plays', JSON.stringify(this.recentPlays));

    this.menu.showVictoryScreen(this.stats, this.highScore, isNewHigh, timeStr, acc);
  }

  gameLoop(currentTime) {
    requestAnimationFrame((t) => this.gameLoop(t));

    if (!this.lastTime) this.lastTime = currentTime;
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap delta time to avoid spiral of death on tab freeze
    if (dt > 0.1) dt = 0.1;

    // ESC key toggle pause
    if (this.input.pause) {
      if (this.hud.isTerminalOpen()) {
        this.hud.hideTerminal();
      } else if (this.state === 'playing') {
        this.pauseGame();
      } else if (this.state === 'paused') {
        this.resumeGame();
      }
    }

    if (this.state === 'playing') {
      this.accumulator += dt;
      while (this.accumulator >= this.fixedDt) {
        this.fixedUpdate(this.fixedDt);
        this.accumulator -= this.fixedDt;
      }
    }

    this.render();
  }

  fixedUpdate(dt) {
    // 1. Update Input camera offset
    this.input.update(this.camera);

    // 2. Interact key (E)
    if (this.input.interact) {
      if (this.hud.isTerminalOpen()) {
        this.hud.hideTerminal();
      } else if (this.level && this.level.terminals) {
        for (const term of this.level.terminals) {
          if (term.isNear(this.player)) {
            term.interact(this);
            break;
          }
        }
      }
    }

    // If dialogue is open, player controls are paused
    if (!this.hud.isTerminalOpen()) {
      // 3. Update Player
      if (this.player) {
        const prevAmmo = this.player.magazineAmmo;
        this.player.update(
          dt,
          this.input,
          this.level.platforms,
          this.projectiles,
          this.level.enemies,
          this.level.crates,
          this.particles,
          this.sound,
          this.camera
        );

        if (this.player.magazineAmmo < prevAmmo) {
          this.stats.shotsFired++;
        }

        // Instant Death Fall Damage: check if Marine falls below screen into abyss (y > 520)
        if (!this.player.isDead && this.player.y > 520) {
          this.player.die(this.particles, this.sound, 'fall');
          this.camera.addTrauma(0.7);

          // Trigger prominent on-screen "GAME OVER" sign immediately
          const fallBanner = document.getElementById('fall-gameover-banner');
          if (fallBanner) fallBanner.classList.remove('hidden');

          this.handleGameOver('KIA (FALL)', 'FATAL ABYSS FALL // CRITICAL IMPACT');
        }

        // Check if player died from enemy combat
        if (this.player.isDead && this.state === 'playing') {
          this.handleGameOver('KIA (COMBAT)', 'AEGIS COMBAT PROTOCOL // FATAL CASUALTY');
        }
      }

      // 4. Update Level & Enemies
      if (this.level) {
        const prevDead = this.level.enemies.filter((e) => e.isDead).length;
        this.level.update(dt, this.player, this.projectiles, this.particles, this.sound, this.camera);
        const currDead = this.level.enemies.filter((e) => e.isDead).length;
        if (currDead > prevDead) {
          const diff = currDead - prevDead;
          this.stats.kills += diff;

          // Award score based on enemy type
          if (this.level.heavyBotBoss && this.level.heavyBotBoss.isDead && !this.level.heavyBotBoss._scoreAwarded) {
            this.level.heavyBotBoss._scoreAwarded = true;
            this.addScore(2500, this.level.heavyBotBoss.x, this.level.heavyBotBoss.y - 40, 'BOSS ELIMINATED');
          } else {
            this.addScore(250 * diff, this.player ? this.player.x : 0, this.player ? this.player.y - 40 : 0, 'BOT DESTROYED');
          }
        }

        // Check exploded crates to award score
        for (const crate of this.level.crates) {
          if (crate.isExploded && !crate._scoreAwarded) {
            crate._scoreAwarded = true;
            this.addScore(150, crate.x + crate.width / 2, crate.y, 'HAZARD CRATE');
          }
        }

        // Check collected pickups to award score
        for (const pickup of this.level.pickups) {
          if (pickup.isCollected && !pickup._scoreAwarded) {
            pickup._scoreAwarded = true;
            this.addScore(100, pickup.x + 12, pickup.y, 'SUPPLIES');
          }
        }
      }

      // 5. Update Projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.update(
          dt,
          this.level.platforms,
          this.level.enemies,
          this.player,
          this.level.crates,
          this.particles,
          this.sound
        );
        if (p.isDead) {
          if (p.owner === 'marine') {
            this.stats.shotsHit++;
          }
          this.projectiles.splice(i, 1);
        }
      }

      // 6. Update Camera
      if (this.player) {
        this.camera.update(
          dt,
          this.player,
          this.player.facing,
          this.player.isAiming,
          this.player.aimAngle
        );
      }
    }

    // 7. Update Particles & Parallax
    this.particles.update(dt);
    if (this.parallax) {
      this.parallax.update(dt);
    }

    // 8. Update HUD with player, level, and game stats
    this.hud.update(this.player, this.level, this);

    // 9. Reset single-tick key triggers (ensures jump, punch, reload, interact are reliably processed)
    this.input.clearJustPressed();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === 'menu') {
      // Cinematic animated title screen
      if (this.cinematicImg && this.cinematicImg.complete) {
        this.ctx.drawImage(this.cinematicImg, 0, 0, this.canvas.width, this.canvas.height);
      }
      // Dark vignette & scanlines
      this.ctx.fillStyle = 'rgba(5, 10, 16, 0.45)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    // 1. Parallax Sky & Background
    if (this.parallax) {
      this.parallax.render(this.ctx, this.camera);
    }

    // 2. Level Environment & Enemies
    if (this.level) {
      this.level.render(this.ctx, this.camera, this.player);
    }

    // 3. Projectiles
    for (const p of this.projectiles) {
      p.render(this.ctx, this.camera);
    }

    // 4. Player Marine
    if (this.player) {
      this.player.render(this.ctx, this.camera);
    }

    // 5. Particles & FX
    this.particles.render(this.ctx, this.camera);
  }
}

// Bootstrap on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
