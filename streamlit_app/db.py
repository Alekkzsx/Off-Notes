import psycopg2
import streamlit as st

def get_db_connection():
    conn = psycopg2.connect(
        host="YOUR_DATABASE_HOST",
        database="YOUR_DATABASE_NAME",
        user="YOUR_DATABASE_USER",
        password="YOUR_DATABASE_PASSWORD"
    )
    return conn

def get_user_by_email(email):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user

def get_folders_by_user_id(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM folders WHERE user_id = %s", (user_id,))
    folders = cur.fetchall()
    cur.close()
    conn.close()
    return folders

def get_notes_by_user_id(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM notes WHERE user_id = %s", (user_id,))
    notes = cur.fetchall()
    cur.close()
    conn.close()
    return notes

def update_note(note_id, title, content):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE notes SET title = %s, content = %s WHERE id = %s", (title, content, note_id))
    conn.commit()
    cur.close()
    conn.close()
