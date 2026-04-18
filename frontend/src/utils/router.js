class Router {
    constructor() {
        this.routes = {};
        
        // Add initial routes here
        this.setRoute('/', 'home');
        this.setRoute('/login', 'login');
        this.setRoute('/about', 'about');
    }

    setRoute(path, pageId) {
        this.routes[path] = pageId;
    }

    init() {
        window.addEventListener('popstate', () => this.handleRoute());
        document.querySelectorAll('a[href^="/"]').forEach(link => {
            link.addEventListener('click', (e) => this.handleClick(e, link));
        });
        
        // Initialize first route
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        const container = document.getElementById('app-container');
        const route = this.routes[path] || '404';
        
        if (!container) return; // No container found
        
        // Fetch and render the appropriate page
        fetch(`pages/${route}.html`)
            .then(response => response.text())
            .then(html => {
                container.innerHTML = html;
                // Add any hydration logic here
            });
    }
}

export default Router;
