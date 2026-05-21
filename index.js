// =========================================================================
// 1. Inisialisasi Kursor Magnetik
// =========================================================================
new MagneticCursor({
    targetSelector: '.cursor-target',
    spinDuration: 3,
    hideDefaultCursor: true
});

// =========================================================================
// 2. Database Konten Proyek (Mendukung .gltf 3D & Screenshot Software)
// =========================================================================
const projectDatabase = {
    majigotcha: {
        title: "Majigotcha Development",
        type: "hardware",
        description: "MAJIGOTCHA is a handheld digital pet, proper care determines its growth while neglect can cause it to die.",
        model3d: "./assets/3dmodels/majigotcha.gltf" 
    },
    sharkpad: {
        title: "Sharkpad Macropad",
        type: "hardware",
        description: "A custom 2x3 mechanical macropad built around the Seeed Studio XIAO RP2040. Features physical keyswitch hotswap sockets, custom circuit routing design via KiCad, and a parametric 3D case.",
        model3d: "./assets/3dmodels/sharkpad.gltf" 
    },
    tap: {
        title: "Tap Tap Trulala",
        type: "hardware",
        description: "RFID music player, modification or improvisation from juukebox by ananords (instructables).",
        model3d: "./assets/3dmodels/taptaptrulala.gltf" 
    },
    yo: {
        title: "Yohub",
        type: "hardware",
        description: "meet YOHUBv0.1.0! a compact size dual function of hardware! aesthetic and usable as an USB HUB!",
        model3d: "./assets/3dmodels/yohub.gltf" 
    },
    clowncard: {
        title: "ClownCard",
        type: "software",
        description: "A business startup concept combining custom NFC acrylic keychains with deep-linking digital profile pages. Optimized for custom aesthetics and instant profile sharing built on full-stack web architecture.",
        model3d: null,
        previewImg: "./assets/images/clowncard-preview.png",
        liveUrl: "https://clowncard.id"
    },
    cooquizz: {
        title: "Cooquizz",
        type: "software",
        description: "Complete quizzes and get new recipes!",
        model3d: null,
        previewImg: "./assets/images/clowncard-preview.png",
        liveUrl: "https://github.com/cybloxyz/cooquizz"
    }
};

// =========================================================================
// 3. Engine Animasi Scramble Text (Konversi dari Svelte 5)
// =========================================================================
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';

class TextScrambler {
    constructor(element, options = {}) {
        this.el = element;
        this.originalText = element.textContent.trim();
        this.iterations = options.iterations || 7;
        this.speed = options.speed || 10;
        this.rippleRadius = options.rippleRadius || 1;
        
        this.chars = [];
        this.isAnimating = false;
        this.init();
    }

    init() {
        // Cek apakah elemen ini merupakan paragraf perkenalan panjang
        this.disableHover = this.el.classList.contains('js-scramble-p');
        
        this.el.innerHTML = '';
        this.chars = this.originalText.split('').map((char, index) => {
            const span = document.createElement('span');
            const isStatic = char === ' ' || /[^\w]/.test(char);
            
            span.textContent = char;
            if (!isStatic && !this.disableHover) {
                span.classList.add('hover-char');
                span.addEventListener('mouseenter', () => this.handleHover(index));
            }
            this.el.appendChild(span);

            return {
                dom: span,
                original: char,
                current: char,
                isStatic: isStatic,
                animating: false,
                iteration: 0,
                timeoutId: null
            };
        });
    }

    getRandomChar() {
        return CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }

    scrambleChar(index) {
        const char = this.chars[index];
        if (!char || char.animating || char.isStatic) return;

        char.animating = true;
        char.iteration = 0;

        const nextIteration = () => {
            if (char.iteration < this.iterations) {
                char.current = this.getRandomChar();
                char.dom.textContent = char.current;
                char.iteration++;
                
                const delay = this.speed * Math.pow(1.2, char.iteration);
                char.timeoutId = setTimeout(nextIteration, delay);
            } else {
                char.current = char.original;
                char.dom.textContent = char.original;
                char.animating = false;
                char.timeoutId = null;
            }
        };

        nextIteration();
    }

    handleHover(index) {
        this.scrambleChar(index);

        for (let i = Math.max(0, index - this.rippleRadius); i <= Math.min(this.chars.length - 1, index + this.rippleRadius); i++) {
            if (i !== index) {
                const distance = Math.abs(i - index);
                setTimeout(() => this.scrambleChar(i), distance * 15);
            }
        }
    }

    triggerInitialScramble(duration = 2.2, delayMax = 0.4, staggerMax = 0.6) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        const startTime = Date.now();
        
        this.chars.forEach((char, index) => {
            if (!char.isStatic) {
                const lockTime = Math.random() * delayMax + (index / this.chars.length) * staggerMax;
                char.lockTime = lockTime * 1000;
                char.locked = false;
            }
        });

        const tick = () => {
            if (!this.isAnimating) return;
            const elapsed = Date.now() - startTime;
            let allLocked = true;

            this.chars.forEach((char) => {
                if (char.isStatic) return;

                if (!char.locked) {
                    if (elapsed >= char.lockTime) {
                        char.locked = true;
                        char.dom.textContent = char.original;
                    } else {
                        char.dom.textContent = this.getRandomChar();
                        allLocked = false;
                    }
                }
            });

            if (allLocked && elapsed >= duration * 1000) {
                this.isAnimating = false;
                gsap.ticker.remove(tick);
            }
        };

