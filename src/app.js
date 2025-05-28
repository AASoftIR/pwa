document.addEventListener("DOMContentLoaded", () => {
	const noteTitleInput = document.getElementById("note-title");
	const noteContentInput = document.getElementById("note-content");
	const addNoteBtn = document.getElementById("add-note-btn");
	const notesGrid = document.getElementById("notes-grid");

	let notes = [];

	// Load notes from localStorage
	const loadNotes = () => {
		const storedNotes = localStorage.getItem("pwaNotes");
		if (storedNotes) {
			notes = JSON.parse(storedNotes);
		}
		renderNotes();
	};

	// Save notes to localStorage
	const saveNotes = () => {
		localStorage.setItem("pwaNotes", JSON.stringify(notes));
	};

	// Render notes to the DOM
	const renderNotes = () => {
		notesGrid.innerHTML = ""; // Clear existing notes
		if (notes.length === 0) {
			notesGrid.innerHTML =
				'<p style="color: var(--text-secondary); text-align: center; grid-column: 1 / -1;">No notes yet. Add one!</p>';
			return;
		}
		notes.forEach((note, index) => {
			const noteCard = document.createElement("div");
			noteCard.classList.add("note-card");
			noteCard.innerHTML = `
                <h3>${escapeHTML(note.title) || "Untitled Note"}</h3>
                <p>${escapeHTML(note.content)}</p>
                <button class="delete-btn" data-index="${index}">Delete</button>
            `;
			notesGrid.appendChild(noteCard);
		});

		// Add event listeners to delete buttons
		document.querySelectorAll(".delete-btn").forEach((button) => {
			button.addEventListener("click", (e) => {
				const noteIndex = parseInt(e.target.dataset.index, 10);
				deleteNote(noteIndex);
			});
		});
	};

	// Add a new note
	const addNote = () => {
		const title = noteTitleInput.value.trim();
		const content = noteContentInput.value.trim();

		if (!content && !title) {
			// Require at least content or title
			alert("Please enter a title or some content for your note.");
			return;
		}

		notes.unshift({ title, content, id: Date.now() }); // Add to the beginning for newest first
		saveNotes();
		renderNotes();

		// Clear input fields
		noteTitleInput.value = "";
		noteContentInput.value = "";
		noteTitleInput.focus();
	};

	// Delete a note
	const deleteNote = (index) => {
		notes.splice(index, 1);
		saveNotes();
		renderNotes();
	};

	// Helper to escape HTML to prevent XSS
	const escapeHTML = (str) => {
		if (typeof str !== "string") return "";
		return str.replace(/[&<>"']/g, function (match) {
			return {
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			}[match];
		});
	};

	// Event listener for add note button
	if (addNoteBtn) {
		addNoteBtn.addEventListener("click", addNote);
	}

	// Allow Enter key in title to move to content, and Ctrl+Enter in content to submit
	if (noteTitleInput) {
		noteTitleInput.addEventListener("keypress", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				noteContentInput.focus();
			}
		});
	}

	if (noteContentInput) {
		noteContentInput.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
				addNote();
			}
		});
	}

	// Initial load of notes
	loadNotes();

	// Service Worker Registration
	if ("serviceWorker" in navigator) {
		window.addEventListener("load", () => {
			navigator.serviceWorker
				.register("/sw.js")
				.then((registration) => {
					console.log(
						"ServiceWorker registration successful with scope: ",
						registration.scope
					);
				})
				.catch((error) => {
					console.log("ServiceWorker registration failed: ", error);
				});
		});
	}
});
