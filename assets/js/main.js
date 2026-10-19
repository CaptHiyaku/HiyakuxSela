/* ==========================================
   OUR RELATIONSHIP
   Main JavaScript - Capthiyaku x Sela
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const landing = document.querySelector(".landing-page");
    const landingTitle = document.querySelector(".landing-page h1");
    const navLinks = document.querySelectorAll(
        '.main-header nav a[href^="#"]'
    );

    /* Inject animation styles */
    const animationStyles = document.createElement("style");
    animationStyles.textContent = `
        .reveal-item {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal-item.is-visible {
            opacity: 1;
            transform: translateY(0);
        }
        .landing-page { position: relative; overflow: hidden; }
        .landing-page h1 { position: relative; z-index: 2; }
        .floating-heart {
            position: absolute;
            bottom: -35px;
            z-index: 1;
            pointer-events: none;
            user-select: none;
            animation: heartFloat linear forwards;
            filter: drop-shadow(0 2px 5px rgba(120, 20, 60, 0.15));
        }
        @keyframes heartFloat {
            0% { opacity: 0; transform: translateY(0) rotate(0deg) scale(0.7); }
            15% { opacity: 0.8; }
            80% { opacity: 0.65; }
            100% { opacity: 0; transform: translateY(-75vh) rotate(35deg) scale(1.2); }
        }
        .main-header nav a { transition: color 0.25s ease, background-color 0.25s ease; }
        .main-header nav a.active { color: #d86b8a; }
        .ourstory-img, .ourmoment-img, .photobox-img {
            cursor: zoom-in;
            -webkit-tap-highlight-color: transparent;
        }
        .photo-lightbox {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px 20px 30px;
            background: rgba(25, 12, 19, 0.92);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.25s ease, visibility 0.25s ease;
        }
        .photo-lightbox.is-open { opacity: 1; visibility: visible; }
        .photo-lightbox-image {
            display: block;
            max-width: 100%;
            max-height: 85vh;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 10px;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
            transform: scale(0.95);
            transition: transform 0.25s ease;
        }
        .photo-lightbox.is-open .photo-lightbox-image { transform: scale(1); }
        .photo-lightbox-close {
            position: absolute;
            top: 15px;
            right: 22px;
            width: 44px;
            height: 44px;
            border: none;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.15);
            color: white;
            font-size: 30px;
            cursor: pointer;
        }
        .photo-lightbox-close:hover { background: rgba(255, 255, 255, 0.28); }
        .photo-lightbox-caption {
            position: absolute;
            left: 20px;
            right: 20px;
            bottom: 12px;
            color: white;
            text-align: center;
            font-size: 14px;
        }
        @keyframes typingCursor { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
            .reveal-item, .floating-heart, .photo-lightbox, .photo-lightbox-image {
                animation: none !important;
                transition: none !important;
            }
            .reveal-item { opacity: 1; transform: none; }
        }
    `;
    document.head.appendChild(animationStyles);

    /* 1. Scroll reveal */
    const revealElements = document.querySelectorAll(
        ".ourstory article, .ourmoment article, .photobox-img, " +
        "#ourstory h2, #ourmoment h2, #photobox h2"
    );

    revealElements.forEach((element, index) => {
        element.classList.add("reveal-item");
        if (prefersReducedMotion) {
            element.classList.add("is-visible");
        } else {
            element.style.transitionDelay = `${(index % 4) * 100}ms`;
        }
    });

    if ("IntersectionObserver" in window && !prefersReducedMotion) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

        revealElements.forEach((element) => revealObserver.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add("is-visible"));
    }

    /* 2. Typing effect */
    if (landingTitle && !prefersReducedMotion) {
        const originalTitle = landingTitle.textContent.trim();
        landingTitle.textContent = "";
        landingTitle.setAttribute("aria-label", originalTitle);

        const typedText = document.createTextNode("");
        const cursor = document.createElement("span");
        cursor.setAttribute("aria-hidden", "true");
        cursor.textContent = "|";
        cursor.style.cssText = `
            display: inline-block;
            margin-left: 4px;
            color: #ffd5e2;
            animation: typingCursor 0.8s step-end infinite;
        `;

        landingTitle.append(typedText, cursor);

        let characterIndex = 0;
        function typeTitle() {
            if (characterIndex < originalTitle.length) {
                characterIndex++;
                typedText.textContent = originalTitle.slice(0, characterIndex);
                window.setTimeout(typeTitle, 90);
            } else {
                cursor.remove();
            }
        }
        window.setTimeout(typeTitle, 400);
    }

    /* 3. Floating hearts on the hero */
    if (landing && !prefersReducedMotion) {
        const heartSymbols = ["♥", "♡", "❤"];
        let heartInterval = null;

        function createHeart() {
            if (document.hidden) return;
            const heart = document.createElement("span");
            heart.className = "floating-heart";
            heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];

            const size = 12 + Math.random() * 20;
            const duration = 5 + Math.random() * 5;
            const colors = ["#ffd1dc", "#ffffff", "#f7a9c0", "#f4c6d7"];

            heart.style.left = `${Math.random() * 95}%`;
            heart.style.fontSize = `${size}px`;
            heart.style.color = colors[Math.floor(Math.random() * colors.length)];
            heart.style.animationDuration = `${duration}s`;
            landing.appendChild(heart);

            window.setTimeout(() => heart.remove(), duration * 1000);
        }

        function startHearts() {
            if (heartInterval !== null) return;
            createHeart();
            heartInterval = window.setInterval(createHeart, 850);
        }

        function stopHearts() {
            if (heartInterval !== null) {
                window.clearInterval(heartInterval);
                heartInterval = null;
            }
        }

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) stopHearts();
            else startHearts();
        });

        startHearts();
    }

    /* 4. Active navigation based on visible section */
    const sections = document.querySelectorAll("#ourstory, #ourmoment, #photobox");
    if ("IntersectionObserver" in window && sections.length > 0) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                navLinks.forEach((link) => {
                    const isActive = link.getAttribute("href") === `#${entry.target.id}`;
                    link.classList.toggle("active", isActive);
                    if (isActive) link.setAttribute("aria-current", "location");
                    else link.removeAttribute("aria-current");
                });
            });
        }, { rootMargin: "-25% 0px -60% 0px", threshold: 0 });

        sections.forEach((section) => sectionObserver.observe(section));
    }

    /* 5. Photo lightbox */
    const galleryImages = document.querySelectorAll(
        ".ourstory-img, .ourmoment-img, .photobox-img"
    );

    const lightbox = document.createElement("div");
    lightbox.className = "photo-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Photo preview");
    lightbox.innerHTML = `
        <button class="photo-lightbox-close" type="button" aria-label="Close photo">&times;</button>
        <img class="photo-lightbox-image" alt="">
        <p class="photo-lightbox-caption"></p>
    `;
    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector(".photo-lightbox-image");
    const lightboxCaption = lightbox.querySelector(".photo-lightbox-caption");
    const closeButton = lightbox.querySelector(".photo-lightbox-close");
    let previousFocusedElement = null;

    function openLightbox(image) {
        if (!image.complete || image.naturalWidth === 0) {
            console.warn("Image could not be opened. Check path:", image.getAttribute("src"));
            return;
        }
        previousFocusedElement = document.activeElement;
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt || "Photo memory";
        lightboxCaption.textContent = image.alt || "";
        lightbox.classList.add("is-open");
        document.body.style.overflow = "hidden";
        closeButton.focus();
    }

    function closeLightbox() {
        lightbox.classList.remove("is-open");
        document.body.style.overflow = "";
        lightboxImage.removeAttribute("src");
        if (previousFocusedElement) previousFocusedElement.focus();
    }

    galleryImages.forEach((image) => {
        image.addEventListener("click", () => openLightbox(image));
        image.addEventListener("error", () => {
            console.warn("Image failed to load:", image.getAttribute("src"));
        });
    });

    closeButton.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
            closeLightbox();
        }
    });

    console.log("Our Relationship: animations and interactions initialized.");
});
