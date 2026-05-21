/* lib/magnetic-cursor.js */

class MagneticCursor {
    constructor(options = {}) {
        this.targetSelector = options.targetSelector || '.cursor-target';
        this.spinDuration = options.spinDuration || 2;
        this.hideDefaultCursor = options.hideDefaultCursor ?? true;

        this.cursorRef = document.querySelector('.target-cursor-wrapper');
        this.dotRef = document.querySelector('.target-cursor-dot');
        this.cornersRef = document.querySelectorAll('.target-cursor-corner');
        
        this.spinTl = null;
        this.constants = {
            borderWidth: 16,       /* UBAH INI: Semakin besar angkanya, semakin renggang sudutnya ke luar */
            cornerSize: 14,        /* Ukuran panjang siku kursor (tetap) */
            parallaxStrength: 0.05
        };

        if (!this.cursorRef) {
            console.warn("Elemen .target-cursor-wrapper tidak ditemukan di HTML!");
            return;
        }

        this.init();
    }

    init() {
        const originalCursor = document.body.style.cursor;
        if (this.hideDefaultCursor) {
            document.body.style.cursor = 'none';
        }

        let activeTarget = null;
        let currentTargetMove = null;
        let currentLeaveHandler = null;
        let isAnimatingToTarget = false;
        let resumeTimeout = null;

        const cleanupTarget = (target) => {
            if (currentTargetMove) target.removeEventListener('mousemove', currentTargetMove);
            if (currentLeaveHandler) target.removeEventListener('mouseleave', currentLeaveHandler);
            currentTargetMove = null;
            currentLeaveHandler = null;
        };

        // Set Posisi Awal di Tengah Layar
        window.gsap.set(this.cursorRef, {
            xPercent: -50,
            yPercent: -50,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });

        // Bikin Animasi Putar Default
        const createSpinTimeline = () => {
            if (this.spinTl) this.spinTl.kill();
            this.spinTl = window.gsap
                .timeline({ repeat: -1 })
                .to(this.cursorRef, { rotation: '+=360', duration: this.spinDuration, ease: 'none' });
        };
        createSpinTimeline();

        // Gerakan Kursor Mengikuti Mouse
        const moveHandler = (e) => {
            window.gsap.to(this.cursorRef, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1,
                ease: 'power3.out'
            });
        };
        window.addEventListener('mousemove', moveHandler);

