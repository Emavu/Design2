function App() {
    try {
        return (
            <div className="min-h-screen" data-name="app">
                <Navigation />
                <Hero />
                <ServicesLine />
                <Works />
                <About />
                <Blog />
                <Shop />
                <Contact />
                <Footer />
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
