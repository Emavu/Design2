function Blog({ preview = false, onNavigate }) {
    try {
        const [posts, setPosts] = React.useState([]);
        const [loading, setLoading] = React.useState(true);
        const [selectedPost, setSelectedPost] = React.useState(null);

        React.useEffect(() => {
            loadBlogPosts();
        }, []);

        async function loadBlogPosts() {
            try {
                const blogPosts = await window.db.getBlogPosts();
                setPosts(preview ? blogPosts.slice(0, 3) : blogPosts);
                setLoading(false);
            } catch (error) {
                console.error('Error loading blog posts:', error);
                setLoading(false);
            }
        }

        const handlePostClick = (post) => {
            console.log('Selected post:', post); // Debug log
            setSelectedPost(post);
        };

        if (loading) {
            return (
                <section id="blog" className="py-20 bg-gray-50" data-name="blog">
                    <div className="container mx-auto px-4 text-center">
                        <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                    </div>
                </section>
            );
        }

        if (selectedPost) {
            console.log('Rendering BlogPostDetail with post:', selectedPost); // Debug log
            return window.BlogPostDetail ? (
                <window.BlogPostDetail post={selectedPost} onBack={() => setSelectedPost(null)} />
            ) : null;
        }

        return (
            <section id="blog" className="py-20 bg-gray-50" data-name="blog">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold mb-12 text-center">
                        {preview ? "Latest Posts" : "Blog Posts"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-name="blog-grid">
                        {posts.map(post => (
                            <article 
                                key={post.objectId} 
                                className="card bg-white cursor-pointer"
                                onClick={() => handlePostClick(post)}
                                data-name={`blog-post-${post.objectId}`}
                            >
                                {post.imageUrl && (
                                    <img 
                                        src={post.imageUrl} 
                                        alt={post.title} 
                                        className="w-full h-48 object-cover"
                                        data-name={`blog-image-${post.objectId}`}
                                    />
                                )}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                                    <p className="text-gray-600 mb-4">
                                        {post.content.substring(0, 150)}...
                                    </p>
                                    <div className="text-sm text-gray-500">
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                    {preview && posts.length > 0 && (
                        <div className="text-center mt-12">
                            <button 
                                onClick={() => onNavigate('blog')}
                                className="button"
                                data-name="view-all-posts"
                            >
                                View All Posts
                            </button>
                        </div>
                    )}
                </div>
            </section>
        );
    } catch (error) {
        console.error('Blog component error:', error);
        reportError(error);
        return null;
    }
}
