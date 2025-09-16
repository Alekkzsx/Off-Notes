import sqlite3
import streamlit as st

# Use a singleton pattern to ensure only one in-memory database connection exists
@st.cache_resource
def get_db_connection():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def setup_database(conn):
    cur = conn.cursor()
    # Create tables
    cur.execute("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    );
    """)
    cur.execute("""
    CREATE TABLE folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """)
    cur.execute("""
    CREATE TABLE notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        folder_id INTEGER,
        user_id INTEGER,
        FOREIGN KEY (folder_id) REFERENCES folders (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """)

    # Insert sample data
    cur.execute("INSERT INTO users (email, password) VALUES (?, ?)", ("test@example.com", "password"))
    cur.execute("INSERT INTO folders (name, user_id) VALUES (?, ?)", ("My Folder", 1))
    cur.execute("INSERT INTO notes (title, content, folder_id, user_id) VALUES (?, ?, ?, ?)", 
                ("Note in a folder", "This is a note inside a folder.", 1, 1))
    cur.execute("INSERT INTO notes (title, content, user_id) VALUES (?, ?, ?)", 
                ("Root note", "This is a note at the root level.", 1))
    
    conn.commit()
    cur.close()

def get_user_by_email(email):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cur.fetchone()
    return user

def get_folders_by_user_id(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM folders WHERE user_id = ?", (user_id,))
    folders = cur.fetchall()
    return folders

def get_notes_by_user_id(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM notes WHERE user_id = ?", (user_id,))
    notes = cur.fetchall()
    return notes

def update_note(note_id, title, content):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE notes SET title = ?, content = ? WHERE id = ?", (title, content, note_id))
    conn.commit()
    cur.close()

def create_user(email, password):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, password))
        conn.commit()
        return cur.lastrowid
    except sqlite3.IntegrityError:
        return None # User already exists
    finally:
        cur.close()

def create_folder(name, user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO folders (name, user_id) VALUES (?, ?)", (name, user_id))
    conn.commit()
    cur.close()

def create_note(user_id, folder_id=None):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO notes (title, content, user_id, folder_id) VALUES (?, ?, ?, ?)", 
                ("Untitled", "", user_id, folder_id))
    new_note_id = cur.lastrowid
    conn.commit()
    cur.close()
    return new_note_id

def delete_note(note_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    cur.close()

def delete_folder(folder_id):
    conn = get_db_connection()
    cur = conn.cursor()
    # Delete notes within the folder first
    cur.execute("DELETE FROM notes WHERE folder_id = ?", (folder_id,))
    # Then delete the folder
    cur.execute("DELETE FROM folders WHERE id = ?", (folder_id,))
    conn.commit()
    cur.close()

# Initialize the database and tables when the app starts
conn = get_db_connection()
# Check if tables are already created to avoid re-creating them on every rerun
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
if cur.fetchone() is None:
    setup_database(conn)
cur.close()
