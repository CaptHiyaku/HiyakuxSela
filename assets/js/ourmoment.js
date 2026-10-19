
document.addEventListener("DOMContentLoaded", () => {
    const section = document.querySelector(".content-section-ourmoment");
    const carousel = document.querySelector(".ourmoment-carousel");
    const track = carousel?.querySelector(".ourmoment");

    if (!section || !carousel || !track) return;

    const prevButton = section.querySelector(".ourmoment-prev");
    const nextButton = section.querySelector(".ourmoment-next");
    const dotsContainer = section.querySelector(".ourmoment-dots");
    const counter = section.querySelector(".ourmoment-counter");

    const originalCards = Array.from(track.children);

    if (originalCards.length === 0) return;

    const total = originalCards.length;
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const mobileQuery = window.matchMedia("(max-width: 768px)");

    let visibleCount = getVisibleCount();
    let currentIndex = 0;
    let autoplayId = null;
    let isTransitioning = false;
    let startX = 0;
    let startY = 0;
    let isPointerDown = false;
    let hasMoved = false;
    let pointerId = null;
    let dragDistance = 0;
    let interactionTimer = null;

    // Menentukan jumlah kartu yang terlihat
    function getVisibleCount() {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    }

    // Menghapus clone lama ketika ukuran layar berubah
    function removeClones() {
        track.querySelectorAll("[data-clone='true']").forEach((clone) => {
            clone.remove();
        });
    }

    // Membuat salinan kartu untuk efek looping
    function createClones() {
        removeClones();

        visibleCount = getVisibleCount();

        for (let i = 0; i < visibleCount; i++) {
            const clone = originalCards[i % total].cloneNode(true);

            clone.dataset.clone = "true";
            clone.setAttribute("aria-hidden", "true");

            clone.querySelectorAll("img").forEach((img) => {
                img.alt = "";
            });

            track.appendChild(clone);
        }
    }

    // Membuat titik navigasi
    function createDots() {
        dotsContainer.innerHTML = "";

        originalCards.forEach((card, index) => {
            const dot = document.createElement("button");

            dot.type = "button";
            dot.setAttribute(
                "aria-label",
                `Tampilkan foto ${index + 1}: ${
                    card.querySelector("h3")?.textContent.trim() || ""
                }`
            );

            dot.addEventListener("click", () => {
                goTo(index);
                restartAutoplay();
            });

            dotsContainer.appendChild(dot);
        });
    }

    const dots = () => Array.from(dotsContainer.children);

    // Menghitung jarak perpindahan satu kartu
    function getStep() {
        const card = track.querySelector("article");

        if (!card) return 0;

        const trackStyle = getComputedStyle(track);
        const gap = parseFloat(trackStyle.columnGap) || 0;

        return card.getBoundingClientRect().width + gap;
    }

    // Memperbarui posisi carousel
    function updateCarousel(animate = true) {
        track.style.transition = animate
            ? "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)"
            : "none";

        track.style.transform =
            `translate3d(${-currentIndex * getStep()}px, 0, 0)`;

        const activeIndex = currentIndex % total;

        dots().forEach((dot, index) => {
            const active = index === activeIndex;

            dot.classList.toggle("active", active);

            if (active) {
                dot.setAttribute("aria-current", "true");
            } else {
                dot.removeAttribute("aria-current");
            }
        });

        counter.textContent =
            `${String(activeIndex + 1).padStart(2, "0")} / ` +
            `${String(total).padStart(2, "0")}`;
    }

    // Pindah ke foto tertentu
    function goTo(index) {
        if (isTransitioning) return;

        currentIndex = Math.max(0, Math.min(index, total));
        isTransitioning = true;

        updateCarousel(true);
    }

    // Pindah ke foto berikutnya
    function next() {
        if (isTransitioning) return;

        currentIndex++;
        isTransitioning = true;

        updateCarousel(true);
    }

    // Pindah ke foto sebelumnya
    function previous() {
        if (isTransitioning) return;

        if (currentIndex <= 0) {
            currentIndex = total;

            updateCarousel(false);

            // Memaksa browser menerapkan posisi awal tanpa animasi
            void track.offsetWidth;

            currentIndex = total - 1;
        } else {
            currentIndex--;
        }

        isTransitioning = true;
        updateCarousel(true);
    }

    // Ketika animasi berakhir, lanjutkan dari awal jika mencapai clone
    track.addEventListener("transitionend", (event) => {
        if (
            event.target !== track ||
            event.propertyName !== "transform"
        ) {
            return;
        }

        if (currentIndex >= total) {
            currentIndex = 0;
            updateCarousel(false);
        }

        isTransitioning = false;
    });

    // Autoplay
    function stopAutoplay() {
        if (autoplayId !== null) {
            clearInterval(autoplayId);
            autoplayId = null;
        }
    }

    function startAutoplay() {
        stopAutoplay();

        if (
            reducedMotion.matches ||
            document.hidden ||
            total <= 1
        ) {
            return;
        }

        autoplayId = setInterval(next, 3500);
    }

    function restartAutoplay() {
        stopAutoplay();

        // Hindari perpindahan otomatis langsung setelah interaksi
        clearTimeout(interactionTimer);

        interactionTimer = setTimeout(() => {
            startAutoplay();
        }, 5000);
    }

    // Tombol navigasi
    nextButton?.addEventListener("click", () => {
        next();
        restartAutoplay();
    });

    prevButton?.addEventListener("click", () => {
        previous();
        restartAutoplay();
    });

    // Pause saat pointer berada di carousel
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);

    // Pause ketika carousel menerima fokus keyboard
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", (event) => {
        if (!carousel.contains(event.relatedTarget)) {
            startAutoplay();
        }
    });

    // Swipe pada HP dan drag menggunakan pointer
    carousel.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) {
            return;
        }

        isPointerDown = true;
        hasMoved = false;
        startX = event.clientX;
        startY = event.clientY;
        dragDistance = 0;
        pointerId = event.pointerId;

        stopAutoplay();
    });

    carousel.addEventListener("pointermove", (event) => {
        if (!isPointerDown || event.pointerId !== pointerId) return;

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        // Biarkan scroll vertikal halaman tetap berfungsi
        if (Math.abs(deltaY) > Math.abs(deltaX) + 5) return;

        if (Math.abs(deltaX) > 10) {
            hasMoved = true;
            dragDistance = deltaX;
        }
    });

    function finishPointer(event) {
        if (!isPointerDown || event.pointerId !== pointerId) return;

        isPointerDown = false;
        pointerId = null;

        if (hasMoved && Math.abs(dragDistance) > 45) {
            if (dragDistance < 0) {
                next();
            } else {
                previous();
            }
        }

        restartAutoplay();
    }

    carousel.addEventListener("pointerup", finishPointer);
    carousel.addEventListener("pointercancel", finishPointer);

    // Hindari browser membuka gambar saat drag
    carousel.addEventListener("dragstart", (event) => {
        event.preventDefault();
    });

    // Jangan biarkan carousel menerima klik setelah swipe
    carousel.addEventListener("click", (event) => {
        if (hasMoved) {
            event.preventDefault();
            event.stopPropagation();
            hasMoved = false;
        }
    }, true);

    // Reset ketika ukuran layar berubah
    let resizeTimeout;

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);

        resizeTimeout = setTimeout(() => {
            const newVisibleCount = getVisibleCount();

            if (newVisibleCount !== visibleCount) {
                currentIndex = currentIndex % total;
                isTransitioning = false;

                createClones();
                updateCarousel(false);
            } else {
                updateCarousel(false);
            }
        }, 150);
    });

    // Pause ketika tab tidak terlihat
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopAutoplay();
        } else if (!carousel.matches(":hover")) {
            startAutoplay();
        }
    });

    // Animasi ketika section masuk ke layar
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        section.classList.add("moments-visible");
                        observer.unobserve(section);
                    }
                });
            },
            { threshold: 0.1 }
        );

        observer.observe(section);
    } else {
        section.classList.add("moments-visible");
    }

    // Inisialisasi
    createClones();
    createDots();
    updateCarousel(false);
    startAutoplay();

    // Hormati perubahan preferensi animasi
    reducedMotion.addEventListener("change", () => {
        if (reducedMotion.matches) {
            stopAutoplay();
        } else {
            startAutoplay();
        }
    });
});
