function BlogPage({ onNavigate }) {
    try {
        const [posts, setPosts] = React.useState([]);
        const [loading, setLoading] = React.useState(true);
        const [searchTerm, setSearchTerm] = React.useState('');
        const [filteredPosts, setFilteredPosts] = React.useState([]);
        const [selectedPost, setSelectedPost] = React.useState(null);

        React.useEffect(() => {
            loadBlogPosts();
        }, []);

        React.useEffect(() => {
            filterPosts();
        }, [searchTerm, posts]);

        async function loadBlogPosts() {
            try {
                const fetchedPosts = await getBlogPosts();
                setPosts(fetchedPosts);
                setFilteredPosts(fetchedPosts);
                setLoading(false);
            } catch (error) {
                console.error('Error loading blog posts:', error);
                setLoading(false);
            }
        }

        function filterPosts() {
            const filtered = posts.filter(post => 
                post.objectData.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.objectData.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredPosts(filtered);
        }

        // If a post is selected, show the post detail view
        if (selectedPost) {
            return <BlogPostDetail post={selectedPost} onBack={() => setSelectedPost(null)} />;
        }

        return (
            <div className="min-h-screen bg-gray-50" data-name="blog-page">
                <div className="pt-24 pb-16">
                    <div className="container mx-auto px-4">
                        <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
                        
                        <div className="mb-8" data-name="blog-search">
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
                                data-name="blog-search-input"
                            />
                        </div>

                        {loading ? (
                            <div className="text-center py-8">Loading posts...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-name="blog-grid">
                                {filteredPosts.map(post => (
                                    <article 
                                        key={post.objectId} 
                                        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300"
                                        onClick={() => setSelectedPost(post)}
                                        data-name={`blog-post-${post.objectId}`}
                                    >
                                        {post.objectData.imageUrl && (
                                            <img 
                                                src={post.objectData.imageUrl} 
                                                alt={post.objectData.title}
                                                className="w-full h-48 object-cover"
                                                data-name={`blog-image-${post.objectId}`}
                                            />
                                        )}
                                        <div className="p-6">
                                            <h2 className="text-xl font-bold mb-2">{post.objectData.title}</h2>
                                            <p className="text-gray-600 mb-4">
                                                {post.objectData.content.substring(0, 150)}...
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-500">
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedPost(post);
                                                    }}
                                                    className="text-black hover:text-gray-600 transition-colors"
                                                >
                                                    Read more →
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

                        {filteredPosts.length === 0 && !loading && (
                            <div className="text-center py-8 text-gray-500">
                                No posts found matching your search.
                            </div>
                        )}
                    </div>
                </div>

                <Footer />
            </div>
        );
    } catch (error) {
        console.error('BlogPage component error:', error);
        reportError(error);
        return null;
    }
}
