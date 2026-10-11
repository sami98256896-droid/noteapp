import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/notes";

function App() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // MongoDB se notes load karna
  const fetchNotes = async () => {
    try {
      setError("");

      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Notes load nahi huin");
      }

      // Backend array ya object dono return kar sakta hai
      const notesList = Array.isArray(data) ? data : data.notes;

      if (!Array.isArray(notesList)) {
        throw new Error("Backend se notes ka data sahi format mein nahi aaya.");
      }

      setNotes(notesList);
    } catch (err) {
      setError(err.message || "Backend se connection nahi ho saka");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Nayi note ka form open karna
  const openCreateForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setError("");
    setMessage("");
    setShowForm(true);
  };

  // Existing note edit karna
  const openEditForm = (note) => {
    setEditingId(note._id);
    setTitle(note.title || "");
    setContent(note.content || "");
    setError("");
    setMessage("");
    setShowForm(true);
  };

  // Note create ya update karna
  const saveNote = async (event) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Title aur content dono likhna zaroori hai.");
      return;
    }

    try {
      setError("");
      setMessage("");

      const isEditing = Boolean(editingId);
      const url = isEditing
        ? `${API_URL}/${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Note save nahi hui");
      }

      // Backend seedha note ya { note: ... } return kar sakta hai
      const savedNote = data.note || data;

      if (!savedNote || !savedNote._id) {
        throw new Error("Backend se saved note sahi format mein nahi mili.");
      }

      if (isEditing) {
        setNotes((previousNotes) =>
          previousNotes.map((note) =>
            note._id === editingId ? savedNote : note
          )
        );

        setMessage("Note successfully update ho gayi!");
      } else {
        setNotes((previousNotes) => [savedNote, ...previousNotes]);
        setMessage("Note successfully create ho gayi!");
      }

      setTitle("");
      setContent("");
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setError(err.message || "Note save karte waqt error aaya");
    }
  };

  // Note delete karna
  const deleteNote = async (id) => {
    try {
      setError("");
      setMessage("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Note delete nahi hui");
      }

      setNotes((previousNotes) =>
        previousNotes.filter((note) => note._id !== id)
      );

      setMessage("Note delete ho gayi!");
    } catch (err) {
      setError(err.message || "Note delete nahi ho saki");
    }
  };

  // Note complete ya incomplete karna
  const toggleCompleted = async (note) => {
    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/${note._id}/complete`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: !note.completed,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Note update nahi hui");
      }

      const updatedNote = data.note || data;

      if (!updatedNote || !updatedNote._id) {
        throw new Error("Updated note ka data sahi format mein nahi mila.");
      }

      setNotes((previousNotes) =>
        previousNotes.map((item) =>
          item._id === note._id ? updatedNote : item
        )
      );

      setMessage("Note ka status update ho gaya!");
    } catch (err) {
      setError(err.message || "Status update nahi ho saka");
    }
  };

  // Search ke mutabiq notes filter karna
  const safeNotes = Array.isArray(notes) ? notes : [];

  const filteredNotes = safeNotes.filter((note) => {
    const query = search.toLowerCase();

    return (
      (note.title || "").toLowerCase().includes(query) ||
      (note.content || "").toLowerCase().includes(query)
    );
  });

  const completedCount = safeNotes.filter(
    (note) => note.completed
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-7xl">

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 md:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-2xl text-white">
              ✎
            </div>

            <div>
              <h1 className="text-lg font-bold">Student Notes</h1>
              <p className="text-xs text-slate-500">
                Your study space
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-10 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            + Create New Note
          </button>

          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 text-indigo-700">
              <span>All Notes</span>
              <span className="font-semibold">{safeNotes.length}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl px-4 py-3 text-slate-600">
              <span>Completed</span>
              <span className="font-semibold">{completedCount}</span>
            </div>
          </div>

          <div className="mt-10 rounded-2xl bg-slate-50 p-4">
            <p className="font-semibold">Stay organized!</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Keep your class notes and study tasks in one place.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-indigo-600">
                YOUR PERSONAL WORKSPACE
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                My Notepad
              </h2>

              <p className="mt-2 text-slate-500">
                Capture your ideas. Organize your studies.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              + New Note
            </button>
          </header>

          {/* Summary */}
          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Notes</p>
              <p className="mt-2 text-3xl font-bold">
                {safeNotes.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Completed Notes</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {completedCount}
              </p>
            </div>
          </section>

          {/* Search */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your notes..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />

            <button
              type="button"
              onClick={fetchNotes}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium hover:bg-slate-100"
            >
              Refresh
            </button>
          </div>

          {/* Error and success messages */}
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
            >
              {message}
            </p>
          )}

          {/* Create / Edit form */}
          {showForm && (
            <section className="mt-6 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">
                  {editingId ? "Edit Note" : "Create New Note"}
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>

              <form onSubmit={saveNote} className="space-y-4">
                <div>
                  <label
                    htmlFor="noteTitle"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Note Title
                  </label>

                  <input
                    id="noteTitle"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={150}
                    required
                    placeholder="e.g. React Assignment"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="noteContent"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Note Content
                  </label>

                  <textarea
                    id="noteContent"
                    rows={5}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    maxLength={10000}
                    required
                    placeholder="Write your notes here..."
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
                >
                  {editingId ? "Save Changes" : "Save Note"}
                </button>
              </form>
            </section>
          )}

          {/* Notes list */}
          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold">All Notes</h3>
              <span className="text-sm text-slate-500">
                {filteredNotes.length} found
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-500">
                Loading notes...
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-5 py-16 text-center">
                <div className="text-5xl">📝</div>

                <h4 className="mt-4 text-lg font-bold">
                  {search ? "No matching notes" : "No notes available"}
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  {search
                    ? "Try another search term."
                    : "Create your first note to get started."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
                  >
                    Create Your First Note
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredNotes.map((note) => (
                  <article
                    key={note._id}
                    className="flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4
                        className={`break-words text-lg font-bold ${
                          note.completed
                            ? "text-slate-400 line-through"
                            : "text-slate-800"
                        }`}
                      >
                        {note.title}
                      </h4>

                      <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                        {note.completed ? "Done" : "Note"}
                      </span>
                    </div>

                    <p className="mt-4 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                      {note.content}
                    </p>

                    <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                      {note.updatedAt
                        ? `Updated ${new Date(note.updatedAt).toLocaleDateString()}`
                        : ""}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(note)}
                        className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCompleted(note)}
                        className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        {note.completed ? "Undo" : "Complete"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteNote(note._id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="mt-12 border-t border-slate-200 py-6 text-center text-sm text-slate-400">
            Student Notepad · Keep your ideas organized.
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;