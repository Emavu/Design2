function Shop() {
    try {
        const [products, setProducts] = React.useState([]);
        const [loading, setLoading] = React.useState(true);
        const [paymentModal, setPaymentModal] = React.useState(null);

        React.useEffect(() => {
            loadProducts();
        }, []);

        async function loadProducts() {
            try {
                const fetchedProducts = await getProducts();
                setProducts(fetchedProducts);
                setLoading(false);
            } catch (error) {
                console.error('Error loading products:', error);
                setLoading(false);
            }
        }

        const handlePayment = (product) => {
            setPaymentModal(product);
        };

        const processPayment = async (e) => {
            e.preventDefault();
            try {
                // Here we would integrate with a real payment gateway
                // For now, we'll simulate a successful payment
                await new Promise(resolve => setTimeout(resolve, 1000));
                alert('Payment successful! Thank you for your purchase.');
                setPaymentModal(null);
            } catch (error) {
                console.error('Payment error:', error);
                alert('Payment failed. Please try again.');
            }
        };

        if (loading) {
            return (
                <section id="shop" className="py-20 bg-white" data-name="shop">
                    <div className="container mx-auto px-4 text-center">
                        Loading products...
                    </div>
                </section>
            );
        }

        return (
            <section id="shop" className="py-20 bg-white" data-name="shop">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold mb-12 text-center" data-name="shop-heading">
                        Shop
                    </h2>
                    <div className="product-grid" data-name="product-grid">
                        {products.map(product => (
                            <div 
                                key={product.objectId} 
                                className="card bg-white"
                                data-name={`product-${product.objectId}`}
                            >
                                {product.objectData.imageUrl && (
                                    <img 
                                        src={product.objectData.imageUrl} 
                                        alt={product.objectData.name} 
                                        className="w-full h-48 object-cover mb-4"
                                        data-name={`product-image-${product.objectId}`}
                                    />
                                )}
                                <h3 className="text-xl font-bold mb-2" data-name={`product-name-${product.objectId}`}>
                                    {product.objectData.name}
                                </h3>
                                <p className="text-gray-600 mb-4" data-name={`product-description-${product.objectId}`}>
                                    {product.objectData.description}
                                </p>
                                <div className="flex justify-between items-center" data-name={`product-footer-${product.objectId}`}>
                                    <span className="text-xl font-bold" data-name={`product-price-${product.objectId}`}>
                                        ${product.objectData.price}
                                    </span>
                                    <button 
                                        className="button"
                                        onClick={() => handlePayment(product)}
                                        data-name={`product-buy-${product.objectId}`}
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {paymentModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-name="payment-modal">
                            <div className="bg-white p-8 rounded-lg max-w-md w-full" data-name="payment-modal-content">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold">Payment Details</h3>
                                    <button 
                                        onClick={() => setPaymentModal(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                        data-name="payment-modal-close"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                <form onSubmit={processPayment} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Card Number</label>
                                        <input
                                            type="text"
                                            placeholder="1234 5678 9012 3456"
                                            className="w-full p-3 border border-gray-300 rounded"
                                            required
                                            pattern="[0-9\s]{13,19}"
                                            data-name="card-number-input"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Expiry Date</label>
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                className="w-full p-3 border border-gray-300 rounded"
                                                required
                                                pattern="(0[1-9]|1[0-2])\/([0-9]{2})"
                                                data-name="expiry-date-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">CVC</label>
                                            <input
                                                type="text"
                                                placeholder="123"
                                                className="w-full p-3 border border-gray-300 rounded"
                                                required
                                                pattern="[0-9]{3,4}"
                                                data-name="cvc-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <button 
                                            type="submit"
                                            className="button w-full"
                                            data-name="payment-submit"
                                        >
                                            Pay ${paymentModal.objectData.price}
                                        </button>
                                    </div>
                                </form>
                            </div>
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
