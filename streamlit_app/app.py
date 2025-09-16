import streamlit as st
from db import create_user, get_user_by_email, get_folders_by_user_id, get_notes_by_user_id, update_note

def register_page():
    st.title("Register")
    email = st.text_input("Email")
    password = st.text_input("Password", type="password")
    if st.button("Register"):
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
    st.write("Use `test@example.com` and `password` to log in.")
    email = st.text_input("Email")
    password = st.text_input("Password", type="password")
    if st.button("Login"):
        user = get_user_by_email(email)
        if user and user["password"] == password:
            st.session_state["logged_in"] = True
            st.session_state["user_email"] = user["email"]
            st.session_state["user_id"] = user["id"]
            st.rerun()
        else:
            st.error("Invalid email or password")

    if st.button("Go to Register"):
        st.session_state["page"] = "register"
        st.rerun()

def note_editor():
    note_id = st.session_state["selected_note"]
    notes = get_notes_by_user_id(st.session_state["user_id"])
    note = next((n for n in notes if n["id"] == note_id), None)

    if note:
        title = st.text_input("Title", value=note["title"])
        content = st.text_area("Content", value=note["content"], height=300)

        if st.button("Save"):
            update_note(note_id, title, content)
            st.success("Note saved successfully!")
            st.rerun()

        st.header("Attachments")
        uploaded_file = st.file_uploader("Upload a file")
        if uploaded_file is not None:
            with open(f"streamlit_app/uploads/{uploaded_file.name}", "wb") as f:
                f.write(uploaded_file.getbuffer())
            st.success(f"File '{uploaded_file.name}' uploaded successfully!")

def main_app():
    st.sidebar.title(f"Welcome, {st.session_state['user_email']}")
    if st.sidebar.button("Logout"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()

    user_id = st.session_state["user_id"]
    folders = get_folders_by_user_id(user_id)
    notes = get_notes_by_user_id(user_id)

    st.sidebar.header("Folders")
    for folder in folders:
        with st.sidebar.expander(folder["name"]):
            for note in notes:
                if note["folder_id"] == folder["id"]:
                    if st.button(note["title"], key=f"note_{note['id']}"):
                        st.session_state["selected_note"] = note["id"]
                        st.rerun()

    st.sidebar.header("Notes")
    for note in notes:
        if note["folder_id"] is None:
            if st.button(note["title"], key=f"note_{note['id']}"):
                st.session_state["selected_note"] = note["id"]
                st.rerun()

    st.title("Off-Notes (Streamlit)")

    if "selected_note" not in st.session_state:
        st.write("Select a note to view or edit.")
    else:
        note_editor()

# Main app logic
if "page" not in st.session_state:
    st.session_state["page"] = "register"

if "logged_in" not in st.session_state:
    if st.session_state["page"] == "login":
        login_page()
    else:
        register_page()
else:
    main_app()
