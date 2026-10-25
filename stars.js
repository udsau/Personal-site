const canvas = document.getElementById("starfield");
const ctx = canvas?.getContext("2d");

if (canvas && ctx) {
  let stars = [];
  let shootingStar = null;
  let width = 0;
  let height = 0;
  let lastTime = 0;
  let animationId = null;
  let shootingStarTimer = null;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function createStars() {
    const count = Math.min(220, Math.floor((width * height) / 6500));

    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.4,
      speed: Math.random() * 4 + 1,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 2 + 0.8,
    }));
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createStars();
    drawStars(0);
  }

  function scheduleShootingStar() {
    clearTimeout(shootingStarTimer);

    if (reducedMotion.matches) return;

    // Wait 5 seconds between appearances.
    const delay = 10000;

    shootingStarTimer = setTimeout(() => {
      if (!document.hidden && !reducedMotion.matches) {
        shootingStar = {
          x: Math.random() * width * 0.7,
          y: Math.random() * height * 0.4,
          length: 140 + Math.random() * 70,
          speed: 180 + Math.random() * 60,
          progress: 0,
          duration: 1600,
          angle: Math.PI / 4,
        };
      }

      scheduleShootingStar();
    }, delay);
  }

  function drawStars(deltaTime) {
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      if (!reducedMotion.matches) {
        star.y += (star.speed * deltaTime) / 1000;

        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }

        star.phase += (star.twinkleSpeed * deltaTime) / 1000;
      }

      const opacity = 0.45 + (Math.sin(star.phase) + 1) * 0.275;

      // Soft halo around each star.
      const glowRadius = star.radius * 5;

      const glow = ctx.createRadialGradient(
        star.x,
        star.y,
        0,
        star.x,
        star.y,
        glowRadius,
      );

      glow.addColorStop(0, `rgba(135, 180, 255, ${opacity * 0.55})`);
      glow.addColorStop(1, "rgba(100, 150, 255, 0)");

      ctx.beginPath();
      ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Bright centre of the star.
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(235, 243, 255, ${opacity})`;
      ctx.fill();
    }

    // Draw a shooting star while it is active.
    // Draw a soft, glowing shooting star.
    if (shootingStar) {
      const s = shootingStar;

      // Fade in and out smoothly.
      const progress = Math.min(s.progress / s.duration, 1);
      const opacity = Math.sin(progress * Math.PI);

      const tailX = s.x - Math.cos(s.angle) * s.length;
      const tailY = s.y - Math.sin(s.angle) * s.length;

      // Soft blue glow along the trail.
      const trailGlow = ctx.createLinearGradient(tailX, tailY, s.x, s.y);

      trailGlow.addColorStop(0, "rgba(100, 150, 255, 0)");
      trailGlow.addColorStop(0.65, `rgba(135, 180, 255, ${opacity * 0.12})`);
      trailGlow.addColorStop(1, `rgba(170, 205, 255, ${opacity * 0.65})`);

      ctx.save();
      ctx.lineCap = "round";
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#8EBBFF";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = trailGlow;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // Thin, bright centre of the trail.
      const trail = ctx.createLinearGradient(tailX, tailY, s.x, s.y);

      trail.addColorStop(0, "rgba(200, 220, 255, 0)");
      trail.addColorStop(1, `rgba(245, 250, 255, ${opacity})`);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = trail;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Large, soft halo around the bright head.
      const glowRadius = 18;

      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowRadius);

      glow.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.95})`);
      glow.addColorStop(0.2, `rgba(180, 210, 255, ${opacity * 0.6})`);
      glow.addColorStop(1, "rgba(100, 150, 255, 0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Bright white head.
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#8EBBFF";
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function animate(time) {
    const deltaTime = lastTime ? Math.min(time - lastTime, 50) : 0;

    lastTime = time;

    if (shootingStar) {
      const distance = (shootingStar.speed * deltaTime) / 1000;

      shootingStar.x += Math.cos(shootingStar.angle) * distance;
      shootingStar.y += Math.sin(shootingStar.angle) * distance;
      shootingStar.progress += deltaTime;

      if (
        shootingStar.progress >= shootingStar.duration ||
        shootingStar.x > width + 200 ||
        shootingStar.y > height + 200
      ) {
        shootingStar = null;
      }
    }

    drawStars(deltaTime);
    animationId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    cancelAnimationFrame(animationId);
    clearTimeout(shootingStarTimer);

    shootingStar = null;
    lastTime = 0;

    if (reducedMotion.matches) {
      drawStars(0);
    } else {
      animationId = requestAnimationFrame(animate);
      scheduleShootingStar();
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(shootingStarTimer);
    } else if (!reducedMotion.matches) {
      scheduleShootingStar();
    }
  });

  window.addEventListener("resize", resizeCanvas);
  reducedMotion.addEventListener("change", startAnimation);

  resizeCanvas();
  startAnimation();
}
