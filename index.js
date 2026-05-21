// 1. Inisialisasi Kursor Magnetik
new MagneticCursor({
    targetSelector: '.cursor-target',
    spinDuration: 3,
    hideDefaultCursor: true
});

// 2. Database Konten Proyek (Mendukung Rendering .gltf / .glb & Preview Website)
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
        previewImg: "./assets/images/cooquizz-preview.png",
        liveUrl: "https://github.com/cybloxyz/cooquizz"
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const footerText = document.querySelector('.js-footer-trigger');

    if (footerText) {
        footerText.addEventListener('mousemove', (e) => {
            
            const rect = footerText.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

           
            footerText.style.setProperty('--x', `${x}px`);
            footerText.style.setProperty('--y', `${y}px`);
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
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
                } 
            
                else if (data.type === "software" && data.previewImg) {
                    contentHTML += `
                        <h3 style="margin-top: 25px; font-size: 1.3rem; letter-spacing: 1px;">💻 Interface Preview:</h3>
                        <div class="web-preview-container">
                            <img src="${data.previewImg}" alt="${data.title} Preview" class="web-preview-img">
                        </div>
                        
                        <div style="text-align: center; margin-top: 25px;">
                            <a href="${data.liveUrl}" target="_blank" class="visit-link-btn cursor-target">
                                VISIT LIVE WEBSITE →
                            </a>
                        </div>
                    `;
                }

                modalBody.innerHTML = contentHTML;
                modal.classList.add("active");
            }
        });
    });

   
    closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        modalBody.innerHTML = "";
    });

    
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
            modalBody.innerHTML = "";
        }
    });
});