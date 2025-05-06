function WorkEditor({ work, onClose }) {
    try {
        const [workData, setWorkData] = React.useState({
            title: '',
            description: '',
            imageUrl: '',
            modelUrl: '',
            gallery: ['', '', ''],
            details: '',
            category: '',
            newCategory: ''
        });
        const [categories, setCategories] = React.useState([
            'UI/UX Design',
            'Interior Design',
            '3D Modeling',
            'Product Design',
            'Branding'
        ]);
        const [showNewCategory, setShowNewCategory] = React.useState(false);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState(null);

        React.useEffect(() => {
            if (work) {
                setWorkData({
                    title: work.title || '',
                    description: work.description || '',
                    imageUrl: work.imageUrl || '',
                    modelUrl: work.modelUrl || '',
                    gallery: work.gallery || ['', '', ''],
                    details: work.details || '',
                    category: work.category || '',
                    newCategory: ''
                });
            }
        }, [work]);

        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);

            try {
                if (!workData.title || !workData.description || !workData.details) {
                    throw new Error('Please fill in all required fields');
                }

                const category = showNewCategory ? workData.newCategory : workData.category;
                if (!category) {
                    throw new Error('Please select or create a category');
                }

                if (showNewCategory && !categories.includes(workData.newCategory)) {
                    setCategories([...categories, workData.newCategory]);
                }

                // Filter out empty gallery URLs
                const gallery = workData.gallery.filter(url => url.trim() !== '');

                if (work) {
                    await window.db.updateWork(work.id, {
                        title: workData.title,
                        description: workData.description,
                        imageUrl: workData.imageUrl,
                        modelUrl: workData.modelUrl,
                        gallery,
                        details: workData.details,
                        category
                    });
                } else {
                    await createWork(
                        workData.title,
                        workData.description,
                        workData.imageUrl,
                        workData.modelUrl,
                        gallery,
                        workData.details,
                        category
                    );
                }

                onClose();
            } catch (err) {
                console.error('Error saving work:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const handleChange = (e) => {
            const { name, value } = e.target;
            setWorkData(prev => ({
                ...prev,
                [name]: value
            }));
        };

        const handleGalleryChange = (index, value) => {
            setWorkData(prev => ({
                ...prev,
                gallery: prev.gallery.map((url, i) => i === index ? value : url)
            }));
        };

        const handleImageUpload = (imageUrl) => {
            setWorkData(prev => ({ ...prev, imageUrl }));
        };

        const handleGalleryUpload = (index, imageUrl) => {
            setWorkData(prev => ({
                ...prev,
                gallery: prev.gallery.map((url, i) => i === index ? imageUrl : url)
            }));
        };

        const toggleNewCategory = () => {
            setShowNewCategory(!showNewCategory);
            setWorkData(prev => ({
                ...prev,
                category: '',
                newCategory: ''
            }));
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-name="work-editor">
                <div className="bg-white p-8 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto" data-name="work-editor-modal">
                    <div className="flex justify-between items-center mb-6" data-name="work-editor-header">
                        <h2 className="text-2xl font-bold">{work ? 'Edit Work' : 'Add New Work'}</h2>
                        <button 
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                            data-name="work-editor-close"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" data-name="work-editor-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" data-name="work-editor-form">
                        <div>
                            <label className="block text-sm font-medium mb-2">Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={workData.title}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded"
                                required
                                data-name="work-title-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Description *</label>
                            <textarea
                                name="description"
                                value={workData.description}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded h-32"
                                required
                                data-name="work-description-input"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Main Image *</label>
                            <DragDropUploader onUploadComplete={handleImageUpload} type="image" />
                            {workData.imageUrl && (
                                <div className="mt-2">
                                    <img 
                                        src={workData.imageUrl} 
                                        alt="Preview" 
                                        className="max-h-40 rounded-lg"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">3D Model (GLB format)</label>
                            <DragDropUploader onUploadComplete={(url) => setWorkData(prev => ({ ...prev, modelUrl: url }))} type="model" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Gallery Images</label>
                            {workData.gallery.map((url, index) => (
                                <div key={index} className="mb-4">
                                    <DragDropUploader 
                                        onUploadComplete={(imageUrl) => handleGalleryUpload(index, imageUrl)} 
                                        type="image"
                                    />
                                    {url && (
                                        <div className="mt-2">
                                            <img 
                                                src={url} 
                                                alt={`Gallery ${index + 1}`} 
                                                className="max-h-40 rounded-lg"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Detailed Description *</label>
                            <textarea
                                name="details"
                                value={workData.details}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded h-48"
                                required
                                data-name="work-details-input"
                            ></textarea>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium">Category *</label>
                                <button
                                    type="button"
                                    onClick={toggleNewCategory}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                    data-name="toggle-category-button"
                                >
                                    {showNewCategory ? 'Select Existing Category' : 'Create New Category'}
                                </button>
                            </div>
                            
                            {showNewCategory ? (
                                <input
                                    type="text"
                                    name="newCategory"
                                    value={workData.newCategory}
                                    onChange={handleChange}
                                    placeholder="Enter new category name"
                                    className="w-full p-3 border border-gray-300 rounded"
                                    required
                                    data-name="new-category-input"
                                />
                            ) : (
                                <select
                                    name="category"
                                    value={workData.category}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded"
                                    required
                                    data-name="category-select"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {workData.modelUrl && (
                            <div className="mt-4" data-name="work-model-preview">
                                <label className="block text-sm font-medium mb-2">Model Preview</label>
                                <ModelViewer modelUrl={workData.modelUrl} />
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="button w-full"
                            disabled={loading}
                            data-name="work-submit-button"
                        >
                            {loading ? 'Saving...' : (work ? 'Update Work' : 'Create Work')}
                        </button>
                    </form>
                </div>
            </div>
        );
    } catch (error) {
        console.error('WorkEditor component error:', error);
        reportError(error);
        return null;
    }
}
