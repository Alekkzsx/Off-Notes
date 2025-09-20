import streamlit as st
from db import get_user_by_email, create_user, verify_password

def login_page():
    """Renders the login page."""
    with st.container():
        st.markdown("<h1>Login</h1>", unsafe_allow_html=True) # Hidden by CSS, but good for structure
        with st.form("login_form"):
            st.markdown('<div class="user-icon">👤</div>', unsafe_allow_html=True)
            email = st.text_input("Email", placeholder="Username")
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
        
        if st.button("Go to Register", key="goto_register_login", type="secondary"):
            st.session_state.page = "register"
            st.rerun()

def register_page():
    """Renders the registration page."""
    with st.container():
        st.markdown("<h1>Register</h1>", unsafe_allow_html=True) # Hidden by CSS, but good for structure
        with st.form("register_form"):
            st.markdown('<div class="user-icon">👤</div>', unsafe_allow_html=True)
            email = st.text_input("Email", placeholder="Username")
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

        if st.button("Go to Login", key="goto_login_register", type="secondary"):
            st.session_state.page = "login"
            st.rerun()
