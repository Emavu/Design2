function WorksPage() {
    const [works, setWorks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        loadWorks();
    }, []);

    const loadWorks = async () => {
        setLoading(true);
        setError('');
        try {
            const workItems = await window.db.getWorks();
            setWorks(workItems);
        } catch (error) {
            setError('Error loading works: ' + error.message);
            console.error('Error loading works:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <i className="fas fa-spinner fa-spin text-4xl"></i>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Works</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {works.map(work => (
                    <div key={work.id} className="border rounded-lg overflow-hidden shadow-lg">
                        {work.image && (
                            <img
                                src={work.image}
                                alt={work.title}
                                className="w-full h-48 object-cover"
                            />
                        )}
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-2">{work.title}</h2>
                            <p className="text-gray-600 mb-4">{work.description}</p>
                            {work.category && (
                                <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                                    {work.category}
                                </span>
                            )}
                            <div className="flex justify-between items-center mt-4">
                                <span className="text-sm text-gray-500">
                                    {new Date(work.createdAt?.toDate()).toLocaleDateString()}
                                </span>
                                {work.link && (
                                    <a
                                        href={work.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-black hover:text-gray-600"
                                    >
                                        View Project
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Make WorksPage component available globally
window.WorksPage = WorksPage;
