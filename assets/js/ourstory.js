
document.addEventListener("DOMContentLoaded", () => {
    const section = document.querySelector(".content-section-ourstory");
    if (!section) return;

    const articles = section.querySelectorAll(".ourstory article");

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const typingSpeed = 28;
    const startDelay = 180;

    // Menyimpan teks asli dan timer setiap elemen
    const textElements = new Map();

    // Menyiapkan teks untuk efek mesin tik
    articles.forEach((article) => {
        const elements = article.querySelectorAll("h3, p");

        elements.forEach((element) => {
            const originalText = element.textContent.trim();

            const span = document.createElement("span");
            span.className = "story-typewriter";

            element.textContent = "";
            element.appendChild(span);

            textElements.set(element, {
                originalText,
                span,
                timer: null,
                generation: 0
            });
        });
    });

    // Menghentikan animasi mengetik dan mengosongkan teks
    function resetTyping(article) {
        article.querySelectorAll("h3, p").forEach((element) => {
            const data = textElements.get(element);
            if (!data) return;

            clearTimeout(data.timer);
            data.timer = null;
            data.generation++;

            data.span.classList.remove("typing");
            data.span.textContent = "";
        });
    }

    // Mengetik teks satu karakter setiap interval
    function typeText(element, delay = 0) {
        const data = textElements.get(element);
        if (!data) return;

        const { originalText, span } = data;
        const generation = ++data.generation;

        clearTimeout(data.timer);

        if (reduceMotion.matches) {
            span.textContent = originalText;
            span.classList.remove("typing");
            return;
        }

        span.textContent = "";
        span.classList.add("typing");

        let index = 0;

        function typeNextCharacter() {
            // Abaikan timer lama jika animasi telah diulang
            if (data.generation !== generation) return;

            if (index >= originalText.length) {
                span.classList.remove("typing");
                data.timer = null;
                return;
            }

            span.textContent += originalText.charAt(index);
            index++;

            data.timer = setTimeout(
                typeNextCharacter,
                typingSpeed
            );
        }

        data.timer = setTimeout(
            typeNextCharacter,
            delay
        );
    }

    // Menjalankan teks secara berurutan
    function startStory(article) {
        resetTyping(article);

        article.classList.add("story-visible");

        const elements = Array.from(
            article.querySelectorAll("h3, p")
        );

        elements.forEach((element, index) => {
            typeText(element, startDelay + index * 220);
        });
    }

    // Saat cerita keluar dari layar, foto dan teks menghilang
    function hideStory(article) {
        article.classList.remove("story-visible");
        resetTyping(article);
    }

    // Mengulang animasi setiap kali artikel masuk/keluar layar
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const article = entry.target;

                    if (entry.isIntersecting) {
                        startStory(article);
                    } else {
                        hideStory(article);
                    }
                });
            },
            {
                threshold: 0.15
            }
        );

        articles.forEach((article) => {
            observer.observe(article);
        });
    } else {
        // Fallback untuk browser lama
        articles.forEach((article) => {
            article.classList.add("story-visible");

            article.querySelectorAll("h3, p").forEach((element) => {
                const data = textElements.get(element);

                if (data) {
                    data.span.textContent = data.originalText;
                }
            });
        });
    }

    // Ketika preferensi animasi berubah
    reduceMotion.addEventListener("change", () => {
        articles.forEach((article) => {
            if (reduceMotion.matches) {
                resetTyping(article);

                article.querySelectorAll("h3, p").forEach((element) => {
                    const data = textElements.get(element);

                    if (data) {
                        data.span.textContent = data.originalText;
                    }
                });
            } else if (article.classList.contains("story-visible")) {
                startStory(article);
            }
        });
    });
});
