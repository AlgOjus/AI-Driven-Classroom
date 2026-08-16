function PresentMode(props) {
    var classroom = props.classroom;
    var material = props.material;
    var s1 = React.useState(null); var session = s1[0], setSession = s1[1];
    var s2 = React.useState(false); var listening = s2[0], setListening = s2[1];
    var s3 = React.useState([]); var matchHistory = s3[0], setMatchHistory = s3[1];
    var s4 = React.useState(false); var ending = s4[0], setEnding = s4[1];
    var s5 = React.useState(false); var hasNewMatch = s5[0], setHasNewMatch = s5[1];

    var recognitionRef = React.useRef(null);
    var bufferRef = React.useRef('');
    var intervalRef = React.useRef(null);
    var listeningRef = React.useRef(false);
    var sessionRef = React.useRef(null);

    React.useEffect(function () {
        apiFetch('/session/start', 'POST', { classroomId: classroom.id, materialId: material.id })
            .then(function (s) { setSession(s); sessionRef.current = s; })
            .catch(function (e) { alert('Could not start session: ' + e.message); });
        return function () { stopListening(); };
    }, []);

    function flushBuffer() {
        var s = sessionRef.current;
        if (!s) return;
        var text = bufferRef.current.trim();
        if (!text) return;
        bufferRef.current = '';
        apiFetch('/session/' + s.id + '/match', 'POST', { transcriptChunk: text })
            .then(function (res) {
                if (res.matched) {
                    setMatchHistory(function (prev) {
                        var filtered = prev.filter(function (p) { return p.topic !== res.topic; });
                        var updated = [{
                            topic: res.topic, score: res.score,
                            suggestions: res.suggestions, quiz: res.quiz,
                            timestamp: Date.now()
                        }].concat(filtered);
                        return updated.slice(0, 6);
                    });
                    setHasNewMatch(true);
                }
            })
            .catch(function (e) { console.log('match error', e.message); });
    }

    function startListening() {
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { alert('Speech recognition not supported in this browser. Use Chrome.'); return; }
        var recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = function (event) {
            for (var i = event.resultIndex; i < event.results.length; i++) {
                bufferRef.current += ' ' + event.results[i][0].transcript;
            }
        };
        recognition.onerror = function (e) { console.log('speech error', e.error); };
        recognition.onend = function () {
            if (listeningRef.current) { try { recognition.start(); } catch (e) { } }
        };
        recognition.start();
        recognitionRef.current = recognition;
        listeningRef.current = true;
        setListening(true);
        intervalRef.current = setInterval(flushBuffer, 12000);
    }

    function stopListening() {
        listeningRef.current = false;
        if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) { } }
        if (intervalRef.current) clearInterval(intervalRef.current);
        setListening(false);
    }

    function endClass() {
        var s = sessionRef.current;
        if (!s) return;
        stopListening();
        setEnding(true);
        apiFetch('/session/' + s.id + '/end', 'POST')
            .then(function () { alert('Class ended! AI Summary has been posted to the classroom stream.'); props.onExit(); })
            .catch(function (e) { alert('Error ending class: ' + e.message); })
            .finally(function () { setEnding(false); });
    }

    return (
        <div className="present-wrap">
            <div className="present-main">
                <div className="toolbar">
                    <button className={"btn" + (listening ? " btn-recording" : "")} onClick={listening ? stopListening : startListening}>
                        {listening ? '🔴 Stop AI Listening' : '🎙️ Start AI Listening'}
                    </button>
                    <button className="btn danger" onClick={endClass} disabled={ending}>
                        {ending ? 'Ending...' : 'End Class & Post Summary'}
                    </button>
                    <button className="btn secondary" onClick={props.onExit}>Exit</button>
                </div>
                <div className="pdf-frame-wrap">
                    <iframe title="pdf" src={material.fileUrl} className="pdf-frame"></iframe>
                </div>
            </div>

            <AIPanel
                matchHistory={matchHistory}
                hasNewMatch={hasNewMatch}
                onOpened={function () { setHasNewMatch(false); }}
            />
        </div>
    );
}