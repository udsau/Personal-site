
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

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    function createStars() {
        const count = Math.min(
            220,
            Math.floor((width * height) / 6500)
        );

        stars = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.2 + 0.4,
            speed: Math.random() * 4 + 1,
            phase: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 2 + 0.8
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

        // Wait a random 2–4 minutes between appearances.
        const delay = 120000 + Math.random() * 120000;

        shootingStarTimer = setTimeout(() => {
            if (!document.hidden && !reducedMotion.matches) {
                shootingStar = {
                    x: Math.random() * width * 0.7,
                    y: Math.random() * height * 0.4,
                    length: 100 + Math.random() * 100,
                    speed: 500 + Math.random() * 250,
                    progress: 0,
                    angle: Math.PI / 4
                };
            }

            scheduleShootingStar();
        }, delay);
    }

    function drawStars(deltaTime) {
        ctx.clearRect(0, 0, width, height);
        for (const star of stars) {
            if (!reducedMotion.matches) {
                star.y += star.speed * deltaTime / 1000;

                if (star.y > height) {
                    star.y = 0;
                    star.x = Math.random() * width;
                }

                star.phase += star.twinkleSpeed * deltaTime / 1000;
            }

            const opacity =
                0.45 + (Math.sin(star.phase) + 1) * 0.275;

            // Soft halo around each star.
            const glowRadius = star.radius * 5;

            const glow = ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, glowRadius
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
        if (shootingStar) {
            const s = shootingStar;
            const tailX = s.x - Math.cos(s.angle) * s.length;
            const tailY = s.y - Math.sin(s.angle) * s.length;

            const trail = ctx.createLinearGradient(
                tailX, tailY, s.x, s.y
            );

            trail.addColorStop(0, "rgba(135, 180, 255, 0)");
            trail.addColorStop(1, "rgba(235, 245, 255, 0.95)");

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(s.x, s.y);
            ctx.strokeStyle = trail;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Bright head.
            ctx.beginPath();
            ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "#FFFFFF";
            ctx.shadowBlur = 18;
            ctx.shadowColor = "#8EBBFF";
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    function animate(time) {
        const deltaTime = lastTime
            ? Math.min(time - lastTime, 50)
            : 0;

        lastTime = time;

        if (shootingStar) {
            const distance =
                shootingStar.speed * deltaTime / 1000;

            shootingStar.x += Math.cos(shootingStar.angle) * distance;
            shootingStar.y += Math.sin(shootingStar.angle) * distance;
            shootingStar.progress += deltaTime;

            if (
                shootingStar.progress > 700 ||
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
