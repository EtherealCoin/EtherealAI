function loadFooter() {
    const container = document.getElementById('footer-container');

    if (!container) {
        return;
    }

    fetch('/components/footer.html')
        .then(response => response.text())
        .then(data => {
            container.innerHTML = data;
        });
}

window.initializeFooter = function initializeFooter() {
    return { init: loadFooter };
};

loadFooter();
