export class Physics {
  static intersects(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  static pointInBox(px, py, box) {
    return (
      px >= box.x &&
      px <= box.x + box.width &&
      py >= box.y &&
      py <= box.y + box.height
    );
  }

  // Move entity with horizontal and vertical collision checks against level platforms
  static moveAndCollide(entity, dt, platforms) {
    // 1. Horizontal movement
    entity.x += entity.vx * dt;
    entity.isCollidingWall = false;

    const boxH = entity.getHitbox();
    const halfWidth = boxH.width / 2;

    for (const plat of platforms) {
      if (plat.oneWay) continue; // One-way platforms do not block horizontal motion

      if (this.intersects(boxH, plat)) {
        if (entity.vx > 0) {
          // Moving right -> snap entity center so right edge touches plat.x
          entity.x = plat.x - halfWidth;
          entity.vx = 0;
          entity.isCollidingWall = true;
        } else if (entity.vx < 0) {
          // Moving left -> snap entity center so left edge touches plat.x + plat.width
          entity.x = plat.x + plat.width + halfWidth;
          entity.vx = 0;
          entity.isCollidingWall = true;
        }
      }
    }

    // 2. Vertical movement
    // entity.y represents the feet (bottom) position of the character
    const prevBottom = entity.y;
    entity.y += entity.vy * dt;
    entity.isGrounded = false;

    const boxV = entity.getHitbox();

    for (const plat of platforms) {
      if (plat.oneWay) {
        // One-way hover platform: only collide if falling downward and previous feet were at or above platform top
        if (entity.vy >= 0 && prevBottom <= plat.y + 6) {
          const horizOverlap = (entity.x + halfWidth > plat.x) && (entity.x - halfWidth < plat.x + plat.width);
          const maxSnapDist = Math.max(20, entity.vy * dt + 6);
          if (horizOverlap && entity.y >= plat.y && entity.y <= plat.y + maxSnapDist) {
            entity.y = plat.y;
            entity.vy = 0;
            entity.isGrounded = true;
            entity.currentPlatform = plat;
          }
        }
      } else {
        // Solid obstacle
        if (this.intersects(boxV, plat)) {
          if (entity.vy > 0) {
            // Landing on top of platform: feet align with platform surface
            entity.y = plat.y;
            entity.vy = 0;
            entity.isGrounded = true;
            entity.currentPlatform = plat;
          } else if (entity.vy < 0) {
            // Hitting ceiling: top of hitbox touches bottom of platform
            entity.y = plat.y + plat.height + boxV.height;
            entity.vy = 0;
          }
        }
      }
    }
  }
}
