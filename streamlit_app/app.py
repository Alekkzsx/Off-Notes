import streamlit as st
from db import init_db
from ui.auth_ui import login_page, register_page
from ui.main_ui import main_app_sidebar, main_app_content

def initialize_session():
    """Initializes the session state variables if they don't exist."""
    if "logged_in" not in st.session_state:
        st.session_state.logged_in = False
        st.session_state.page = "register"
        st.session_state.user_id = None
        st.session_state.user_email = None
        st.session_state.selected_item = None
        st.session_state.selected_item_type = None
        st.session_state.expanded_folders = []

def main():
    """Main function to run the Streamlit app."""
    st.set_page_config(layout="wide")
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

if __name__ == "__main__":
    main()
