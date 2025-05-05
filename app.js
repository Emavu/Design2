function App() {
    try {
        const [currentPage, setCurrentPage] = React.useState('home');
        const [cartItems, setCartItems] = React.useState([]);
        const [isCartOpen, setIsCartOpen] = React.useState(false);

        const handleNavigate = (page) => {
            setCurrentPage(page);
            window.location.hash = `#${page}`;
        };

        const renderPage = () => {
            switch(currentPage) {
                case 'blog':
                    return (
                        <div className="min-h-screen bg-white" data-name="blog-container">
                            <Navigation onNavigate={handleNavigate} currentPage="blog" />
                            <div className="pt-20">
                                <BlogPage onNavigate={handleNavigate} />
                            </div>
                        </div>
                    );
                case 'works':
                    return (
                        <div className="min-h-screen bg-white" data-name="works-container">
                            <Navigation onNavigate={handleNavigate} currentPage="works" />
                            <div className="pt-20">
                                <WorksPage onNavigate={handleNavigate} />
                            </div>
                        </div>
                    );
                case 'shop':
                    return (
                        <div className="min-h-screen bg-white" data-name="shop-container">
                            <Navigation 
                                onNavigate={handleNavigate} 
                                currentPage="shop"
                                cartItems={cartItems}
                                onCartClick={() => setIsCartOpen(true)}
                            />
                            <div className="pt-20">
                                <ShopPage 
                                    onNavigate={handleNavigate}
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
                        <div className="min-h-screen bg-white" data-name="home-container">
                            <Navigation onNavigate={handleNavigate} currentPage="home" />
                            <Hero />
                            <ServicesLine />
                
                            <Works preview={true} onNavigate={handleNavigate} />
                            <ColorfulCanvas 
                                id="works-about-canvas" 
                                position={{ x: -100, y: -1, z: -3 }}
                                scale={120}
                            />
                            <About />
                            <ColorfulCanvas 
                                id="about-blog-canvas" 
                                position={{ x: -200, y: 200, z: -3 }}
                                scale={140}
                            />
                            <Blog preview={true} onNavigate={handleNavigate} />
                            <ColorfulCanvas 
                                id="blog-shop-canvas" 
                                position={{ x: 200, y: 0, z: -4 }}
                                scale={160}
                            />
                            <Shop preview={true} onNavigate={handleNavigate} />
                            <ColorfulCanvas 
                                id="shop-contact-canvas" 
                                position={{ x: 70, y: -200, z:0}}
                                scale={180}
                            />
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
