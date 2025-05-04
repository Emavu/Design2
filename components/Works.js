function Works({ preview = false, onNavigate }) {
    try {
        const [works, setWorks] = React.useState([]);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
            loadWorks();
        }, []);

        async function loadWorks() {
            try {
                const fetchedWorks = await getWorks();
                setWorks(preview ? fetchedWorks.slice(0, 3) : fetchedWorks);
                setLoading(false);
            } catch (error) {
                console.error('Error loading works:', error);
                setLoading(false);
            }
        }

        if (loading) {
            return (
                <section id="works" className="py-20 bg-gray-50" data-name="works">
                    <div className="container mx-auto px-4 text-center">
                        <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                    </div>
                </section>
            );
        }

        return (
            <section id="works" className="py-20 bg-gray-50" data-name="works">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold mb-12 text-center">
                        {preview ? "Featured Works" : "My Works"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-name="works-grid">
                        {works.map(work => (
                            <div 
                                key={work.objectId} 
                                className="card bg-white cursor-pointer transform hover:scale-105 transition-all duration-300"
                                onClick={() => onNavigate && onNavigate('works', work)}
                                data-name={`work-item-${work.objectId}`}
                            >
                                <img 
                                    src={work.objectData.imageUrl} 
                                    alt={work.objectData.title} 
                                    className="w-full h-48 object-cover mb-4"
                                    data-name={`work-image-${work.objectId}`}
                                />
                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-2">{work.objectData.title}</h3>
                                    <p className="text-gray-600">{work.objectData.description}</p>
                                    <div className="mt-4">
                                        <span className="text-sm text-gray-500">{work.objectData.category}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {preview && works.length > 0 && (
                        <div className="text-center mt-12">
                            <button 
                                onClick={() => onNavigate('works')}
                                className="button"
                                data-name="view-all-works"
                            >
                                View All Works
                            </button>
                        </div>
                    )}
                </div>
            </section>
        );
    } catch (error) {
        console.error('Works component error:', error);
        reportError(error);
        return null;
    }
}
