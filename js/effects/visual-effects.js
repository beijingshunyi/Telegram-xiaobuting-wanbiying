class VisualEffectsManager {
    constructor() {
        this.animationEngine = new AnimationEngine();
        this.particleSystem = new ParticleSystem();
        this.screenShakeActive = false;
        this.screenShakeIntensity = 0;
        this.screenShakeDuration = 0;
        this.screenShakeStartTime = 0;
        this.flashActive = false;
        this.flashAlpha = 0;
        this.flashColor = '#FFFFFF';
        this.slowMotionActive = false;
        this.timeScale = 1;
        this.comboChainsActive = new Map();
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;
        this.initialized = true;
    }

    createMatchEffect(elements, matchType = 'normal') {
        const centerX = elements.reduce((sum, el) => sum + el.x, 0) / elements.length;
        const centerY = elements.reduce((sum, el) => sum + el.y, 0) / elements.length;

        this.animationEngine.createMatchAnimation(elements, matchType);

        let particlePreset = 'sparkle';
        let screenShake = 2;

        switch (matchType) {
            case 'perfect':
                particlePreset = 'starburst';
                this.createFlashEffect('#FFD700', 0.3, 200);
                screenShake = 5;
                break;
            case 'special':
                particlePreset = 'rainbow';
                this.createFlashEffect('#FF69B4', 0.4, 300);
                screenShake = 7;
                break;
            case 'combo':
                particlePreset = 'explosion';
                screenShake = 4;
                break;
        }

        this.particleSystem.createBurst(centerX, centerY, particlePreset);
        this.createScreenShake(screenShake, 200);

        return {
            centerX,
            centerY,
            type: matchType
        };
    }

    createComboEffect(comboCount, x, y) {
        this.animationEngine.createComboAnimation(comboCount, x, y);

        const intensity = Math.min(comboCount / 5, 3);
        let effectType = 'explosion';

        if (comboCount >= 10) {
            effectType = 'rainbow';
            this.createFlashEffect('#FF1493', 0.5, 400);
            this.createScreenShake(10, 400);
            this.enableSlowMotion(0.5, 1000);
        } else if (comboCount >= 5) {
            effectType = 'starburst';
            this.createFlashEffect('#00CED1', 0.4, 300);
            this.createScreenShake(7, 300);
        } else {
            this.createScreenShake(3 + comboCount, 150 + comboCount * 50);
        }

        this.particleSystem.createSpecialEffect('comboChain', x, y, intensity);

        const chainId = Date.now();
        this.comboChainsActive.set(chainId, {
            x, y, count: comboCount, startTime: Date.now()
        });

        setTimeout(() => {
            this.comboChainsActive.delete(chainId);
        }, 2000);

        return chainId;
    }

    createSpecialElementEffect(type, x, y, direction = null) {
        let animationId = this.animationEngine.createSpecialEffectAnimation(type, x, y, direction);

        switch (type) {
            case 'rocket':
                this.particleSystem.createSpecialEffect('powerupActivation', x, y);
                this.createScreenShake(6, 300);
                break;

            case 'bomb':
                this.particleSystem.createBurst(x, y, 'explosion');
                this.createFlashEffect('#FF4500', 0.6, 250);
                this.createScreenShake(8, 400);

                setTimeout(() => {
                    for (let i = 0; i < 5; i++) {
                        const angle = (Math.PI * 2 / 5) * i;
                        const distance = 60;
                        const px = x + Math.cos(angle) * distance;
                        const py = y + Math.sin(angle) * distance;
                        this.particleSystem.createBurst(px, py, 'sparkle');
                    }
                }, 200);
                break;

            case 'rainbow':
                this.particleSystem.createBurst(x, y, 'rainbow');
                this.createFlashEffect('#9400D3', 0.7, 500);
                this.createScreenShake(12, 600);
                this.enableSlowMotion(0.3, 1500);

                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        const angle = (Math.PI * 2 / 8) * i;
                        const distance = 80 + i * 10;
                        const px = x + Math.cos(angle) * distance;
                        const py = y + Math.sin(angle) * distance;
                        this.particleSystem.createBurst(px, py, 'magic');
                    }, i * 100);
                }
                break;

            case 'cross':
                this.particleSystem.createSpecialEffect('powerupActivation', x, y, 2);
                this.createScreenShake(10, 500);
                break;

            case 'mega':
                this.createMegaBlastEffect(x, y);
                break;

            case 'clear':
                this.createClearAllEffect(x, y);
                break;
        }

        return animationId;
    }

    createMegaBlastEffect(x, y) {
        this.createFlashEffect('#FF0000', 0.8, 800);
        this.createScreenShake(15, 800);
        this.enableSlowMotion(0.2, 2000);

        this.particleSystem.createBurst(x, y, 'explosion');

        for (let ring = 1; ring <= 4; ring++) {
            setTimeout(() => {
                const particles = ring * 8;
                for (let i = 0; i < particles; i++) {
                    const angle = (Math.PI * 2 / particles) * i;
                    const distance = ring * 60;
                    const px = x + Math.cos(angle) * distance;
                    const py = y + Math.sin(angle) * distance;
                    this.particleSystem.createBurst(px, py, 'explosion');
                }
            }, ring * 150);
        }
    }

    createClearAllEffect(x, y) {
        this.createFlashEffect('#FFFFFF', 1, 1200);
        this.createScreenShake(20, 1000);
        this.enableSlowMotion(0.1, 3000);

        this.particleSystem.createBurst(x, y, 'rainbow');

        const spiralParticles = 50;
        for (let i = 0; i < spiralParticles; i++) {
            setTimeout(() => {
                const angle = (i / spiralParticles) * Math.PI * 8;
                const distance = (i / spiralParticles) * 200;
                const px = x + Math.cos(angle) * distance;
                const py = y + Math.sin(angle) * distance;
                this.particleSystem.createBurst(px, py, 'starburst');
            }, i * 20);
        }
    }

    createLevelCompleteEffect() {
        const centerX = 400;
        const centerY = 300;

        this.createFlashEffect('#FFD700', 0.6, 1000);
        this.createScreenShake(8, 800);

        this.particleSystem.createSpecialEffect('levelUp', centerX, centerY);

        setTimeout(() => {
            this.particleSystem.createBurst(centerX, centerY, 'confetti');
        }, 300);

        setTimeout(() => {
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI * 2 / 10) * i;
                const distance = 150;
                const px = centerX + Math.cos(angle) * distance;
                const py = centerY + Math.sin(angle) * distance;
                this.particleSystem.createBurst(px, py, 'sparkle');
            }
        }, 600);
    }

    createCoinRewardEffect(amount, x, y) {
        const intensity = Math.min(amount / 100, 5);

        this.particleSystem.createSpecialEffect('coinReward', x, y, intensity);

        for (let i = 0; i < intensity; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 100;
                const offsetY = (Math.random() - 0.5) * 100;
                this.particleSystem.createBurst(x + offsetX, y + offsetY, 'sparkle');
            }, i * 100);
        }

        if (amount >= 1000) {
            this.createFlashEffect('#FFD700', 0.4, 500);
            this.createScreenShake(5, 300);
        }
    }

    createScreenShake(intensity, duration) {
        this.screenShakeActive = true;
        this.screenShakeIntensity = intensity;
        this.screenShakeDuration = duration;
        this.screenShakeStartTime = Date.now();
    }

    createFlashEffect(color, maxAlpha, duration) {
        this.flashActive = true;
        this.flashColor = color;
        this.flashAlpha = maxAlpha;

        this.animationEngine.createTweenAnimation(
            this,
            { flashAlpha: 0 },
            duration,
            'easeOut'
        );

        setTimeout(() => {
            this.flashActive = false;
        }, duration + 50);
    }

    enableSlowMotion(timeScale, duration) {
        this.slowMotionActive = true;
        this.timeScale = timeScale;

        setTimeout(() => {
            this.slowMotionActive = false;
            this.timeScale = 1;
        }, duration);
    }

    createPowerupPickupEffect(type, x, y) {
        const effects = {
            'extra-moves': {
                color: '#00CED1',
                preset: 'magic',
                flash: true
            },
            'time-freeze': {
                color: '#87CEEB',
                preset: 'starburst',
                flash: true
            },
            'score-multiplier': {
                color: '#FFD700',
                preset: 'rainbow',
                flash: true
            },
            'element-destroyer': {
                color: '#FF4500',
                preset: 'explosion',
                flash: true
            }
        };

        const effect = effects[type] || effects['extra-moves'];

        this.particleSystem.createBurst(x, y, effect.preset);

        if (effect.flash) {
            this.createFlashEffect(effect.color, 0.3, 200);
        }

        this.createScreenShake(3, 200);
    }

    update(deltaTime) {
        const scaledDeltaTime = deltaTime * this.timeScale;

        this.animationEngine.update(scaledDeltaTime);
        this.particleSystem.update(scaledDeltaTime);

        this.updateScreenShake();
        this.updateComboChains();
    }

    updateScreenShake() {
        if (!this.screenShakeActive) return;

        const elapsed = Date.now() - this.screenShakeStartTime;
        if (elapsed >= this.screenShakeDuration) {
            this.screenShakeActive = false;
            this.screenShakeIntensity = 0;
            return;
        }

        const progress = elapsed / this.screenShakeDuration;
        const intensity = this.screenShakeIntensity * (1 - progress);

        this.currentShakeX = (Math.random() - 0.5) * intensity * 2;
        this.currentShakeY = (Math.random() - 0.5) * intensity * 2;
    }

    updateComboChains() {
        const now = Date.now();
        const toRemove = [];

        this.comboChainsActive.forEach((chain, id) => {
            const elapsed = now - chain.startTime;

            if (elapsed > 2000) {
                toRemove.push(id);
                return;
            }

            if (elapsed % 300 < 50) {
                const offsetX = (Math.random() - 0.5) * 50;
                const offsetY = (Math.random() - 0.5) * 50;
                this.particleSystem.createBurst(
                    chain.x + offsetX,
                    chain.y + offsetY,
                    'sparkle'
                );
            }
        });

        toRemove.forEach(id => this.comboChainsActive.delete(id));
    }

    render(ctx) {
        ctx.save();

        if (this.screenShakeActive) {
            ctx.translate(this.currentShakeX || 0, this.currentShakeY || 0);
        }

        this.animationEngine.render(ctx);
        this.particleSystem.render(ctx);

        ctx.restore();

        if (this.flashActive && this.flashAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }

        if (this.slowMotionActive) {
            this.renderSlowMotionOverlay(ctx);
        }
    }

    renderSlowMotionOverlay(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#0080FF';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#0080FF';
        ctx.lineWidth = 2;
        const time = Date.now() / 1000;

        for (let i = 0; i < 5; i++) {
            const y = (Math.sin(time + i) * 50) + ctx.canvas.height / 2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(ctx.canvas.width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    getShakeOffset() {
        return {
            x: this.currentShakeX || 0,
            y: this.currentShakeY || 0
        };
    }

    isSlowMotionActive() {
        return this.slowMotionActive;
    }

    getTimeScale() {
        return this.timeScale;
    }

    clear() {
        this.animationEngine.clear();
        this.particleSystem.clearAll();
        this.comboChainsActive.clear();
        this.screenShakeActive = false;
        this.flashActive = false;
        this.slowMotionActive = false;
        this.timeScale = 1;
    }

    createTrailEffect(startX, startY, endX, endY, type = 'normal') {
        let preset = 'sparkle';
        let particleCount = 10;

        switch (type) {
            case 'rocket':
                preset = 'explosion';
                particleCount = 15;
                break;
            case 'magic':
                preset = 'magic';
                particleCount = 12;
                break;
            case 'rainbow':
                preset = 'rainbow';
                particleCount = 20;
                break;
        }

        this.particleSystem.createTrail(startX, startY, endX, endY, preset, particleCount);
    }

    createElementSwapEffect(element1, element2) {
        this.createTrailEffect(element1.x, element1.y, element2.x, element2.y);
        this.createTrailEffect(element2.x, element2.y, element1.x, element1.y);

        this.particleSystem.createBurst(element1.x, element1.y, 'sparkle');
        this.particleSystem.createBurst(element2.x, element2.y, 'sparkle');
    }

    preloadEffects() {
        this.particleSystem.createBurst(-100, -100, 'sparkle');
        this.particleSystem.createBurst(-100, -100, 'explosion');
        this.particleSystem.createBurst(-100, -100, 'starburst');

        setTimeout(() => {
            this.particleSystem.clearAll();
        }, 100);
    }
}

window.VisualEffectsManager = VisualEffectsManager;