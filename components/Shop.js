function Shop({ preview = false, onNavigate }) {
    try {
        const [products, setProducts] = React.useState([]);
        const [loading, setLoading] = React.useState(true);

        React.useEffect(() => {
            loadProducts();
        }, []);

        async function loadProducts() {
            try {
                const fetchedProducts = await getProducts();
                // Normalize: flatten objectData if it exists
                const normalizedProducts = fetchedProducts.map(product =>
                    product.objectData
                        ? {
                            id: product.objectId,
                            ...product.objectData
                          }
                        : product
                );
                setProducts(preview ? normalizedProducts.slice(0, 3) : normalizedProducts);
                setLoading(false);
            } catch (error) {
                console.error('Error loading products:', error);
                setLoading(false);
            }
        }

        if (loading) {
            return (
                <section id="shop" className="py-20 " data-name="shop">
                    <div className="container mx-auto px-4 text-center">
                        <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                    </div>
                </section>
            );
        }

        return (
            <section id="shop" className="py-20 " data-name="shop">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold mb-12 text-center">
                        {preview ? "Featured Products" : "Shop"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-name="product-grid">
                        {products.map(product => (
                            <div 
                                key={product.id || product.objectId} 
                                className="card bg-white cursor-pointer"
                                onClick={() => onNavigate && onNavigate('shop')}
                                data-name={`product-${product.id || product.objectId}`}
                            >
                                {product.image && (
                                    <img 
                                        src={product.image} 
                                        alt={product.name} 
                                        className="w-full h-48 object-cover"
                                        data-name={`product-image-${product.id || product.objectId}`}
                                    />
                                )}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                                    <p className="text-gray-600 mb-4">{product.description}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-bold">${product.price}</span>
                                        <button 
                                            className="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle quick add to cart
                                            }}
                                        >
                                            Quick Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {preview && products.length > 0 && (
                        <div className="text-center mt-12">
                            <button 
                                onClick={() => onNavigate && onNavigate('shop')}
                                className="button"
                                data-name="view-all-products"
                            >
                                View All Products
                            </button>
                        </div>
                    )}
                </div>
            </section>
        );
    } catch (error) {
        console.error('Shop component error:', error);
        reportError(error);
        return null;
    }
}
