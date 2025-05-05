function AdminPanel({ onClose }) {
    const [activeTab, setActiveTab] = React.useState('blog');
    const [blogPosts, setBlogPosts] = React.useState([]);
    const [products, setProducts] = React.useState([]);
    const [works, setWorks] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [showBlogEditor, setShowBlogEditor] = React.useState(false);
    const [showProductEditor, setShowProductEditor] = React.useState(false);
    const [showWorkEditor, setShowWorkEditor] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState(null);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            switch (activeTab) {
                case 'blog':
                    const posts = await window.db.getBlogPosts();
                    setBlogPosts(posts);
                    break;
                case 'products':
                    const prods = await window.db.getProducts();
                    setProducts(prods);
                    break;
                case 'works':
                    const workItems = await window.db.getWorks();
                    setWorks(workItems);
                    break;
            }
        } catch (error) {
            setError('Error loading data: ' + error.message);
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, [activeTab]);

    const handleDelete = async (type, id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        
        setLoading(true);
        setError('');
        try {
            switch (type) {
                case 'blog':
                    await window.db.deleteBlogPost(id);
                    setBlogPosts(blogPosts.filter(post => post.id !== id));
                    break;
                case 'product':
                    await window.db.deleteProduct(id);
                    setProducts(products.filter(product => product.id !== id));
                    break;
                case 'work':
                    await window.db.deleteWork(id);
                    setWorks(works.filter(work => work.id !== id));
                    break;
            }
        } catch (error) {
            setError('Error deleting item: ' + error.message);
            console.error('Error deleting item:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Admin Panel</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}

                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => setActiveTab('blog')}
                        className={`px-4 py-2 rounded ${activeTab === 'blog' ? 'bg-black text-white' : 'bg-gray-200'}`}
                    >
                        Blog Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-4 py-2 rounded ${activeTab === 'products' ? 'bg-black text-white' : 'bg-gray-200'}`}
                    >
                        Products
                    </button>
                    <button
                        onClick={() => setActiveTab('works')}
                        className={`px-4 py-2 rounded ${activeTab === 'works' ? 'bg-black text-white' : 'bg-gray-200'}`}
                    >
                        Works
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <i className="fas fa-spinner fa-spin text-4xl"></i>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeTab === 'blog' && (
                            <>
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={() => {
                                            setEditingItem(null);
                                            setShowBlogEditor(true);
                                        }}
                                        className="bg-black text-white px-4 py-2 rounded"
                                    >
                                        Add New Post
                                    </button>
                                </div>
                                <div className="grid gap-4">
                                    {blogPosts.map(post => (
                                        <div key={post.id} className="border p-4 rounded-lg flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold">{post.title}</h3>
                                                <p className="text-gray-600">{post.excerpt}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(post);
                                                        setShowBlogEditor(true);
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('blog', post.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === 'products' && (
                            <>
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={() => {
                                            setEditingItem(null);
                                            setShowProductEditor(true);
                                        }}
                                        className="bg-black text-white px-4 py-2 rounded"
                                    >
                                        Add New Product
                                    </button>
                                </div>
                                <div className="grid gap-4">
                                    {products.map(product => (
                                        <div key={product.id} className="border p-4 rounded-lg flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold">{product.name}</h3>
                                                <p className="text-gray-600">${product.price}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(product);
                                                        setShowProductEditor(true);
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('product', product.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === 'works' && (
                            <>
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={() => {
                                            setEditingItem(null);
                                            setShowWorkEditor(true);
                                        }}
                                        className="bg-black text-white px-4 py-2 rounded"
                                    >
                                        Add New Work
                                    </button>
                                </div>
                                <div className="grid gap-4">
                                    {works.map(work => (
                                        <div key={work.id} className="border p-4 rounded-lg flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold">{work.title}</h3>
                                                <p className="text-gray-600">{work.description}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(work);
                                                        setShowWorkEditor(true);
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('work', work.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {showBlogEditor && (
                    <BlogEditor 
                        post={editingItem}
                        onClose={() => {
                            setShowBlogEditor(false);
                            setEditingItem(null);
                            loadData();
                        }} 
                    />
                )}

                {showProductEditor && (
                    <ProductEditor 
                        product={editingItem}
                        onClose={() => {
                            setShowProductEditor(false);
                            setEditingItem(null);
                            loadData();
                        }} 
                    />
                )}

                {showWorkEditor && (
                    <WorkEditor 
                        work={editingItem}
                        onClose={() => {
                            setShowWorkEditor(false);
                            setEditingItem(null);
                            loadData();
                        }} 
                    />
                )}
            </div>
        </div>
    );
}

// Make AdminPanel component available globally
window.AdminPanel = AdminPanel;
