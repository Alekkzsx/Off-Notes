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
    """Renders the main application sidebar with an Obsidian-like feel."""
    with st.sidebar:
        # Icon bar simulation
        st.markdown("""
            <div style="display: flex; flex-direction: column; align-items: center; padding: 8px 0;">
                <div class="sidebar-icon" title="Notes">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <div class="sidebar-icon" title="Files">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <div class="sidebar-icon" title="Bookmarks">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
                </div>
                <div class="sidebar-icon" title="Favorites">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </div>
            </div>
        """, unsafe_allow_html=True)

        st.markdown("---")

        user_id = st.session_state.user_id
        c1, c2, c3 = st.columns(3)
        with c1:
            if st.button("➕ Note", use_container_width=True):
                create_note_and_select(user_id, None)
        with c2:
            if st.button("📁 Folder", use_container_width=True):
                create_folder_dialog(user_id, None)
        with c3:
            if st.button("📎 Upload", use_container_width=True):
                upload_attachment_dialog(user_id, None)
        
        st.markdown("---")
        st.markdown("#### Your Files")
>>>>>>> Stashed changes
    
    folders = get_folders_by_user_id(user_id)
    notes = get_notes_by_user_id(user_id)
    attachments = get_attachments_by_user_id(user_id)
    
    tree_items = [{'id': f['id'], 'name': f['name'], 'parent_id': f['parent_id'], 'type': 'folder', 'icon': '📁'} for f in folders]
    tree_items += [{'id': n['id'], 'name': n['title'], 'parent_id': n['folder_id'], 'type': 'note', 'icon': '📄'} for n in notes]
    tree_items += [{'id': a['id'], 'name': a['filename'], 'parent_id': a['folder_id'], 'type': 'attachment', 'icon': '📎'} for a in attachments]
    
    with st.sidebar:
        render_tree(tree_items)

        # Logout button at the bottom
        st.markdown("---")
        if st.button("Logout"):
            st.session_state.clear()
            st.rerun()
    
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
            title = st.text_input("Title", value=note["title"], label_visibility="collapsed")
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
    """Recursively renders a clean, Obsidian-like tree of items."""
    children = [item for item in items if item['parent_id'] == parent_id]

    for item in children:
        item_id = item['id']
        item_type = item['type']
        indent = level * 20
        
        cols = st.columns([0.9, 0.1])
        
        with cols[0]:
            if item_type == 'folder':
                is_expanded = item_id in st.session_state.expanded_folders
                arrow_icon = "▼" if is_expanded else "▶"
                st.button(f"{' ' * level * 2}{arrow_icon} {item['icon']} {item['name']}", 
                          key=f"toggle_{item_type}_{item_id}", 
                          on_click=toggle_folder, args=(item_id,),
                          use_container_width=True)
            else:
                st.button(f"{' ' * level * 2} {item['icon']} {item['name']}", 
                          key=f"select_{item_type}_{item_id}", 
                          on_click=select_item, args=(item_id, item_type),
                          use_container_width=True)
        
        with cols[1]:
            st.button("🗑️", key=f"del_{item_type}_{item_id}", on_click=delete_item, args=(item_id, item_type))

        if item_type == 'folder' and item_id in st.session_state.expanded_folders:
            render_tree(items, parent_id=item_id, level=level + 1)
