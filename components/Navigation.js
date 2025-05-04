function Navigation({ onNavigate, currentPage, cartItems = [], onCartClick }) {
    try {
        const [isAdmin, setIsAdmin] = React.useState(false);
        const [showAdminPanel, setShowAdminPanel] = React.useState(false);
        const [isScrolled, setIsScrolled] = React.useState(false);

        React.useEffect(() => {
            const handleScroll = () => {
                setIsScrolled(window.scrollY > 50);
            };
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }, []);

        React.useEffect(() => {
            const handleKeyPress = (event) => {
                if (event.ctrlKey && event.shiftKey && event.key === 'A') {
                    setIsAdmin(prev => !prev);
                    if (!isAdmin) {
                        alert('Admin mode activated! You can now access the admin panel.');
                    }
                }
            };

            window.addEventListener('keydown', handleKeyPress);
            return () => window.removeEventListener('keydown', handleKeyPress);
        }, [isAdmin]);

        const totalItems = cartItems ? cartItems.reduce((sum, item) => sum + item.quantity, 0) : 0;

        return (
            <nav className={`fixed top-0 left-0 w-full bg-white z-50 transition-all duration-300 ${
                isScrolled ? 'shadow-md py-2' : 'py-4'
            }`} data-name="navigation">
                <div className="header-block container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div className="logo flex items-center space-x-8" data-name="nav-left">
                            <a 
                                onClick={() => onNavigate('home')} 
                                className="cursor-pointer flex items-center group"
                                data-name="logo-link"
                            >
                                <img 
                                    src="https://raw.githubusercontent.com/Emavu/Design2/5869a85b44237f2f161f6cdfe9dc4cf7f4537c5d/pictures/logo.png"
                                    alt="Logo"
                                    className=" transition-transform duration-300 "
                                    data-name="logo-image"
                                />
                                <span className="ml-2 text-xl font-bold">Portfolio</span>
                            </a>
                            <div className="hidden md:flex space-x-6" data-name="main-nav">
                                <a 
                                    onClick={() => onNavigate('works')} 
                                    className={`nav-link cursor-pointer ${currentPage === 'works' ? 'font-bold' : ''}`}
                                >
                                    Works
                                </a>
                                <a 
                                    onClick={() => onNavigate('blog')} 
                                    className={`nav-link cursor-pointer ${currentPage === 'blog' ? 'font-bold' : ''}`}
                                >
                                    Blog
                                </a>
                                <a 
                                    onClick={() => onNavigate('shop')} 
                                    className={`nav-link cursor-pointer ${currentPage === 'shop' ? 'font-bold' : ''}`}
                                >
                                    Shop
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6" data-name="nav-right">
                            <a 
                                onClick={() => onNavigate('home')} 
                                className="nav-link cursor-pointer"
                            >
                                About
                            </a>
                            <a 
                                onClick={() => onNavigate('home')} 
                                className="nav-link cursor-pointer"
                            >
                                Contact
                            </a>
                            {currentPage === 'shop' && onCartClick && (
                                <button 
                                    onClick={onCartClick}
                                    className="relative p-2"
                                    data-name="cart-button"
                                >
                                    <i className="fas fa-shopping-cart text-xl"></i>
                                    {totalItems > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                            {totalItems}
                                        </span>
                                    )}
                                </button>
                            )}
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
                </div>
                {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
            </nav>
        );
    } catch (error) {
        console.error('Navigation component error:', error);
        reportError(error);
        return null;
    }
}
