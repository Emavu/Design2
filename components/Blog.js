function Blog() {
    try {
        const [posts, setPosts] = React.useState([]);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
            loadBlogPosts();
        }, []);

        async function loadBlogPosts() {
            try {
                const fetchedPosts = await getBlogPosts();
                setPosts(fetchedPosts);
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
                        Loading blog posts...
                    </div>
                </section>
            );
        }

        return (
            <section id="blog" className="py-20 bg-gray-50" data-name="blog">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold mb-12 text-center" data-name="blog-heading">
                        Blog Posts
                    </h2>
                    <div className="blog-grid" data-name="blog-grid">
                        {posts.map(post => (
                            <article 
                                key={post.objectId} 
                                className="card bg-white"
                                data-name={`blog-post-${post.objectId}`}
                            >
                                {post.objectData.imageUrl && (
                                    <img 
                                        src={post.objectData.imageUrl} 
                                        alt={post.objectData.title} 
                                        className="w-full h-48 object-cover mb-4"
                                        data-name={`blog-image-${post.objectId}`}
                                    />
                                )}
                                <h3 className="text-xl font-bold mb-2" data-name={`blog-title-${post.objectId}`}>
                                    {post.objectData.title}
                                </h3>
                                <p className="text-gray-600 mb-4" data-name={`blog-excerpt-${post.objectId}`}>
                                    {post.objectData.content.substring(0, 150)}...
                                </p>
                                <div className="text-sm text-gray-500" data-name={`blog-date-${post.objectId}`}>
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        );
    } catch (error) {
        console.error('Blog component error:', error);
        reportError(error);
        return null;
    }
}
