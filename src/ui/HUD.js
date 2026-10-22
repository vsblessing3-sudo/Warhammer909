export class HUD {
  constructor() {
    this.container = document.getElementById('hud-container');
    this.hpFill = document.getElementById('health-bar-fill');
    this.hpText = document.getElementById('health-bar-value');
    this.ammoCount = document.getElementById('ammo-count');
    this.ammoReserve = document.getElementById('ammo-reserve');
    this.bulletIcons = document.querySelectorAll('.bullet-icon');
    this.reloadContainer = document.getElementById('reload-bar-container');
    this.reloadFill = document.getElementById('reload-bar-fill');

    this.bossContainer = document.getElementById('boss-hud-container');
    this.bossFill = document.getElementById('boss-bar-fill');
    this.bossHpText = document.getElementById('boss-hp-value');

    this.objectiveText = document.getElementById('objective-text');
    this.promptContainer = document.getElementById('interaction-prompt');
    this.promptText = document.getElementById('prompt-text');

    this.scoreVal = document.getElementById('hud-score-val');
    this.highScoreVal = document.getElementById('hud-high-score-val');

    this.terminalDialog = document.getElementById('terminal-dialog');
    this.terminalContent = document.getElementById('terminal-content');
    this.terminalCloseBtn = document.getElementById('terminal-close-btn');

    this.terminalTypingTimer = null;
    this.terminalCallback = null;

    if (this.terminalCloseBtn) {
      this.terminalCloseBtn.addEventListener('click', () => {
        this.hideTerminal();
      });
    }
  }

  show() {
    if (this.container) this.container.classList.remove('hidden');
  }

  hide() {
    if (this.container) this.container.classList.add('hidden');
  }

  update(player, level, game) {
    if (!player) return;

    // 0. Tactical Score & High Score
    if (game) {
      if (this.scoreVal) {
        this.scoreVal.textContent = String(game.stats.score).padStart(6, '0');
      }
      if (this.highScoreVal) {
        const currentHigh = Math.max(game.stats.score, game.highScore || 0);
        this.highScoreVal.textContent = String(currentHigh).padStart(6, '0');
      }
    }

    // 1. Health Bar
    const hpPct = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
    if (this.hpFill) this.hpFill.style.width = `${hpPct}%`;
    if (this.hpText) this.hpText.textContent = `${Math.ceil(player.health)} / ${player.maxHealth} HP`;

    // 2. Ammunition
    if (this.ammoCount) this.ammoCount.textContent = player.magazineAmmo;
    if (this.ammoReserve) this.ammoReserve.textContent = player.reserveAmmo;

    // Bullet icons
    this.bulletIcons.forEach((icon, idx) => {
      if (idx < player.magazineAmmo) {
        icon.classList.add('active');
      } else {
        icon.classList.remove('active');
      }
    });

    // 3. Reloading Bar
    if (player.isReloading) {
      if (this.reloadContainer) this.reloadContainer.classList.remove('hidden');
      const reloadPct = 100 - (player.reloadTimer / player.reloadDuration) * 100;
      if (this.reloadFill) this.reloadFill.style.width = `${reloadPct}%`;
    } else {
      if (this.reloadContainer) this.reloadContainer.classList.add('hidden');
    }

    // 4. Objective
    if (this.objectiveText && level) {
      this.objectiveText.textContent = level.currentObjective;
    }

    // 5. Boss Bar (Heavy Bot)
    if (level && level.heavyBotBoss && !level.heavyBotBoss.isDead) {
      const boss = level.heavyBotBoss;
      const distToMarine = Math.hypot(boss.x - player.x, boss.y - player.y);
      if (distToMarine < 550 || boss.state !== 'patrol') {
        if (this.bossContainer) this.bossContainer.classList.remove('hidden');
        const bPct = Math.max(0, Math.min(100, (boss.health / boss.maxHealth) * 100));
        if (this.bossFill) this.bossFill.style.width = `${bPct}%`;
        if (this.bossHpText) this.bossHpText.textContent = `${Math.ceil(boss.health)} / ${boss.maxHealth} HP`;
      } else {
        if (this.bossContainer) this.bossContainer.classList.add('hidden');
      }
    } else {
      if (this.bossContainer) this.bossContainer.classList.add('hidden');
    }

    // 6. Interaction Prompt
    let nearTerminal = null;
    if (level && level.terminals) {
      for (const term of level.terminals) {
        if (term.isNear(player)) {
          nearTerminal = term;
          break;
        }
      }
    }

    if (nearTerminal) {
      if (this.promptContainer) this.promptContainer.classList.remove('hidden');
      if (this.promptText) this.promptText.textContent = nearTerminal.prompt;
    } else {
      if (this.promptContainer) this.promptContainer.classList.add('hidden');
    }
  }

  showTerminalDialog(title, message, callback = null) {
    if (!this.terminalDialog) return;
    this.terminalCallback = callback;
    this.terminalDialog.classList.remove('hidden');

    const headerTitle = this.terminalDialog.querySelector('.terminal-title');
    if (headerTitle) headerTitle.textContent = title;

    if (this.terminalContent) {
      this.terminalContent.textContent = '';
      let charIdx = 0;
      if (this.terminalTypingTimer) clearInterval(this.terminalTypingTimer);

      this.terminalTypingTimer = setInterval(() => {
        if (charIdx < message.length) {
          this.terminalContent.textContent += message[charIdx];
          charIdx++;
        } else {
          clearInterval(this.terminalTypingTimer);
        }
      }, 16);
    }
  }

  hideTerminal() {
    if (this.terminalDialog) {
      this.terminalDialog.classList.add('hidden');
    }
    if (this.terminalTypingTimer) {
      clearInterval(this.terminalTypingTimer);
    }
    if (this.terminalCallback) {
      const cb = this.terminalCallback;
      this.terminalCallback = null;
      cb();
    }
  }

  isTerminalOpen() {
    return this.terminalDialog && !this.terminalDialog.classList.contains('hidden');
  }
}
