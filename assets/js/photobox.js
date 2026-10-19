
document.addEventListener("DOMContentLoaded", () => {
    const section = document.querySelector(".content-section-photobox");

    if (!section) return;

    const images = section.querySelectorAll(".photobox-img");
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    // 1. ANIMASI FADE IN / FADE OUT SAAT SCROLL
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        section.classList.add("photobox-visible");
                    } else {
                        section.classList.remove("photobox-visible");
                    }
                });
            },
            {
                threshold: 0.12
            }
        );

        observer.observe(section);
    } else {
        section.classList.add("photobox-visible");
    }

    // 2. BUAT LIGHTBOX
    const lightbox = document.createElement("div");

    lightbox.className = "photobox-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Pratinjau foto kenangan");
    lightbox.setAttribute("aria-hidden", "true");

    lightbox.innerHTML = `
        <button
            class="photobox-lightbox-close"
            type="button"
            aria-label="Tutup foto"
        >&times;</button>

        <img src="" alt="">
    `;

    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector("img");
    const closeButton = lightbox.querySelector(
        ".photobox-lightbox-close"
    );

    let previousFocus = null;

    // 3. BUKA FOTO UKURAN BESAR
    function openLightbox(image) {
        previousFocus = document.activeElement;

        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt;

        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";
        closeButton.focus();
    }

    // 4. TUTUP LIGHTBOX
    function closeLightbox() {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";

        lightboxImage.removeAttribute("src");
        lightboxImage.alt = "";

        if (previousFocus && previousFocus.isConnected) {
            previousFocus.focus();
        }
    }

    // Klik atau keyboard Enter/Space untuk membuka foto
    images.forEach((image) => {
        image.addEventListener("click", () => {
            openLightbox(image);
        });

        image.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openLightbox(image);
            }
        });
    });

    closeButton.addEventListener("click", closeLightbox);

    // Klik area gelap untuk menutup
    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    // Tombol Escape untuk menutup
    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            lightbox.classList.contains("open")
        ) {
            closeLightbox();
        }
    });

    // 5. Hormati preferensi pengurangan gerakan
    function updateMotionPreference() {
        if (reduceMotion.matches) {
            section.classList.add("photobox-visible");
        }
    }

    updateMotionPreference();

    reduceMotion.addEventListener("change", updateMotionPreference);
});
