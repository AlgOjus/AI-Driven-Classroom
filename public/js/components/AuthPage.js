function AuthPage(props) {
    var s1 = React.useState('login'); var mode = s1[0], setMode = s1[1];
    var s2 = React.useState(''); var name = s2[0], setName = s2[1];
    var s3 = React.useState(''); var email = s3[0], setEmail = s3[1];
    var s4 = React.useState(''); var password = s4[0], setPassword = s4[1];
    var s5 = React.useState('student'); var role = s5[0], setRole = s5[1];
    var s6 = React.useState(''); var error = s6[0], setError = s6[1];

    var particles = React.useState(function () {
        return Array.from({ length: 18 }).map(function () {
            return {
                left: Math.random() * 100,
                delay: Math.random() * 10,
                duration: 8 + Math.random() * 10,
                size: 4 + Math.random() * 8
            };
        });
    })[0];

    function submit(e) {
        e.preventDefault();
        setError('');
        if (mode === 'login') {
            apiFetch('/auth/login', 'POST', { email: email, password: password })
                .then(function (data) { props.onAuthSuccess(data); })
                .catch(function (err) { setError(err.message); });
        } else {
            apiFetch('/auth/signup', 'POST', { name: name, email: email, password: password, role: role })
                .then(function () { alert('Signup successful! Please login.'); setMode('login'); })
                .catch(function (err) { setError(err.message); });
        }
    }

    return (
        <div className="auth-page">
            <video className="bg-video" autoPlay loop muted playsInline>
                <source src="/videos/classroom-bg.mp4" type="video/mp4" />
            </video>
            <div className="video-overlay"></div>

            <div className="auth-card-wrap">
                <div className="auth-container glass">
                    <div className="auth-logo">📚 <span>Smart Classroom AI</span></div>
                    <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                    <form onSubmit={submit}>
                        {mode === 'signup' && (
                            <input placeholder="Full Name" value={name} onChange={function (e) { setName(e.target.value); }} required />
                        )}
                        <input type="email" placeholder="Email" value={email} onChange={function (e) { setEmail(e.target.value); }} required />
                        <input type="password" placeholder="Password" value={password} onChange={function (e) { setPassword(e.target.value); }} required />
                        {mode === 'signup' && (
                            <select value={role} onChange={function (e) { setRole(e.target.value); }}>
                                <option value="student">🎓 Student</option>
                                <option value="teacher">👩‍🏫 Teacher</option>
                            </select>
                        )}
                        {error && <p className="auth-error">{error}</p>}
                        <button type="submit" className="auth-submit-btn">{mode === 'login' ? 'Login' : 'Sign Up'}</button>
                    </form>
                    <div className="auth-switch" onClick={function () { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
                        {mode === 'login' ? (<span>New here? <b>Create an account</b></span>) : (<span>Already have an account? <b>Login</b></span>)}
                    </div>
                </div>
            </div>
        </div>
    );

}