function Navigation() {
    try {
        const [isAdmin, setIsAdmin] = React.useState(false);
        const [showAdminPanel, setShowAdminPanel] = React.useState(false);

        return (
            <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-30" data-name="navigation">
                <div className="container mx-auto px-4 navigation flex justify-between items-center">
                   <a href="#" className="text-2xl font-bold" data-name="logo">
                   <img src="pictures/logo.png" alt="Logo" style={{ height: '40px' }} />

                   </a>
                  
                    <div className="flex items-center space-x-6" data-name="nav-links">
                        <a href="#works" className="nav-link" data-name="works-link">Works</a>
                        <a href="#about" className="nav-link" data-name="about-link">About</a>
                        <a href="#blog" className="nav-link" data-name="blog-link">Blog</a>
                        <a href="#shop" className="nav-link" data-name="shop-link">Shop</a>
                        <a href="#contact" className="nav-link" data-name="contact-link">Contact</a>
                        {isAdmin && (
                            <button 
                                onClick={() => setShowAdminPanel(!showAdminPanel)}
                                className="button"
                                data-name="admin-button"
                            >
                                Admin Panel
                            </button>
                        )}
                    </div>
                </div>
            </nav>
        );
    } catch (error) {
        console.error('Navigation component error:', error);
        reportError(error);
        return null;
    }
}
export default Navigation;
