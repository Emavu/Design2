function Navigation({ onNavigate, currentPage, cartItems = [], onCartClick }) {
        const [isAdmin, setIsAdmin] = React.useState(false);
        const [showAdminPanel, setShowAdminPanel] = React.useState(false);
        const [isScrolled, setIsScrolled] = React.useState(false);
    const [user, setUser] = React.useState(null);
    const [showLogin, setShowLogin] = React.useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

        React.useEffect(() => {
            const handleScroll = () => {
                setIsScrolled(window.scrollY > 50);
            };
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }, []);

        React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) {
                setIsMobileMenuOpen(false);
                }
            };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        const unsubscribe = window.firebase.auth.onAuthStateChanged((user) => {
            setUser(user);
            if (user) {
                setShowLogin(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = () => {
        setShowLogin(true);
    };

    const handleLogout = async () => {
        try {
            await window.firebase.auth.signOut();
            setIsAdmin(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleNavigation = (page) => {
        onNavigate(page);
        setIsMobileMenuOpen(false);
    };

    const totalItems = cartItems ? cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

        return (
        <>
            <nav className={`fixed top-0 left-0 w-full bg-white/30 backdrop-blur-md z-50 transition-all duration-300 ${
                isScrolled ? 'shadow-md py-2' : 'py-4'
            }`} data-name="navigation">
                <div className="w-full px-4">
                    <div className="flex items-center justify-between max-w-[90vw] mx-auto relative">
                        <div className="logo flex items-center" data-name="nav-left">
                            <a 
                                onClick={() => handleNavigation('home')} 
                                className="cursor-pointer flex items-center group"
                                data-name="logo-link"
                            >
                                <img 
                                    src="https://raw.githubusercontent.com/Emavu/Design2/5869a85b44237f2f161f6cdfe9dc4cf7f4537c5d/pictures/logo.png"
                                    alt="Logo"
                                    className="transition-transform duration-300"
                                    data-name="logo-image"
                                />
                                <span className="ml-2 text-2xl font-bold text-black drop-shadow-lg">Portfolio</span>
                            </a>
                        </div>
                        <div className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2 space-x-8" data-name="main-nav">
                                <a 
                                onClick={() => handleNavigation('works')} 
                                className={`nav-link cursor-pointer text-black drop-shadow-lg text-lg ${
                                    currentPage === 'works' ? 'font-bold' : ''
                                }`}
                                >
                                    Works
                                </a>
                                <a 
                                onClick={() => handleNavigation('blog')} 
                                className={`nav-link cursor-pointer text-black drop-shadow-lg text-lg ${
                                    currentPage === 'blog' ? 'font-bold' : ''
                                }`}
                                >
                                    Blog
                                </a>
                                <a 
                                onClick={() => handleNavigation('shop')} 
                                className={`nav-link cursor-pointer text-black drop-shadow-lg text-lg ${
                                    currentPage === 'shop' ? 'font-bold' : ''
                                }`}
                                >
                                    Shop
                                </a>
                            <a 
                                onClick={() => handleNavigation('#about')} 
                                className="nav-link cursor-pointer text-black drop-shadow-lg text-lg"
                            >
                                About
                            </a>
                            <a 
                                onClick={() => handleNavigation('#home')} 
                                className="nav-link cursor-pointer text-black drop-shadow-lg text-lg"
                            >
                                Contact
                            </a>
                        </div>
                        <div className="flex items-center space-x-6" data-name="nav-right">
                            <div className="md:hidden flex items-center space-x-4">
                                <button 
                                    onClick={onCartClick}
                                    className="relative p-2 text-black drop-shadow-lg"
                                    data-name="cart-button"
                                >
                                    <i className="fas fa-shopping-cart text-xl"></i>
                                    {totalItems > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                            {totalItems}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={toggleMobileMenu}
                                    className="text-black drop-shadow-lg hover:text-gray-700 focus:outline-none"
                                    data-name="mobile-menu-button"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {isMobileMenuOpen ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                            <div className="hidden md:flex items-center space-x-6">
                                <button 
                                    onClick={onCartClick}
                                    className="relative p-2 text-black drop-shadow-lg"
                                    data-name="cart-button"
                                >
                                    <i className="fas fa-shopping-cart text-xl"></i>
                                    {totalItems > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                            {totalItems}
                                        </span>
                                    )}
                                </button>
                                {user ? (
                                    <>
                                <button 
                                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                                            className="button bg-white/20 hover:bg-white/30 text-black drop-shadow-lg text-lg"
                                    data-name="admin-button"
                                        >
                                            Admin Panel
                                        </button>
                                        <button 
                                            onClick={handleLogout}
                                            className="nav-link cursor-pointer text-black drop-shadow-lg text-lg"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleLogin}
                                        className="text-black drop-shadow-lg hover:text-gray-700 px-3 py-2 rounded-md text-lg font-medium"
                                    >
                                        Login
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            <div 
                className={`md:hidden fixed top-[4.5rem] right-0 w-64 bg-white/20 backdrop-blur-md shadow-lg z-40 transform transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
                data-name="mobile-menu"
            >
                <div className="p-4">
                    <div className="flex flex-col space-y-3">
                        <a 
                            onClick={() => handleNavigation('works')} 
                            className={`text-lg px-4 py-2 transition-colors text-black drop-shadow-lg ${
                                currentPage === 'works' ? 'bg-white/30 font-bold' : 'hover:bg-white/20'
                            }`}
                        >
                            Works
                        </a>
                        <a 
                            onClick={() => handleNavigation('blog')} 
                            className={`text-lg px-4 py-2 transition-colors text-black drop-shadow-lg ${
                                currentPage === 'blog' ? 'bg-white/30 font-bold' : 'hover:bg-white/20'
                            }`}
                        >
                            Blog
                        </a>
                        <a 
                            onClick={() => handleNavigation('shop')} 
                            className={`text-lg px-4 py-2 transition-colors text-black drop-shadow-lg ${
                                currentPage === 'shop' ? 'bg-white/30 font-bold' : 'hover:bg-white/20'
                            }`}
                        >
                            Shop
                        </a>
                        <a 
                            onClick={() => handleNavigation('home')} 
                            className="text-lg px-4 py-2 transition-colors text-black drop-shadow-lg hover:bg-white/20"
                        >
                            About
                        </a>
                        <a 
                            onClick={() => handleNavigation('home')} 
                            className="text-lg px-4 py-2 transition-colors text-black drop-shadow-lg hover:bg-white/20"
                        >
                            Contact
                        </a>
                        {user ? (
                            <>
                                <button 
                                    onClick={() => {
                                        setShowAdminPanel(!showAdminPanel);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="text-lg px-4 py-2 transition-colors text-black drop-shadow-lg hover:bg-white/20 text-left"
                                >
                                    Admin Panel
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="text-lg px-4 py-2 transition-colors text-black drop-shadow-lg hover:bg-white/20 text-left"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    handleLogin();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="text-lg px-4 py-2 transition-colors text-black drop-shadow-lg hover:bg-white/20 text-left"
                            >
                                Login
                                </button>
                            )}
                        </div>
                </div>
            </div>
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
                    onClick={toggleMobileMenu}
                    data-name="mobile-menu-overlay"
                />
            )}
            {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
            {showLogin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <button
                            onClick={() => setShowLogin(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        <Login onLogin={() => {
                            setShowLogin(false);
                            setUser(window.firebase.auth.currentUser);
                        }} />
                    </div>
                </div>
            )}
        </>
    );
}

const style = document.createElement('style');
style.textContent = `
    .nav-link {
        position: relative;
        padding: 0.5rem 0;
        transition: all 0.3s ease;
    }

    .nav-link::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background-color: currentColor;
        transition: width 0.3s ease;
    }

    .nav-link:hover::after {
        width: 100%;
    }

    @media (max-width: 768px) {
        .nav-link {
            padding: 0.5rem 0;
    }
}
`;
document.head.appendChild(style);
