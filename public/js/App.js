function App() {
    var s1 = React.useState(null); var user = s1[0], setUser = s1[1];
    var s2 = React.useState('login'); var page = s2[0], setPage = s2[1];
    var s3 = React.useState(null); var currentClassroom = s3[0], setCurrentClassroom = s3[1];
    var s4 = React.useState(null); var currentMaterial = s4[0], setCurrentMaterial = s4[1];

    React.useEffect(function () {
        var token = localStorage.getItem('token');
        var savedUser = localStorage.getItem('user');
        if (token && savedUser) { setUser(JSON.parse(savedUser)); setPage('dashboard'); }
    }, []);

    function onAuthSuccess(data) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, role: data.role }));
        setUser({ id: data.id, name: data.name, role: data.role });
        setPage('dashboard');
    }

    function onLogout() {
        localStorage.removeItem('token'); localStorage.removeItem('user');
        setUser(null); setPage('login');
    }

    function openClassroom(c) { setCurrentClassroom(c); setPage('classroom'); }
    function presentMaterial(material) { setCurrentMaterial(material); setPage('present'); }
    function exitPresent() { setPage('classroom'); setCurrentMaterial(null); }

    if (!user) return <AuthPage onAuthSuccess={onAuthSuccess} />;

    return (
        <div>
            <Navbar user={user} onLogout={onLogout} />
            {page === 'dashboard' && <Dashboard user={user} onOpenClassroom={openClassroom} />}
            {page === 'classroom' && currentClassroom && (
                <ClassroomPage user={user} classroom={currentClassroom} onBack={function () { setPage('dashboard'); }} onPresent={presentMaterial} />
            )}
            {page === 'present' && currentMaterial && (
                <PresentMode classroom={currentClassroom} material={currentMaterial} onExit={exitPresent} />
            )}
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);