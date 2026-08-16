function ChatWidget(props) {
    var s1 = React.useState([]); var messages = s1[0], setMessages = s1[1];
    var s2 = React.useState(''); var q = s2[0], setQ = s2[1];
    var s3 = React.useState(false); var loading = s3[0], setLoading = s3[1];

    function ask() {
        if (!q.trim()) return;
        var question = q;
        setMessages(function (m) { return m.concat([{ role: 'student', text: question }]); });
        setQ('');
        setLoading(true);
        apiFetch('/chat/' + props.sessionId + '/ask', 'POST', { question: question })
            .then(function (res) { setMessages(function (m) { return m.concat([{ role: 'ai', text: res.answer }]); }); })
            .catch(function (e) { setMessages(function (m) { return m.concat([{ role: 'ai', text: 'Error: ' + e.message }]); }); })
            .finally(function () { setLoading(false); });
    }

    return (
        <div className="chat-widget">
            <div className="chat-messages">
                {messages.map(function (m, i) { return <div key={i} className={'chat-msg ' + m.role}>{m.text}</div>; })}
                {loading && <div className="chat-msg ai">Thinking...</div>}
            </div>
            <div className="chat-input-row">
                <input placeholder="Ask about what was taught in this class..." value={q}
                    onChange={function (e) { setQ(e.target.value); }}
                    onKeyDown={function (e) { if (e.key === 'Enter') ask(); }} />
                <button className="btn" onClick={ask}>Ask</button>
            </div>
        </div>
    );
}