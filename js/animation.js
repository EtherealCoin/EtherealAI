export function animateContainer() {
    const container = document.querySelector('.container');
    
    function scaleUp() {
        container.style.transform = 'scale(1.2)';
    }
    
    function scaleDown() {
        setTimeout(() => {
            container.style.transform = 'scale(1)';
        }, 500);
    }
    
    return {
        init: function() {
            const button = document.getElementById('animationButton');
            if (button) {
                button.addEventListener('click', () => {
                    scaleUp();
                    scaleDown();
                });
            }
        }
    };
}
