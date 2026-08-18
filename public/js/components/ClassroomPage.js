function ClassroomPage(props) {
    var classroom = props.classroom;
    var user = props.user;
    var s1 = React.useState([]); var posts = s1[0], setPosts = s1[1];
    var s2 = React.useState(''); var title = s2[0], setTitle = s2[1];
    var s3 = React.useState(null); var file = s3[0], setFile = s3[1];
    var s4 = React.useState(false); var uploading = s4[0], setUploading = s4[1];
    var s5 = React.useState(null); var openChatFor = s5[0], setOpenChatFor = s5[1];
    var s6 = React.useState(''); var error = s6[0], setError = s6[1];

    function load() {
        apiFetch('/classroom/' + classroom.id + '/stream').then(setPosts).catch(function (e) { setError(e.message); });
    }
    React.useEffect(function () { load(); }, [classroom.id]);

    function submitUpload(e) {
        e.preventDefault();
        if (!file) { setError('Select a PDF file'); return; }
        var fd = new FormData();
        fd.append('pdf', file);
        fd.append('title', title || file.name);
        setUploading(true);
        uploadMaterial(classroom.id, fd)
            .then(function () { setTitle(''); setFile(null); load(); })
            .catch(function (e) { setError(e.message); })
            .finally(function () { setUploading(false); });
    }

    function openMaterial(materialId) {
        apiFetch('/material/' + materialId).then(function (material) { props.onPresent(material); })
            .catch(function (e) { setError(e.message); });
    }

    function handleCopy(e) {
        copyText(classroom.classCode);
        var btn = e.currentTarget;
        var original = btn.innerText;
        btn.innerText = '✅ Copied';
        setTimeout(function () { btn.innerText = original; }, 1200);
    }

    return (
        <div className="container">
            <button className="btn secondary" onClick={props.onBack}>← Back to Dashboard</button>
            <div className="card" style={{ marginTop: 14 }}>
                <h3>{classroom.name} {classroom.section ? '- ' + classroom.section : ''}</h3>
                {user.role === 'teacher' && (
                    <p>
                        Class Code: <span className="classcode-badge">{classroom.classCode}</span>{' '}
                        <button className="copy-btn light" onClick={handleCopy}>📋 Copy</button>{' '}
                        (share this with students)
                    </p>
                )}
            </div>

            {user.role === 'teacher' && (
                <div className="card">
                    <h3>Upload PDF Material</h3>
                    <form onSubmit={submitUpload}>
                        <div className="form-row">
                            <input placeholder="Title" value={title} onChange={function (e) { setTitle(e.target.value); }} />
                            <input type="file" accept="application/pdf" onChange={function (e) { setFile(e.target.files[0]); }} />
                            <button className="btn" type="submit" disabled={uploading}>{uploading ? 'Processing (AI analyzing PDF)...' : 'Upload'}</button>
                        </div>
                    </form>
                </div>
            )}

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h3>Class Stream</h3>
            {posts.map(function (p) {
                return (
                    <div className="post-card" key={p.id}>
                        <h4>{p.title}</h4>
                        <p style={{ color: '#888', fontSize: 12 }}>{new Date(p.createdAt).toLocaleString()}</p>
                        {p.type === 'material' && (
                            <button className="btn" onClick={function () { openMaterial(p.materialId); }}>
                                {user.role === 'teacher' ? '🖥️ Present This' : '📖 Open PDF'}
                            </button>
                        )}
                        {p.type === 'summary' && (
                            <div>
                                <div className="post-summary-content">{p.content}</div>
                                {user.role === 'student' && (
                                    <button className="btn" style={{ marginTop: 10 }} onClick={function () { setOpenChatFor(openChatFor === p.sessionId ? null : p.sessionId); }}>
                                        💬 {openChatFor === p.sessionId ? 'Close AI Chat' : 'Ask AI about this class'}
                                    </button>
                                )}
                                {openChatFor === p.sessionId && <ChatWidget sessionId={p.sessionId} />}
                            </div>
                        )}
                        {p.type === 'quiz' && <QuizView quiz={p.quiz} topic={null} />}
                    </div>
                );
            })}
            {posts.length === 0 && <p className="empty-hint">No posts yet.</p>}
        </div>
    );
}