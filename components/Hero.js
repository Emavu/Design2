function Hero() {
    React.useEffect(() => {
        try {
            const heading = document.querySelector('[data-name="hero-heading"]');
            if (heading) {
                typeWriter(heading, "Welcome to My Creative Portfolio");
            }

            const cleanup = initBackground3D();
            return () => {
                if (cleanup) cleanup();
            };
        } catch (error) {
            console.error('Hero component error:', error);
            reportError(error);
        }
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center bg-transparent pt-20" data-name="hero">
            <canvas 
                id="background-canvas" 
                className="absolute inset-0 w-full h-full pointer-events-none" 
                style={{ zIndex: 0 }}
                data-name="hero-canvas"
            />
            <div className="container mx-auto px-4 text-center relative" style={{ zIndex: 1 }}>
                <h1 
                    className="text-6xl font-bold mb-6" 
                    data-name="hero-heading"
                ></h1>
                <p className="text-xl mb-8 fade-in" data-name="hero-description">
                    Explore my works, read my blog, and shop unique products
                </p>
                <a 
                    href="#works" 
                    className="button text-lg"
                    data-name="hero-cta"
                >
                    View My Works
                </a>
            </div>
        </section>
    );
}

// Make Hero component available globally
window.Hero = Hero;
