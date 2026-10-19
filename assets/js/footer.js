
document.addEventListener("DOMContentLoaded", () => {
    const footer = document.querySelector(".site-footer");
    const backTopButton = document.querySelector(".footer-back-top");

    if (!footer) return;

    // Animasi footer saat masuk dan keluar viewport
    if ("IntersectionObserver" in window) {
        const footerObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    footer.classList.toggle(
                        "footer-visible",
                        entry.isIntersecting
                    );
                });
            },
            {
                threshold: 0.12
            }
        );

        footerObserver.observe(footer);
    } else {
        footer.classList.add("footer-visible");
    }

    // Tombol kembali ke atas
    if (backTopButton) {
        backTopButton.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches ? "auto" : "smooth"
            });
        });
    }
});
