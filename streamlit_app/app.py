import streamlit as st
import bcrypt
from db import get_user_by_email

def login_page():
    st.title("Login")
    email = st.text_input("Email")
    password = st.text_input("Password", type="password")
    if st.button("Login"):
        user = get_user_by_email(email)
        if user and bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
            st.session_state["logged_in"] = True
            st.session_state["user_email"] = user[1]
            st.experimental_rerun()
        else:
            st.error("Invalid email or password")

from db import get_folders_by_user_id, get_notes_by_user_id

def main_app():
    st.sidebar.title(f"Welcome, {st.session_state['user_email']}")
    if st.sidebar.button("Logout"):
        del st.session_state["logged_in"]
        del st.session_state["user_email"]
        st.experimental_rerun()

    user_id = get_user_by_email(st.session_state['user_email'])[0]
    folders = get_folders_by_user_id(user_id)
    notes = get_notes_by_user_id(user_id)

    st.sidebar.header("Folders")
    for folder in folders:
        with st.sidebar.expander(folder[1]):
            for note in notes:
                if note[3] == folder[0]:
                    if st.button(note[1], key=note[0]):
                        st.session_state["selected_note"] = note[0]

    st.sidebar.header("Notes")
    for note in notes:
        if note[3] is None:
            if st.button(note[1], key=note[0]):
                st.session_state["selected_note"] = note[0]


    st.title("Off-Notes (Streamlit)")

    if "selected_note" not in st.session_state:
        st.write("Select a note to view or edit.")
    else:
        note_editor()

def note_editor():
    note_id = st.session_state["selected_note"]
    notes = get_notes_by_user_id(get_user_by_email(st.session_state['user_email'])[0])
    note = next((n for n in notes if n[0] == note_id), None)

    if note:
        title = st.text_input("Title", value=note[1])
        content = st.text_area("Content", value=note[2], height=300)

        if st.button("Save"):
            update_note(note_id, title, content)
            st.success("Note saved successfully!")

        st.header("Attachments")
        uploaded_file = st.file_uploader("Upload a file")
        if uploaded_file is not None:
            with open(f"streamlit_app/uploads/{uploaded_file.name}", "wb") as f:
                f.write(uploaded_file.getbuffer())
            st.success(f"File '{uploaded_file.name}' uploaded successfully!")

# Main app logic
if "logged_in" not in st.session_state:
    login_page()
else:
    main_app()
