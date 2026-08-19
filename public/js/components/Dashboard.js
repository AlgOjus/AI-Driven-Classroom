function Dashboard(props) {
    var s1 = React.useState([]); var classrooms = s1[0], setClassrooms = s1[1];
    var s2 = React.useState(''); var name = s2[0], setName = s2[1];
    var s3 = React.useState(''); var section = s3[0], setSection = s3[1];
    var s4 = React.useState(''); var code = s4[0], setCode = s4[1];
    var s5 = React.useState(''); var error = s5[0], setError = s5[1];

    function load() {
        apiFetch('/classroom/mine').then(setClassrooms).catch(function (e) { setError(e.message); });
    }
    React.useEffect(function () { load(); }, []);

    function createClassroom(e) {
        e.preventDefault();
        apiFetch('/classroom/create', 'POST', { name: name, section: section })
            .then(function () { setName(''); setSection(''); load(); })
            .catch(function (e) { setError(e.message); });
    }

    function joinClassroom(e) {
        e.preventDefault();
        apiFetch('/classroom/join', 'POST', { code: code })
            .then(function () { setCode(''); load(); })
            .catch(function (e) { setError(e.message); });
    }

    function handleCopy(e, codeToCopy) {
        e.stopPropagation();
        copyText(codeToCopy);
        var btn = e.currentTarget;
        var original = btn.innerText;
        btn.innerText = '✅';
        setTimeout(function () { btn.innerText = original; }, 1200);
    }

    return (
        <div className="container">
            {props.user.role === 'teacher' && (
                <div className="card">
                    <h3>Create a Classroom</h3>
                    <form className="form-row" onSubmit={createClassroom}>
                        <input placeholder="Class name (e.g. Physics 10A)" value={name} onChange={function (e) { setName(e.target.value); }} required />
                        <input placeholder="Section" value={section} onChange={function (e) { setSection(e.target.value); }} />
                        <button className="btn" type="submit">Create</button>
                    </form>
                </div>
            )}
            {props.user.role === 'student' && (
                <div className="card">
                    <h3>Join a Classroom</h3>
                    <form className="form-row" onSubmit={joinClassroom}>
                        <input placeholder="Enter class code" value={code} onChange={function (e) { setCode(e.target.value); }} required />
                        <button className="btn" type="submit">Join</button>
                    </form>
                </div>
            )}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <h3>Your Classrooms</h3>
            <div className="classroom-grid">
                {classrooms.map(function (c) {
                    return (
                        <div className="classroom-card" key={c.id} onClick={function () { props.onOpenClassroom(c); }}>
                            <h4>{c.name}</h4>
                            <p>{c.section}</p>
                            <p>Teacher: {c.teacherName}</p>
                            {props.user.role === 'teacher' && (
                                <div className="classcode-row">
                                    <span className="classcode-badge">{c.classCode}</span>
                                    <button className="copy-btn" onClick={function (e) { handleCopy(e, c.classCode); }}>📋</button>
                                </div>
                            )}
                        </div>
                    );
                })}
                {classrooms.length === 0 && <p className="empty-hint">No classrooms yet.</p>}
            </div>
        </div>
    );
}