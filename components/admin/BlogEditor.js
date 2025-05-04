function BlogEditor({ onClose }) {
    try {
        const [post, setPost] = React.useState({
            title: '',
            content: '',
            imageUrl: '',
            category: '',
            newCategory: ''
        });
        const [categories, setCategories] = React.useState([
            'Technology',
            'Design',
            'Business',
            'Lifestyle',
            'Tutorial'
        ]);
        const [showNewCategory, setShowNewCategory] = React.useState(false);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState(null);

        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);

            try {
                if (!post.title || !post.content) {
                    throw new Error('Please fill in all required fields');
                }

                const category = showNewCategory ? post.newCategory : post.category;
                if (!category) {
                    throw new Error('Please select or create a category');
                }

                if (showNewCategory && !categories.includes(post.newCategory)) {
                    setCategories([...categories, post.newCategory]);
                }

                await createBlogPost(
                    post.title,
                    post.content,
                    post.imageUrl,
                    category
                );

                setPost({
                    title: '',
                    content: '',
                    imageUrl: '',
                    category: '',
                    newCategory: ''
                });
                onClose();
            } catch (err) {
                console.error('Error creating blog post:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const handleChange = (e) => {
            const { name, value } = e.target;
            setPost(prev => ({
                ...prev,
                [name]: value
            }));
        };

        const toggleNewCategory = () => {
            setShowNewCategory(!showNewCategory);
            setPost(prev => ({
                ...prev,
                category: '',
                newCategory: ''
            }));
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-name="blog-editor">
                <div className="bg-white p-8 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto" data-name="blog-editor-modal">
                    <div className="flex justify-between items-center mb-6" data-name="blog-editor-header">
                        <h2 className="text-2xl font-bold">Create New Blog Post</h2>
                        <button 
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                            data-name="blog-editor-close"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" data-name="blog-editor-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" data-name="blog-editor-form">
                        <div>
                            <label className="block text-sm font-medium mb-2">Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={post.title}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded"
                                required
                                data-name="blog-title-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Content *</label>
                            <textarea
                                name="content"
                                value={post.content}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded h-64"
                                required
                                data-name="blog-content-input"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Image URL</label>
                            <input
                                type="url"
                                name="imageUrl"
                                value={post.imageUrl}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded"
                                data-name="blog-image-input"
                            />
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
                                    value={post.newCategory}
                                    onChange={handleChange}
                                    placeholder="Enter new category name"
                                    className="w-full p-3 border border-gray-300 rounded"
                                    required
                                    data-name="new-category-input"
                                />
                            ) : (
                                <select
                                    name="category"
                                    value={post.category}
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

                        <button 
                            type="submit"
                            className="button w-full"
                            disabled={loading}
                            data-name="blog-submit-button"
                        >
                            {loading ? 'Creating...' : 'Create Post'}
                        </button>
                    </form>
                </div>
            </div>
        );
    } catch (error) {
        console.error('BlogEditor component error:', error);
        reportError(error);
        return null;
    }
}
