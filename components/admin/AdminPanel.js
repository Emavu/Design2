function AdminPanel({ onClose }) {
    try {
        const [activeTab, setActiveTab] = React.useState('blog');
        const [showBlogEditor, setShowBlogEditor] = React.useState(false);
        const [showProductEditor, setShowProductEditor] = React.useState(false);
        const [showWorkEditor, setShowWorkEditor] = React.useState(false);
        const [posts, setPosts] = React.useState([]);
        const [products, setProducts] = React.useState([]);
        const [works, setWorks] = React.useState([]);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
            loadData();
        }, [activeTab]);

        const loadData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'blog') {
                    const fetchedPosts = await getBlogPosts();
                    setPosts(fetchedPosts);
                } else if (activeTab === 'products') {
                    const fetchedProducts = await getProducts();
                    setProducts(fetchedProducts);
                } else if (activeTab === 'works') {
                    const fetchedWorks = await getWorks();
                    setWorks(fetchedWorks);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        const handleDeletePost = async (postId) => {
            try {
                await trickleDeleteObject('blog', postId);
                setPosts(posts.filter(post => post.objectId !== postId));
            } catch (error) {
                console.error('Error deleting post:', error);
            }
        };

        const handleDeleteProduct = async (productId) => {
            try {
                await trickleDeleteObject('product', productId);
                setProducts(products.filter(product => product.objectId !== productId));
            } catch (error) {
                console.error('Error deleting product:', error);
            }
        };

        const handleDeleteWork = async (workId) => {
            try {
                await trickleDeleteObject('work', workId);
                setWorks(works.filter(work => work.objectId !== workId));
            } catch (error) {
                console.error('Error deleting work:', error);
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto" data-name="admin-panel">
                <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg" data-name="admin-panel-modal">
                    <div className="p-6 border-b border-gray-200" data-name="admin-panel-header">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Admin Panel</h2>
                            <button 
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                                data-name="admin-panel-close"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="flex space-x-4" data-name="admin-panel-tabs">
                            <button 
                                className={`px-4 py-2 ${activeTab === 'blog' ? 'border-b-2 border-black' : ''}`}
                                onClick={() => setActiveTab('blog')}
                                data-name="admin-blog-tab"
                            >
                                Blog Posts
                            </button>
                            <button 
                                className={`px-4 py-2 ${activeTab === 'works' ? 'border-b-2 border-black' : ''}`}
                                onClick={() => setActiveTab('works')}
                                data-name="admin-works-tab"
                            >
                                Works
                            </button>
                            <button 
                                className={`px-4 py-2 ${activeTab === 'products' ? 'border-b-2 border-black' : ''}`}
                                onClick={() => setActiveTab('products')}
                                data-name="admin-products-tab"
                            >
                                Products
                            </button>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }} data-name="admin-panel-content">
                        <div className="mb-6">
                            <button 
                                className="button"
                                onClick={() => {
                                    if (activeTab === 'blog') setShowBlogEditor(true);
                                    else if (activeTab === 'products') setShowProductEditor(true);
                                    else if (activeTab === 'works') setShowWorkEditor(true);
                                }}
                                data-name="admin-add-button"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                {activeTab === 'blog' ? 'Add New Post' : 
                                 activeTab === 'products' ? 'Add New Product' : 
                                 'Add New Work'}
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-4" data-name="admin-loading">Loading...</div>
                        ) : activeTab === 'blog' ? (
                            <div className="space-y-4" data-name="admin-blog-list">
                                {posts.map(post => (
                                    <div 
                                        key={post.objectId} 
                                        className="border border-gray-200 p-4 rounded"
                                        data-name={`admin-blog-item-${post.objectId}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold mb-2">{post.objectData.title}</h3>
                                                <p className="text-gray-600">{post.objectData.content.substring(0, 100)}...</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDeletePost(post.objectId)}
                                                className="text-red-500 hover:text-red-700"
                                                data-name={`admin-blog-delete-${post.objectId}`}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'products' ? (
                            <div className="space-y-4" data-name="admin-products-list">
                                {products.map(product => (
                                    <div 
                                        key={product.objectId} 
                                        className="border border-gray-200 p-4 rounded"
                                        data-name={`admin-product-item-${product.objectId}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold mb-2">{product.objectData.name}</h3>
                                                <p className="text-gray-600">{product.objectData.description.substring(0, 100)}...</p>
                                                <p className="text-lg font-bold mt-2">${product.objectData.price}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteProduct(product.objectId)}
                                                className="text-red-500 hover:text-red-700"
                                                data-name={`admin-product-delete-${product.objectId}`}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4" data-name="admin-works-list">
                                {works.map(work => (
                                    <div 
                                        key={work.objectId} 
                                        className="border border-gray-200 p-4 rounded"
                                        data-name={`admin-work-item-${work.objectId}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold mb-2">{work.objectData.title}</h3>
                                                <p className="text-gray-600">{work.objectData.description.substring(0, 100)}...</p>
                                                <p className="text-sm text-gray-500 mt-2">{work.objectData.category}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteWork(work.objectId)}
                                                className="text-red-500 hover:text-red-700"
                                                data-name={`admin-work-delete-${work.objectId}`}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {showBlogEditor && (
                    <BlogEditor onClose={() => {
                        setShowBlogEditor(false);
                        loadData();
                    }} />
                )}

                {showProductEditor && (
                    <ProductEditor onClose={() => {
                        setShowProductEditor(false);
                        loadData();
                    }} />
                )}

                {showWorkEditor && (
                    <WorkEditor onClose={() => {
                        setShowWorkEditor(false);
                        loadData();
                    }} />
                )}
            </div>
        );
    } catch (error) {
        console.error('AdminPanel component error:', error);
        reportError(error);
        return null;
    }
}
