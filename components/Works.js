function Works({ preview = false, onNavigate }) {
    try {
        const [works, setWorks] = React.useState([]);
        const [loading, setLoading] = React.useState(true);
        const [selectedWork, setSelectedWork] = React.useState(null);

        React.useEffect(() => {
            loadWorks();
        }, []);

        async function loadWorks() {
            try {
                const fetchedWorks = await getWorks();
                // Normalize: flatten objectData if it exists
                const normalizedWorks = fetchedWorks.map(work =>
                    work.objectData
                        ? {
                            id: work.objectId,
                            ...work.objectData
                          }
                        : work
                );
                setWorks(preview ? normalizedWorks.slice(0, 3) : normalizedWorks);
                setLoading(false);
            } catch (error) {
                console.error('Error loading works:', error);
                setLoading(false);
            }
        }

        const handleWorkClick = (work) => {
            console.log('Selected work:', work); // Debug log
            setSelectedWork(work);
        };

        if (loading) {
            return (
                <section id="works" className="py-20 bg-gray-50" data-name="works">
                    <div className="container mx-auto px-4 text-center">
                        <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                    </div>
                </section>
            );
        }

        if (selectedWork) {
            console.log('Rendering WorksPostDetail with work:', selectedWork); // Debug log
            return window.WorksPostDetail ? (
                <window.WorksPostDetail work={selectedWork} onBack={() => setSelectedWork(null)} />
            ) : null;
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
                                key={work.id || work.objectId} 
                                className="card bg-white cursor-pointer transform hover:scale-105 transition-all duration-300"
                                onClick={() => handleWorkClick(work)}
                                data-name={`work-item-${work.id || work.objectId}`}
                            >
                                {work.image && (
                                    <img 
                                        src={work.image} 
                                        alt={work.title} 
                                        className="w-full h-48 object-cover mb-4"
                                        data-name={`work-image-${work.id || work.objectId}`}
                                    />
                                )}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-2">{work.title}</h3>
                                    <p className="text-gray-600">{work.description}</p>
                                    <div className="mt-4">
                                        <span className="text-sm text-gray-500">{work.category}</span>
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
