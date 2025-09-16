import streamlit as st
from streamlit_quill import st_quill
import mimetypes
from db import (
    init_db, create_user, get_user_by_email, get_folders_by_user_id,
    get_notes_by_user_id, update_note, create_folder,
    create_note, delete_folder, delete_note,
    create_attachment, get_attachments_by_user_id,
    get_attachment_data, delete_attachment
)

# --- App State Initialization ---
st.set_page_config(layout="wide")

def initialize_session():
    if "logged_in" not in st.session_state:
        st.session_state.logged_in = False
        st.session_state.page = "register"
        st.session_state.user_id = None
        st.session_state.user_email = None
        st.session_state.selected_item = None
        st.session_state.selected_item_type = None
        st.session_state.creating_folder_in = None
        st.session_state.uploading_to = None

# --- UI Rendering ---
def render_tree(items, parent_id=None, level=0):
    indent = " " * level * 4
    children = [item for item in items if item['parent_id'] == parent_id]
    
    for item in children:
        with st.container():
            col1, col2, col3, col4 = st.columns([0.7, 0.1, 0.1, 0.1])
            col1.button(f"{indent}{item['icon']} {item['name']}", key=f"select_{item['type']}_{item['id']}", on_click=lambda i=item: select_item(i['id'], i['type']))
            if item['type'] == 'folder':
                col2.button("➕", key=f"add_note_{item['id']}", on_click=lambda i=item: create_note_and_select(st.session_state.user_id, i['id']))
                col3.button("📁", key=f"add_folder_{item['id']}", on_click=lambda i=item: set_creation_mode('folder', i['id']))
            col4.button("🗑️", key=f"del_{item['type']}_{item['id']}", on_click=lambda i=item: delete_item(i['id'], i['type']))
            
            if item['type'] == 'folder':
                render_tree(items, parent_id=item['id'], level=level + 1)

def main_app_sidebar():
    st.sidebar.title(f"Welcome, {st.session_state.user_email}")
    if st.sidebar.button("Logout"):
        st.session_state.clear()
        st.rerun()

    user_id = st.session_state.user_id
    c1, c2, c3 = st.sidebar.columns(3)
    c1.button("➕ Note", on_click=create_note_and_select, args=(user_id, None))
    c2.button("📁 Folder", on_click=set_creation_mode, args=('folder', None))
    c3.button("📎 Upload", on_click=set_creation_mode, args=('attachment', None))

    handle_creation_forms(user_id)
    
    st.sidebar.markdown("---")
    
    folders = get_folders_by_user_id(user_id)
    notes = get_notes_by_user_id(user_id)
    attachments = get_attachments_by_user_id(user_id)
    
    tree_items = [{'id': f['id'], 'name': f['name'], 'parent_id': f['parent_id'], 'type': 'folder', 'icon': '📁'} for f in folders]
    tree_items += [{'id': n['id'], 'name': n['title'], 'parent_id': n['folder_id'], 'type': 'note', 'icon': '📄'} for n in notes]
    tree_items += [{'id': a['id'], 'name': a['filename'], 'parent_id': a['folder_id'], 'type': 'attachment', 'icon': '📎'} for a in attachments]
    
    render_tree(tree_items)

def main_app_content():
    st.title("Off-Notes")
    if st.session_state.selected_item is None:
        st.info("Select an item from the sidebar or create something new.")
        return

    item_type = st.session_state.selected_item_type
    item_id = st.session_state.selected_item

    if item_type == "note":
        note = get_note_by_id(item_id) # Assumes get_note_by_id exists
        if note:
            title = st.text_input("Title", value=note["title"])
            content = st_quill(value=note["content"], html=True, key="quill")
            if st.button("Save"):
                update_note(item_id, title, content)
                st.success("Saved!")
        else:
            st.warning("Note not found.")
    
    elif item_type == "attachment":
        attachment = get_attachment_data(item_id)
        if attachment:
            st.header(attachment['filename'])
            mime_type, _ = mimetypes.guess_type(attachment['filename'])
            if mime_type and "image" in mime_type:
                st.image(attachment['file_data'])
            else:
                st.download_button(f"Download {attachment['filename']}", attachment['file_data'], attachment['filename'])

# --- Helper & Callback Functions ---
def select_item(item_id, item_type):
    st.session_state.selected_item = item_id
    st.session_state.selected_item_type = item_type

def create_note_and_select(user_id, folder_id=None):
    new_note_id = create_note(user_id, folder_id)
    select_item(new_note_id, "note")

def delete_item(item_id, item_type):
    if item_type == 'folder': delete_folder(item_id)
    elif item_type == 'note': delete_note(item_id)
    elif item_type == 'attachment': delete_attachment(item_id)
    if st.session_state.selected_item == item_id:
        st.session_state.selected_item = None
    st.rerun()

def set_creation_mode(item_type, parent_id):
    if item_type == 'folder': st.session_state.creating_folder_in = parent_id
    elif item_type == 'attachment': st.session_state.uploading_to = parent_id

def handle_creation_forms(user_id):
    if st.session_state.creating_folder_in is not None:
        with st.sidebar.form("new_folder_form"):
            name = st.text_input("Folder Name")
            if st.form_submit_button("Create"):
                create_folder(name, user_id, st.session_state.creating_folder_in)
                st.session_state.creating_folder_in = None
                st.rerun()

    if st.session_state.uploading_to is not None:
        uploaded_file = st.sidebar.file_uploader("Upload File")
        if uploaded_file:
            create_attachment(uploaded_file.name, uploaded_file.getvalue(), user_id, st.session_state.uploading_to)
            st.session_state.uploading_to = None
            st.rerun()

def get_note_by_id(note_id):
    notes = get_notes_by_user_id(st.session_state.user_id)
    return next((n for n in notes if n["id"] == note_id), None)

# --- Auth Pages ---
def login_page():
    # ... (login_page code remains the same)
    pass

def register_page():
    # ... (register_page code remains the same)
    pass

# --- Main Logic ---
initialize_session()
init_db()

if st.session_state.logged_in:
    main_app_sidebar()
    main_app_content()
else:
    if st.session_state.page == "login":
        login_page()
    else:
        register_page()
