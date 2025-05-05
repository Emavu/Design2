function BlogPage() {
    const [posts, setPosts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        setError('');
        try {
            const blogPosts = await window.db.getBlogPosts();
            setPosts(blogPosts);
            // After fetching posts, log each imageUrl
            blogPosts.forEach(post => {
                if (post.imageUrl) {
                    console.log('BlogPost imageUrl:', post.imageUrl);
                } else if (post.objectData && post.objectData.imageUrl) {
                    console.log('BlogPost objectData.imageUrl:', post.objectData.imageUrl);
                } else {
                    console.log('BlogPost has no imageUrl:', post);
                }
            });
        } catch (error) {
            setError('Error loading blog posts: ' + error.message);
            console.error('Error loading blog posts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <i className="fas fa-spinner fa-spin text-4xl"></i>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Blog</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map(post => (
                    <div key={post.id} className="border rounded-lg overflow-hidden shadow-lg">
                        {(post.imageUrl || post.image) && (
                            <img
                                src={post.imageUrl || post.image}
                                alt={post.title}
                                className="w-full h-48 object-cover"
                            />
                        )}
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
                            <p className="text-gray-600 mb-4">{post.excerpt}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    {new Date(post.createdAt?.toDate()).toLocaleDateString()}
                                </span>
                                <a
                                    href={`/blog/${post.id}`}
                                    className="text-black hover:text-gray-600"
                                >
                                    Read More
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Make BlogPage component available globally
window.BlogPage = BlogPage;
