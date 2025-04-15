function About() {
    try {
        return (
            <section id="about" className="py-20 bg-white" data-name="about">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-4xl font-bold mb-8" data-name="about-heading">
                            About Me
                        </h2>
                        <img 
                            src="https://source.unsplash.com/random/150x150?portrait" 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full mx-auto mb-8 object-cover"
                            data-name="about-image"
                        />
                        <p className="text-xl mb-6" data-name="about-description">
                            I'm a creative professional passionate about design, development, and digital art. 
                            With years of experience in the field, I strive to create meaningful and impactful projects.
                        </p>
                        <div className="flex justify-center space-x-4" data-name="about-social">
                            <a href="#" className="text-2xl" data-name="social-github">
                                <i className="fab fa-github"></i>
                            </a>
                            <a href="#" className="text-2xl" data-name="social-linkedin">
                                <i className="fab fa-linkedin"></i>
                            </a>
                            <a href="#" className="text-2xl" data-name="social-twitter">
                                <i className="fab fa-twitter"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        );
    } catch (error) {
        console.error('About component error:', error);
        reportError(error);
        return null;
    }
}
