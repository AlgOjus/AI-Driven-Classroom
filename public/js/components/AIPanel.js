function AIPanel(props) {
    var matchHistory = props.matchHistory || [];
    var pdfTopics = props.pdfTopics || [];

    var s1 = React.useState(false); var open = s1[0], setOpen = s1[1];
    var s2 = React.useState('live'); var mainTab = s2[0], setMainTab = s2[1];
    var s3 = React.useState(0); var selectedLiveIndex = s3[0], setSelectedLiveIndex = s3[1];
    var s4 = React.useState(0); var selectedPdfIndex = s4[0], setSelectedPdfIndex = s4[1];
    var s5 = React.useState('3d'); var activeSubTab = s5[0], setActiveSubTab = s5[1];

    React.useEffect(function () { setSelectedLiveIndex(0); }, [matchHistory.length]);

    function toggleOpen() {
        var next = !open;
        setOpen(next);
        if (next && props.onOpened) props.onOpened();
    }

    var current = mainTab === 'live' ? matchHistory[selectedLiveIndex] : pdfTopics[selectedPdfIndex];

    return (
        <div className="fab-wrap">
            <button className={"round-fab ai" + (props.hasNewMatch && !open ? " pulse" : "")} onClick={toggleOpen} title="AI Teaching Assistant">
                {open ? <span style={{ fontSize: 20 }}>✕</span> : <AIIcon size={28} />}
                {!open && props.hasNewMatch && <span className="dot"></span>}
            </button>

            {open && (
                <div className="ai-panel">
                    <div className="ai-panel-header">
                        <h3>🤖 AI Teaching Assistant</h3>
                        <button className="ai-panel-close" onClick={function () { setOpen(false); }}>✕</button>
                    </div>

                    <div className="ai-main-tabs">
                        <button className={mainTab === 'live' ? 'active' : ''} onClick={function () { setMainTab('live'); }}>🔴 Live Topic</button>
                        <button className={mainTab === 'pdf' ? 'active' : ''} onClick={function () { setMainTab('pdf'); }}>📄 PDF Topics</button>
                    </div>

                    <div className="ai-panel-body">
                        <div className="ai-topics-col">
                            <p className="ai-topics-label">{mainTab === 'live' ? 'Detected while teaching' : 'All topics in this PDF'}</p>

                            {mainTab === 'live' && matchHistory.length === 0 && (
                                <p className="empty-hint-sm">🎙️ Start listening — a topic appears here only when it truly matches this PDF's content.</p>
                            )}
                            {mainTab === 'live' && matchHistory.map(function (m, i) {
                                return (
                                    <div key={i} className={"ai-topic-item" + (i === selectedLiveIndex ? " active" : "")} onClick={function () { setSelectedLiveIndex(i); }}>
                                        {i === 0 && <span className="live-dot"></span>}
                                        <span>{m.topic}</span>
                                    </div>
                                );
                            })}

                            {mainTab === 'pdf' && pdfTopics.length === 0 && <p className="empty-hint-sm">Scanning PDF content...</p>}
                            {mainTab === 'pdf' && pdfTopics.map(function (t, i) {
                                return (
                                    <div key={i} className={"ai-topic-item" + (i === selectedPdfIndex ? " active" : "")} onClick={function () { setSelectedPdfIndex(i); }}>
                                        <span>{t.topic}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="ai-content-col">
                            {current ? (
                                <React.Fragment>
                                    <div className="ai-tabs">
                                        <button className={activeSubTab === '3d' ? 'active' : ''} onClick={function () { setActiveSubTab('3d'); }}>🧊 3D</button>
                                        <button className={activeSubTab === 'animation' ? 'active' : ''} onClick={function () { setActiveSubTab('animation'); }}>🎞️ Animation</button>
                                        <button className={activeSubTab === 'simulation' ? 'active' : ''} onClick={function () { setActiveSubTab('simulation'); }}>⚙️ Simulation</button>
                                        <button className={activeSubTab === 'quiz' ? 'active' : ''} onClick={function () { setActiveSubTab('quiz'); }}>📝 Quiz</button>
                                    </div>
                                    <div className="ai-tab-content">
                                        {activeSubTab !== 'quiz' && (
                                            <div className="flashcard-grid">
                                                {((current.flashcards && current.flashcards[activeSubTab]) || []).map(function (card, i) {
                                                    return <FlashCard key={card.id || i} card={card} />;
                                                })}
                                                {(!current.flashcards || !current.flashcards[activeSubTab] || !current.flashcards[activeSubTab].length) && (
                                                    <p className="empty-hint-sm">No {activeSubTab} content generated for this topic.</p>
                                                )}
                                            </div>
                                        )}
                                        {activeSubTab === 'quiz' && (
                                            <QuizView quiz={current.quiz || []} topic={current.topic} onSendQuiz={props.onSendQuiz} />
                                        )}
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

function FlashCard(props) {
    var card = props.card;
    var s1 = React.useState(false); var showPreview = s1[0], setShowPreview = s1[1];

    function handleDragStart(e) {
        e.dataTransfer.setData('application/json', JSON.stringify(card));
        e.dataTransfer.effectAllowed = 'copy';
    }

    return (
        <div className="flashcard" draggable={true} onDragStart={handleDragStart}>
            <div className="flashcard-title">{card.title}</div>
            <div className="flashcard-desc">{card.description}</div>
            <div className="flashcard-actions">
                <span className="flashcard-drag-hint">✋ Drag onto slide</span>
                <button className="flashcard-preview-btn" onClick={function (e) { e.stopPropagation(); setShowPreview(!showPreview); }}>
                    {showPreview ? 'Hide' : '👁 Preview'}
                </button>
            </div>
            {showPreview && (
                <div className="flashcard-embed">
                    {card.embeddable ? (
                        <iframe title={card.title} src={card.url}></iframe>
                    ) : (
                        <p className="empty-hint-sm">Live inline preview isn't available for this one — drag it onto the slide to present it.</p>
                    )}
                </div>
            )}
        </div>
    );
}

function QuizView(props) {
    var quiz = props.quiz || [];
    var s1 = React.useState({}); var answers = s1[0], setAnswers = s1[1];
    var s2 = React.useState(false); var submitted = s2[0], setSubmitted = s2[1];
    var s3 = React.useState(false); var sent = s3[0], setSent = s3[1];

    if (!quiz.length) return <p className="empty-hint-sm">No quiz generated for this topic yet.</p>;

    function selectAnswer(qIndex, optIndex) {
        if (submitted) return;
        setAnswers(function (prev) { var c = Object.assign({}, prev); c[qIndex] = optIndex; return c; });
    }

    var score = 0;
    if (submitted) quiz.forEach(function (q, i) { if (answers[i] === q.answerIndex) score++; });

    function handleSend() {
        if (props.onSendQuiz) {
            props.onSendQuiz(props.topic, quiz);
            setSent(true);
            setTimeout(function () { setSent(false); }, 2000);
        }
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
                                return <div key={oi} className={cls} onClick={function () { selectAnswer(qi, oi); }}>{opt}</div>;
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
            {props.onSendQuiz && (
                <button className="btn secondary quiz-send-btn" onClick={handleSend}>
                    {sent ? '✅ Sent to students!' : '📤 Send this quiz to students'}
                </button>
            )}
        </div>
    );
}