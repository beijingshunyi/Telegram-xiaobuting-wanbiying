class ParticleSystem {
    constructor() {
        this.emitters = new Map();
        this.globalParticles = [];
        this.presets = {
            sparkle: {
                particleCount: 20,
                lifetime: 1000,
                speed: { min: 1, max: 3 },
                size: { min: 2, max: 6 },
                colors: ['#FFD700', '#FFF700', '#FFAA00'],
                gravity: 0,
                fadeOut: true,
                shape: 'circle'
            },
            explosion: {
                particleCount: 30,
                lifetime: 800,
                speed: { min: 2, max: 6 },
                size: { min: 3, max: 8 },
                colors: ['#FF4500', '#FF6B6B', '#FFD700', '#FF1493'],
                gravity: 0.1,
                fadeOut: true,
                shape: 'circle'
            },
            starburst: {
                particleCount: 25,
                lifetime: 1200,
                speed: { min: 1.5, max: 4 },
                size: { min: 4, max: 7 },
                colors: ['#00CED1', '#FF69B4', '#FFD700', '#98FB98'],
                gravity: 0.05,
                fadeOut: true,
                shape: 'star'
            },
            rainbow: {
                particleCount: 35,
                lifetime: 1500,
                speed: { min: 1, max: 3.5 },
                size: { min: 3, max: 6 },
                colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
                gravity: 0,
                fadeOut: true,
                shape: 'circle',
                rainbow: true
            },
            confetti: {
                particleCount: 40,
                lifetime: 2000,
                speed: { min: 2, max: 5 },
                size: { min: 4, max: 10 },
                colors: ['#FF69B4', '#00CED1', '#FFD700', '#98FB98', '#FF6B6B'],
                gravity: 0.15,
                fadeOut: true,
                shape: 'rectangle',
                rotation: true
            },
            magic: {
                particleCount: 15,
                lifetime: 2500,
                speed: { min: 0.5, max: 2 },
                size: { min: 3, max: 8 },
                colors: ['#9370DB', '#FF69B4', '#00CED1', '#FFD700'],
                gravity: -0.02,
                fadeOut: true,
                shape: 'diamond',
                glow: true
            }
        };
    }

    createEmitter(x, y, preset = 'sparkle', duration = 1000) {
        const emitterId = Date.now() + Math.random();
        const config = { ...this.presets[preset] };

        const emitter = {
            id: emitterId,
            x: x,
            y: y,
            config: config,
            particles: [],
            startTime: Date.now(),
            duration: duration,
            active: true,
            emissionRate: config.particleCount / (duration / 1000),
            lastEmission: 0
        };

        this.emitters.set(emitterId, emitter);
        return emitterId;
    }

    createBurst(x, y, preset = 'explosion') {
        const config = this.presets[preset];
        const particles = [];

        for (let i = 0; i < config.particleCount; i++) {
            const angle = (Math.PI * 2 / config.particleCount) * i + Math.random() * 0.5;
            const speed = this.randomBetween(config.speed.min, config.speed.max);
            const size = this.randomBetween(config.size.min, config.size.max);
            const color = config.colors[Math.floor(Math.random() * config.colors.length)];

            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                originalSize: size,
                color: color,
                life: config.lifetime,
                maxLife: config.lifetime,
                alpha: 1,
                rotation: config.rotation ? Math.random() * Math.PI * 2 : 0,
                rotationSpeed: config.rotation ? (Math.random() - 0.5) * 0.2 : 0,
                shape: config.shape,
                gravity: config.gravity || 0,
                fadeOut: config.fadeOut,
                glow: config.glow,
                rainbow: config.rainbow
            };

            particles.push(particle);
        }

        this.globalParticles.push(...particles);
        return particles;
    }

    createTrail(startX, startY, endX, endY, preset = 'sparkle', particleCount = 15) {
        const config = this.presets[preset];
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const progress = i / (particleCount - 1);
            const x = startX + (endX - startX) * progress;
            const y = startY + (endY - startY) * progress;

            const speed = this.randomBetween(config.speed.min, config.speed.max) * 0.5;
            const angle = Math.random() * Math.PI * 2;
            const size = this.randomBetween(config.size.min, config.size.max);
            const color = config.colors[Math.floor(Math.random() * config.colors.length)];

            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                originalSize: size,
                color: color,
                life: config.lifetime * (1 - progress * 0.5),
                maxLife: config.lifetime,
                alpha: 1,
                rotation: 0,
                rotationSpeed: 0,
                shape: config.shape,
                gravity: config.gravity || 0,
                fadeOut: config.fadeOut,
                glow: config.glow,
                rainbow: config.rainbow
            };

            particles.push(particle);
        }

        this.globalParticles.push(...particles);
        return particles;
    }

    createSpecialEffect(type, x, y, intensity = 1) {
        switch (type) {
            case 'levelUp':
                this.createBurst(x, y, 'starburst');
                setTimeout(() => this.createBurst(x, y, 'confetti'), 200);
                break;

            case 'perfectMatch':
                this.createBurst(x, y, 'rainbow');
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        this.createBurst(x + (Math.random() - 0.5) * 100,
                                       y + (Math.random() - 0.5) * 100, 'sparkle');
                    }, i * 150);
                }
                break;

            case 'powerupActivation':
                this.createBurst(x, y, 'magic');
                this.createEmitter(x, y, 'sparkle', 2000);
                break;

            case 'coinReward':
                const coinParticles = this.createBurst(x, y, 'sparkle');
                coinParticles.forEach(particle => {
                    particle.color = '#FFD700';
                    particle.shape = 'coin';
                });
                break;

            case 'comboChain':
                for (let i = 0; i < intensity; i++) {
                    setTimeout(() => {
                        this.createBurst(x + Math.sin(i) * 50, y + Math.cos(i) * 50, 'explosion');
                    }, i * 100);
                }
                break;

            case 'elementDestroy':
                this.createBurst(x, y, 'explosion');
                break;
        }
    }

    update(deltaTime) {
        this.updateEmitters(deltaTime);
        this.updateParticles(deltaTime);
        this.cleanupDeadParticles();
    }

    updateEmitters(deltaTime) {
        const now = Date.now();
        const toRemove = [];

        this.emitters.forEach((emitter, id) => {
            if (!emitter.active || now - emitter.startTime > emitter.duration) {
                toRemove.push(id);
                return;
            }

            const timeSinceLastEmission = now - emitter.lastEmission;
            const emissionInterval = 1000 / emitter.emissionRate;

            if (timeSinceLastEmission >= emissionInterval) {
                this.emitParticle(emitter);
                emitter.lastEmission = now;
            }

            this.updateParticles(deltaTime, emitter.particles);
        });

        toRemove.forEach(id => this.emitters.delete(id));
    }

    emitParticle(emitter) {
        const config = emitter.config;
        const angle = Math.random() * Math.PI * 2;
        const speed = this.randomBetween(config.speed.min, config.speed.max);
        const size = this.randomBetween(config.size.min, config.size.max);
        const color = config.colors[Math.floor(Math.random() * config.colors.length)];

        const particle = {
            x: emitter.x + (Math.random() - 0.5) * 20,
            y: emitter.y + (Math.random() - 0.5) * 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size,
            originalSize: size,
            color: color,
            life: config.lifetime,
            maxLife: config.lifetime,
            alpha: 1,
            rotation: config.rotation ? Math.random() * Math.PI * 2 : 0,
            rotationSpeed: config.rotation ? (Math.random() - 0.5) * 0.1 : 0,
            shape: config.shape,
            gravity: config.gravity || 0,
            fadeOut: config.fadeOut,
            glow: config.glow,
            rainbow: config.rainbow
        };

        emitter.particles.push(particle);
    }

    updateParticles(deltaTime, particleArray = this.globalParticles) {
        particleArray.forEach(particle => {
            particle.life -= deltaTime;

            if (particle.life <= 0) return;

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity;

            if (particle.rotation !== undefined) {
                particle.rotation += particle.rotationSpeed;
            }

            if (particle.fadeOut) {
                particle.alpha = particle.life / particle.maxLife;
            }

            if (particle.rainbow) {
                const hue = (Date.now() / 10) % 360;
                particle.color = `hsl(${hue}, 100%, 60%)`;
            }

            const lifeRatio = particle.life / particle.maxLife;
            particle.size = particle.originalSize * (0.5 + lifeRatio * 0.5);
        });
    }

    cleanupDeadParticles() {
        this.globalParticles = this.globalParticles.filter(p => p.life > 0);

        this.emitters.forEach(emitter => {
            emitter.particles = emitter.particles.filter(p => p.life > 0);
        });
    }

    render(ctx) {
        this.renderParticles(ctx, this.globalParticles);

        this.emitters.forEach(emitter => {
            this.renderParticles(ctx, emitter.particles);
        });
    }

    renderParticles(ctx, particles) {
        particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.alpha;
            ctx.translate(particle.x, particle.y);

            if (particle.rotation) {
                ctx.rotate(particle.rotation);
            }

            if (particle.glow) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = particle.color;
            }

            ctx.fillStyle = particle.color;

            switch (particle.shape) {
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'star':
                    this.drawStar(ctx, 0, 0, 5, particle.size, particle.size * 0.5);
                    break;

                case 'rectangle':
                    ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                    break;

                case 'diamond':
                    this.drawDiamond(ctx, 0, 0, particle.size);
                    break;

                case 'coin':
                    this.drawCoin(ctx, 0, 0, particle.size);
                    break;

                default:
                    ctx.beginPath();
                    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                    ctx.fill();
            }

            ctx.restore();
        });
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    drawDiamond(ctx, cx, cy, size) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size, cy);
        ctx.lineTo(cx, cy + size);
        ctx.lineTo(cx - size, cy);
        ctx.closePath();
        ctx.fill();
    }

    drawCoin(ctx, cx, cy, radius) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFA500';
        ctx.font = `${radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('¥', cx, cy);
    }

    randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    stopEmitter(emitterId) {
        const emitter = this.emitters.get(emitterId);
        if (emitter) {
            emitter.active = false;
        }
    }

    clearAll() {
        this.emitters.clear();
        this.globalParticles = [];
    }

    setGlobalWind(windX, windY) {
        this.windX = windX || 0;
        this.windY = windY || 0;
    }

    createCustomPreset(name, config) {
        this.presets[name] = config;
    }

    getActiveParticleCount() {
        let count = this.globalParticles.length;
        this.emitters.forEach(emitter => {
            count += emitter.particles.length;
        });
        return count;
    }
}

window.ParticleSystem = ParticleSystem;