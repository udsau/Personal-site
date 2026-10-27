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

  // --- NEW MINIGAME VARIABLES ---
  let userLines = []; // Remembers the connections the user draws
  let selectedStar = null; // The star currently clicked
  let mousePos = { x: null, y: null }; // Tracks mouse for the preview line

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

    // Clear user lines if the screen is resized and stars reset
    userLines = [];
    selectedStar = null;
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

        // When a star hits the bottom, it loops to the top
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }

        star.phase += (star.twinkleSpeed * deltaTime) / 1000;
      }

      const opacity = 0.45 + (Math.sin(star.phase) + 1) * 0.275;

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

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(235, 243, 255, ${opacity})`;
      ctx.fill();
    } // End of star loop

    // --- DRAW CONSTELLATION MINIGAME ---
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#8EBBFF";

    // 1. Draw all saved connections
    ctx.strokeStyle = "rgba(142, 187, 255, 0.7)";
    for (const line of userLines) {
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();
    }

    // 2. Draw active preview line & highlight selected star
    if (selectedStar && mousePos.x !== null && !reducedMotion.matches) {
      // Faint line to mouse
      ctx.strokeStyle = "rgba(142, 187, 255, 0.3)";
      ctx.beginPath();
      ctx.moveTo(selectedStar.x, selectedStar.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();

      // Bright dot on the selected star
      ctx.beginPath();
      ctx.arc(
        selectedStar.x,
        selectedStar.y,
        selectedStar.radius * 3,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();
    }
    ctx.restore();
    // -----------------------------------

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

  // --- MINIGAME EVENT LISTENERS ---
  window.addEventListener("mousemove", (event) => {
    mousePos.x = event.clientX;
    mousePos.y = event.clientY;
  });

  window.addEventListener("mouseout", () => {
    mousePos.x = null;
    mousePos.y = null;
  });

  // Handles clicking the stars to connect them
  window.addEventListener("click", (event) => {
    if (reducedMotion.matches) return;

    let clickedStar = null;
    const clickTolerance = 30; // How close to the star they need to click (in pixels)

    // Find the closest star to the mouse click
    for (const star of stars) {
      const dx = star.x - event.clientX;
      const dy = star.y - event.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < clickTolerance) {
        clickedStar = star;
        break;
      }
    }

    if (clickedStar) {
      if (selectedStar) {
        if (selectedStar !== clickedStar) {
          // Connect the two stars!
          userLines.push({ start: selectedStar, end: clickedStar });
          // Make the newly clicked star the active one so they can keep drawing a chain
          selectedStar = clickedStar;
        } else {
          // They clicked the same star twice, cancel the selection
          selectedStar = null;
        }
      } else {
        // First click: select the star
        selectedStar = clickedStar;
      }
    } else {
      // They clicked on empty space, cancel the selection
      selectedStar = null;
    }
  });

  resizeCanvas();
  startAnimation();
}
// Paste your Discord link right here inside the quotes:
const webhookURL = "https://discord.com/api/webhooks/1564637470719615016/igfwRvFu_rBD6rjIHtYmeFwfACtsWP09N6tyLS3L5-wJoR5C-1oQmQyN8pdzfjvjldDX";

const contactForm = document.getElementById("transmission-form");
const submitBtn = document.getElementById("submit-btn");

let lastSubmissionTime = 0; // Tracks the last time a message was sent
const cooldownDuration = 20000; // 20 seconds cooldown in milliseconds

if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // 1. SPAM TRAP: Check if the hidden bot field was filled out
    const botField = document.getElementById('bot-field').value;
    if (botField !== "") {
      console.warn("Spam bot detected.");
      return; // Silently block the bot
    }

    // 2. COOLDOWN CHECK: Prevent rapid-fire clicking
    const currentTime = Date.now();
    const timeElapsed = currentTime - lastSubmissionTime;
    
    if (timeElapsed < cooldownDuration) {
      const secondsLeft = Math.ceil((cooldownDuration - timeElapsed) / 1000);
      submitBtn.innerText = `Wait ${secondsLeft}s`;
      setTimeout(() => {
        submitBtn.innerText = "Send";
      }, 2000);
      return;
    }

    const nameInput = document.getElementById("sender-name").value.trim();
    const messageInput = document.getElementById("sender-message").value.trim();

    // 3. VALIDATION: Prevent empty messages
    if (messageInput === "") return;

    const finalName = nameInput === "" ? "Anonymous Visitor" : nameInput;

    submitBtn.innerText = "Transmitting...";
    submitBtn.disabled = true;

    // Packages the message for Discord
    const payload = {
      username: "Portfolio Website",
      avatar_url: "https://i.imgur.com/4M34hi2.png",
      embeds: [
        {
          title: `New Message from: ${finalName}`,
          description: messageInput,
          color: 9354239, // Your theme's blue color
        },
      ],
    };

    // Sends the message
    fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) {
          lastSubmissionTime = Date.now(); // Reset cooldown timer
          submitBtn.innerText = "Sent!";
          contactForm.reset();
          
          setTimeout(() => {
            submitBtn.innerText = "Send";
            submitBtn.disabled = false;
          }, 3000);
        } else {
          submitBtn.innerText = "Error!";
          submitBtn.disabled = false;
        }
      })
      .catch(() => {
        submitBtn.innerText = "Error!";
        submitBtn.disabled = false;
      });
  });
}
