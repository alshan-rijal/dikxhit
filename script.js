const PIN_CODE = "57472";

const pinPanel = document.getElementById("pinPanel");
const pinInput = document.getElementById("pinInput");
const pinBtn = document.getElementById("pinBtn");
const pinMessage = document.getElementById("pinMessage");

const envelopeWrap = document.getElementById("envelopeWrap");
const envelope = document.getElementById("envelope");

const bgMusic = document.getElementById("bgMusic");

const photoPreview = document.getElementById("photoPreview");
const closeLetterBtn = document.getElementById("closeLetterBtn");
const floatingLayer = document.getElementById("floatingLayer");
const cursorAura = document.getElementById("cursorAura");

let isUnlocked = false;

const floatingLabels = ["K", "krisha", "🍉"];
const floatingItems = [];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isLowPower =
    (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4) ||
    (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4);

let resizeTimer = null;

const floatingState = {
    mouseX: null,
    mouseY: null,
    targetMouseX: null,
    targetMouseY: null,
    lastTime: 0,
    rafId: null,
    count: prefersReducedMotion
        ? 10
        : (isLowPower ? (window.innerWidth < 720 ? 14 : 18) : (window.innerWidth < 720 ? 22 : 30)),
    isVisible: true
};

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function createFloatingItem() {
    const label = floatingLabels[Math.floor(Math.random() * floatingLabels.length)];
    const el = document.createElement("span");
    el.className = "float-item";
    el.textContent = label;

    const fontSize = label === "krisha"
        ? randomBetween(16, 26)
        : randomBetween(20, 34);

    el.style.fontSize = `${fontSize}px`;
    const baseOpacity = randomBetween(0.34, 0.72);
    el.style.opacity = `${baseOpacity}`;
    floatingLayer.appendChild(el);

    return {
        el,
        x: randomBetween(0, window.innerWidth),
        y: randomBetween(-window.innerHeight * 0.4, window.innerHeight * 1.1),
        speed: randomBetween(9, 24),
        swayAmp: randomBetween(10, 34),
        swaySpeed: randomBetween(0.55, 1.4),
        phase: randomBetween(0, Math.PI * 2),
        repelX: 0,
        repelY: 0,
        repelRadius: randomBetween(110, 190),
        repelStrength: randomBetween(16, 34),
        spinDir: Math.random() > 0.5 ? 1 : -1,
        twinkleSpeed: randomBetween(0.8, 1.8),
        baseOpacity
    };
}

function resetFloatingItem(item) {
    item.x += randomBetween(-90, 90);
    if (item.x < -140) {
        item.x = window.innerWidth + randomBetween(0, 80);
    }
    if (item.x > window.innerWidth + 140) {
        item.x = -randomBetween(0, 80);
    }
    item.y = window.innerHeight + randomBetween(0, 70);
    item.repelX = 0;
    item.repelY = 0;
}

function buildFloatingLayer() {
    if (!floatingLayer) {
        return;
    }

    floatingLayer.innerHTML = "";
    floatingItems.length = 0;

    for (let i = 0; i < floatingState.count; i += 1) {
        floatingItems.push(createFloatingItem());
    }
}

function animateFloatingLayer(timestamp) {
    if (!floatingLayer || !floatingState.isVisible) {
        return;
    }

    if (!floatingState.lastTime) {
        floatingState.lastTime = timestamp;
    }

    const dt = Math.min((timestamp - floatingState.lastTime) / 1000, 0.05);
    floatingState.lastTime = timestamp;

    const timeSec = timestamp / 1000;

    if (floatingState.targetMouseX !== null && floatingState.targetMouseY !== null) {
        if (floatingState.mouseX === null || floatingState.mouseY === null) {
            floatingState.mouseX = floatingState.targetMouseX;
            floatingState.mouseY = floatingState.targetMouseY;
        } else {
            floatingState.mouseX += (floatingState.targetMouseX - floatingState.mouseX) * 0.16;
            floatingState.mouseY += (floatingState.targetMouseY - floatingState.mouseY) * 0.16;
        }
    }

    for (const item of floatingItems) {
        item.y -= item.speed * dt;
        item.x += Math.sin(timeSec * item.swaySpeed + item.phase) * item.swayAmp * dt;

        if (item.y < -80) {
            resetFloatingItem(item);
        }

        if (item.x < -180) {
            item.x = window.innerWidth + randomBetween(30, 120);
        }

        if (item.x > window.innerWidth + 180) {
            item.x = -randomBetween(30, 120);
        }

        item.repelX *= 0.86;
        item.repelY *= 0.86;

        if (floatingState.mouseX !== null && floatingState.mouseY !== null) {
            const dx = item.x - floatingState.mouseX;
            const dy = item.y - floatingState.mouseY;
            const dist = Math.hypot(dx, dy) || 1;

            if (dist < item.repelRadius) {
                const force = ((item.repelRadius - dist) / item.repelRadius) * item.repelStrength;
                item.repelX += (dx / dist) * force;
                item.repelY += (dy / dist) * force;

                const swirl = force * 0.6 * item.spinDir;
                item.repelX += (-dy / dist) * swirl;
                item.repelY += (dx / dist) * swirl;
            }
        }

        const renderX = item.x + item.repelX;
        const renderY = item.y + item.repelY;

        let hoverScale = 1;
        let glowAmount = 0;
        if (floatingState.mouseX !== null && floatingState.mouseY !== null) {
            const dx = renderX - floatingState.mouseX;
            const dy = renderY - floatingState.mouseY;
            const dist = Math.hypot(dx, dy) || 1;
            const proximity = Math.max(0, 1 - dist / (item.repelRadius + 30));
            hoverScale += proximity * 0.26;
            glowAmount = proximity;
        }

        const twinkle = 0.16 * Math.sin(timeSec * item.twinkleSpeed + item.phase);
        const opacity = Math.max(0.22, Math.min(0.95, item.baseOpacity + twinkle + glowAmount * 0.18));
        item.el.style.opacity = opacity.toFixed(3);
        item.el.style.filter = glowAmount > 0.06 ? `drop-shadow(0 0 ${6 + glowAmount * 14}px rgba(255, 255, 255, 0.45))` : "none";
        item.el.style.transform = `translate3d(${renderX}px, ${renderY}px, 0) scale(${hoverScale.toFixed(3)})`;
    }

    floatingState.rafId = window.requestAnimationFrame(animateFloatingLayer);
}

