function BlogPostDetail({ post, onBack }) {
    try {
        const [relatedPosts, setRelatedPosts] = React.useState([]);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
            loadRelatedPosts();
        }, [post.objectId]);

        async function loadRelatedPosts() {
            try {
                const posts = await getBlogPosts();
                const related = posts
                    .filter(p => p.objectId !== post.objectId)
                    .slice(0, 3);
                setRelatedPosts(related);
                setLoading(false);
            } catch (error) {
                console.error('Error loading related posts:', error);
                setLoading(false);
            }
        }

        return (
            <div className="min-h-screen bg-gray-50" data-name="blog-post-detail">
                <div className="pt-24 pb-16">
                    <div className="container mx-auto px-4">
                        <button 
                            onClick={onBack}
                            className="mb-8 flex items-center text-gray-600 hover:text-black transition-colors"
                            data-name="back-button"
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Blog
                        </button>

                        <article className="max-w-4xl mx-auto" data-name="blog-post-content">
                            {post.objectData.imageUrl && (
                                <div className="mb-8 rounded-lg overflow-hidden">
                                    <img 
                                        src={post.objectData.imageUrl}
                                        alt={post.objectData.title}
                                        className="w-full h-[400px] object-cover"
                                        data-name="post-header-image"
                                    />
                                </div>
                            )}

                            <header className="mb-8">
                                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                    {post.objectData.title}
                                </h1>
                                <div className="flex items-center text-gray-500">
                                    <span className="mr-4">
                                        <i className="far fa-calendar mr-2"></i>
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </span>
                                    <span>
                                        <i className="far fa-clock mr-2"></i>
                                        {Math.ceil(post.objectData.content.split(' ').length / 200)} min read
                                    </span>
                                </div>
                            </header>

                            <div className="prose prose-lg max-w-none">
                                {post.objectData.content.split('\n').map((paragraph, index) => (
                                    <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>

                            {/* Social Share */}
                            <div className="border-t border-b border-gray-200 py-8 my-8">
                                <h3 className="text-lg font-bold mb-4">Share this post</h3>
                                <div className="flex space-x-4">
                                    <button className="text-gray-600 hover:text-black transition-colors">
                                        <i className="fab fa-twitter text-xl"></i>
                                    </button>
                                    <button className="text-gray-600 hover:text-black transition-colors">
                                        <i className="fab fa-facebook text-xl"></i>
                                    </button>
                                    <button className="text-gray-600 hover:text-black transition-colors">
                                        <i className="fab fa-linkedin text-xl"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Related Posts */}
                            {!loading && relatedPosts.length > 0 && (
                                <div className="mt-16" data-name="related-posts">
                                    <h2 className="text-2xl font-bold mb-8">Related Posts</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {relatedPosts.map(relatedPost => (
                                            <div 
                                                key={relatedPost.objectId}
                                                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300"
                                                onClick={() => {
                                                    window.scrollTo(0, 0);
                                                    onBack();
                                                    setTimeout(() => {
                                                        // This will trigger a re-render with the new post
                                                        window.location.hash = `#post-${relatedPost.objectId}`;
                                                    }, 100);
                                                }}
                                                data-name={`related-post-${relatedPost.objectId}`}
                                            >
                                                {relatedPost.objectData.imageUrl && (
                                                    <img 
                                                        src={relatedPost.objectData.imageUrl}
                                                        alt={relatedPost.objectData.title}
                                                        className="w-full h-40 object-cover"
                                                    />
                                                )}
                                                <div className="p-4">
                                                    <h3 className="font-bold mb-2">
                                                        {relatedPost.objectData.title}
                                                    </h3>
                                                    <p className="text-gray-600 text-sm">
                                                        {relatedPost.objectData.content.substring(0, 100)}...
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </article>
                    </div>
                </div>

                <Footer />
            </div>
        );
    } catch (error) {
        console.error('BlogPostDetail component error:', error);
        reportError(error);
        return null;
    }
}
