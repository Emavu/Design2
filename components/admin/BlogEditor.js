function BlogEditor({ post, onClose }) {
    const [postData, setPostData] = React.useState({
        title: '',
        content: '',
        excerpt: '',
        imageUrl: '',
        category: '',
        tags: []
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [categories, setCategories] = React.useState([]);
    const [showNewCategory, setShowNewCategory] = React.useState(false);
    const [newCategory, setNewCategory] = React.useState('');

    React.useEffect(() => {
        if (post) {
            setPostData({
                title: post.title || '',
                content: post.content || '',
                excerpt: post.excerpt || '',
                imageUrl: post.imageUrl || '',
                category: post.category || '',
                tags: post.tags || []
            });
        }
        loadCategories();
    }, [post]);

    const loadCategories = async () => {
        try {
            const cats = await window.db.getCategories();
            setCategories(cats);
        } catch (err) {
            console.error('Error loading categories:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!postData.title || !postData.content) {
                throw new Error('Title and content are required');
            }

            // Create post data object
            const postDataToSave = {
                ...postData,
                createdAt: post ? post.createdAt : window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            };

            if (post) {
                await window.db.updateBlogPost(post.id, postDataToSave);
            } else {
                await window.db.createBlogPost(postDataToSave);
            }

            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (imageUrl) => {
        setPostData(prev => ({ ...prev, imageUrl }));
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;

        try {
            const categoryName = newCategory.trim();
            await window.db.addCategory({ name: categoryName });
            await loadCategories(); // Refresh categories list
            setPostData(prev => ({ ...prev, category: categoryName }));
            setNewCategory('');
            setShowNewCategory(false);
        } catch (err) {
            setError('Failed to add category: ' + err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{post ? 'Edit Post' : 'Create New Post'}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={postData.title}
                            onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                            value={postData.content}
                            onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black h-32"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                        <textarea
                            value={postData.excerpt}
                            onChange={(e) => setPostData(prev => ({ ...prev, excerpt: e.target.value }))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black h-20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <div className="flex gap-2">
                            <select
                                value={postData.category}
                                onChange={(e) => setPostData(prev => ({ ...prev, category: e.target.value }))}
                                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowNewCategory(true)}
                                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                <i className="fas fa-plus"></i>
                            </button>
                        </div>
                        {showNewCategory && (
                            <div className="mt-2 flex gap-2">
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="New category name"
                                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                                >
                                    Add
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                        <DragDropUploader onUploadComplete={handleImageUpload} type="image" />
                        {postData.imageUrl && (
                            <div className="mt-2">
                                <img 
                                    src={postData.imageUrl} 
                                    alt="Preview" 
                                    className="max-h-40 rounded-lg"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loading ? (
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                            ) : null}
                            {post ? 'Update Post' : 'Create Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Make BlogEditor component available globally
window.BlogEditor = BlogEditor;
