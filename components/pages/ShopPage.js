function ShopPage({ onNavigate, cartItems, setCartItems, isCartOpen, setIsCartOpen }) {
    const [products, setProducts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState('all');
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const [selectedColor, setSelectedColor] = React.useState('default');
    const [quantity, setQuantity] = React.useState(1);

    const categories = [
        { id: 'all', name: 'All Products' },
        { id: 'interior', name: 'Interior Products' },
        { id: 'gadgets', name: 'Gadgets' },
        { id: 'furniture', name: 'Furniture' }
    ];

    const colors = [
        { id: 'default', name: 'Default', hex: '#000000' },
        { id: 'white', name: 'White', hex: '#FFFFFF' },
        { id: 'natural', name: 'Natural', hex: '#D2B48C' },
        { id: 'gray', name: 'Gray', hex: '#808080' }
    ];

    React.useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        setError('');
        try {
            const productItems = await window.db.getProducts();
            setProducts(productItems);
        } catch (error) {
            setError('Error loading products: ' + error.message);
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const addToCart = (product) => {
        const existingItem = cartItems.find(item => item.id === product.id);
        if (existingItem) {
            setCartItems(cartItems.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCartItems([...cartItems, { ...product, quantity: 1 }]);
        }
        setIsCartOpen(true);
    };

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setSelectedColor('default');
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
        <div className="min-h-screen bg-gray-50" data-name="shop-page">
            <div className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        {/* Search and Categories */}
                        <div className="mb-12 space-y-6" data-name="shop-filters">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full max-w-xl px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    data-name="shop-search"
                                />
                                <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                            
                            <div className="flex flex-wrap gap-4" data-name="category-filters">
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`px-6 py-2 rounded-full transition-all transform hover:scale-105 ${
                                            selectedCategory === category.id
                                                ? 'bg-black text-white shadow-lg'
                                                : 'bg-white hover:bg-gray-100 border border-gray-200'
                                        }`}
                                        data-name={`category-${category.id}`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-name="products-grid">
                            {filteredProducts.map(product => (
                                <div 
                                    key={product.id}
                                    className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                                    onClick={() => handleProductClick(product)}
                                    data-name={`product-${product.id}`}
                                >
                                    <div className="relative overflow-hidden h-48">
                                        <img 
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="p-6">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                                            <p className="text-gray-600">{product.description}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-2xl font-bold">${product.price}</span>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addToCart(product);
                                                }}
                                                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transform hover:scale-105 transition-all"
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredProducts.length === 0 && !loading && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-xl mb-4">
                                    <i className="fas fa-search text-3xl mb-4"></i>
                                    <p>No products found matching your criteria.</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedCategory('all');
                                    }}
                                    className="text-black underline hover:text-gray-600"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto" data-name="product-detail-modal">
                    <div className="relative bg-white w-full max-w-6xl m-4 rounded-lg shadow-xl" data-name="product-detail-content">
                        <button 
                            onClick={() => setSelectedProduct(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl z-10"
                            data-name="product-detail-close"
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                            <div className="space-y-8">
                                <div className="h-[400px] bg-gray-100 rounded-lg overflow-hidden" data-name="product-gallery">
                                    <ModelViewer modelUrl={selectedProduct.modelUrl} />
                                </div>
                                
                                <div className="grid grid-cols-4 gap-4">
                                    {selectedProduct.gallery.map((image, index) => (
                                        <div 
                                            key={index}
                                            className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden"
                                        >
                                            <img 
                                                src={image}
                                                alt={`Product view ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-3xl font-bold mb-4">{selectedProduct.name}</h2>
                                    <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
                                    <div className="text-3xl font-bold text-black">
                                        ${selectedProduct.price}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold">Color</h3>
                                    <div className="flex space-x-4">
                                        {colors.map(color => (
                                            <button
                                                key={color.id}
                                                onClick={() => setSelectedColor(color.id)}
                                                className={`w-10 h-10 rounded-full border-2 transition-all ${
                                                    selectedColor === color.id 
                                                        ? 'border-black shadow-lg scale-110' 
                                                        : 'border-gray-200'
                                                }`}
                                                style={{ backgroundColor: color.hex }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold">Quantity</h3>
                                    <div className="flex items-center space-x-4">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setQuantity(prev => Math.max(1, prev - 1));
                                            }}
                                            className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                                        >
                                            <i className="fas fa-minus"></i>
                                        </button>
                                        <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setQuantity(prev => prev + 1);
                                            }}
                                            className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                                        >
                                            <i className="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold">Specifications</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-gray-500">Dimensions</p>
                                            <p className="font-medium">{selectedProduct.specs.dimensions}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Weight</p>
                                            <p className="font-medium">{selectedProduct.specs.weight}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Material</p>
                                            <p className="font-medium">{selectedProduct.specs.material}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Warranty</p>
                                            <p className="font-medium">{selectedProduct.specs.warranty}</p>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(selectedProduct);
                                    }}
                                    className="w-full py-4 bg-black text-white rounded-lg hover:bg-gray-800 transform hover:scale-105 transition-all text-lg font-bold"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ShoppingCart 
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cartItems}
                onUpdateQuantity={(id, quantity) => {
                    setCartItems(prevItems =>
                        prevItems.map(item =>
                            item.id === id
                                ? { ...item, quantity }
                                : item
                        )
                    );
                }}
                onRemoveItem={(id) => {
                    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
                }}
            />

            <Footer />
        </div>
    );
}

// Make ShopPage component available globally
window.ShopPage = ShopPage;
