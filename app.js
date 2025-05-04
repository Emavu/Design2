function App() {
    try {
        const [currentPage, setCurrentPage] = React.useState('home');
        const [cartItems, setCartItems] = React.useState([]);
        const [isCartOpen, setIsCartOpen] = React.useState(false);

        const renderPage = () => {
            switch(currentPage) {
                case 'blog':
                    return (
                        <div className="min-h-screen" data-name="blog-container">
                            <Navigation onNavigate={setCurrentPage} currentPage="blog" />
                            <div className="pt-20">
                                <BlogPage onNavigate={setCurrentPage} />
                            </div>
                        </div>
                    );
                case 'works':
                    return (
                        <div className="min-h-screen" data-name="works-container">
                            <Navigation onNavigate={setCurrentPage} currentPage="works" />
                            <div className="pt-20">
                                <WorksPage onNavigate={setCurrentPage} />
                            </div>
                        </div>
                    );
                case 'shop':
                    return (
                        <div className="min-h-screen" data-name="shop-container">
                            <Navigation 
                                onNavigate={setCurrentPage} 
                                currentPage="shop"
                                cartItems={cartItems}
                                onCartClick={() => setIsCartOpen(true)}
                            />
                            <div className="pt-20">
                                <ShopPage 
                                    onNavigate={setCurrentPage}
                                    cartItems={cartItems}
                                    setCartItems={setCartItems}
                                    isCartOpen={isCartOpen}
                                    setIsCartOpen={setIsCartOpen}
                                />
                            </div>
                        </div>
                    );
                default:
                    return (
                        <div className="min-h-screen" data-name="home-container">
                            <Navigation onNavigate={setCurrentPage} currentPage="home" />
                            <Hero />
                            <ServicesLine />
                            <Works preview={true} />
                            <About />
                            <Blog preview={true} />
                            <Shop preview={true} />
                            <Contact />
                            <Footer />
                        </div>
                    );
            }
        };

        return (
            <div className="app-container" data-name="app-container">
                {renderPage()}
            </div>
        );
    } catch (error) {
        console.error('App component error:', error);
        reportError(error);
        return null;
    }
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
