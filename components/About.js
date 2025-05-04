function About() {
    try {
        const [activeSection, setActiveSection] = React.useState('about');

        const sections = {
            about: {
                title: 'ABOUT',
                content: `I'm Domantas Garmus, I'm a Product Designer, Currently residing in the Kaunas Lithuania, though operate globally and I am ready to take on any design challenge...`
            },
            experience: {
                title: 'EXPERIENCE',
                content: 'Product Designer with 5+ years of experience in creating digital products and brand identities. Specialized in UI/UX design, 3D modeling, and product development.'
            },
            education: {
                title: 'EDUCATION',
                content: 'Bachelor of Design - Visual Communication\nMaster of Interactive Design'
            },
            skills: {
                title: 'SKILLS',
                content: 'UI/UX Design\nProduct Design\n3D Modeling\nBrand Identity\nPrototyping'
            }
        };

        return (
            <section id="about" className="about min-h-screen bg-gray-50 py-20 relative overflow-hidden" data-name="about">
                <canvas 
                    id="about-background-canvas" 
                    className="absolute inset-0 w-full h-full opacity-10" 
                    data-name="about-canvas"
                />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-6xl mx-auto">
                        {/* Header Text */}
                        <div className="about text-center mb-16" data-name="about-header">
                            <h2 className="text-5xl md:text-6xl font-bold mb-8 text-gray-900">
                                I'm Domantas Garmus
                            </h2>
                            <p className="about text-xl md:text-2xl text-gray-600">
                                Product Designer, based in Kaunas Lithuania
                            </p>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex flex-wrap justify-center gap-4 mb-16" data-name="about-navigation">
                            {Object.entries(sections).map(([key, section]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveSection(key)}
                                    className={`px-8 py-3 rounded-lg transition-all ${
                                        activeSection === key 
                                            ? 'bg-black text-white shadow-lg transform hover:scale-105' 
                                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                    data-name={`about-nav-${key}`}
                                >
                                    {section.title}
                                </button>
                            ))}
                        </div>

                        {/* Content Section */}
                        <div className="max-w-3xl mx-auto text-center" data-name="about-content">
                            <div className="prose prose-lg text-gray-700 mx-auto">
                                {sections[activeSection].content.split('\n').map((line, index) => (
                                    <p key={index} className="mb-4 text-lg">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Personal Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16" data-name="about-info">
                            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="text-gray-500 mb-2">Email</h4>
                                <p className="text-gray-900">domantas@example.com</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="text-gray-500 mb-2">Phone</h4>
                                <p className="text-gray-900">+(370) 123 456 789</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="text-gray-500 mb-2">Location</h4>
                                <p className="text-gray-900">Kaunas, Lithuania</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="text-gray-500 mb-2">Follow</h4>
                                <div className="flex space-x-4">
                                    <a href="#" className="text-gray-600 hover:text-black transition-colors">
                                        <i className="fab fa-facebook"></i>
                                    </a>
                                    <a href="#" className="text-gray-600 hover:text-black transition-colors">
                                        <i className="fab fa-linkedin"></i>
                                    </a>
                                    <a href="#" className="text-gray-600 hover:text-black transition-colors">
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
        console.error('About component error:', error);
        reportError(error);
        return null;
    }
}
