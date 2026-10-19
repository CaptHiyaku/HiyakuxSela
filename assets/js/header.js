
document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".main-header");
    const nav = header?.querySelector("nav");
    const navLinks = header?.querySelectorAll("nav a");
    const menuToggle = header?.querySelector(".menu-toggle");

    if (!header || !nav || !navLinks) return;

    // 1. Animasi header ketika halaman dibuka
    header.classList.add("header-hidden");

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            header.classList.remove("header-hidden");
            header.classList.add("header-visible");
        });
    });

    // 2. Header berubah ketika halaman di-scroll
    function updateHeader() {
        header.classList.toggle("scrolled", window.scrollY > 40);
    }

    window.addEventListener("scroll", updateHeader, {
        passive: true
    });

    updateHeader();

    // 3. Membuat tombol hamburger jika belum tersedia di HTML
    let toggle = menuToggle;

    if (!toggle) {
        toggle = document.createElement("button");
        toggle.className = "menu-toggle";
        toggle.type = "button";
        toggle.setAttribute("aria-label", "Buka menu");
        toggle.setAttribute("aria-expanded", "false");

        toggle.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;

        header.appendChild(toggle);
    }

    // 4. Membuka dan menutup menu di HP
    function closeMenu() {
        nav.classList.remove("nav-open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Buka menu");
    }

    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("nav-open");

        toggle.classList.toggle("open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute(
            "aria-label",
            isOpen ? "Tutup menu" : "Buka menu"
        );
    });

    // 5. Tutup menu setelah link ditekan
    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            closeMenu();
        });
    });

    // 6. Tandai menu sesuai bagian halaman
    function setActiveLink() {
        const currentHash = window.location.hash;

        navLinks.forEach((link) => {
            const href = link.getAttribute("href");

            link.classList.toggle(
                "active",
                href === currentHash && href.startsWith("#")
            );
        });
    }

    window.addEventListener("hashchange", setActiveLink);
    setActiveLink();

    // 7. Tutup menu ketika layar kembali ke desktop
    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
});
