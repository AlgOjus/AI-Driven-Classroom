function apiFetch(path, method, body) {
    var token = localStorage.getItem('token');
    var headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    var opts = { method: method || 'GET', headers: headers };
    if (body) {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    return fetch('/api' + path, opts).then(function (res) {
        return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.error || 'Request failed');
            return data;
        });
    });
}

function uploadMaterial(classroomId, formData) {
    var token = localStorage.getItem('token');
    return fetch('/api/material/upload/' + classroomId, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
    }).then(function (res) {
        return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            return data;
        });
    });
}

function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { }
    document.body.removeChild(ta);
    return Promise.resolve();
}