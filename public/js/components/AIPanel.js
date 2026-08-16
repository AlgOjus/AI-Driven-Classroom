function AIPanel(props) {
    var matchHistory = props.matchHistory || [];
    var s1 = React.useState(false); var open = s1[0], setOpen = s1[1];
    var s2 = React.useState(0); var selectedIndex = s2[0], setSelectedIndex = s2[1];
    var s3 = React.useState('3d'); var activeTab = s3[0], setActiveTab = s3[1];

    React.useEffect(function () {
        setSelectedIndex(0);
    }, [matchHistory.length]);

    function toggleOpen() {
        var next = !open;
        setOpen(next);
        if (next && props.onOpened) props.onOpened();
    }

    var current = matchHistory[selectedIndex];

    return (
        <div className="ai-panel-root">
            <button className={"ai-fab" + (props.hasNewMatch && !open ? " pulse" : "")} onClick={toggleOpen} title="AI Teaching Assistant">
                {open ? '✕' : '🤖'}
                {!open && matchHistory.length > 0 && <span className="ai-fab-badge">{matchHistory.length}</span>}
            </button>

            {open && (
                <div className="ai-panel">
                    <div className="ai-panel-header">
                        <h3>🤖 AI Teaching Assistant</h3>
                        <button className="ai-panel-close" onClick={function () { setOpen(false); }}>✕</button>
                    </div>
                    <div className="ai-panel-body">
                        <div className="ai-topics-col">
                            <p className="ai-topics-label">Live Topics (priority order)</p>
                            {matchHistory.length === 0 && (
                                <p className="empty-hint-sm">🎙️ Start listening — AI will detect topics here in real time, prioritized by what's currently being taught.</p>
                            )}
                            {matchHistory.map(function (m, i) {
                                return (
                                    <div key={i}
                                        className={"ai-topic-item" + (i === selectedIndex ? " active" : "") + (i === 0 ? " latest" : "")}
                                        onClick={function () { setSelectedIndex(i); }}>
                                        {i === 0 && <span className="live-dot"></span>}
                                        <span>{m.topic}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="ai-content-col">
                            {current ? (
                                <React.Fragment>
                                    <div className="ai-tabs">
                                        <button className={activeTab === '3d' ? 'active' : ''} onClick={function () { setActiveTab('3d'); }}>🧊 3D Model</button>
                                        <button className={activeTab === 'animation' ? 'active' : ''} onClick={function () { setActiveTab('animation'); }}>🎞️ Animation</button>
                                        <button className={activeTab === 'simulation' ? 'active' : ''} onClick={function () { setActiveTab('simulation'); }}>⚙️ Simulation</button>
                                        <button className={activeTab === 'quiz' ? 'active' : ''} onClick={function () { setActiveTab('quiz'); }}>📝 Quiz</button>
                                    </div>
                                    <div className="ai-tab-content">
                                        {activeTab !== 'quiz' && (function () {
                                            var s = (current.suggestions || []).find(function (x) { return x.type === activeTab; });
                                            if (!s) return <p className="empty-hint-sm">No {activeTab} suggestion available for this topic.</p>;
                                            return (
                                                <div>
                                                    <p className="ai-query-label">🔍 {s.query}</p>
                                                    {s.embeddable ? (
                                                        <iframe title="visual" src={s.url} className="ai-embed-frame"></iframe>
                                                    ) : (
                                                        <a className="btn" href={s.url} target="_blank" rel="noreferrer">Open {activeTab} resource ↗</a>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                        {activeTab === 'quiz' && <QuizView quiz={current.quiz || []} />}
                                    </div>
                                </React.Fragment>
                            ) : (
                                <p className="empty-hint">Select a topic on the left to view its AI-suggested content.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function QuizView(props) {
    var quiz = props.quiz || [];
    var s1 = React.useState({}); var answers = s1[0], setAnswers = s1[1];
    var s2 = React.useState(false); var submitted = s2[0], setSubmitted = s2[1];

    if (!quiz.length) return <p className="empty-hint-sm">No quiz generated for this topic yet.</p>;

    function selectAnswer(qIndex, optIndex) {
        if (submitted) return;
        setAnswers(function (prev) {
            var copy = Object.assign({}, prev);
            copy[qIndex] = optIndex;
            return copy;
        });
    }

    var score = 0;
    if (submitted) {
        quiz.forEach(function (q, i) { if (answers[i] === q.answerIndex) score++; });
    }

    return (
        <div className="quiz-view">
            {quiz.map(function (q, qi) {
                return (
                    <div className="quiz-question" key={qi}>
                        <p className="quiz-q-text">{qi + 1}. {q.question}</p>
                        <div className="quiz-options">
                            {q.options.map(function (opt, oi) {
                                var cls = "quiz-option";
                                if (answers[qi] === oi) cls += " selected";
                                if (submitted && oi === q.answerIndex) cls += " correct";
                                if (submitted && answers[qi] === oi && oi !== q.answerIndex) cls += " wrong";
                                return (
                                    <div key={oi} className={cls} onClick={function () { selectAnswer(qi, oi); }}>
                                        {opt}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            {!submitted ? (
                <button className="btn" onClick={function () { setSubmitted(true); }}>Submit Quiz</button>
            ) : (
                <p className="quiz-score">Score: {score} / {quiz.length}</p>
            )}
        </div>
    );
}