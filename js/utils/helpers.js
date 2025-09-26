/**
 * 工具助手函数
 * 提供通用的实用工具方法
 */

window.GameHelpers = {
    // 数学工具
    math: {
        // 线性插值
        lerp(start, end, t) {
            return start + (end - start) * t;
        },

        // 限制数值范围
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },

        // 随机整数
        randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        // 随机浮点数
        randomFloat(min, max) {
            return Math.random() * (max - min) + min;
        },

        // 角度转弧度
        toRadians(degrees) {
            return degrees * Math.PI / 180;
        },

        // 弧度转角度
        toDegrees(radians) {
            return radians * 180 / Math.PI;
        },

        // 计算两点距离
        distance(x1, y1, x2, y2) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            return Math.sqrt(dx * dx + dy * dy);
        },

        // 计算角度
        angle(x1, y1, x2, y2) {
            return Math.atan2(y2 - y1, x2 - x1);
        }
    },

    // 缓动函数
    easing: {
        // 线性
        linear(t) {
            return t;
        },

        // 二次方缓入
        easeInQuad(t) {
            return t * t;
        },

        // 二次方缓出
        easeOutQuad(t) {
            return t * (2 - t);
        },

        // 二次方缓入缓出
        easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        },

        // 三次方缓入
        easeInCubic(t) {
            return t * t * t;
        },

        // 三次方缓出
        easeOutCubic(t) {
            return (--t) * t * t + 1;
        },

        // 三次方缓入缓出
        easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        },

        // 弹性缓出
        easeOutElastic(t) {
            return Math.sin(-13 * (t + 1) * Math.PI / 2) * Math.pow(2, -10 * t) + 1;
        },

        // 回弹缓出
        easeOutBounce(t) {
            if (t < 1 / 2.75) {
                return 7.5625 * t * t;
            } else if (t < 2 / 2.75) {
                return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            } else if (t < 2.5 / 2.75) {
                return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            } else {
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            }
        }
    },

    // 颜色工具
    color: {
        // RGB转十六进制
        rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },

        // 十六进制转RGB
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        // HSL转RGB
        hslToRgb(h, s, l) {
            h /= 360;
            s /= 100;
            l /= 100;

            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            return {
                r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
                g: Math.round(hue2rgb(p, q, h) * 255),
                b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
            };
        },

        // 颜色插值
        interpolate(color1, color2, t) {
            const c1 = this.hexToRgb(color1);
            const c2 = this.hexToRgb(color2);

            if (!c1 || !c2) return color1;

            const r = Math.round(GameHelpers.math.lerp(c1.r, c2.r, t));
            const g = Math.round(GameHelpers.math.lerp(c1.g, c2.g, t));
            const b = Math.round(GameHelpers.math.lerp(c1.b, c2.b, t));

            return this.rgbToHex(r, g, b);
        }
    },

    // 数组工具
    array: {
        // 洗牌算法
        shuffle(array) {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        },

        // 随机选择元素
        randomElement(array) {
            return array[Math.floor(Math.random() * array.length)];
        },

        // 随机选择多个元素
        randomElements(array, count) {
            const shuffled = this.shuffle(array);
            return shuffled.slice(0, count);
        },

        // 移除元素
        remove(array, element) {
            const index = array.indexOf(element);
            if (index > -1) {
                array.splice(index, 1);
            }
            return array;
        },

        // 去重
        unique(array) {
            return [...new Set(array)];
        },

        // 分组
        groupBy(array, keyFn) {
            return array.reduce((groups, item) => {
                const key = keyFn(item);
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(item);
                return groups;
            }, {});
        }
    },

    // 字符串工具
    string: {
        // 格式化模板字符串
        format(template, data) {
            return template.replace(/\{(\w+)\}/g, (match, key) => {
                return data.hasOwnProperty(key) ? data[key] : match;
            });
        },

        // 首字母大写
        capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        },

        // 驼峰命名转换
        camelCase(str) {
            return str.replace(/[-_\s](.)/g, (match, char) => char.toUpperCase());
        },

        // 下划线命名转换
        snakeCase(str) {
            return str.replace(/([A-Z])/g, '_$1').toLowerCase();
        },

        // 生成随机字符串
        random(length = 8, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }
    },

    // 时间工具
    time: {
        // 延迟执行
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        // 格式化时间
        format(ms, format = 'mm:ss') {
            const seconds = Math.floor(ms / 1000) % 60;
            const minutes = Math.floor(ms / (1000 * 60)) % 60;
            const hours = Math.floor(ms / (1000 * 60 * 60));

            const pad = (num) => String(num).padStart(2, '0');

            return format
                .replace('hh', pad(hours))
                .replace('mm', pad(minutes))
                .replace('ss', pad(seconds));
        },

        // 获取友好时间显示
        friendly(timestamp) {
            const now = Date.now();
            const diff = now - timestamp;

            const second = 1000;
            const minute = second * 60;
            const hour = minute * 60;
            const day = hour * 24;

            if (diff < minute) {
                return '刚刚';
            } else if (diff < hour) {
                return `${Math.floor(diff / minute)}分钟前`;
            } else if (diff < day) {
                return `${Math.floor(diff / hour)}小时前`;
            } else {
                return `${Math.floor(diff / day)}天前`;
            }
        }
    },

    // 本地存储工具
    storage: {
        // 获取数据
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        },

        // 设置数据
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },

        // 移除数据
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },

        // 清空所有数据
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        },

        // 获取存储大小
        size() {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return total;
        }
    },

    // DOM工具
    dom: {
        // 查询元素
        $(selector, context = document) {
            return context.querySelector(selector);
        },

        // 查询所有元素
        $$(selector, context = document) {
            return Array.from(context.querySelectorAll(selector));
        },

        // 创建元素
        create(tag, attributes = {}, content = '') {
            const element = document.createElement(tag);

            Object.keys(attributes).forEach(key => {
                if (key === 'className') {
                    element.className = attributes[key];
                } else if (key === 'innerHTML') {
                    element.innerHTML = attributes[key];
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            });

            if (content) {
                element.textContent = content;
            }

            return element;
        },

        // 添加事件监听
        on(element, event, handler, options = false) {
            element.addEventListener(event, handler, options);
            return () => element.removeEventListener(event, handler, options);
        },

        // 触发事件
        trigger(element, eventType, detail = null) {
            const event = new CustomEvent(eventType, { detail });
            element.dispatchEvent(event);
        },

        // 获取元素位置
        getPosition(element) {
            const rect = element.getBoundingClientRect();
            return {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height
            };
        },

        // 检查元素是否在视窗中
        isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        }
    },

    // 网络工具
    network: {
        // 检查网络状态
        isOnline() {
            return navigator.onLine;
        },

        // 简单的HTTP请求
        async request(url, options = {}) {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const config = { ...defaultOptions, ...options };

            if (config.body && typeof config.body === 'object') {
                config.body = JSON.stringify(config.body);
            }

            try {
                const response = await fetch(url, config);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                } else {
                    return await response.text();
                }
            } catch (error) {
                console.error('Network request failed:', error);
                throw error;
            }
        }
    },

    // 设备检测
    device: {
        // 检查是否为移动设备
        isMobile() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },

        // 检查是否为触摸设备
        isTouch() {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },

        // 获取设备像素比
        getPixelRatio() {
            return window.devicePixelRatio || 1;
        },

        // 获取视窗大小
        getViewportSize() {
            return {
                width: window.innerWidth || document.documentElement.clientWidth,
                height: window.innerHeight || document.documentElement.clientHeight
            };
        },

        // 检查设备方向
        getOrientation() {
            if (window.orientation !== undefined) {
                return Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
            }
            return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        }
    },

    // 性能优化工具
    performance: {
        // 防抖
        debounce(func, wait, immediate = false) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    timeout = null;
                    if (!immediate) func(...args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func(...args);
            };
        },

        // 节流
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // 内存使用情况
        getMemoryUsage() {
            if (performance.memory) {
                return {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) // MB
                };
            }
            return null;
        },

        // FPS计算器
        createFpsCounter() {
            let fps = 0;
            let lastTime = performance.now();
            let frameCount = 0;

            return {
                update() {
                    frameCount++;
                    const currentTime = performance.now();
                    if (currentTime >= lastTime + 1000) {
                        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                        frameCount = 0;
                        lastTime = currentTime;
                    }
                },
                getFPS() {
                    return fps;
                }
            };
        }
    },

    // 调试工具
    debug: {
        // 日志级别
        LOG_LEVELS: {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        },

        currentLevel: 1, // INFO

        log(level, message, ...args) {
            if (level >= this.currentLevel) {
                const methods = ['debug', 'info', 'warn', 'error'];
                const method = methods[level] || 'log';
                console[method](`[${new Date().toISOString()}]`, message, ...args);
            }
        },

        debug(message, ...args) {
            this.log(this.LOG_LEVELS.DEBUG, message, ...args);
        },

        info(message, ...args) {
            this.log(this.LOG_LEVELS.INFO, message, ...args);
        },

        warn(message, ...args) {
            this.log(this.LOG_LEVELS.WARN, message, ...args);
        },

        error(message, ...args) {
            this.log(this.LOG_LEVELS.ERROR, message, ...args);
        },

        // 性能测量
        time(label) {
            console.time(label);
        },

        timeEnd(label) {
            console.timeEnd(label);
        }
    }
};

console.log('🔧 Game helpers loaded');