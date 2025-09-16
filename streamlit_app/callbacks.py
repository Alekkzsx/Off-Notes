import streamlit as st
from db import create_note, delete_folder, delete_note, delete_attachment

def select_item(item_id, item_type):
    """Sets the selected item in the session state."""
    st.session_state.selected_item = item_id
    st.session_state.selected_item_type = item_type

def create_note_and_select(user_id, folder_id=None):
    """Creates a new note and selects it."""
    new_note_id = create_note(user_id, folder_id)
    select_item(new_note_id, "note")

def delete_item(item_id, item_type):
    """Deletes an item (folder, note, or attachment)."""
    if item_type == 'folder': delete_folder(item_id)
    elif item_type == 'note': delete_note(item_id)
    elif item_type == 'attachment': delete_attachment(item_id)
    
    if st.session_state.selected_item == item_id:
        st.session_state.selected_item = None
    st.rerun()

def toggle_folder(folder_id):
    """Expands or collapses a folder."""
    if folder_id in st.session_state.expanded_folders:
        st.session_state.expanded_folders.remove(folder_id)
    else:
        st.session_state.expanded_folders.append(folder_id)
