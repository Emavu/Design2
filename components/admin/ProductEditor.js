function ProductEditor({ product, onClose }) {
    try {
        const [productData, setProductData] = React.useState({
            name: '',
            description: '',
            price: '',
            imageUrl: '',
            modelUrl: '',
            category: '',
            newCategory: ''
        });
        const [categories, setCategories] = React.useState([
            'Interior Products',
            'Gadgets',
            'Furniture',
            'Accessories',
            'Lighting'
        ]);
        const [showNewCategory, setShowNewCategory] = React.useState(false);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState(null);

        React.useEffect(() => {
            if (product) {
                setProductData({
                    name: product.name || '',
                    description: product.description || '',
                    price: product.price || '',
                    imageUrl: product.imageUrl || '',
                    modelUrl: product.modelUrl || '',
                    category: product.category || '',
                    newCategory: ''
                });
            }
        }, [product]);

        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);

            try {
                if (!productData.name || !productData.description || !productData.price) {
                    throw new Error('Please fill in all required fields');
                }

                const category = showNewCategory ? productData.newCategory : productData.category;
                if (!category) {
                    throw new Error('Please select or create a category');
                }

                if (showNewCategory && !categories.includes(productData.newCategory)) {
                    setCategories([...categories, productData.newCategory]);
                }

                if (product) {
                    await window.db.updateProduct(product.id, {
                        name: productData.name,
                        description: productData.description,
                        price: parseFloat(productData.price),
                        imageUrl: productData.imageUrl,
                        modelUrl: productData.modelUrl,
                        category
                    });
                } else {
                    await createProduct(
                        productData.name,
                        productData.description,
                        parseFloat(productData.price),
                        productData.imageUrl,
                        productData.modelUrl,
                        category
                    );
                }

                onClose();
            } catch (err) {
                console.error('Error saving product:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const handleChange = (e) => {
            const { name, value } = e.target;
            setProductData(prev => ({
                ...prev,
                [name]: value
            }));
        };

        const handleImageUpload = (imageUrl) => {
            setProductData(prev => ({ ...prev, imageUrl }));
        };

        const toggleNewCategory = () => {
            setShowNewCategory(!showNewCategory);
            setProductData(prev => ({
                ...prev,
                category: '',
                newCategory: ''
            }));
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-name="product-editor">
                <div className="bg-white p-8 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto" data-name="product-editor-modal">
                    <div className="flex justify-between items-center mb-6" data-name="product-editor-header">
                        <h2 className="text-2xl font-bold">{product ? 'Edit Product' : 'Add New Product'}</h2>
                        <button 
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                            data-name="product-editor-close"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" data-name="product-editor-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" data-name="product-editor-form">
                        <div>
                            <label className="block text-sm font-medium mb-2">Product Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={productData.name}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded"
                                required
                                data-name="product-name-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Description *</label>
                            <textarea
                                name="description"
                                value={productData.description}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded h-32"
                                required
                                data-name="product-description-input"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Price *</label>
                            <input
                                type="number"
                                name="price"
                                value={productData.price}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded"
                                required
                                min="0"
                                step="0.01"
                                data-name="product-price-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Product Image *</label>
                            <DragDropUploader onUploadComplete={handleImageUpload} type="image" />
                            {productData.imageUrl && (
                                <div className="mt-2">
                                    <img 
                                        src={productData.imageUrl} 
                                        alt="Preview" 
                                        className="max-h-40 rounded-lg"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">3D Model (GLB format)</label>
                            <DragDropUploader onUploadComplete={(url) => setProductData(prev => ({ ...prev, modelUrl: url }))} type="model" />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium">Category *</label>
                                <button
                                    type="button"
                                    onClick={toggleNewCategory}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                    data-name="toggle-category-button"
                                >
                                    {showNewCategory ? 'Select Existing Category' : 'Create New Category'}
                                </button>
                            </div>
                            
                            {showNewCategory ? (
                                <input
                                    type="text"
                                    name="newCategory"
                                    value={productData.newCategory}
                                    onChange={handleChange}
                                    placeholder="Enter new category name"
                                    className="w-full p-3 border border-gray-300 rounded"
                                    required
                                    data-name="new-category-input"
                                />
                            ) : (
                                <select
                                    name="category"
                                    value={productData.category}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded"
                                    required
                                    data-name="category-select"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {productData.modelUrl && (
                            <div className="mt-4" data-name="product-model-preview">
                                <label className="block text-sm font-medium mb-2">Model Preview</label>
                                <ModelViewer modelUrl={productData.modelUrl} />
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="button w-full"
                            disabled={loading}
                            data-name="product-submit-button"
                        >
                            {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
                        </button>
                    </form>
                </div>
            </div>
        );
    } catch (error) {
        console.error('ProductEditor component error:', error);
        reportError(error);
        return null;
    }
}
