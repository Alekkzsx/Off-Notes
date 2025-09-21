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
        # This container simulates the far-left icon bar
        st.markdown("""
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 56px; /* w-16 equivalent */
                background-color: #202326;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding-top: 0.5rem;
                gap: 1rem;
                border-right: 1px solid #4a4a4a;
            ">
                <div class="sidebar-icon" title="Notes">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                <div class="sidebar-icon" title="Files">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                </div>
            </div>
        """, unsafe_allow_html=True)

        # This div pushes the file explorer content to the right of the icon bar
        st.markdown('<div style="margin-left: 60px; padding-top: 0.5rem;">', unsafe_allow_html=True)
        
        user_id = st.session_state.user_id
        
        st.markdown("##### Your Files")
        
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
            
        st.markdown('</div>', unsafe_allow_html=True)

def main_app_content():
    """Renders the main content area based on the selected item."""
    if st.session_state.selected_item is None:
        render_home_page()
        return

    item_type = st.session_state.selected_item_type
    item_id = st.session_state.selected_item

    st.markdown('<div class="main-content-container">', unsafe_allow_html=True)

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
    
    st.markdown('</div>', unsafe_allow_html=True)

def render_home_page():
    """Renders the default home page content from the user's HTML."""
    st.markdown("""
        <div class="main-content-container">
            <h1>Home</h1>
            
            <h2>Vault Info</h2>
            <div style="margin-left: 1rem;">
                <h3>Recent file updates</h3>
                <div class="code-block">
                    <pre><code><span class="syntax-cyan">list</span> <span class="syntax-purple">from</span> <span class="syntax-green">""</span>
<span class="syntax-cyan">sort</span> <span class="syntax-red">file.mtime</span>, <span class="syntax-green">"desc"</span>
<span class="syntax-cyan">limit</span>(4)</code></pre>
                </div>
                
                <h3>Recent Ideas</h3>
                <div class="code-block">
                    <pre><code><span class="syntax-cyan">list</span> <span class="syntax-purple">from</span> <span class="syntax-green">"Inbox"</span>
<span class="syntax-cyan">sort</span>(<span class="syntax-red">f</span> => <span class="syntax-red">f</span>.<span class="syntax-blue">file.mtime</span>, <span class="syntax-green">'desc'</span>).<span class="syntax-cyan">limit</span>(4).<span class="syntax-red">file.link</span></code></pre>
                </div>
            </div>
            
            <h2 style="margin-top: 3rem;">Book Notes</h2>
            <div style="margin-left: 1rem;">
                <h3>Notes to Process</h3>
                <div class="code-block">
                    <pre><code><span class="syntax-cyan">list</span> <span class="syntax-purple">from</span> <span class="syntax-green">#unprocessed</span>
<span class="syntax-cyan">sort</span>(<span class="syntax-red">f</span> => <span class="syntax-red">f</span>.<span class="syntax-blue">file.mtime</span>, <span class="syntax-green">'asc'</span>).<span class="syntax-cyan">limit</span>(4).<span class="syntax-red">file.link</span></code></pre>
                </div>
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
