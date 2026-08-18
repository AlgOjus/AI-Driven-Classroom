function BackgroundTextureSwitcher() {
    var s1 = React.useState(function () {
        return localStorage.getItem('bgTexture') || 'none';
    });
    var texture = s1[0], setTexture = s1[1];

    React.useEffect(function () {
        document.documentElement.setAttribute('data-bgtexture', texture);
        localStorage.setItem('bgTexture', texture);
    }, [texture]);

    return (
        <select className="theme-switcher" value={texture} onChange={function (e) { setTexture(e.target.value); }} title="Background Texture">
            <option value="none">🎨 No Texture</option>
            <option value="dots">⚪ Dots</option>
            <option value="grid">▦ Grid</option>
            <option value="diagonal">↗ Diagonal Lines</option>
            <option value="chat">💬 Chat Bubbles</option>
        </select>
    );
}