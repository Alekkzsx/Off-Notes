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
    with st.sidebar:
        st.header("Notes")
        
        user_id = st.session_state.user_id
        folders = get_folders_by_user_id(user_id)
        notes = get_notes_by_user_id(user_id)
        attachments = get_attachments_by_user_id(user_id)
        
        tree_items = [{'id': f['id'], 'name': f['name'], 'parent_id': f['parent_id'], 'type': 'folder', 'icon': '📁'} for f in folders]
        tree_items += [{'id': n['id'], 'name': n['title'], 'parent_id': n['folder_id'], 'type': 'note', 'icon': '📄'} for n in notes]
        tree_items += [{'id': a['id'], 'name': a['filename'], 'parent_id': a['folder_id'], 'type': 'attachment', 'icon': '📎'} for a in attachments]
        
        render_tree(tree_items)

        st.markdown("---")
        if st.button("Logout"):
            st.session_state.clear()
            st.rerun()

def main_app_content():
    """Renders the main content area based on the selected item."""
    if st.session_state.selected_item is None:
        render_home_page()
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

def render_home_page():
    """Renders the default home page content."""
    st.title("Home")
    st.header("Vault Info")

    st.subheader("Recent file updates")
    st.markdown("""
    <div class="code-block">
    <pre><code><span class="syntax-cyan">list</span> <span class="syntax-purple">from</span> <span class="syntax-green">""</span>
<span class="syntax-cyan">sort</span> <span class="syntax-red">file.mtime</span>, <span class="syntax-green">"desc"</span>
<span class="syntax-cyan">limit</span>(4)</code></pre>
    </div>
    """, unsafe_allow_html=True)

    st.subheader("Recent Ideas")
    st.markdown("""
    <div class="code-block">
    <pre><code><span class="syntax-cyan">list</span> <span class="syntax-purple">from</span> <span class="syntax-green">"Inbox"</span>
<span class="syntax-cyan">sort</span>(<span class="syntax-red">f</span> => <span class="syntax-red">f</span>.<span class="syntax-blue">file.mtime</span>, <span class="syntax-green">'desc'</span>).<span class="syntax-cyan">limit</span>(4).<span class="syntax-red">file.link</span></code></pre>
    </div>
    """, unsafe_allow_html=True)

    st.header("Book Notes")

    st.subheader("Notes to Process")
    st.markdown("""
    <div class="code-block">
    <pre><code><span class="syntax-cyan">list</span> <span class="syntax-purple">from</span> <span class="syntax-green">#unprocessed</span>
<span class="syntax-cyan">sort</span>(<span class="syntax-red">f</span> => <span class="syntax-red">f</span>.<span class="syntax-blue">file.mtime</span>, <span class="syntax-green">'asc'</span>).<span class="syntax-cyan">limit</span>(4).<span class="syntax-red">file.link</span></code></pre>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="status-bar">
        <div>
            <span>1 min read</span> | <span>1 backlink</span>
        </div>
        <div>
            <span>246 words</span> | <span>1515 characters</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

def render_tree(items, parent_id=None, level=0):
    """Recursively renders a clean, Obsidian-like tree of items."""
    children = [item for item in items if item['parent_id'] == parent_id]

    for item in children:
        item_id = item['id']
        item_type = item['type']
        
        cols = st.columns([0.9, 0.1])
        
        with cols[0]:
            if item_type == 'folder':
                is_expanded = item_id in st.session_state.expanded_folders
                arrow_icon = "▼" if is_expanded else "▶"
                st.button(f"{' ' * level * 4}{arrow_icon} {item['icon']} {item['name']}", 
                          key=f"toggle_{item_type}_{item_id}", 
                          on_click=toggle_folder, args=(item_id,),
                          use_container_width=True)
            else:
                st.button(f"{' ' * level * 4} {item['icon']} {item['name']}", 
                          key=f"select_{item_type}_{item_id}", 
                          on_click=select_item, args=(item_id, item_type),
                          use_container_width=True)
        
        with cols[1]:
            st.button("🗑️", key=f"del_{item_type}_{item_id}", on_click=delete_item, args=(item_id, item_type))

        if item_type == 'folder' and item_id in st.session_state.expanded_folders:
            render_tree(items, parent_id=item_id, level=level + 1)
