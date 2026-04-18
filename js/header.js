export function initializeHeader() {
    // Header specific initialization code goes here
    console.log('Header initialized');
    
    return {
        init: function() {
            fetch('components/header.html')
                .then(response => response.text())
                .then(data => {
                    document.getElementById('header-container').innerHTML = data;
                });
        }
    };
}
