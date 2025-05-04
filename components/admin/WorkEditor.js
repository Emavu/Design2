function WorkEditor({ onClose }) {
    try {
        const [work, setWork] = React.useState({
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

        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);

            try {
                if (!work.title || !work.description || !work.details) {
                    throw new Error('Please fill in all required fields');
                }

                const category = showNewCategory ? work.newCategory : work.category;
                if (!category) {
                    throw new Error('Please select or create a category');
                }

                if (showNewCategory && !categories.includes(work.newCategory)) {
                    setCategories([...categories, work.newCategory]);
                }

                // Filter out empty gallery URLs
                const gallery = work.gallery.filter(url => url.trim() !== '');

                await createWork(
                    work.title,
                    work.description,
                    work.imageUrl,
                    work.modelUrl,
                    gallery,
                    work.details,
                    category
                );

                setWork({
                    title: '',
                    description: '',
                    imageUrl: '',
                    modelUrl: '',
                    gallery: ['', '', ''],
                    details: '',
                    category: '',
                    newCategory: ''
                });
                onClose();
            } catch (err) {
                console.error('Error creating work:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const handleChange = (e) => {
            const { name, value } = e.target;
            setWork(prev => ({
                ...prev,
                [name]: value
            }));
        };

        const handleGalleryChange = (index, value) => {
            setWork(prev => ({
                ...prev,
                gallery: prev.gallery.map((url, i) => i === index ? value : url)
            }));
        };

        const toggleNewCategory = () => {
            setShowNewCategory(!showNewCategory);
            setWork(prev => ({
                ...prev,
                category: '',
                newCategory: ''
            }));
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-name="work-editor">
                <div className="bg-white p-8 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto" data-name="work-editor-modal">
                    <div className="flex justify-between items-center mb-6" data-name="work-editor-header">
                        <h2 className="text-2xl font-bold">Add New Work</h2>
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
                                value={work.title}
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
                                value={work.description}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded h-32"
                                required
                                data-name="work-description-input"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Main Image URL *</label>
                            <input
                                type="url"
                                name="imageUrl"
                                value={work.imageUrl}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded"
                                required
                                data-name="work-image-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">3D Model URL (GLB format)</label>
                            <input
                                type="url"
                                name="modelUrl"
                                value={work.modelUrl}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded"
                                data-name="work-model-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Gallery Images</label>
                            {work.gallery.map((url, index) => (
                                <input
                                    key={index}
                                    type="url"
                                    value={url}
                                    onChange={(e) => handleGalleryChange(index, e.target.value)}
                                    placeholder={`Gallery image URL ${index + 1}`}
                                    className="w-full p-3 border border-gray-300 rounded mb-2"
                                    data-name={`work-gallery-input-${index}`}
                                />
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Detailed Description *</label>
                            <textarea
                                name="details"
                                value={work.details}
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
                                    value={work.newCategory}
                                    onChange={handleChange}
                                    placeholder="Enter new category name"
                                    className="w-full p-3 border border-gray-300 rounded"
                                    required
                                    data-name="new-category-input"
                                />
                            ) : (
                                <select
                                    name="category"
                                    value={work.category}
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

                        {work.modelUrl && (
                            <div className="mt-4" data-name="work-model-preview">
                                <label className="block text-sm font-medium mb-2">Model Preview</label>
                                <ModelViewer modelUrl={work.modelUrl} />
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="button w-full"
                            disabled={loading}
                            data-name="work-submit-button"
                        >
                            {loading ? 'Creating...' : 'Create Work'}
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
