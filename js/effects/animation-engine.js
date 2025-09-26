class AnimationEngine {
    constructor() {
        this.animations = new Set();
        this.particleSystems = new Map();
        this.tweens = new Map();
        this.easingFunctions = {
            linear: t => t,
            easeIn: t => t * t,
            easeOut: t => 1 - Math.pow(1 - t, 2),
            easeInOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
            bounce: t => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) return n1 * t * t;
                if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
                if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            },
            elastic: t => t === 0 ? 0 : t === 1 ? 1 :
                -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI)
        };
    }

    createMatchAnimation(elements, type = 'normal') {
        const animation = {
            id: Date.now() + Math.random(),
            type: 'match',
            elements: elements,
            matchType: type,
            startTime: Date.now(),
            duration: type === 'special' ? 800 : 500
        };

        this.animations.add(animation);

        elements.forEach((element, index) => {
            setTimeout(() => {
                this.createParticleEffect(element.x, element.y, type);
            }, index * 50);
        });

        return animation.id;
    }

    createComboAnimation(combo, x, y) {
        const animation = {
            id: Date.now() + Math.random(),
            type: 'combo',
            combo: combo,
            x: x,
            y: y,
            startTime: Date.now(),
            duration: 1500,
            scale: 0,
            alpha: 1
        };

        this.animations.add(animation);
        this.createParticleEffect(x, y, 'combo', combo);

        return animation.id;
    }

    createElementFallAnimation(element, fromY, toY) {
        const animation = {
            id: Date.now() + Math.random(),
            type: 'fall',
            element: element,
            fromY: fromY,
            toY: toY,
            startTime: Date.now(),
            duration: 300,
            currentY: fromY
        };

        this.animations.add(animation);
        return animation.id;
    }

    createSpecialEffectAnimation(type, x, y, direction = null) {
        const durations = {
            rocket: 800,
            bomb: 1000,
            rainbow: 1200,
            cross: 600,
            mega: 1500,
            clear: 2000
        };

        const animation = {
            id: Date.now() + Math.random(),
            type: 'special',
            effectType: type,
            x: x,
            y: y,
            direction: direction,
            startTime: Date.now(),
            duration: durations[type] || 1000,
            progress: 0
        };

        this.animations.add(animation);
        this.createSpecialParticles(type, x, y, direction);

        return animation.id;
    }

    createTweenAnimation(target, properties, duration, easing = 'easeOut') {
        const id = Date.now() + Math.random();
        const startValues = {};

        Object.keys(properties).forEach(prop => {
            startValues[prop] = target[prop] || 0;
        });

        const tween = {
            id: id,
            target: target,
            startValues: startValues,
            endValues: properties,
            duration: duration,
            startTime: Date.now(),
            easing: this.easingFunctions[easing] || this.easingFunctions.linear,
            completed: false
        };

        this.tweens.set(id, tween);
        return id;
    }

    createParticleEffect(x, y, type, intensity = 1) {
        const configs = {
            normal: {
                count: 8 * intensity,
                colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4'],
                size: 4,
                speed: 2,
                life: 500
            },
            special: {
                count: 16 * intensity,
                colors: ['#FF1493', '#00CED1', '#FFD700', '#FF69B4'],
                size: 6,
                speed: 3,
                life: 800
            },
            combo: {
                count: 12 * intensity,
                colors: ['#FF0000', '#FF4500', '#FFD700'],
                size: 8,
                speed: 4,
                life: 1000
            }
        };

        const config = configs[type] || configs.normal;
        const particles = [];

        for (let i = 0; i < config.count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * config.speed * 2,
                vy: (Math.random() - 0.5) * config.speed * 2,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                size: config.size + Math.random() * config.size,
                life: config.life,
                maxLife: config.life,
                alpha: 1
            });
        }

        this.particleSystems.set(Date.now() + Math.random(), {
            particles: particles,
            startTime: Date.now(),
            type: type
        });
    }

    createSpecialParticles(type, x, y, direction) {
        const specialConfigs = {
            rocket: {
                count: 20,
                colors: ['#FF4500', '#FFD700', '#FF6B6B'],
                pattern: 'line',
                direction: direction
            },
            bomb: {
                count: 30,
                colors: ['#FF0000', '#FFA500', '#FFFF00'],
                pattern: 'circle',
                radius: 80
            },
            rainbow: {
                count: 40,
                colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
                pattern: 'spiral'
            }
        };

        const config = specialConfigs[type];
        if (!config) return;

        const particles = [];
        for (let i = 0; i < config.count; i++) {
            let vx, vy;

            switch (config.pattern) {
                case 'line':
                    const angle = direction === 'horizontal' ? 0 : Math.PI / 2;
                    vx = Math.cos(angle) * (3 + Math.random() * 2);
                    vy = Math.sin(angle) * (3 + Math.random() * 2);
                    break;
                case 'circle':
                    const circleAngle = (i / config.count) * Math.PI * 2;
                    vx = Math.cos(circleAngle) * 4;
                    vy = Math.sin(circleAngle) * 4;
                    break;
                case 'spiral':
                    const spiralAngle = (i / config.count) * Math.PI * 4;
                    const spiralRadius = (i / config.count) * 3;
                    vx = Math.cos(spiralAngle) * spiralRadius;
                    vy = Math.sin(spiralAngle) * spiralRadius;
                    break;
                default:
                    vx = (Math.random() - 0.5) * 4;
                    vy = (Math.random() - 0.5) * 4;
            }

            particles.push({
                x: x,
                y: y,
                vx: vx,
                vy: vy,
                color: config.colors[i % config.colors.length],
                size: 6 + Math.random() * 4,
                life: 1200,
                maxLife: 1200,
                alpha: 1
            });
        }

        this.particleSystems.set(Date.now() + Math.random(), {
            particles: particles,
            startTime: Date.now(),
            type: type
        });
    }

    update(deltaTime) {
        this.updateAnimations(deltaTime);
        this.updateTweens(deltaTime);
        this.updateParticles(deltaTime);
    }

    updateAnimations(deltaTime) {
        const now = Date.now();
        const toRemove = [];

        this.animations.forEach(animation => {
            const elapsed = now - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);

            switch (animation.type) {
                case 'match':
                    this.updateMatchAnimation(animation, progress);
                    break;
                case 'combo':
                    this.updateComboAnimation(animation, progress);
                    break;
                case 'fall':
                    this.updateFallAnimation(animation, progress);
                    break;
                case 'special':
                    this.updateSpecialAnimation(animation, progress);
                    break;
            }

            if (progress >= 1) {
                toRemove.push(animation);
            }
        });

        toRemove.forEach(animation => this.animations.delete(animation));
    }

    updateMatchAnimation(animation, progress) {
        const scale = 1 + Math.sin(progress * Math.PI) * 0.5;
        const alpha = 1 - progress;

        animation.elements.forEach(element => {
            element.animationScale = scale;
            element.animationAlpha = alpha;
        });
    }

    updateComboAnimation(animation, progress) {
        animation.scale = this.easingFunctions.bounce(progress) * 2;
        animation.alpha = 1 - progress * 0.5;
    }

    updateFallAnimation(animation, progress) {
        const easedProgress = this.easingFunctions.bounce(progress);
        animation.currentY = animation.fromY + (animation.toY - animation.fromY) * easedProgress;
        animation.element.y = animation.currentY;
    }

    updateSpecialAnimation(animation, progress) {
        animation.progress = progress;

        switch (animation.effectType) {
            case 'rocket':
                this.updateRocketEffect(animation, progress);
                break;
            case 'bomb':
                this.updateBombEffect(animation, progress);
                break;
            case 'rainbow':
                this.updateRainbowEffect(animation, progress);
                break;
        }
    }

    updateRocketEffect(animation, progress) {
        const intensity = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
        animation.intensity = intensity;
    }

    updateBombEffect(animation, progress) {
        if (progress < 0.3) {
            animation.scale = progress / 0.3;
        } else if (progress < 0.7) {
            animation.scale = 1;
        } else {
            animation.scale = 1 + (progress - 0.7) / 0.3 * 2;
        }
    }

    updateRainbowEffect(animation, progress) {
        animation.rotation = progress * Math.PI * 4;
        animation.rainbow = progress;
    }

    updateTweens(deltaTime) {
        const now = Date.now();
        const toRemove = [];

        this.tweens.forEach((tween, id) => {
            if (tween.completed) {
                toRemove.push(id);
                return;
            }

            const elapsed = now - tween.startTime;
            const progress = Math.min(elapsed / tween.duration, 1);
            const easedProgress = tween.easing(progress);

            Object.keys(tween.endValues).forEach(prop => {
                const start = tween.startValues[prop];
                const end = tween.endValues[prop];
                tween.target[prop] = start + (end - start) * easedProgress;
            });

            if (progress >= 1) {
                tween.completed = true;
            }
        });

        toRemove.forEach(id => this.tweens.delete(id));
    }

    updateParticles(deltaTime) {
        const now = Date.now();
        const toRemove = [];

        this.particleSystems.forEach((system, id) => {
            const aliveParticles = [];

            system.particles.forEach(particle => {
                particle.life -= deltaTime;

                if (particle.life <= 0) return;

                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.1; // gravity
                particle.alpha = particle.life / particle.maxLife;

                aliveParticles.push(particle);
            });

            if (aliveParticles.length === 0) {
                toRemove.push(id);
            } else {
                system.particles = aliveParticles;
            }
        });

        toRemove.forEach(id => this.particleSystems.delete(id));
    }

    render(ctx) {
        this.renderParticles(ctx);
        this.renderAnimations(ctx);
    }

    renderParticles(ctx) {
        this.particleSystems.forEach(system => {
            system.particles.forEach(particle => {
                ctx.save();
                ctx.globalAlpha = particle.alpha;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        });
    }

    renderAnimations(ctx) {
        this.animations.forEach(animation => {
            switch (animation.type) {
                case 'combo':
                    this.renderComboText(ctx, animation);
                    break;
                case 'special':
                    this.renderSpecialEffect(ctx, animation);
                    break;
            }
        });
    }

    renderComboText(ctx, animation) {
        ctx.save();
        ctx.globalAlpha = animation.alpha;
        ctx.font = `bold ${24 + animation.scale * 12}px Arial`;
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';

        const text = `COMBO x${animation.combo}`;
        ctx.strokeText(text, animation.x, animation.y);
        ctx.fillText(text, animation.x, animation.y);
        ctx.restore();
    }

    renderSpecialEffect(ctx, animation) {
        ctx.save();
        ctx.translate(animation.x, animation.y);

        switch (animation.effectType) {
            case 'rocket':
                this.renderRocketEffect(ctx, animation);
                break;
            case 'bomb':
                this.renderBombEffect(ctx, animation);
                break;
            case 'rainbow':
                this.renderRainbowEffect(ctx, animation);
                break;
        }

        ctx.restore();
    }

    renderRocketEffect(ctx, animation) {
        const intensity = animation.intensity || 1;
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 4 * intensity;
        ctx.globalAlpha = intensity;

        if (animation.direction === 'horizontal') {
            ctx.beginPath();
            ctx.moveTo(-200, 0);
            ctx.lineTo(200, 0);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, -200);
            ctx.lineTo(0, 200);
            ctx.stroke();
        }
    }

    renderBombEffect(ctx, animation) {
        const scale = animation.scale || 1;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 6;
        ctx.globalAlpha = 1 - animation.progress;

        ctx.beginPath();
        ctx.arc(0, 0, 50 * scale, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderRainbowEffect(ctx, animation) {
        const rotation = animation.rotation || 0;
        const rainbow = animation.rainbow || 0;

        ctx.rotate(rotation);

        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        colors.forEach((color, index) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = rainbow;
            ctx.beginPath();
            ctx.arc(0, 0, 30 + index * 8, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    clear() {
        this.animations.clear();
        this.particleSystems.clear();
        this.tweens.clear();
    }

    stopAnimation(id) {
        this.animations.forEach(animation => {
            if (animation.id === id) {
                this.animations.delete(animation);
            }
        });
    }

    pauseAll() {
        this.paused = true;
    }

    resumeAll() {
        this.paused = false;
        const now = Date.now();

        this.animations.forEach(animation => {
            animation.startTime = now - (animation.duration * animation.progress || 0);
        });

        this.tweens.forEach(tween => {
            const elapsed = (tween.target.currentValue || 0) * tween.duration;
            tween.startTime = now - elapsed;
        });
    }
}

window.AnimationEngine = AnimationEngine;