        // Handler saat Scroll
        const scrollHandler = () => {
            if (!activeTarget || !this.cursorRef) return;
            const mouseX = window.gsap.getProperty(this.cursorRef, 'x');
            const mouseY = window.gsap.getProperty(this.cursorRef, 'y');
            const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
            const isStillOverTarget = elementUnderMouse && (elementUnderMouse === activeTarget || elementUnderMouse.closest(this.targetSelector) === activeTarget);

            if (!isStillOverTarget && currentLeaveHandler) {
                currentLeaveHandler();
            }
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });

        // Klik Efek Mencengkeram (Scale Down)
        const mouseDownHandler = () => {
            if (!this.dotRef) return;
            window.gsap.to(this.dotRef, { scale: 0.7, duration: 0.3 });
            window.gsap.to(this.cursorRef, { scale: 0.9, duration: 0.2 });
        };
        const mouseUpHandler = () => {
            if (!this.dotRef) return;
            window.gsap.to(this.dotRef, { scale: 1, duration: 0.3 });
            window.gsap.to(this.cursorRef, { scale: 1, duration: 0.2 });
        };
        window.addEventListener('mousedown', mouseDownHandler);
        window.addEventListener('mouseup', mouseUpHandler);

        // Kursor Masuk ke Area Tombol Target
        const enterHandler = (e) => {
            let current = e.target;
            let target = null;
            while (current && current !== document.body) {
                if (current.matches && current.matches(this.targetSelector)) {
                    target = current;
                    break;
                }
                current = current.parentElement;
            }

            if (!target || !this.cursorRef || !this.cornersRef) return;
            if (activeTarget === target) return;
            if (activeTarget) cleanupTarget(activeTarget);
            if (resumeTimeout) { clearTimeout(resumeTimeout); resumeTimeout = null; }

            activeTarget = target;
            const corners = Array.from(this.cornersRef);
            corners.forEach(corner => window.gsap.killTweensOf(corner));
            window.gsap.killTweensOf(this.cursorRef, 'rotation');
            this.spinTl?.pause();

            window.gsap.set(this.cursorRef, { rotation: 0 });

            // Fungsi Kunci Sudut-Sudut Kursor ke Tombol
            const updateCorners = (mouseX, mouseY) => {
                const rect = target.getBoundingClientRect();
                const cursorRect = this.cursorRef.getBoundingClientRect();
                const cursorCenterX = cursorRect.left + cursorRect.width / 2;
                const cursorCenterY = cursorRect.top + cursorRect.height / 2;

                const [tlc, trc, brc, blc] = Array.from(this.cornersRef);
                const { borderWidth, cornerSize, parallaxStrength } = this.constants;

                let tlOffset = { x: rect.left - cursorCenterX - borderWidth, y: rect.top - cursorCenterY - borderWidth };
                let trOffset = { x: rect.right - cursorCenterX + borderWidth - cornerSize, y: rect.top - cursorCenterY - borderWidth };
                let brOffset = { x: rect.right - cursorCenterX + borderWidth - cornerSize, y: rect.bottom - cursorCenterY + borderWidth - cornerSize };
                let blOffset = { x: rect.left - cursorCenterX - borderWidth, y: rect.bottom - cursorCenterY + borderWidth - cornerSize };

                if (mouseX !== undefined && mouseY !== undefined) {
                    const targetCenterX = rect.left + rect.width / 2;
                    const targetCenterY = rect.top + rect.height / 2;
                    const mouseOffsetX = (mouseX - targetCenterX) * parallaxStrength;
                    const mouseOffsetY = (mouseY - targetCenterY) * parallaxStrength;

                    tlOffset.x += mouseOffsetX; tlOffset.y += mouseOffsetY;
                    trOffset.x += mouseOffsetX; trOffset.y += mouseOffsetY;
                    brOffset.x += mouseOffsetX; brOffset.y += mouseOffsetY;
                    blOffset.x += mouseOffsetX; blOffset.y += mouseOffsetY;
                }

                const tl = window.gsap.timeline();
                const targetCorners = [tlc, trc, brc, blc];
                const offsets = [tlOffset, trOffset, brOffset, blOffset];

                targetCorners.forEach((corner, index) => {
                    tl.to(corner, { x: offsets[index].x, y: offsets[index].y, duration: 0.2, ease: 'power2.out' }, 0);
                });
            };

            isAnimatingToTarget = true;
            updateCorners();
            setTimeout(() => { isAnimatingToTarget = false; }, 1);

            let moveThrottle = null;
            const targetMove = (ev) => {
                if (moveThrottle || isAnimatingToTarget) return;
                moveThrottle = requestAnimationFrame(() => {
                    updateCorners(ev.clientX, ev.clientY);
                    moveThrottle = null;
                });
            };

            // Kursor Meninggalkan Area Tombol (Kembali Muter)
            const leaveHandler = () => {
                activeTarget = null;
                isAnimatingToTarget = false;

                const targetCorners = Array.from(this.cornersRef);
                window.gsap.killTweensOf(targetCorners);

                const { cornerSize } = this.constants;
                const positions = [
                    { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
                    { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
                    { x: cornerSize * 0.5, y: cornerSize * 0.5 },
                    { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
                ];

                const tl = window.gsap.timeline();
                targetCorners.forEach((corner, index) => {
                    tl.to(corner, { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: 'power3.out' }, 0);
                });

                resumeTimeout = setTimeout(() => {
                    if (!activeTarget && this.cursorRef && this.spinTl) {
                        const currentRotation = window.gsap.getProperty(this.cursorRef, 'rotation');
                        const normalizedRotation = currentRotation % 360;

                        this.spinTl.kill();
                        this.spinTl = window.gsap
                            .timeline({ repeat: -1 })
                            .to(this.cursorRef, { rotation: '+=360', duration: this.spinDuration, ease: 'none' });

                        window.gsap.to(this.cursorRef, {
                            rotation: normalizedRotation + 360,
                            duration: this.spinDuration * (1 - normalizedRotation / 360),
                            ease: 'none',
                            onComplete: () => { this.spinTl?.restart(); }
                        });
                    }
                    resumeTimeout = null;
                }, 50);

                cleanupTarget(target);
            };

            currentTargetMove = targetMove;
            currentLeaveHandler = leaveHandler;
            target.addEventListener('mousemove', targetMove);
            target.addEventListener('mouseleave', leaveHandler);
        };

        window.addEventListener('mouseover', enterHandler, { passive: true });
    }
}

// Pasang ke objek window global
window.MagneticCursor = MagneticCursor;