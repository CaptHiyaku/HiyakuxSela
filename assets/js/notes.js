
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // ==========================================
    // 1. KONFIGURASI
    // ==========================================
    const STORAGE_KEY = "ourRelationshipNotes_v1";
    const NOTE_LIFETIME = 24 * 60 * 60 * 1000;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_IMAGE_SIDE = 1200;
    const IMAGE_QUALITY = 0.78;
    const FADE_DURATION = 400;

    // ==========================================
    // 2. MENGAMBIL ELEMEN HTML
    // ==========================================
    const form = document.getElementById("noteForm");
    const noteIdInput = document.getElementById("noteId");
    const senderInput = document.getElementById("noteSender");
    const titleInput = document.getElementById("noteTitle");
    const messageInput = document.getElementById("noteMessage");
    const photoInput = document.getElementById("notePhoto");

    const photoPreview = document.getElementById("notePhotoPreview");
    const previewImage = document.getElementById("notePreviewImage");
    const removePhotoButton = document.getElementById("removeNotePhoto");

    const saveButton = document.getElementById("saveNoteBtn");
    const cancelEditButton = document.getElementById("cancelEditBtn");

    const notesList = document.getElementById("notesList");
    const notesEmpty = document.getElementById("notesEmpty");
    const notesCount = document.getElementById("notesCount");

    if (
        !form ||
        !noteIdInput ||
        !senderInput ||
        !titleInput ||
        !messageInput ||
        !photoInput ||
        !photoPreview ||
        !previewImage ||
        !removePhotoButton ||
        !saveButton ||
        !cancelEditButton ||
        !notesList ||
        !notesEmpty ||
        !notesCount
    ) {
        console.error(
            "Notes App: Periksa kembali ID elemen HTML."
        );
        return;
    }

    // ==========================================
    // 3. STATE APLIKASI
    // ==========================================
    let notes = loadNotes();
    let currentPhoto = "";
    let photoChanged = false;
    let isSaving = false;

    // Mencegah animasi penghapusan berjalan berulang.
    const removingNoteIds = new Set();

    renderNotes();
    setupNotesReveal();

    // Satu interval untuk hitung mundur dan kedaluwarsa.
    window.setInterval(updateExpiryCountdown, 1000);

    // ==========================================
    // 4. WAKTU KEDALUWARSA
    // ==========================================
    function isNoteExpired(note) {
        const createdAt = new Date(note.createdAt).getTime();

        // Pertahankan catatan lama yang tanggalnya tidak valid.
        if (!Number.isFinite(createdAt)) {
            return false;
        }

        return Date.now() >= createdAt + NOTE_LIFETIME;
    }

    function getTimeLeft(note) {
        const createdAt = new Date(note.createdAt).getTime();

        if (!Number.isFinite(createdAt)) {
            return NOTE_LIFETIME;
        }

        return Math.max(
            0,
            createdAt + NOTE_LIFETIME - Date.now()
        );
    }

    function formatTimeLeft(note) {
        const remaining = getTimeLeft(note);

        if (remaining <= 0) {
            return "Catatan kedaluwarsa";
        }

        const hours = Math.floor(
            remaining / 3600000
        );

        const minutes = Math.floor(
            (remaining % 3600000) / 60000
        );

        const seconds = Math.floor(
            (remaining % 60000) / 1000
        );

        return (
            `Terhapus otomatis dalam ` +
            `${hours} jam ${minutes} menit ${seconds} detik`
        );
    }

    function updateExpiryCountdown() {
        const expiredNotes = notes.filter(
            note => isNoteExpired(note)
        );

        // Animasi dan hapus catatan yang sudah kedaluwarsa.
        expiredNotes.forEach(note => {
            removeNoteWithAnimation(note.id, false);
        });

        // Perbarui hitung mundur catatan yang masih aktif.
        document.querySelectorAll(
            "[data-note-expiry-id]"
        ).forEach(label => {
            const id = label.dataset.noteExpiryId;

            const note = notes.find(
                item => item.id === id
            );

            if (note && !isNoteExpired(note)) {
                label.textContent = formatTimeLeft(note);
            }
        });
    }

    // ==========================================
    // 5. LOCAL STORAGE
    // ==========================================
    function loadNotes() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : [];

            if (!Array.isArray(parsed)) {
                return [];
            }

            const validNotes = parsed.filter(note =>
                note &&
                typeof note.id === "string" &&
                typeof note.title === "string" &&
                typeof note.message === "string"
            );

            // Hapus catatan kedaluwarsa ketika halaman dibuka.
            const activeNotes = validNotes.filter(
                note => !isNoteExpired(note)
            );

            if (activeNotes.length !== validNotes.length) {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(activeNotes)
                );
            }

            return activeNotes;
        } catch (error) {
            console.error(
                "Gagal membaca catatan:",
                error
            );

            return [];
        }
    }

    function persistNotes(nextNotes) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(nextNotes)
            );

            notes = nextNotes;
            return true;
        } catch (error) {
            console.error(
                "Gagal menyimpan catatan:",
                error
            );

            alert(
                "Catatan gagal disimpan. " +
                "Penyimpanan browser mungkin penuh. " +
                "Coba gunakan foto yang lebih kecil."
            );

            return false;
        }
    }

    // ==========================================
    // 6. FUNGSI BANTUAN
    // ==========================================
    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined) {
            element.textContent = text;
        }

        return element;
    }

    function formatDate(dateValue) {
        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Tanggal tidak tersedia";
        }

        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);
    }

    // ==========================================
    // 7. ANIMASI FADE-IN DAN FADE-OUT
    // ==========================================
    function setupNotesReveal() {
        const targets = document.querySelectorAll(
            ".notes-heading, " +
            ".notes-form-card, " +
            ".notes-list-container"
        );

        if (
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches ||
            !("IntersectionObserver" in window)
        ) {
            targets.forEach(target => {
                target.classList.add("notes-reveal-visible");
            });

            return;
        }

        targets.forEach(target => {
            target.classList.add("notes-reveal");
        });

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(
                            "notes-reveal-visible"
                        );

                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );

        targets.forEach(target => observer.observe(target));
    }

    function fadeOutNote(noteCard, callback) {
        if (!noteCard) {
            if (typeof callback === "function") {
                callback();
            }
            return;
        }

        if (
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            if (typeof callback === "function") {
                callback();
            }
            return;
        }

        noteCard.classList.add("fade-out");

        let completed = false;

        function finish() {
            if (completed) return;
            completed = true;

            noteCard.removeEventListener(
                "animationend",
                handleAnimationEnd
            );

            if (typeof callback === "function") {
                callback();
            }
        }

        function handleAnimationEnd(event) {
            if (
                event.target === noteCard &&
                event.animationName === "fadeOut"
            ) {
                finish();
            }
        }

        noteCard.addEventListener(
            "animationend",
            handleAnimationEnd
        );

        // Fallback jika CSS animasi tidak tersedia.
        window.setTimeout(finish, FADE_DURATION + 150);
    }

    // ==========================================
    // 8. MENAMPILKAN CATATAN
    // ==========================================
    function renderNotes() {
        notesList.replaceChildren();

        notesCount.textContent =
            `${notes.length} ` +
            `${notes.length === 1 ? "note" : "notes"}`;

        notesEmpty.hidden = notes.length > 0;

        const sortedNotes = [...notes].sort(
            (a, b) =>
                new Date(b.updatedAt || b.createdAt).getTime() -
                new Date(a.updatedAt || a.createdAt).getTime()
        );

        sortedNotes.forEach(note => {
            const card = createElement(
                "article",
                "note-card"
            );

            card.dataset.noteId = note.id;

            const header = createElement(
                "div",
                "note-card-header"
            );

            const identity = createElement(
                "div",
                "note-card-identity"
            );

            identity.append(
                createElement(
                    "span",
                    "note-sender",
                    note.sender || "Us"
                ),
                createElement(
                    "h4",
                    "note-card-title",
                    note.title
                ),
                createElement(
                    "time",
                    "note-date",
                    formatDate(note.updatedAt || note.createdAt)
                )
            );

            const expiryLabel = createElement(
                "p",
                "note-expiry",
                formatTimeLeft(note)
            );

            expiryLabel.dataset.noteExpiryId = note.id;

            identity.append(expiryLabel);
            header.append(identity);
            card.append(header);

            card.append(
                createElement(
                    "p",
                    "note-message",
                    note.message
                )
            );

            // Foto hanya ditampilkan jika berupa data URL gambar.
            if (
                typeof note.photo === "string" &&
                note.photo.startsWith("data:image/")
            ) {
                const image = document.createElement("img");

                image.className = "note-card-photo";
                image.src = note.photo;
                image.alt = `Foto untuk ${note.title}`;
                image.loading = "lazy";

                image.addEventListener("click", () => {
                    openPhoto(note.photo, note.title);
                });

                card.append(image);
            }

            const actions = createElement(
                "div",
                "note-card-actions"
            );

            const editButton = createElement(
                "button",
                "note-action-btn",
                "Edit note"
            );

            editButton.type = "button";

            editButton.addEventListener("click", () => {
                editNote(note.id);
            });

            const deleteButton = createElement(
                "button",
                "note-action-btn note-delete-btn",
                "Delete"
            );

            deleteButton.type = "button";

            deleteButton.addEventListener("click", () => {
                deleteNote(note.id);
            });

            actions.append(editButton, deleteButton);
            card.append(actions);

            // Fade-in saat catatan baru ditampilkan.
            card.classList.add("note-enter");

            notesList.append(card);

            // Memicu transisi pada frame berikutnya.
            requestAnimationFrame(() => {
                card.classList.add("note-enter-active");
            });
        });
    }

    // ==========================================
    // 9. PREVIEW FOTO
    // ==========================================
    function showPhotoPreview(photoData) {
        currentPhoto = photoData;
        previewImage.src = photoData;
        photoPreview.hidden = false;
    }

    function clearPhoto() {
        currentPhoto = "";
        photoChanged = true;
        photoInput.value = "";

        previewImage.removeAttribute("src");
        photoPreview.hidden = true;
    }

    function resetForm() {
        form.reset();

        noteIdInput.value = "";
        currentPhoto = "";
        photoChanged = false;
        isSaving = false;

        previewImage.removeAttribute("src");
        photoPreview.hidden = true;

        saveButton.innerHTML = "<span>♥</span> Save Our Note";
        cancelEditButton.hidden = true;
        saveButton.disabled = false;
    }

    // ==========================================
    // 10. EDIT CATATAN
    // ==========================================
    function editNote(id) {
        const note = notes.find(item => item.id === id);

        if (!note || removingNoteIds.has(id)) {
            return;
        }

        noteIdInput.value = note.id;
        senderInput.value = note.sender || "Us";
        titleInput.value = note.title;
        messageInput.value = note.message;

        currentPhoto = note.photo || "";
        photoChanged = false;

        if (currentPhoto) {
            showPhotoPreview(currentPhoto);
        } else {
            photoPreview.hidden = true;
            previewImage.removeAttribute("src");
        }

        cancelEditButton.hidden = false;

        saveButton.innerHTML =
            "<span>♥</span> Update Our Note";

        document.querySelector(".notes-form-card")
            ?.scrollIntoView({
                behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches ? "auto" : "smooth",
                block: "start"
            });

        titleInput.focus({ preventScroll: true });
    }

    // ==========================================
    // 11. HAPUS CATATAN DENGAN ANIMASI
    // ==========================================
    function removeNoteWithAnimation(id, askConfirmation) {
        const note = notes.find(item => item.id === id);

        if (!note || removingNoteIds.has(id)) {
            return;
        }

        if (askConfirmation) {
            const confirmed = window.confirm(
                `Hapus catatan "${note.title}"? ` +
                "Tindakan ini tidak dapat dibatalkan."
            );

            if (!confirmed) return;
        }

        removingNoteIds.add(id);

        const card = [...notesList.querySelectorAll(".note-card")]
            .find(item => item.dataset.noteId === id);

        fadeOutNote(card, () => {
            const nextNotes = notes.filter(
                item => item.id !== id
            );

            if (persistNotes(nextNotes)) {
                if (noteIdInput.value === id) {
                    resetForm();
                }

                renderNotes();
            } else if (card) {
                // Catatan tetap disimpan jika localStorage gagal.
                card.classList.remove("fade-out");
            }

            removingNoteIds.delete(id);
        });
    }

    function deleteNote(id) {
        removeNoteWithAnimation(id, true);
    }

    // ==========================================
    // 12. MEMBUKA FOTO DALAM LIGHTBOX
    // ==========================================
    function openPhoto(photo, title) {
        const overlay = document.createElement("div");

        overlay.className = "photo-lightbox";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", title);

        const image = document.createElement("img");

        image.src = photo;
        image.alt = title;
        image.className = "photo-lightbox-image";

        const closeButton = document.createElement("button");

        closeButton.type = "button";
        closeButton.textContent = "×";
        closeButton.className = "photo-lightbox-close";
        closeButton.setAttribute("aria-label", "Tutup foto");

        function close() {
            document.removeEventListener(
                "keydown",
                handleKeydown
            );

            overlay.remove();
        }

        function handleKeydown(event) {
            if (event.key === "Escape") {
                close();
            }
        }

        closeButton.addEventListener("click", close);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                close();
            }
        });

        document.addEventListener("keydown", handleKeydown);

        overlay.append(image, closeButton);
        document.body.append(overlay);

        closeButton.focus();
    }

    // ==========================================
    // 13. KOMPRESI FOTO
    // ==========================================
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onerror = () => {
                reject(new Error("Gagal membaca foto."));
            };

            reader.onload = () => {
                const image = new Image();

                image.onerror = () => {
                    reject(new Error("File foto tidak valid."));
                };

                image.onload = () => {
                    const scale = Math.min(
                        1,
                        MAX_IMAGE_SIDE /
                        Math.max(image.width, image.height)
                    );

                    const canvas = document.createElement("canvas");

                    canvas.width = Math.max(
                        1,
                        Math.round(image.width * scale)
                    );

                    canvas.height = Math.max(
                        1,
                        Math.round(image.height * scale)
                    );

                    const context = canvas.getContext("2d");

                    if (!context) {
                        reject(
                            new Error("Tidak dapat memproses foto.")
                        );
                        return;
                    }

                    context.drawImage(
                        image,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    try {
                        resolve(
                            canvas.toDataURL(
                                "image/jpeg",
                                IMAGE_QUALITY
                            )
                        );
                    } catch (error) {
                        reject(error);
                    }
                };

                image.src = reader.result;
            };

            reader.readAsDataURL(file);
        });
    }

    // ==========================================
    // 14. EVENT PILIH FOTO
    // ==========================================
    photoInput.addEventListener("change", async () => {
        const file = photoInput.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("Gunakan foto JPG, PNG, atau WebP.");
            photoInput.value = "";
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            alert("Ukuran foto maksimal 5 MB.");
            photoInput.value = "";
            return;
        }

        try {
            const compressedPhoto = await compressImage(file);

            showPhotoPreview(compressedPhoto);
            photoChanged = true;
        } catch (error) {
            console.error(error);

            alert("Foto gagal diproses. Coba pilih foto lain.");

            photoInput.value = "";
        }
    });

    removePhotoButton.addEventListener(
        "click",
        clearPhoto
    );

    cancelEditButton.addEventListener(
        "click",
        resetForm
    );

    // ==========================================
    // 15. SIMPAN DAN UPDATE CATATAN
    // ==========================================
    form.addEventListener("submit", event => {
        event.preventDefault();

        if (isSaving) return;

        const title = titleInput.value.trim();
        const message = messageInput.value.trim();

        if (!title || !message) {
            alert("Isi judul dan pesan terlebih dahulu.");
            return;
        }

        isSaving = true;
        saveButton.disabled = true;

        try {
            const id = noteIdInput.value;

            const existingNote = id
                ? notes.find(item => item.id === id)
                : null;

            // Jangan mengubah catatan yang sedang dihapus.
            if (id && (!existingNote || removingNoteIds.has(id))) {
                alert("Catatan tidak ditemukan atau sedang dihapus.");
                return;
            }

            const now = new Date().toISOString();

            const note = {
                id: existingNote?.id ||
                    (
                        window.crypto?.randomUUID?.() ||
                        `${Date.now()}-${Math.random()
                            .toString(36).slice(2)}`
                    ),

                sender: senderInput.value.trim() || "Us",
                title,
                message,

                photo: photoChanged
                    ? currentPhoto
                    : (existingNote?.photo || ""),

                // Waktu awal tetap sama saat mengedit.
                createdAt: existingNote?.createdAt || now,
                updatedAt: now
            };

            const nextNotes = existingNote
                ? notes.map(item =>
                    item.id === id ? note : item
                )
                : [...notes, note];

            if (persistNotes(nextNotes)) {
                resetForm();
                renderNotes();
            }
        } finally {
            isSaving = false;
            saveButton.disabled = false;
        }
    });
});
