function AIIcon(props) {
    var size = props.size || 26;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" opacity="0.18" />
            <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="1.8" fill="currentColor" />
            <path d="M12 2.5V5M12 19V21.5M2.5 12H5M19 12H21.5M5.8 5.8L7.4 7.4M16.6 16.6L18.2 18.2M18.2 5.8L16.6 7.4M7.4 16.6L5.8 18.2"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

function ControlsIcon(props) {
    var size = props.size || 24;
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8" cy="6" r="2.2" fill="currentColor" />
            <circle cx="16" cy="12" r="2.2" fill="currentColor" />
            <circle cx="10" cy="18" r="2.2" fill="currentColor" />
        </svg>
    );
}