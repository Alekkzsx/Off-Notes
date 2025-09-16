import streamlit as st
from streamlit_quill import st_quill
import mimetypes
from db import (
    get_folders_by_user_id, get_notes_by_user_id, get_attachments_by_user_id,
    get_note_by_id, update_note, get_attachment_data, create_folder, create_attachment
)
from callbacks import create_note_and_select, select_item, delete_item, toggle_folder

@st.dialog("Create New Folder")
def create_folder_dialog(user_id, parent_id=None):
    """Dialog to create a new folder."""
    folder_name = st.text_input("Folder Name")
    if st.button("Create"):
        if folder_name:
            create_folder(folder_name, user_id, parent_id)
            st.rerun()
        else:
            st.warning("Folder name cannot be empty.")

@st.dialog("Upload Attachment")
def upload_attachment_dialog(user_id, parent_id=None):
    """Dialog to upload a new attachment."""
    uploaded_file = st.file_uploader("Choose a file")
    if st.button("Upload"):
        if uploaded_file:
            create_attachment(uploaded_file.name, uploaded_file.getvalue(), user_id, parent_id)
            st.rerun()
        else:
            st.warning("Please choose a file to upload.")

def main_app_sidebar():
    """Renders the main application sidebar."""
    st.sidebar.title("Off-Notes")
    st.sidebar.markdown(f"Welcome, {st.session_state.user_email}")
    if st.sidebar.button("Logout"):
        st.session_state.clear()
        st.rerun()

    user_id = st.session_state.user_id
    c1, c2, c3 = st.sidebar.columns(3)
    c1.button("➕ Note", on_click=create_note_and_select, args=(user_id, None))
    if c2.button("📁 Folder"):
        create_folder_dialog(user_id, None)
    if c3.button("📎 Upload"):
        upload_attachment_dialog(user_id, None)
    
    st.sidebar.markdown("---")
    
    # Fetch all items for the tree view
    folders = get_folders_by_user_id(user_id)
    notes = get_notes_by_user_id(user_id)
    attachments = get_attachments_by_user_id(user_id)
    
    tree_items = [{'id': f['id'], 'name': f['name'], 'parent_id': f['parent_id'], 'type': 'folder', 'icon': '📁'} for f in folders]
    tree_items += [{'id': n['id'], 'name': n['title'], 'parent_id': n['folder_id'], 'type': 'note', 'icon': '📄'} for n in notes]
    tree_items += [{'id': a['id'], 'name': a['filename'], 'parent_id': a['folder_id'], 'type': 'attachment', 'icon': '📎'} for a in attachments]
    
    with st.sidebar:
        render_tree(tree_items)

def main_app_content():
    """Renders the main content area based on the selected item."""
    if st.session_state.selected_item is None:
        st.info("Select an item from the sidebar or create something new.")
        return

    item_type = st.session_state.selected_item_type
    item_id = st.session_state.selected_item

    if item_type == "note":
        note = get_note_by_id(item_id)
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

def render_tree(items, parent_id=None, level=0):
    """Recursively renders a tree of folders, notes, and attachments with a clean, indented look."""
    children = [item for item in items if item['parent_id'] == parent_id]
    
    # CSS to make buttons smaller and less intrusive
    st.markdown("""
        <style>
            div[data-testid="stButton"] > button {
                padding: 0.1rem 0.3rem;
                font-size: 0.8rem;
                border: none;
                background: none;
            }
        </style>
    """, unsafe_allow_html=True)

    for item in children:
        item_id = item['id']
        item_type = item['type']
        
        if item_type == 'folder':
            is_expanded = item_id in st.session_state.expanded_folders
            arrow_icon = "▼" if is_expanded else "▶"
            
            # Adjust column ratios for a compact layout
            cols = st.columns([0.1 + (level * 0.05), 0.5 - (level * 0.05), 0.1, 0.1, 0.1])
            
            # Column 1: Toggle arrow with indentation
            cols[0].button(arrow_icon, key=f"toggle_{item_id}", on_click=toggle_folder, args=(item_id,))
            
            # Column 2: Item name (as a button for selection)
            cols[1].button(f"{item['icon']} {item['name']}", key=f"select_{item_type}_{item_id}", on_click=select_item, args=(item_id, item_type))
            
            # Columns 3-5: Action buttons
            cols[2].button("➕", key=f"add_note_{item_id}", on_click=create_note_and_select, args=(st.session_state.user_id, item_id))
            if cols[3].button("📁", key=f"add_folder_{item_id}"):
                create_folder_dialog(st.session_state.user_id, item_id)
            cols[4].button("🗑️", key=f"del_{item_type}_{item_id}", on_click=delete_item, args=(item_id, item_type))

            if is_expanded:
                render_tree(items, parent_id=item_id, level=level + 1)
        else: # For notes and attachments
            # Indent notes and attachments to align with folder content
            indent_level = level + 1
            
            # Adjust column ratios for a compact layout
            cols = st.columns([0.1 + (indent_level * 0.05), 0.8 - (indent_level * 0.05), 0.1])
            
            # Column 2: Item name (as a button for selection)
            cols[1].button(f"{item['icon']} {item['name']}", key=f"select_{item_type}_{item_id}", on_click=select_item, args=(item_id, item_type))
            
            # Column 3: Delete button
            cols[2].button("🗑️", key=f"del_{item_type}_{item_id}", on_click=delete_item, args=(item_id, item_type))