        gsap.ticker.add(tick);
    }
}

// =========================================================================
// 4. Routing Handler Modal Popup + IntersectionObserver Control
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // FIX: Variabel allBigTitles sekarang diambil dari dokumen DOM agar tidak menyebabkan crash!
    const allBigTitles = document.querySelectorAll('.bigtitle');
    const homeSubtitle = document.querySelector('.subtitle-greek');
    const aboutParagraphs = document.querySelectorAll('.js-scramble-p');
    const footerLogo = document.querySelector('.js-footer-trigger');

    const scramblerMap = new Map();

    // Jalankan mesin pengacak untuk semua .bigtitle
    allBigTitles.forEach((title) => {
        const scrambler = new TextScrambler(title, { iterations: 7, speed: 10, rippleRadius: 1 });
        scramblerMap.set(title, scrambler);
    });

    if (homeSubtitle) {
        const scrambler = new TextScrambler(homeSubtitle, { iterations: 6, speed: 15, rippleRadius: 1 });
        scramblerMap.set(homeSubtitle, scrambler);
    }

    // Jalankan mesin pengacak untuk teks perkenalan panjang (Otomatis mematikan efek hover)
    aboutParagraphs.forEach((p) => {
        const scrambler = new TextScrambler(p, { iterations: 5, speed: 8, rippleRadius: 0 });
        scramblerMap.set(p, scrambler);
    });

    if (footerLogo) {
        const scrambler = new TextScrambler(footerLogo, { iterations: 8, speed: 12, rippleRadius: 2 });
        scramblerMap.set(footerLogo, scrambler);
    }

    // Mengatur trigger pemicu masuk layar (scroll view trigger)
    const viewObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const scrambler = scramblerMap.get(entry.target);
                if (scrambler) {
                    if (entry.target.classList.contains('js-scramble-p')) {
                        scrambler.triggerInitialScramble(0.8, 0.2, 0.4); 
                    } else if (entry.target === footerLogo) {
                        scrambler.triggerInitialScramble(1.5, 0.4, 0.6);
                    } else {
                        scrambler.triggerInitialScramble(1.2, 0.4, 0.6);
                    }
                }
                viewObserver.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.15 });

    allBigTitles.forEach(el => viewObserver.observe(el));
    if (homeSubtitle) viewObserver.observe(homeSubtitle);
    aboutParagraphs.forEach(el => viewObserver.observe(el));
    if (footerLogo) viewObserver.observe(footerLogo);

    // Efek Spotlight Masking Coklat pada Teks Footer
    if (footerLogo) {
        footerLogo.addEventListener('mousemove', (e) => {
            const rect = footerLogo.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            footerLogo.style.setProperty('--x', `${x}px`);
            footerLogo.style.setProperty('--y', `${y}px`);
        });
    }

    // Logika Manajemen Tampilan Box Modal
    const modal = document.getElementById("project-modal");
    const modalBody = document.getElementById("modal-body-content");
    const closeBtn = document.querySelector(".close-modal");

    document.querySelectorAll(".project-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = card.getAttribute("data-project-id");
            const data = projectDatabase[id];

            if (data) {
                let contentHTML = `
                    <h2 class="bigtitle" style="color: #d7603e; font-size: 2.2rem; margin-bottom: 10px;">${data.title}</h2>
                    <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">${data.description}</p>
                `;

                if (data.type === "hardware" && data.model3d) {
                    contentHTML += `
                        <h3 style="margin-top: 25px; font-size: 1.3rem; letter-spacing: 1px;">3D Model:</h3>
                        <div class="threeD-container">
                            <model-viewer 
                                src="${data.model3d}" 
                                camera-controls 
                                auto-rotate 
                                shadow-intensity="1" 
                                environment-image="neutral" 
                                exposure="1"
                                style="width: 100%; height: 100%; background-color: #ffffff;">
                            </model-viewer>
                        </div>
                        <p style="font-size: 0.85rem; opacity: 0.7; margin-top: 8px; font-style: italic;">you can drag and drop this model.</p>
                    `;
                } else if (data.type === "software" && data.previewImg) {
                    contentHTML += `
                        <h3 style="margin-top: 25px; font-size: 1.3rem; letter-spacing: 1px;">Preview:</h3>
                        <div class="web-preview-container">
                            <img src="${data.previewImg}" alt="${data.title} Preview" class="web-preview-img">
                        </div>
                        
                        <div style="text-align: center; margin-top: 25px;">
                            <a href="${data.liveUrl}" target="_blank" rel="noopener noreferrer" class="visit-link-btn cursor-target">
                                VISIT LIVE WEBSITE 
                            </a>
                        </div>
                    `;
                }

                modalBody.innerHTML = contentHTML;
                modal.classList.add("active");
            }
        });
    });

    const hideModal = () => {
        modal.classList.remove("active");
        modalBody.innerHTML = "";
    };

    closeBtn.addEventListener("click", hideModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) hideModal(); });
});