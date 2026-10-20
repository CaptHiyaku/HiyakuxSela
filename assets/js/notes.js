document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // ==========================================
    // 1. KONFIGURASI SUPABASE
    // ==========================================
    const SUPABASE_URL = "https://ssnzkjoheeatoicwauie.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qPD_Y6Ql5KR805c_gMLUnw_HapdKhYg";

    const NOTE_LIFETIME = 24 * 60 * 60 * 1000;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_IMAGE_SIDE = 1200;
    const IMAGE_QUALITY = 0.78;
    const FADE_DURATION = 400;

    if (
        !window.supabase ||
        SUPABASE_URL.startsWith("YOUR_") ||
        SUPABASE_PUBLISHABLE_KEY.startsWith("YOUR_")
        
    ) {
        console.error("Notes: Konfigurasi Supabase belum diisi.");
        return;
    }

    const db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

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
        console.error("Notes App: Periksa kembali ID elemen HTML.");
        return;
    }

    // ==========================================
    // 3. STATE APLIKASI
    // ==========================================
    let notes = [];
    let currentPhoto = "";
    let photoChanged = false;
    let isSaving = false;
    let isLoadingNotes = false;

    const removingNoteIds = new Set();

    setupNotesReveal();
    initializeSharedNotes();

    window.setInterval(updateExpiryCountdown, 1000);
    window.setInterval(refreshSharedNotes, 5000);

    async function initializeSharedNotes() {
        await refreshSharedNotes();
    }

    function mapDatabaseNote(row) {
        return {
            id: String(row.id),
            sender: row.sender || "Us",
            title: row.title || "",
            message: row.message || "",
            photo: row.photo || "",
            createdAt: row.created_at,
            updatedAt: row.updated_at || row.created_at
        };
    }

    // ==========================================
    // 4. MEMUAT NOTES DARI DATABASE
    // ==========================================
    async function refreshSharedNotes() {
        if (isLoadingNotes) return;

        isLoadingNotes = true;

        try {
            const { data, error } = await db
                .from("relationship_notes")
                .select(
                    "id, sender, title, message, photo, created_at, updated_at"
                )
                .order("created_at", { ascending: false });

            if (error) throw error;

            const fetchedNotes = (data || [])
                .map(mapDatabaseNote)
                .filter(note => !isNoteExpired(note));

            if (
                JSON.stringify(fetchedNotes) !==
                JSON.stringify(notes)
            ) {
                notes = fetchedNotes;
                renderNotes();
            }

            // Hapus catatan kedaluwarsa dari database.
            const expiredRows = (data || []).filter(row =>
                isNoteExpired(mapDatabaseNote(row))
            );

            for (const row of expiredRows) {
                const { error: deleteError } = await db
                    .from("relationship_notes")
                    .delete()
                    .eq("id", row.id);

                if (deleteError) {
                    console.error(
                        "Gagal menghapus catatan kedaluwarsa:",
                        deleteError.message
                    );
                }
            }
        } catch (error) {
            console.error(
                "Gagal memuat Notes:",
                error.message || error
            );
        } finally {
            isLoadingNotes = false;
        }
    }

    // ==========================================
    // 5. SIMPAN, UPDATE, DAN HAPUS NOTES
    // ==========================================
    async function insertSharedNote(note) {
        const { error } = await db
            .from("relationship_notes")
            .insert({
                id: note.id,
                sender: note.sender,
                title: note.title,
                message: note.message,
                photo: note.photo || null,
                created_at: note.createdAt,
                updated_at: note.updatedAt
            });

        if (error) throw error;

        await refreshSharedNotes();
    }

    async function updateSharedNote(note) {
        const { error } = await db
            .from("relationship_notes")
            .update({
                sender: note.sender,
                title: note.title,
                message: note.message,
                photo: note.photo || null,
                updated_at: note.updatedAt
            })
            .eq("id", note.id);

        if (error) throw error;

        await refreshSharedNotes();
    }

    async function deleteSharedNote(id) {
        const { error } = await db
            .from("relationship_notes")
            .delete()
            .eq("id", id);

        if (error) throw error;

        notes = notes.filter(note => note.id !== id);

        await refreshSharedNotes();
    }

    // ==========================================
    // 6. WAKTU KEDALUWARSA
    // ==========================================
    function isNoteExpired(note) {
        const createdAt = new Date(note.createdAt).getTime();

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

        const hours = Math.floor(remaining / 3600000);
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

        expiredNotes.forEach(note => {
            removeNoteWithAnimation(note.id, false);
        });

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
    // 7. FUNGSI BANTUAN
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
    // 8. ANIMASI FADE-IN DAN FADE-OUT
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

        window.setTimeout(finish, FADE_DURATION + 150);
    }

    // ==========================================
    // 9. MENAMPILKAN CATATAN
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

            card.classList.add("note-enter");
            notesList.append(card);

            requestAnimationFrame(() => {
                card.classList.add("note-enter-active");
            });
        });
    }

    // ==========================================
    // 10. PREVIEW FOTO
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
    // 11. EDIT CATATAN
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
    // 12. HAPUS CATATAN DENGAN ANIMASI
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

        fadeOutNote(card, async () => {
            try {
                await deleteSharedNote(id);

                if (noteIdInput.value === id) {
                    resetForm();
                }
            } catch (error) {
                console.error(
                    "Gagal menghapus Notes:",
                    error.message || error
                );

                alert(
                    "Catatan gagal dihapus dari database. " +
                    "Periksa koneksi atau izin Supabase."
                );

                if (card) {
                    card.classList.remove("fade-out");
                }
            } finally {
                removingNoteIds.delete(id);
            }
        });
    }

    function deleteNote(id) {
        removeNoteWithAnimation(id, true);
    }

    // ==========================================
    // 13. MEMBUKA FOTO DALAM LIGHTBOX
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
    // 14. KOMPRESI FOTO
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
    // 15. EVENT PILIH FOTO
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
    // 16. SIMPAN DAN UPDATE CATATAN
    // ==========================================
    form.addEventListener("submit", async event => {
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

            if (
                id &&
                (!existingNote || removingNoteIds.has(id))
            ) {
                alert(
                    "Catatan tidak ditemukan atau sedang dihapus."
                );

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

                createdAt: existingNote?.createdAt || now,
                updatedAt: now
            };

            if (existingNote) {
                await updateSharedNote(note);
            } else {
                await insertSharedNote(note);
            }

            resetForm();
            await refreshSharedNotes();
        } catch (error) {
            console.error(
                "Gagal menyimpan Notes:",
                error.message || error
            );

            alert(
                "Catatan gagal disimpan ke database. " +
                "Periksa koneksi Supabase dan aturan akses (RLS)."
            );
        } finally {
            isSaving = false;
            saveButton.disabled = false;
        }
    });
});

