import streamlit as st
from db import (
    create_user, get_user_by_email, get_folders_by_user_id,
    get_notes_by_user_id, update_note, create_folder,
    create_note, delete_folder, delete_note
)

# --- Helper functions for callbacks ---
def select_note(note_id):
    st.session_state.selected_note = note_id

def create_note_and_select(user_id, folder_id=None):
    new_note_id = create_note(user_id, folder_id)
    st.session_state.selected_note = new_note_id

def delete_note_and_rerun(note_id):
    if st.session_state.get("selected_note") == note_id:
        del st.session_state.selected_note
    delete_note(note_id)

def delete_folder_and_rerun(folder_id):
    # This is a simplified check. A more robust app would check all notes.
    if st.session_state.get("selected_note"):
         notes_in_folder = get_notes_by_user_id(st.session_state.user_id)
         for note in notes_in_folder:
             if note['folder_id'] == folder_id and note['id'] == st.session_state.selected_note:
                 del st.session_state.selected_note
                 break
    delete_folder(folder_id)

# --- UI Pages ---
def register_page():
    st.title("Register")
    with st.form("register_form"):
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Register")
        if submitted:
            if create_user(email, password):
                st.success("User created successfully! Please log in.")
                st.session_state["page"] = "login"
                st.rerun()
            else:
                st.error("Email already exists.")
    
    if st.button("Go to Login"):
        st.session_state["page"] = "login"
        st.rerun()

def login_page():
    st.title("Login")
    st.info("Default user: `test@example.com` | Password: `password`")
    with st.form("login_form"):
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Login")
        if submitted:
            user = get_user_by_email(email)
            if user and user["password"] == password:
                st.session_state.logged_in = True
                st.session_state.user_email = user["email"]
                st.session_state.user_id = user["id"]
                st.rerun()
            else:
                st.error("Invalid email or password")

    if st.button("Go to Register"):
        st.session_state["page"] = "register"
        st.rerun()

def note_editor():
    note_id = st.session_state.selected_note
    notes = get_notes_by_user_id(st.session_state.user_id)
    note = next((n for n in notes if n["id"] == note_id), None)

    if note:
        title = st.text_input("Title", value=note["title"])
        content = st.text_area("Content", value=note["content"], height=400)

        c1, c2 = st.columns(2)
        if c1.button("Save", use_container_width=True):
            update_note(note_id, title, content)
            st.success("Note saved successfully!")
            st.rerun()

        note_content_for_download = f"# {title}\n\n{content}"
        c2.download_button(
            label="Download",
            data=note_content_for_download,
            file_name=f"{title.replace(' ', '_')}.txt",
            mime="text/plain",
            use_container_width=True
        )
    else:
        st.warning("Note not found. It might have been deleted.")
        del st.session_state.selected_note

def main_app():
    st.sidebar.title(f"Welcome, {st.session_state.user_email}")
    if st.sidebar.button("Logout"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()

    user_id = st.session_state.user_id

    c1, c2 = st.sidebar.columns(2)
    if c1.button("➕ New Note", use_container_width=True):
        create_note_and_select(user_id)
        st.rerun()
    if c2.button("📁 New Folder", use_container_width=True):
        st.session_state.creating_folder = not st.session_state.get("creating_folder", False)
        st.rerun()

    if st.session_state.get("creating_folder"):
        with st.sidebar.form(key="new_folder_form"):
            new_folder_name = st.text_input("Folder Name")
            if st.form_submit_button("Create") and new_folder_name:
                create_folder(new_folder_name, user_id)
                st.session_state.creating_folder = False
                st.rerun()

    st.sidebar.markdown("---")
    folders = get_folders_by_user_id(user_id)
    notes = get_notes_by_user_id(user_id)

    for folder in folders:
        f_col1, f_col2, f_col3 = st.sidebar.columns([0.7, 0.15, 0.15])
        f_col1.write(f"📁 {folder['name']}")
        f_col2.button("➕", key=f"add_in_{folder['id']}", on_click=create_note_and_select, args=(user_id, folder['id']), help="New note in folder")
        f_col3.button("🗑️", key=f"del_f_{folder['id']}", on_click=delete_folder_and_rerun, args=(folder['id'],), help="Delete folder")
        
        for note in notes:
            if note['folder_id'] == folder['id']:
                n_col1, n_col2 = st.sidebar.columns([0.85, 0.15])
                with n_col1:
                    st.button(f"📄 {note['title']}", key=f"note_{note['id']}", on_click=select_note, args=(note['id'],), use_container_width=True)
                with n_col2:
                    st.button("🗑️", key=f"del_n_{note['id']}", on_click=delete_note_and_rerun, args=(note['id'],), help="Delete note")

    st.sidebar.markdown("---")
    for note in notes:
        if note['folder_id'] is None:
            r_col1, r_col2 = st.sidebar.columns([0.85, 0.15])
            r_col1.button(f"📄 {note['title']}", key=f"note_{note['id']}", on_click=select_note, args=(note['id'],), use_container_width=True)
            r_col2.button("🗑️", key=f"del_rn_{note['id']}", on_click=delete_note_and_rerun, args=(note['id'],), help="Delete note")

    st.title("Off-Notes (Streamlit)")
    if "selected_note" in st.session_state:
        note_editor()
    else:
        st.info("Welcome! Create a new note or select an existing one from the sidebar to get started.")

# --- Main app logic ---
if "page" not in st.session_state:
    st.session_state.page = "register"

if "logged_in" not in st.session_state:
    if st.session_state.page == "login":
        login_page()
    else:
        register_page()
else:
    main_app()
