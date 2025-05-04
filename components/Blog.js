function Blog({ preview = false, onNavigate }) {
    try {
        const [posts, setPosts] = React.useState([]);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
            loadBlogPosts();
        }, []);

        async function loadBlogPosts() {
            try {
                const fetchedPosts = await getBlogPosts();
                setPosts(preview ? fetchedPosts.slice(0, 3) : fetchedPosts);
                setLoading(false);
            } catch (error) {
                console.error('Error loading blog posts:', error);
                setLoading(false);
            }
        }

        if (loading) {
            return (
                <section id="blog" className="py-20 bg-gray-50" data-name="blog">
                    <div className="container mx-auto px-4 text-center">
                        <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                    </div>
                </section>
            );
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
                                onClick={() => onNavigate && onNavigate('blog')}
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
                                    <h3 className="text-xl font-bold mb-2">{post.objectData.title}</h3>
                                    <p className="text-gray-600 mb-4">
                                        {post.objectData.content.substring(0, 150)}...
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
