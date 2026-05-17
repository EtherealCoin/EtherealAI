function loadHeader() {
    const container = document.getElementById('header-container');

    if (!container) {
        return;
    }

    fetch('/components/header.html')
        .then(response => response.text())
        .then(data => {
            container.innerHTML = data;
        });
}

window.initializeHeader = function initializeHeader() {
    return { init: loadHeader };
};

loadHeader();
