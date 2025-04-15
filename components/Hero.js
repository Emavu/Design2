function Hero() {
    try {
        React.useEffect(() => {
            const heading = document.querySelector('[data-name="hero-heading"]');
            if (heading) {
                typeWriter(heading, "Welcome to My Creative Portfolio");
            }
        }, []);

        return (
            <section className="min-h-screen flex items-center justify-center bg-white pt-20" data-name="hero">
                <div className="container mx-auto px-4 text-center">
                    <h1 
                        className="text-5xl font-bold mb-5" 
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
    } catch (error) {
        console.error('Hero component error:', error);
        reportError(error);
        return null;
    }
}
