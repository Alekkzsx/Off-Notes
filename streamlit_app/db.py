import sqlite3
import streamlit as st

# Use a singleton pattern to ensure only one in-memory database connection exists
@st.cache_resource
def get_db_connection():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def setup_database(conn):
    cur = conn.cursor()
    cur.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password TEXT)")
    cur.execute("""
    CREATE TABLE folders (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        parent_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (parent_id) REFERENCES folders (id) ON DELETE CASCADE
    )""")
    cur.execute("""
    CREATE TABLE notes (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        user_id INTEGER NOT NULL,
        folder_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE CASCADE
    )""")
    cur.execute("""
    CREATE TABLE attachments (
        id INTEGER PRIMARY KEY,
        filename TEXT NOT NULL,
        file_data BLOB NOT NULL,
        user_id INTEGER NOT NULL,
        folder_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE CASCADE
    )""")
    # Insert sample user
    cur.execute("INSERT INTO users (email, password) VALUES (?, ?)", ("test@example.com", "password"))
    conn.commit()
    cur.close()

# --- DB Initialization ---
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if cur.fetchone() is None:
        setup_database(conn)
    cur.close()

# --- User Functions ---
def create_user(email, password):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, password))
        conn.commit()
        return cur.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        cur.close()

def get_user_by_email(email):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    return cur.fetchone()

# --- Folder Functions ---
def create_folder(name, user_id, parent_id=None):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO folders (name, user_id, parent_id) VALUES (?, ?, ?)", (name, user_id, parent_id))
    conn.commit()
    cur.close()

def get_folders_by_user_id(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM folders WHERE user_id = ?", (user_id,))
    return cur.fetchall()

def delete_folder(folder_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM folders WHERE id = ?", (folder_id,))
    conn.commit()
    cur.close()

# --- Note Functions ---
def create_note(user_id, folder_id=None, title="Untitled"):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO notes (title, content, user_id, folder_id) VALUES (?, ?, ?, ?)", 
                (title, "Start writing...", user_id, folder_id))
    new_note_id = cur.lastrowid
    conn.commit()
    cur.close()
    return new_note_id

def get_notes_by_user_id(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM notes WHERE user_id = ?", (user_id,))
    return cur.fetchall()

def update_note(note_id, title, content):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE notes SET title = ?, content = ? WHERE id = ?", (title, content, note_id))
    conn.commit()
    cur.close()

def delete_note(note_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    cur.close()

# --- Attachment Functions ---
def create_attachment(filename, file_data, user_id, folder_id=None):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO attachments (filename, file_data, user_id, folder_id) VALUES (?, ?, ?, ?)",
                (filename, file_data, user_id, folder_id))
    conn.commit()
    cur.close()

def get_attachments_by_user_id(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, filename, folder_id FROM attachments WHERE user_id = ?", (user_id,))
    return cur.fetchall()

def get_attachment_data(attachment_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT filename, file_data FROM attachments WHERE id = ?", (attachment_id,))
    return cur.fetchone()

def delete_attachment(attachment_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM attachments WHERE id = ?", (attachment_id,))
    conn.commit()
    cur.close()
