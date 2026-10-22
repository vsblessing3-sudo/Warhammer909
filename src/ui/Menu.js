export class Menu {
  constructor(game) {
    this.game = game;
    this.overlay = document.getElementById('menu-overlay');

    // Screens
    this.screens = {
      main: document.getElementById('main-menu'),
      pause: document.getElementById('pause-menu'),
      records: document.getElementById('records-menu'),
      settings: document.getElementById('settings-menu'),
      controls: document.getElementById('controls-menu'),
      intel: document.getElementById('intel-menu'),
      gameover: document.getElementById('gameover-menu'),
      victory: document.getElementById('victory-menu')
    };

    this.previousScreen = 'main';
    this.setupListeners();
    this.loadSettings();
  }

  showScreen(screenName) {
    this.overlay.style.display = 'flex';
    for (const key in this.screens) {
      if (this.screens[key]) {
        if (key === screenName) {
          this.screens[key].classList.add('active');
          this.screens[key].classList.remove('hidden');
        } else {
          this.screens[key].classList.remove('active');
          this.screens[key].classList.add('hidden');
        }
      }
    }

    if (screenName === 'records') {
      this.populateRecordsScreen();
    }
  }

  hideAll() {
    this.overlay.style.display = 'none';
    for (const key in this.screens) {
      if (this.screens[key]) {
        this.screens[key].classList.remove('active');
        this.screens[key].classList.add('hidden');
      }
    }
  }

  setupListeners() {
    // Helper to add click sound
    const addClick = (id, fn) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => {
          this.game.sound.playTerminalBeep();
          fn();
        });
      }
    };

    // Main Menu
    addClick('btn-new-game', () => {
      this.game.startNewGame();
    });

    addClick('btn-continue', () => {
      this.game.continueGame();
    });

    addClick('btn-highscores', () => {
      this.previousScreen = 'main';
      this.showScreen('records');
    });

    addClick('btn-settings', () => {
      this.previousScreen = 'main';
      this.showScreen('settings');
    });

    addClick('btn-controls', () => {
      this.previousScreen = 'main';
      this.showScreen('controls');
    });

    addClick('btn-intel', () => {
      this.previousScreen = 'main';
      this.showScreen('intel');
    });

    // Pause Menu
    addClick('btn-resume', () => {
      this.game.resumeGame();
    });

    addClick('btn-restart-checkpoint', () => {
      this.game.restartCheckpoint();
    });

    addClick('btn-pause-records', () => {
      this.previousScreen = 'pause';
      this.showScreen('records');
    });

    addClick('btn-pause-settings', () => {
      this.previousScreen = 'pause';
      this.showScreen('settings');
    });

    addClick('btn-quit-main', () => {
      this.game.returnToMainMenu();
    });

    // Records back
    addClick('btn-records-back', () => {
      this.showScreen(this.previousScreen);
    });

    // Settings back
    addClick('btn-settings-back', () => {
      this.showScreen(this.previousScreen);
    });

    // Controls back
    addClick('btn-controls-back', () => {
      this.showScreen(this.previousScreen);
    });

    // Intel back
    addClick('btn-intel-back', () => {
      this.showScreen(this.previousScreen);
    });

    // Game Over
    addClick('btn-gameover-restart', () => {
      this.game.restartCheckpoint();
    });

    addClick('btn-gameover-main', () => {
      this.game.returnToMainMenu();
    });

    // Victory
    addClick('btn-victory-replay', () => {
      this.game.startNewGame();
    });

    addClick('btn-victory-main', () => {
      this.game.returnToMainMenu();
    });

    // Volume Sliders
    const sMaster = document.getElementById('slider-master-vol');
    const vMaster = document.getElementById('val-master-vol');
    if (sMaster) {
      sMaster.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (vMaster) vMaster.textContent = `${val}%`;
        this.game.sound.setMasterVolume(val / 100);
        localStorage.setItem('w909_vol_master', val);
      });
    }

    const sSfx = document.getElementById('slider-sfx-vol');
    const vSfx = document.getElementById('val-sfx-vol');
    if (sSfx) {
      sSfx.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (vSfx) vSfx.textContent = `${val}%`;
        this.game.sound.setSfxVolume(val / 100);
        localStorage.setItem('w909_vol_sfx', val);
      });
    }

    const sMusic = document.getElementById('slider-music-vol');
    const vMusic = document.getElementById('val-music-vol');
    if (sMusic) {
      sMusic.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (vMusic) vMusic.textContent = `${val}%`;
        this.game.sound.setMusicVolume(val / 100);
        localStorage.setItem('w909_vol_music', val);
      });
    }

    // Toggle Spacebar Jump Setting (Optional Jump Key)
    const tSpace = document.getElementById('toggle-space-jump');
    if (tSpace) {
      tSpace.addEventListener('click', () => {
        this.game.input.spaceJumpEnabled = !this.game.input.spaceJumpEnabled;
        const enabled = this.game.input.spaceJumpEnabled;
        tSpace.textContent = enabled ? 'ENABLED' : 'DISABLED';
        tSpace.classList.toggle('active', enabled);
        localStorage.setItem('w909_space_jump', enabled ? '1' : '0');
      });
    }

    // Toggle Screen Shake
    const tShake = document.getElementById('toggle-shake');
    if (tShake) {
      tShake.addEventListener('click', () => {
        this.game.camera.shakeEnabled = !this.game.camera.shakeEnabled;
        tShake.textContent = this.game.camera.shakeEnabled ? 'ENABLED' : 'DISABLED';
        tShake.classList.toggle('active', this.game.camera.shakeEnabled);
        localStorage.setItem('w909_shake', this.game.camera.shakeEnabled ? '1' : '0');
      });
    }

    // Toggle CRT Scanlines
    const tCrt = document.getElementById('toggle-crt');
    const crtOverlay = document.getElementById('crt-overlay');
    if (tCrt && crtOverlay) {
      tCrt.addEventListener('click', () => {
        const isActive = crtOverlay.classList.toggle('crt-active');
        tCrt.textContent = isActive ? 'ENABLED' : 'DISABLED';
        tCrt.classList.toggle('active', isActive);
        localStorage.setItem('w909_crt', isActive ? '1' : '0');
      });
    }
  }

  loadSettings() {
    const savedMaster = localStorage.getItem('w909_vol_master');
    if (savedMaster !== null) {
      const val = parseInt(savedMaster, 10);
      const s = document.getElementById('slider-master-vol');
      const v = document.getElementById('val-master-vol');
      if (s) s.value = val;
      if (v) v.textContent = `${val}%`;
      this.game.sound.setMasterVolume(val / 100);
    }

    const savedSfx = localStorage.getItem('w909_vol_sfx');
    if (savedSfx !== null) {
      const val = parseInt(savedSfx, 10);
      const s = document.getElementById('slider-sfx-vol');
      const v = document.getElementById('val-sfx-vol');
      if (s) s.value = val;
      if (v) v.textContent = `${val}%`;
      this.game.sound.setSfxVolume(val / 100);
    }

    const savedSpaceJump = localStorage.getItem('w909_space_jump');
    if (savedSpaceJump !== null) {
      const enabled = savedSpaceJump === '1';
      this.game.input.spaceJumpEnabled = enabled;
      const t = document.getElementById('toggle-space-jump');
      if (t) {
        t.textContent = enabled ? 'ENABLED' : 'DISABLED';
        t.classList.toggle('active', enabled);
      }
    }

    const savedShake = localStorage.getItem('w909_shake');
    if (savedShake !== null) {
      const enabled = savedShake === '1';
      this.game.camera.shakeEnabled = enabled;
      const t = document.getElementById('toggle-shake');
      if (t) {
        t.textContent = enabled ? 'ENABLED' : 'DISABLED';
        t.classList.toggle('active', enabled);
      }
    }

    const savedCrt = localStorage.getItem('w909_crt');
    if (savedCrt !== null) {
      const enabled = savedCrt === '1';
      const crt = document.getElementById('crt-overlay');
      const t = document.getElementById('toggle-crt');
      if (crt) crt.classList.toggle('crt-active', enabled);
      if (t) {
        t.textContent = enabled ? 'ENABLED' : 'DISABLED';
        t.classList.toggle('active', enabled);
      }
    }
  }

  populateRecordsScreen() {
    const elAllTime = document.getElementById('records-alltime-high');
    const elTotalOps = document.getElementById('records-total-ops');
    const tbody = document.getElementById('records-table-body');

    if (elAllTime) elAllTime.textContent = (this.game.highScore || 10000).toLocaleString();
    if (elTotalOps) elTotalOps.textContent = this.game.recentPlays ? this.game.recentPlays.length : 0;

    if (tbody) {
      tbody.innerHTML = '';
      const plays = this.game.recentPlays || [];
      if (plays.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #5a7388; padding: 16px;">NO COMBAT MISSIONS RECORDED YET</td></tr>';
        return;
      }

      plays.forEach((op) => {
        const tr = document.createElement('tr');
        let badgeClass = 'badge-combat';
        if (op.outcome === 'VICTORY') badgeClass = 'badge-victory';
        else if (op.outcome.includes('FALL')) badgeClass = 'badge-fall';

        tr.innerHTML = `
          <td style="font-family: var(--font-display); font-weight: bold; color: var(--color-cyan-glow);">${op.id}</td>
          <td>${op.date || '--'}</td>
          <td style="font-family: var(--font-condensed); font-size: 14px; font-weight: bold; color: var(--color-gold-aquila);">${Number(op.score).toLocaleString()}</td>
          <td><span class="badge-outcome ${badgeClass}">${op.outcome}</span></td>
          <td>${op.kills} UNITS</td>
          <td>${op.accuracy}</td>
          <td>${op.time}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  showGameOverScreen(causeText, score, highScore, isNewHigh, outcome) {
    this.showScreen('gameover');

    const elCause = document.getElementById('gameover-cause');
    const elScore = document.getElementById('gameover-score-val');
    const elHigh = document.getElementById('gameover-high-val');
    const elNewTag = document.getElementById('gameover-new-record-tag');
    const elKills = document.getElementById('gameover-kills-val');
    const elAcc = document.getElementById('gameover-acc-val');
    const elTime = document.getElementById('gameover-time-val');
    const elRecentList = document.getElementById('gameover-recent-list');

    if (elCause) elCause.textContent = causeText || 'SIGNAL TERMINATED // CASUALTY SUSTAINED';
    if (elScore) elScore.textContent = Number(score).toLocaleString();
    if (elHigh) elHigh.textContent = Number(highScore).toLocaleString();

    if (elNewTag) {
      elNewTag.classList.toggle('hidden', !isNewHigh);
    }

    if (elKills) elKills.textContent = `${this.game.stats.kills} UNITS`;
    if (elAcc) {
      const acc = this.game.stats.shotsFired > 0 ? Math.round((this.game.stats.shotsHit / this.game.stats.shotsFired) * 100) : 100;
      elAcc.textContent = `${acc}%`;
    }
    if (elTime) {
      const durationSec = Math.max(1, Math.round((performance.now() - this.game.stats.startTime) / 1000));
      const mins = String(Math.floor(durationSec / 60)).padStart(2, '0');
      const secs = String(durationSec % 60).padStart(2, '0');
      elTime.textContent = `${mins}:${secs}`;
    }

    // Mini Recent Plays in Game Over
    if (elRecentList) {
      elRecentList.innerHTML = '';
      const recent = (this.game.recentPlays || []).slice(0, 3);
      recent.forEach((p) => {
        const row = document.createElement('div');
        row.className = 'recent-mini-row';
        let bClass = 'badge-combat';
        if (p.outcome === 'VICTORY') bClass = 'badge-victory';
        else if (p.outcome.includes('FALL')) bClass = 'badge-fall';

        row.innerHTML = `
          <span style="color: var(--color-steel);">${p.id} (${p.date})</span>
          <span class="badge-outcome ${bClass}">${p.outcome}</span>
          <span style="color: var(--color-gold-aquila); font-weight: bold;">${Number(p.score).toLocaleString()} PTS</span>
        `;
        elRecentList.appendChild(row);
      });
    }
  }

  showVictoryScreen(stats, highScore, isNewHigh, timeStr, acc) {
    this.showScreen('victory');

    const elScore = document.getElementById('victory-score-val');
    const elHigh = document.getElementById('victory-high-val');
    const elNewTag = document.getElementById('victory-new-record-tag');
    const elKills = document.getElementById('stat-kills');
    const elAcc = document.getElementById('stat-accuracy');
    const elTime = document.getElementById('stat-time');
    const elHp = document.getElementById('stat-health');

    if (elScore) elScore.textContent = Number(stats.score).toLocaleString();
    if (elHigh) elHigh.textContent = Number(highScore).toLocaleString();
    if (elNewTag) elNewTag.classList.toggle('hidden', !isNewHigh);

    if (elKills) elKills.textContent = `${stats.kills} UNITS`;
    if (elAcc) elAcc.textContent = `${acc}%`;
    if (elTime) elTime.textContent = timeStr;
    if (elHp && this.game.player) elHp.textContent = `${Math.ceil(this.game.player.health)} HP`;
  }
}
