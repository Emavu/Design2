function Contact() {
    try {
        return (
            <section id="contact" className="py-20 bg-gray-50" data-name="contact">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold mb-12 text-center" data-name="contact-heading">
                        Contact Me
                    </h2>
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8" data-name="contact-content">
                        <div className="space-y-6" data-name="contact-info">
                            <div className="flex items-center space-x-4" data-name="contact-email">
                                <i className="fas fa-envelope text-2xl"></i>
                                <div>
                                    <h3 className="text-lg font-bold">Email</h3>
                                    <p className="text-gray-600">contact@example.com</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4" data-name="contact-phone">
                                <i className="fas fa-phone text-2xl"></i>
                                <div>
                                    <h3 className="text-lg font-bold">Phone</h3>
                                    <p className="text-gray-600">+1 234 567 890</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4" data-name="contact-location">
                                <i className="fas fa-map-marker-alt text-2xl"></i>
                                <div>
                                    <h3 className="text-lg font-bold">Location</h3>
                                    <p className="text-gray-600">123 Creative Street, Design City</p>
                                </div>
                            </div>
                            <div className="flex space-x-4 pt-4" data-name="contact-social">
                                <a href="#" className="text-2xl hover:text-gray-700" data-name="contact-twitter">
                                    <i className="fab fa-twitter"></i>
                                </a>
                                <a href="#" className="text-2xl hover:text-gray-700" data-name="contact-instagram">
                                    <i className="fab fa-instagram"></i>
                                </a>
                                <a href="#" className="text-2xl hover:text-gray-700" data-name="contact-linkedin">
                                    <i className="fab fa-linkedin"></i>
                                </a>
                            </div>
                        </div>
                        <div className="relative h-[400px] bg-gray-100 rounded-lg overflow-hidden" data-name="contact-map">
                            <img 
                                src="https://source.unsplash.com/random/800x600?map" 
                                alt="Location Map"
                                className="w-full h-full object-cover"
                                data-name="contact-map-image"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                        </div>
                    </div>
                </div>
            </section>
        );
    } catch (error) {
        console.error('Contact component error:', error);
        reportError(error);
        return null;
    }
}
