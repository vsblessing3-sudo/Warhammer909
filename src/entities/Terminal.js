export class Terminal {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.width = options.width || 36;
    this.height = options.height || 54;
    this.type = options.type || 'lore'; // 'lore', 'checkpoint', 'exit'
    this.title = options.title || 'AEGIS TERMINAL';
    this.message = options.message || '';
    this.prompt = options.prompt || 'INTERACT';
    this.image = options.image || null;

    this.isActivated = false;
    this.interactionRange = 65;
  }

  isNear(player) {
    if (!player || player.isDead) return false;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const pBox = player.getHitbox();
    const pCenterX = pBox.x + pBox.width / 2;
    const pCenterY = pBox.y + pBox.height / 2;
    const dist = Math.hypot(pCenterX - centerX, pCenterY - centerY);
    return dist <= this.interactionRange;
  }

  interact(game) {
    game.sound.playTerminalBeep();

    if (this.type === 'checkpoint') {
      this.isActivated = true;
      game.setCheckpoint(this.x, this.y);
      game.showTerminalDialog(
        'TACTICAL CHECKPOINT SYNCHRONIZED',
        'VANGUARD SEC-LOC SAVED.\nAEGIS SATELLITE TRIANGULATION STABLE.\nREDEPLOYMENT ANCHOR ESTABLISHED.'
      );
    } else if (this.type === 'lore') {
      this.isActivated = true;
      game.showTerminalDialog(this.title, this.message);
    } else if (this.type === 'exit') {
      this.isActivated = true;
      game.showTerminalDialog(
        this.title,
        this.message,
        () => {
          // Callback after terminal message finishes
          game.completeMission();
        }
      );
    }
  }

  render(ctx, camera, isPlayerNear) {
    const screen = camera.worldToScreen(this.x, this.y);

    ctx.save();
    if (this.image && this.image.complete) {
      ctx.drawImage(this.image, screen.x, screen.y, this.width, this.height);
    } else {
      // High-Tech AEGIS Sci-Fi Military Terminal Console
      // Pedestal base
      ctx.fillStyle = '#0e1722';
      ctx.fillRect(screen.x - 2, screen.y + this.height - 8, this.width + 4, 8);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(screen.x - 2, screen.y + this.height - 8, this.width + 4, 2);

      // Main console body
      ctx.fillStyle = '#14202d';
      ctx.fillRect(screen.x, screen.y, this.width, this.height);
      ctx.strokeStyle = this.isActivated ? '#00e5ff' : '#233748';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(screen.x, screen.y, this.width, this.height);

      // Angled monitor bezel
      ctx.fillStyle = '#080d14';
      ctx.fillRect(screen.x + 3, screen.y + 4, this.width - 6, 22);

      // Terminal Screen phosphor display
      const isExit = this.type === 'exit';
      const screenColor = isExit ? '#ffaa00' : (this.isActivated ? '#00e5ff' : '#00bb88');
      ctx.fillStyle = screenColor;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(screen.x + 4, screen.y + 5, this.width - 8, 20);
      ctx.globalAlpha = 1.0;

      // Holographic projector cone above terminal
      const now = performance.now() / 1000;
      const holoAlpha = 0.18 + Math.sin(now * 3) * 0.08;
      const holoGrad = ctx.createLinearGradient(screen.x + this.width / 2, screen.y + 4, screen.x + this.width / 2, screen.y - 18);
      holoGrad.addColorStop(0, isExit ? `rgba(255, 170, 0, ${holoAlpha + 0.1})` : `rgba(0, 229, 255, ${holoAlpha + 0.1})`);
      holoGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = holoGrad;
      ctx.beginPath();
      ctx.moveTo(screen.x + 6, screen.y + 4);
      ctx.lineTo(screen.x - 6, screen.y - 18);
      ctx.lineTo(screen.x + this.width + 6, screen.y - 18);
      ctx.lineTo(screen.x + this.width - 6, screen.y + 4);
      ctx.closePath();
      ctx.fill();

      // Hologram status icon floating above
      ctx.fillStyle = isExit ? '#ffaa00' : (this.isActivated ? '#00e5ff' : '#00ffaa');
      ctx.font = 'bold 8px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      const holoText = isExit ? 'RELAY 07' : (this.type === 'checkpoint' ? 'CHK-PT' : 'DATA');
      ctx.fillText(holoText, screen.x + this.width / 2, screen.y - 8 + Math.sin(now * 4) * 2);

      // Animated scanlines on monitor
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      for (let y = screen.y + 5; y < screen.y + 25; y += 3) {
        ctx.fillRect(screen.x + 4, y, this.width - 8, 1.5);
      }

      // Keyboard & control switches below monitor
      ctx.fillStyle = '#223444';
      ctx.fillRect(screen.x + 4, screen.y + 30, this.width - 8, 8);
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = (k === 1 && this.isActivated) ? '#00ffaa' : '#3d566e';
        ctx.fillRect(screen.x + 6 + k * 6, screen.y + 32, 4, 4);
      }

      // Status Indicator LED
      ctx.fillStyle = this.isActivated ? '#00ffaa' : (isExit ? '#ffaa00' : '#ff3333');
      ctx.beginPath();
      ctx.arc(screen.x + this.width / 2, screen.y + 44, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Proximity Beacon
    if (isPlayerNear) {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(screen.x - 4, screen.y - 4, this.width + 8, this.height + 8);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}