function startFloatingLayer() {
    if (!floatingLayer) {
        return;
    }

    buildFloatingLayer();
    floatingState.lastTime = 0;

    if (floatingState.rafId) {
        window.cancelAnimationFrame(floatingState.rafId);
    }

    floatingState.rafId = window.requestAnimationFrame(animateFloatingLayer);
}

function stopFloatingLayer() {
    if (floatingState.rafId) {
        window.cancelAnimationFrame(floatingState.rafId);
        floatingState.rafId = null;
    }
}

async function playMusicForEnvelope() {
    bgMusic.muted = false;

    try {
        await bgMusic.play();
    } catch (error) {
        // Ignore autoplay rejections; next user action can retry.
    }
}

function setError(message) {
    pinMessage.textContent = message;
    pinMessage.classList.add("error");
}

function clearPinMessage(message = "") {
    pinMessage.textContent = message;
    pinMessage.classList.remove("error");
}

function unlockEnvelope() {
    isUnlocked = true;
    pinPanel.classList.add("hidden");
    envelopeWrap.classList.add("active");
    clearPinMessage("Unlocked. Click the envelope to open it.");
    envelope.focus();
}

function checkPin() {
    const entered = pinInput.value.trim();

    if (entered === PIN_CODE) {
        unlockEnvelope();
        return;
    }

    setError("Wrong PIN. Hint: remember your name");
}

function toggleEnvelope() {
    if (!isUnlocked) {
        setError("Enter PIN 1234 to unlock the envelope.");
        pinInput.focus();
        return;
    }

    const isOpen = envelope.classList.toggle("open");
    document.body.classList.toggle("letter-focus", isOpen);

    if (isOpen) {
        playMusicForEnvelope();
    } else {
        bgMusic.pause();
    }
}

function closeEnvelope() {
    envelope.classList.remove("open");
    document.body.classList.remove("letter-focus");
    bgMusic.pause();
}

pinBtn.addEventListener("click", checkPin);
pinInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        checkPin();
    }
});

envelope.addEventListener("click", (event) => {
    if (event.target.closest(".letter")) {
        return;
    }

    toggleEnvelope();
});
envelope.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleEnvelope();
    }
});

closeLetterBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeEnvelope();
});

window.addEventListener("pointermove", (event) => {
    document.body.classList.add("has-pointer");
    floatingState.targetMouseX = event.clientX;
    floatingState.targetMouseY = event.clientY;

    if (cursorAura) {
        const auraX = event.clientX - 105;
        const auraY = event.clientY - 105;
        cursorAura.style.transform = `translate3d(${auraX}px, ${auraY}px, 0) scale(1)`;
    }
});

window.addEventListener("pointerleave", () => {
    document.body.classList.remove("has-pointer");
    floatingState.targetMouseX = null;
    floatingState.targetMouseY = null;
    floatingState.mouseX = null;
    floatingState.mouseY = null;

    if (cursorAura) {
        cursorAura.style.transform = "translate3d(-999px, -999px, 0) scale(0.8)";
    }
});

window.addEventListener("resize", () => {
    if (resizeTimer) {
        window.clearTimeout(resizeTimer);
    }

    resizeTimer = window.setTimeout(() => {
        floatingState.count = prefersReducedMotion
            ? 10
            : (isLowPower ? (window.innerWidth < 720 ? 14 : 18) : (window.innerWidth < 720 ? 22 : 30));
        buildFloatingLayer();
    }, 140);
});

document.addEventListener("visibilitychange", () => {
    floatingState.isVisible = !document.hidden;

    if (floatingState.isVisible) {
        startFloatingLayer();
    } else {
        stopFloatingLayer();
    }
});

if (photoPreview) {
    photoPreview.addEventListener("error", () => {
        photoPreview.alt = "image.png not found";
    });
}

startFloatingLayer();
