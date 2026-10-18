const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.querySelector("#load-btn");
const statusEl = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");

// Reusable request function
async function request(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = ""; // clear previous classes
  if (type) statusEl.classList.add(`status-${type}`);
}

function clearStatus() {
  statusEl.textContent = "";
  statusEl.className = "";
}

// GET: Load notes
async function loadNotes() {
  loadBtn.disabled = true;
  notesList.innerHTML = "";
  setStatus("Loading notes...", "loading");

  try {
    const notes = await request(`${API_URL}?_limit=10`);
    
    if (notes.length === 0) {
      setStatus("No notes found.", "success");
      const li = document.createElement("li");
      li.textContent = "No notes available.";
      notesList.appendChild(li);
    } else {
      notes.forEach((note) => renderNote(note));
      setStatus(`Loaded ${notes.length} notes from the server.`, "success");
    }
  } catch (error) {
    setStatus("Could not load notes. Please try again.", "error");
  } finally {
    loadBtn.disabled = false;
  }
}

// POST: Create note
async function createNote(title, body) {
  submitBtn.disabled = true;
  clearStatus();

  try {
    const newNote = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId: 1 }),
    });
    
    // Prepend to list
    const firstChild = notesList.firstChild;
    const li = renderNote(newNote);
    notesList.insertBefore(li, firstChild);
    
    setStatus(`Note created (status 201, id ${newNote.id}).`, "success");
    noteForm.reset();
  } catch (error) {
    setStatus("Failed to create note. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
  }
}

// DELETE: Remove note
async function deleteNote(id, listItem) {
  const deleteBtn = listItem.querySelector(".delete-btn");
  deleteBtn.disabled = true;
  deleteBtn.textContent = "Deleting...";

  try {
    await request(`${API_URL}/${id}`, { method: "DELETE" });
    
    // NOTE: JSONPlaceholder does not actually persist POSTed data. 
    // A real DELETE would remove it from the server. 
    // We simulate removal from the DOM for the user experience.
    listItem.remove();
    setStatus(`Note ${id} deleted successfully.`, "success");
  } catch (error) {
    setStatus("Failed to delete note.", "error");
    deleteBtn.disabled = false;
    deleteBtn.textContent = "Delete";
  }
}

// Helper to render a note to the DOM safely
function renderNote(note) {
  const li = document.createElement("li");
  li.className = "note-item";

  const contentDiv = document.createElement("div");
  contentDiv.className = "note-content";

  const titleEl = document.createElement("div");
  titleEl.className = "note-title";
  titleEl.textContent = note.title; // Safe from XSS

  const bodyEl = document.createElement("div");
  bodyEl.className = "note-body";
  bodyEl.textContent = note.body; // Safe from XSS

  contentDiv.appendChild(titleEl);
  contentDiv.appendChild(bodyEl);

  const delBtn = document.createElement("button");
  delBtn.className = "delete-btn";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", () => deleteNote(note.id, li));

  li.appendChild(contentDiv);
  li.appendChild(delBtn);
  notesList.appendChild(li);
  
  return li;
}

// Event Listeners
loadBtn.addEventListener("click", loadNotes);

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    setStatus("Title is required.", "error");
    return;
  }
  if (title.length > 100) {
    setStatus("Title must be 100 characters or fewer.", "error");
    return;
  }

  createNote(title, body);
});
