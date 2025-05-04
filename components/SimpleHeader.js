function SimpleHeader({ onNavigate }) {
    try {
        return (
            <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50" data-name="simple-header">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <a 
                        onClick={() => onNavigate('home')} 
                        className="text-2xl font-bold cursor-pointer" 
                        data-name="logo"
                    >
                        Portfolio
                    </a>
                    <div className="flex items-center space-x-6" data-name="nav-links">
                        <a href="#about" className="nav-link">About</a>
                        <a href="#contact" className="nav-link">Contact</a>
                    </div>
                </div>
            </nav>
        );
    } catch (error) {
        console.error('SimpleHeader component error:', error);
        reportError(error);
        return null;
    }
}
