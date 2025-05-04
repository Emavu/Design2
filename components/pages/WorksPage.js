function WorksPage({ onNavigate }) {
    try {
        const [works, setWorks] = React.useState([]);
        const [searchTerm, setSearchTerm] = React.useState('');
        const [selectedCategory, setSelectedCategory] = React.useState('all');
        const [loading, setLoading] = React.useState(true);
        const [selectedWork, setSelectedWork] = React.useState(null);

        const categories = [
            { id: 'all', name: 'All Works' },
            { id: 'ui-ux', name: 'UI/UX Design' },
            { id: 'interior', name: 'Interior Design' },
            { id: '3d', name: '3D Modeling' },
            { id: 'product', name: 'Product Design' }
        ];

        React.useEffect(() => {
            loadWorks();
        }, []);

        const loadWorks = async () => {
            setLoading(true);
            try {
                const fetchedWorks = await getWorks();
                setWorks(fetchedWorks);
                setLoading(false);
            } catch (error) {
                console.error('Error loading works:', error);
                setLoading(false);
            }
        };

        const filteredWorks = works.filter(work => {
            const matchesSearch = 
                work.objectData.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                work.objectData.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || work.objectData.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        const handleWorkClick = (work) => {
            setSelectedWork(work);
        };

        const handleClose = () => {
            setSelectedWork(null);
        };

        const navigateWork = (direction) => {
            if (!selectedWork) return;
            
            const currentIndex = works.findIndex(w => w.objectId === selectedWork.objectId);
            let newIndex;
            
            if (direction === 'next') {
                newIndex = currentIndex === works.length - 1 ? 0 : currentIndex + 1;
            } else {
                newIndex = currentIndex === 0 ? works.length - 1 : currentIndex - 1;
            }
            
            setSelectedWork(works[newIndex]);
        };

        return (
            <div className="min-h-screen bg-gray-50" data-name="works-page">
                <div className="pt-24 pb-16">
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto">
                            {/* Search and Categories */}
                            <div className="mb-12 space-y-6" data-name="works-filters">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search works..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full max-w-xl px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                        data-name="works-search"
                                    />
                                    <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                </div>

                                <div className="flex flex-wrap gap-4" data-name="category-filters">
                                    {categories.map(category => (
                                        <button
                                            key={category.id}
                                            onClick={() => setSelectedCategory(category.id)}
                                            className={`px-6 py-2 rounded-full transition-all transform hover:scale-105 ${
                                                selectedCategory === category.id
                                                    ? 'bg-black text-white shadow-lg'
                                                    : 'bg-white hover:bg-gray-100 border border-gray-200'
                                            }`}
                                            data-name={`category-${category.id}`}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Works Grid */}
                            {loading ? (
                                <div className="text-center py-12">
                                    <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-name="works-grid">
                                    {filteredWorks.map(work => (
                                        <div 
                                            key={work.objectId}
                                            className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                                            onClick={() => handleWorkClick(work)}
                                            data-name={`work-item-${work.objectId}`}
                                        >
                                            <div className="relative overflow-hidden h-48">
                                                <img 
                                                    src={work.objectData.imageUrl}
                                                    alt={work.objectData.title}
                                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-xl font-bold mb-2">{work.objectData.title}</h3>
                                                <p className="text-gray-600 mb-4">{work.objectData.description}</p>
                                                <span className="inline-block px-3 py-1 bg-gray-100 text-sm rounded-full">
                                                    {work.objectData.category}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {filteredWorks.length === 0 && !loading && (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 text-xl mb-4">
                                        <i className="fas fa-search text-3xl mb-4"></i>
                                        <p>No works found matching your criteria.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedCategory('all');
                                        }}
                                        className="text-black underline hover:text-gray-600"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Work Detail Modal */}
                {selectedWork && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto" data-name="work-detail-modal">
                        <div className="relative bg-white w-full max-w-6xl m-4 rounded-lg shadow-xl" data-name="work-detail-content">
                            <button 
                                onClick={handleClose}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl z-10"
                                data-name="work-detail-close"
                            >
                                <i className="fas fa-times"></i>
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                                <div className="space-y-8">
                                    <h2 className="text-3xl font-bold">{selectedWork.objectData.title}</h2>
                                    <p className="text-gray-600">{selectedWork.objectData.details}</p>
                                    
                                    <div className="h-[400px] bg-gray-100 rounded-lg overflow-hidden" data-name="model-viewer-container">
                                        <ModelViewer modelUrl={selectedWork.objectData.modelUrl} />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-4" data-name="work-gallery">
                                        {selectedWork.objectData.gallery.map((image, index) => (
                                            <div 
                                                key={index} 
                                                className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden"
                                            >
                                                <img 
                                                    src={image} 
                                                    alt={`Gallery ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Arrows */}
                            <div className="absolute top-1/2 transform -translate-y-1/2 w-full flex justify-between px-4">
                                <button 
                                    onClick={() => navigateWork('prev')}
                                    className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                                    data-name="work-nav-prev"
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <button 
                                    onClick={() => navigateWork('next')}
                                    className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
                                    data-name="work-nav-next"
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <Footer />
            </div>
        );
    } catch (error) {
        console.error('WorksPage component error:', error);
        reportError(error);
        return null;
    }
}
