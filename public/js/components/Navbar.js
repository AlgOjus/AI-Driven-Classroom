function Navbar(props) {
    return (
        <div className="navbar">
            <div className="navbar-brand">
                <span className="brand-icon">📚</span>
                <h2>Manan<span className="brand-ai">AI</span></h2>
            </div>
            <div className="navbar-right">
                <ThemeSwitcher />
                <div className="navbar-user">
                    <span className="user-avatar">{props.user.name.charAt(0).toUpperCase()}</span>
                    <span className="user-info">{props.user.name}<small>{props.user.role}</small></span>
                </div>
                <button className="btn-logout" onClick={props.onLogout}>Logout</button>
            </div>
        </div>
    );
}