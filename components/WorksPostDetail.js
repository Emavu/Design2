function WorksPostDetail({ work, onBack }) {
    console.log('WorksPostDetail received work:', work); // Debug log

    // Normalize work data if needed
    const normalizedWork = work.objectData
        ? { ...work, ...work.objectData }
        : work;

    console.log('Normalized work:', normalizedWork); // Debug log

    return (
        <div className="min-h-screen bg-gray-50" data-name="work-post-detail">
            <div className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <button 
                        onClick={onBack}
                        className="mb-8 flex items-center text-gray-600 hover:text-black transition-colors"
                        data-name="back-button"
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Back to Works
                    </button>

                    <article className="max-w-4xl mx-auto" data-name="work-post-content">
                        {normalizedWork.image && (
                            <div className="mb-8 rounded-lg overflow-hidden">
                                <img 
                                    src={normalizedWork.image}
                                    alt={normalizedWork.title}
                                    className="w-full h-[400px] object-cover"
                                    data-name="work-header-image"
                                />
                            </div>
                        )}

                        <header className="mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                {normalizedWork.title}
                            </h1>
                            <div className="flex items-center text-gray-500">
                                <span className="mr-4">
                                    <i className="far fa-calendar mr-2"></i>
                                    {normalizedWork.createdAt ? new Date(normalizedWork.createdAt.toDate()).toLocaleDateString() : ''}
                                </span>
                                {normalizedWork.category && (
                                    <span>
                                        <i className="fas fa-tag mr-2"></i>
                                        {normalizedWork.category}
                                    </span>
                                )}
                            </div>
                        </header>

                        <div className="prose prose-lg max-w-none mb-8">
                            <p className="mb-4 text-gray-700 leading-relaxed">
                                {normalizedWork.description}
                            </p>
                        </div>

                        {/* 3D Model Viewer */}
                        {normalizedWork.modelUrl && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-4">3D Model</h2>
                                <div className="h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                                    <window.ModelViewer modelUrl={normalizedWork.modelUrl} />
                                </div>
                            </div>
                        )}

                        {/* Project Link */}
                        {normalizedWork.link && (
                            <div className="mt-8">
                                <a
                                    href={normalizedWork.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    View Project
                                </a>
                            </div>
                        )}
                    </article>
                </div>
            </div>
        </div>
    );
}

// Make WorksPostDetail component available globally
window.WorksPostDetail = WorksPostDetail; 