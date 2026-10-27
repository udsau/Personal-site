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

  // --- 1. THE SEED: Predictable Randomizer ---
  // This ensures stars and default constellations spawn in the EXACT same spots on every reload.
  let seed = 1;
  function predictableRandom() {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  // --- 2. CONSTELLATION EDITOR STATE ---
  let isEditMode = false;
  let defaultLines = []; // Layer 1: The predefined shapes (always load)
  let userLines = JSON.parse(localStorage.getItem('userConstellationLines')) || []; // Layer 2: User additions
  
  let selectedStar = null; 
  let mousePos = { x: null, y: null };

  const toggleEditBtn = document.getElementById("toggle-edit-btn");
  const clearCanvasBtn = document.getElementById("clear-canvas-btn");

  if (toggleEditBtn) {
    toggleEditBtn.addEventListener("click", () => {
      isEditMode = !isEditMode;
      toggleEditBtn.textContent = isEditMode ? "[Edit Constellation: ON]" : "[Edit Constellation: OFF]";
      toggleEditBtn.style.color = isEditMode ? "#C4B5FD" : "#8EBBFF";
      selectedStar = null; 
    });
  }

  if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener("click", () => {
      userLines = []; // ONLY clears the user's custom lines
      localStorage.removeItem('userConstellationLines');
      selectedStar = null;
    });
  }

  function createStars() {
    seed = 999; // Reset seed before creating stars so they are identically placed
    const count = Math.min(220, Math.floor((width * height) / 6500));

    stars = Array.from({ length: count }, (_, index) => ({
      id: index,
      x: predictableRandom() * width,
      y: predictableRandom() * height,
      radius: predictableRandom() * 1.2 + 0.4,
      speed: predictableRandom() * 4 + 1,
      phase: predictableRandom() * Math.PI * 2,
      twinkleSpeed: predictableRandom() * 2 + 0.8,
    }));
  }

  function initDefaultPattern() {
    defaultLines = [];
    seed = 555; // Reset seed so the algorithm picks the exact same clusters every time
    
    const numClusters = Math.max(5, Math.floor((width * height) / 200000)); 
    
    for (let i = 0; i < numClusters; i++) {
        let validStars = stars.filter(s => s.y < height * 0.8);
        if (validStars.length === 0) validStars = stars;
        
        let startStar = validStars[Math.floor(predictableRandom() * validStars.length)];
        
        let nearby = stars
            .filter(s => s.id !== startStar.id) 
            .map(s => ({ id: s.id, dist: Math.hypot(s.x - startStar.x, s.y - startStar.y) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, Math.floor(predictableRandom() * 2) + 2); 

        for (let j = 0; j < nearby.length; j++) {
            defaultLines.push({ s1: startStar.id, s2: nearby[j].id });
            
            // Random chance to close the shape (triangles/diamonds)
            if (j > 0 && predictableRandom() > 0.6) {
                defaultLines.push({ s1: nearby[j-1].id, s2: nearby[j].id });
            }
        }
    }
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createStars();
    initDefaultPattern();
    drawStars(0);
  }

  function scheduleShootingStar() {
    clearTimeout(shootingStarTimer);
    if (reducedMotion.matches) return;

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
    }, 10000);
  }

  function drawStars(deltaTime) {
    ctx.clearRect(0, 0, width, height);

    for (const star of stars) {
      if (!reducedMotion.matches) {
        star.y += (star.speed * deltaTime) / 1000;

        if (star.y > height) {
          star.y = -10; 
          star.x = Math.random() * width;
        }
        star.phase += (star.twinkleSpeed * deltaTime) / 1000;
      }

      const opacity = 0.45 + (Math.sin(star.phase) + 1) * 0.275;
      const glowRadius = star.radius * 5;
      const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowRadius);

      glow.addColorStop(0, `rgba(135, 180, 255, ${opacity * 0.55})`);
      glow.addColorStop(1, "rgba(100, 150, 255, 0)");

      ctx.beginPath();
      ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(235, 243, 255, ${opacity})`;
      ctx.fill();
    } 

    // --- 3. DRAW COMBINED CONSTELLATION LINES ---
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#8EBBFF";
    ctx.strokeStyle = "rgba(142, 187, 255, 0.7)";

    // Merge both arrays so we draw the defaults AND the user's additions
    const allLines = [...defaultLines, ...userLines];

    for (const line of allLines) {
      const star1 = stars.find(s => s.id === line.s1);
      const star2 = stars.find(s => s.id === line.s2);
      
      if (star1 && star2) {
          if (Math.abs(star1.y - star2.y) < height * 0.6) {
              ctx.beginPath();
              ctx.moveTo(star1.x, star1.y);
              ctx.lineTo(star2.x, star2.y);
              ctx.stroke();

              ctx.fillStyle = "#8EBBFF";
              ctx.beginPath();
              ctx.arc(star1.x, star1.y, 2.5, 0, Math.PI * 2);
              ctx.arc(star2.x, star2.y, 2.5, 0, Math.PI * 2);
              ctx.fill();
          }
      }
    }

    if (isEditMode && selectedStar && mousePos.x !== null && !reducedMotion.matches) {
      ctx.strokeStyle = "rgba(142, 187, 255, 0.5)";
      ctx.beginPath();
      ctx.moveTo(selectedStar.x, selectedStar.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(selectedStar.x, selectedStar.y, selectedStar.radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();
    }
    ctx.restore();

    // Shooting star render code
    if (shootingStar) {
      const s = shootingStar;
      const progress = Math.min(s.progress / s.duration, 1);
      const opacity = Math.sin(progress * Math.PI);
      const tailX = s.x - Math.cos(s.angle) * s.length;
      const tailY = s.y - Math.sin(s.angle) * s.length;

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

      const glowRadius = 18;
      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowRadius);
      glow.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.95})`);
      glow.addColorStop(0.2, `rgba(180, 210, 255, ${opacity * 0.6})`);
      glow.addColorStop(1, "rgba(100, 150, 255, 0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

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

  window.addEventListener("mousemove", (event) => {
    mousePos.x = event.clientX;
    mousePos.y = event.clientY;
  });

  window.addEventListener("click", (event) => {
    if (!isEditMode || reducedMotion.matches) return;

    let clickedStar = null;
    const clickTolerance = 30; 

    for (const star of stars) {
      const dx = star.x - event.clientX;
      const dy = star.y - event.clientY;
      if (Math.sqrt(dx * dx + dy * dy) < clickTolerance) {
        clickedStar = star;
        break;
      }
    }

    if (clickedStar) {
      if (selectedStar) {
        if (selectedStar !== clickedStar) {
          // Add specifically to the user array, leave the defaults alone
          userLines.push({ s1: selectedStar.id, s2: clickedStar.id });
          localStorage.setItem('userConstellationLines', JSON.stringify(userLines));
          selectedStar = clickedStar; 
        } else {
          selectedStar = null; 
        }
      } else {
        selectedStar = clickedStar;
      }
    } else {
      selectedStar = null;
    }
  });

  window.addEventListener("resize", resizeCanvas);
  reducedMotion.addEventListener("change", startAnimation);

  resizeCanvas();
  startAnimation();
}