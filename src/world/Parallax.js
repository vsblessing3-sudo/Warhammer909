export class Parallax {
  constructor(bgImage, midgroundImage = null) {
    this.bgImage = bgImage;
    this.midgroundImage = midgroundImage;
    this.cloudTimer = 0;
    this.cruiserX = 100;
  }

  update(dt) {
    this.cloudTimer += dt * 8;
    this.cruiserX += dt * 14;
    if (this.cruiserX > 5000) {
      this.cruiserX = -400;
    }
  }

  renderTiled(ctx, img, scrollX, scrollY, imgWidth, vWidth, alpha = 1.0) {
    if (!img || !img.complete) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    let startX = ((scrollX % imgWidth) + imgWidth) % imgWidth - imgWidth;
    while (startX < vWidth) {
      ctx.drawImage(img, startX, scrollY);
      startX += imgWidth;
    }
    ctx.restore();
  }

  render(ctx, camera) {
    const vWidth = camera.viewportWidth;
    const vHeight = camera.viewportHeight;

    // 1. Deep Celestial Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, vHeight);
    skyGrad.addColorStop(0, '#040b14');
    skyGrad.addColorStop(0.4, '#091522');
    skyGrad.addColorStop(0.75, '#132334');
    skyGrad.addColorStop(1, '#1b3042');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, vWidth, vHeight);

    // 2. Distant Celestial Ringed Planet (Layer 0, scroll speed 0.03)
    const moonScreenX = 720 - camera.x * 0.03;
    const moonScreenY = 110 - camera.y * 0.02;

    ctx.save();
    // Planet atmospheric glow
    const planetGlow = ctx.createRadialGradient(moonScreenX, moonScreenY, 30, moonScreenX, moonScreenY, 90);
    planetGlow.addColorStop(0, 'rgba(0, 229, 255, 0.18)');
    planetGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = planetGlow;
    ctx.beginPath();
    ctx.arc(moonScreenX, moonScreenY, 90, 0, Math.PI * 2);
    ctx.fill();

    // Planet body
    ctx.fillStyle = '#182b3a';
    ctx.beginPath();
    ctx.arc(moonScreenX, moonScreenY, 60, 0, Math.PI * 2);
    ctx.fill();

    // Planet ring
    ctx.strokeStyle = 'rgba(100, 180, 220, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(moonScreenX, moonScreenY, 105, 20, -0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Panoramic Sky Layer (Layer 1, scroll speed 0.14)
    if (this.bgImage && this.bgImage.complete) {
      const scrollX = -camera.x * 0.14;
      const scrollY = -10 - camera.y * 0.05;
      this.renderTiled(ctx, this.bgImage, scrollX, scrollY, 1672, vWidth, 0.85);
    }

    // 4. Autonomous AEGIS Dreadnought Cruising (Layer 2, scroll speed 0.10)
    const shipScreenX = this.cruiserX - camera.x * 0.10;
    const shipScreenY = 85 - camera.y * 0.04;

    if (shipScreenX > -250 && shipScreenX < vWidth + 100) {
      ctx.save();
      ctx.translate(shipScreenX, shipScreenY);

      // Ship silhouette
      ctx.fillStyle = '#081119';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(120, 4);
      ctx.lineTo(135, 12);
      ctx.lineTo(120, 20);
      ctx.lineTo(-20, 18);
      ctx.lineTo(-30, 8);
      ctx.closePath();
      ctx.fill();

      // Cyan Engine Exhaust Plumes
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-30, 9);
      ctx.lineTo(-58 - Math.random() * 14, 11);
      ctx.lineTo(-30, 13);
      ctx.fill();

      // Red navigation beacon
      ctx.fillStyle = Math.floor(this.cloudTimer * 4) % 2 === 0 ? '#ff2222' : '#551111';
      ctx.fillRect(80, 2, 2, 2);

      ctx.restore();
    }

    // 5. Midground Ruined Dystopian City Skyline (Layer 3, scroll speed 0.32)
    if (this.midgroundImage && this.midgroundImage.complete) {
      const midScrollX = -camera.x * 0.32;
      const midScrollY = 160 - camera.y * 0.12;
      this.renderTiled(ctx, this.midgroundImage, midScrollX, midScrollY, 1672, vWidth, 0.75);
    } else {
      // Procedural atmospheric skyline silhouettes
      ctx.save();
      ctx.fillStyle = 'rgba(10, 18, 26, 0.65)';
      const buildingWidth = 90;
      const baseScrollX = -camera.x * 0.32;
      const offset = ((baseScrollX % buildingWidth) + buildingWidth) % buildingWidth - buildingWidth;
      for (let bx = offset; bx < vWidth + buildingWidth; bx += buildingWidth) {
        const seed = Math.sin(Math.floor((camera.x * 0.32 + bx) / buildingWidth) * 99);
        const bHeight = 120 + Math.abs(seed) * 110;
        const by = vHeight - bHeight - 120 + (camera.y * 0.08);
        ctx.fillRect(bx, by, buildingWidth - 6, bHeight + 120);

        // Blinking red antenna light
        if (seed > 0.2) {
          ctx.fillStyle = Math.floor(this.cloudTimer * 3 + seed * 10) % 2 === 0 ? '#ff3333' : '#441111';
          ctx.fillRect(bx + (buildingWidth - 6) / 2, by - 6, 3, 3);
          ctx.fillStyle = 'rgba(10, 18, 26, 0.65)';
        }
      }
      ctx.restore();
    }

    // 6. Horizon Atmospheric Fog Gradient
    const horizonFog = ctx.createLinearGradient(0, vHeight - 180, 0, vHeight);
    horizonFog.addColorStop(0, 'rgba(9, 16, 24, 0)');
    horizonFog.addColorStop(0.7, 'rgba(13, 23, 34, 0.45)');
    horizonFog.addColorStop(1, 'rgba(7, 12, 18, 0.75)');
    ctx.fillStyle = horizonFog;
    ctx.fillRect(0, vHeight - 180, vWidth, 180);
  }
}
