
document.addEventListener("DOMContentLoaded", () => {
    const landing = document.querySelector(".landing-page");

    if (!landing) return;

    const image = landing.querySelector("img");
    const title = landing.querySelector("h1");

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // 1. Periksa gambar
    if (image) {
        image.addEventListener("error", () => {
            landing.classList.add("image-error");
        });

        if (image.complete && image.naturalWidth === 0) {
            landing.classList.add("image-error");
        }
    }

    // 2. Animasi judul ketika landing page terlihat
    if (title && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        landing.classList.add("landing-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        observer.observe(landing);
    } else {
        landing.classList.add("landing-visible");
    }

    // 3. Efek parallax ringan untuk desktop
    if (
        !reduceMotion &&
        window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
        landing.addEventListener("pointermove", (event) => {
            const rect = landing.getBoundingClientRect();

            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;

            landing.style.setProperty("--move-x", `${x * 8}px`);
            landing.style.setProperty("--move-y", `${y * 6}px`);
        });

        landing.addEventListener("pointerleave", () => {
            landing.style.setProperty("--move-x", "0px");
            landing.style.setProperty("--move-y", "0px");
        });
    }
});
