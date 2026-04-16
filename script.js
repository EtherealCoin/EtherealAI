document.getElementById('animationButton').addEventListener('click', function() {
    const container = document.querySelector('.container');
    container.style.transform = 'scale(1.2)';
    setTimeout(() => {
        container.style.transform = 'scale(1)';
    }, 500);
});
