import streamlit as st
from streamlit_quill import st_quill
import mimetypes
from db import (
    create_user, get_user_by_email, get_folders_by_user_id,
    get_notes_by_user_id, update_note, create_folder,
    create_note, delete_folder, delete_note,
    create_attachment, get_attachments_by_user_id,
    get_attachment_data, delete_attachment
)

# --- State Management ---
st.set_page_config(layout="wide")

def get_session_state():
    if "logged_in" not in st.session_state:
        st.session_state.logged_in = False
        st.session_state.page = "register"
        st.session_state.user_id = None
        st.session_state.user_email = None
        st.session_state.selected_item = None
        st.session_state.selected_item_type = None
        st.session_state.creating_folder_in = None
        st.session_state.uploading_in = None

get_session_state()

# --- Helper Functions ---
def select_item(item_id, item_type):
    st.session_state.selected_item = item_id
    st.session_state.selected_item_type = item_type

def create_note_and_select(user_id, folder_id=None):
    new_note_id = create_note(user_id, folder_id)
    select_item(new_note_id, "note")

# --- UI Components ---
def render_file_tree(folders, notes, attachments, parent_id=None, level=0):
    indent = " " * level * 4
    
    # Render folders at the current level
    for folder in [f for f in folders if f['parent_id'] == parent_id]:
        with st.container():
            col1, col2, col3, col4 = st.columns([0.7, 0.1, 0.1, 0.1])
            with col1:
                st.write(f"{indent}📁 {folder['name']}")
            with col2:
                if st.button("➕", key=f"add_note_{folder['id']}", help="New Note"):
                    create_note_and_select(st.session_state.user_id, folder['id'])
                    st.rerun()
            with col3:
                if st.button("📁", key=f"add_folder_{folder['id']}", help="New Subfolder"):
                    st.session_state.creating_folder_in = folder['id']
                    st.rerun()
            with col4:
                if st.button("🗑️", key=f"del_folder_{folder['id']}", help="Delete Folder"):
                    delete_folder(folder['id'])
                    st.rerun()
            
            # Recursively render children
            render_file_tree(folders, notes, attachments, parent_id=folder['id'], level=level + 1)

    # Render notes at the current level
    for note in [n for n in notes if n['folder_id'] == parent_id]:
        col1, col2 = st.columns([0.9, 0.1])
        with col1:
            st.button(f"{indent}📄 {note['title']}", key=f"note_{note['id']}", on_click=select_item, args=(note['id'], "note"), use_container_width=True)
        with col2:
            if st.button("🗑️", key=f"del_note_{note['id']}", help="Delete Note"):
                delete_note(note['id'])
                st.rerun()

    # Render attachments at the current level
    for attachment in [a for a in attachments if a['folder_id'] == parent_id]:
        col1, col2 = st.columns([0.9, 0.1])
        with col1:
            st.button(f"{indent}📎 {attachment['filename']}", key=f"att_{attachment['id']}", on_click=select_item, args=(attachment['id'], "attachment"), use_container_width=True)
        with col2:
            if st.button("🗑️", key=f"del_att_{attachment['id']}", help="Delete Attachment"):
                delete_attachment(attachment['id'])
                st.rerun()

def main_app():
    # --- Sidebar ---
    with st.sidebar:
        st.title(f"Welcome, {st.session_state.user_email}")
        if st.button("Logout"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()

        user_id = st.session_state.user_id
        
        c1, c2, c3 = st.columns(3)
        if c1.button("➕ Note", use_container_width=True):
            create_note_and_select(user_id)
            st.rerun()
        if c2.button("📁 Folder", use_container_width=True):
            st.session_state.creating_folder_in = None # Root folder
            st.rerun()
        if c3.button("📎 Upload", use_container_width=True):
            st.session_state.uploading_in = None # Root folder
            st.rerun()

        if st.session_state.creating_folder_in is not None:
            with st.form("new_folder_form"):
                name = st.text_input("Folder Name")
                if st.form_submit_button("Create"):
                    create_folder(name, user_id, st.session_state.creating_folder_in)
                    st.session_state.creating_folder_in = None
                    st.rerun()
        
        if st.session_state.uploading_in is not None:
            uploaded_file = st.file_uploader("Choose a file")
            if uploaded_file:
                create_attachment(uploaded_file.name, uploaded_file.getvalue(), user_id, st.session_state.uploading_in)
                st.session_state.uploading_in = None
                st.rerun()

        st.markdown("---")
        folders = get_folders_by_user_id(user_id)
        notes = get_notes_by_user_id(user_id)
        attachments = get_attachments_by_user_id(user_id)
        render_file_tree(folders, notes, attachments)

    # --- Main Panel ---
    st.title("Off-Notes (Streamlit)")
    if st.session_state.selected_item is None:
        st.info("Welcome! Select an item from the sidebar to view it, or create something new.")
    else:
        item_id = st.session_state.selected_item
        item_type = st.session_state.selected_item_type

        if item_type == "note":
            note = next((n for n in notes if n["id"] == item_id), None)
            if note:
                title = st.text_input("Title", value=note["title"])
                content = st_quill(value=note["content"], html=True, key="quill")
                if st.button("Save"):
                    update_note(item_id, title, content)
                    st.success("Saved!")
                    st.rerun()
        
        elif item_type == "attachment":
            attachment = get_attachment_data(item_id)
            if attachment:
                st.header(attachment['filename'])
                mime_type, _ = mimetypes.guess_type(attachment['filename'])
                if mime_type:
                    if "image" in mime_type:
                        st.image(attachment['file_data'])
                    elif "pdf" in mime_type:
                        st.download_button("Download PDF", attachment['file_data'], attachment['filename'])
                        st.write("PDF preview is not directly supported, please download.")
                    else:
                         st.download_button(f"Download {attachment['filename']}", attachment['file_data'], attachment['filename'])
                else:
                    st.download_button(f"Download {attachment['filename']}", attachment['file_data'], attachment['filename'])

# --- Authentication and Routing ---
if not st.session_state.logged_in:
    if st.session_state.page == "login":
        login_page()
    else:
        register_page()
else:
    main_app()
