function Contact() {
    try {
        const [formData, setFormData] = React.useState({
            email: '',
            message: ''
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            // Handle form submission
            console.log('Form submitted:', formData);
        };

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        };

        return (
            <section id="contact" className="min-h-screen bg-gray-50 py-20" data-name="contact">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-5xl font-bold mb-16 text-center text-gray-900">Write me now</h2>

                        <form onSubmit={handleSubmit} className="mb-20" data-name="contact-form">
                            <div className="mb-8">
                                <label className="block text-lg mb-2 text-gray-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Your email address"
                                    className="w-full p-4 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    required
                                    data-name="email-input"
                                />
                            </div>

                            <div className="mb-8">
                                <label className="block text-lg mb-2 text-gray-700">Input your message</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Describe your project"
                                    className="w-full p-4 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all h-40"
                                    required
                                    data-name="message-input"
                                ></textarea>
                            </div>

                            <div className="text-center">
                                <button 
                                    type="submit"
                                    className="bg-black text-white px-12 py-3 rounded-lg hover:bg-gray-800 transform hover:scale-105 transition-all"
                                    data-name="submit-button"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>

                        <div className="text-center mb-12">
                            <h3 className="text-4xl font-bold mb-8 text-gray-900">OR</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-name="contact-info">
                            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all">
                                <h4 className="text-gray-500 mb-2">Phone</h4>
                                <p className="text-xl text-gray-900">+(2) 871 382 023</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all">
                                <h4 className="text-gray-500 mb-2">Email</h4>
                                <p className="text-xl text-gray-900">ryanwhite@yahoo.com</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all">
                                <h4 className="text-gray-500 mb-2">Follow</h4>
                                <div className="flex space-x-6">
                                    <a href="#" className="text-2xl text-gray-600 hover:text-black transition-colors">
                                        <i className="fab fa-facebook"></i>
                                    </a>
                                    <a href="#" className="text-2xl text-gray-600 hover:text-black transition-colors">
                                        <i className="fab fa-linkedin"></i>
                                    </a>
                                    <a href="#" className="text-2xl text-gray-600 hover:text-black transition-colors">
                                        <i className="fab fa-instagram"></i>
                                    </a>
                                </div>
                            </div>
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
