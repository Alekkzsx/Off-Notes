import streamlit as st
from db import get_user_by_email, create_user, verify_password

def login_page():
    """Renders the login page."""
    st.title("Login")
    with st.form("login_form"):
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        submit_button = st.form_submit_button("Login")

        if submit_button:
            user = get_user_by_email(email)
            if user and verify_password(user['password'], password):
                st.session_state.logged_in = True
                st.session_state.user_id = user['id']
                st.session_state.user_email = user['email']
                st.rerun()
            else:
                st.error("Invalid email or password")
    
    if st.button("Go to Register"):
        st.session_state.page = "register"
        st.rerun()

def register_page():
    """Renders the registration page."""
    st.title("Register")
    with st.form("register_form"):
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        submit_button = st.form_submit_button("Register")

        if submit_button:
            user_id = create_user(email, password)
            if user_id:
                st.success("Registration successful! Please login.")
                st.session_state.page = "login"
                st.rerun()
            else:
                st.error("Email already exists.")

    if st.button("Go to Login"):
        st.session_state.page = "login"
        st.rerun()
