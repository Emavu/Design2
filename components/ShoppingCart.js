function ShoppingCart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem }) {
    try {
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return (
            <div 
                className={`fixed top-0 right-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 z-50 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                data-name="shopping-cart"
            >
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Shopping Cart</h2>
                            <button 
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                                data-name="cart-close"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4" data-name="cart-items">
                        {items.length === 0 ? (
                            <p className="text-center text-gray-500">Your cart is empty</p>
                        ) : (
                            <div className="space-y-4">
                                {items.map(item => (
                                    <div 
                                        key={item.id} 
                                        className="flex items-start space-x-4 pb-4 border-b border-gray-200"
                                        data-name={`cart-item-${item.id}`}
                                    >
                                        {item.imageUrl && (
                                            <img 
                                                src={item.imageUrl} 
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded"
                                                data-name={`cart-item-image-${item.id}`}
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-bold">{item.name}</h3>
                                            <p className="text-gray-600">${item.price}</p>
                                            <div className="flex items-center mt-2">
                                                <button 
                                                    onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                                    className="px-2 py-1 border border-gray-300 rounded"
                                                    data-name={`cart-item-decrease-${item.id}`}
                                                >
                                                    -
                                                </button>
                                                <span className="mx-2">{item.quantity}</span>
                                                <button 
                                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                    className="px-2 py-1 border border-gray-300 rounded"
                                                    data-name={`cart-item-increase-${item.id}`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onRemoveItem(item.id)}
                                            className="text-red-500 hover:text-red-700"
                                            data-name={`cart-item-remove-${item.id}`}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold">Total:</span>
                            <span className="font-bold text-xl">${total.toFixed(2)}</span>
                        </div>
                        <button 
                            onClick={() => {
                                // Handle checkout
                                console.log('Proceeding to checkout...');
                            }}
                            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors"
                            disabled={items.length === 0}
                            data-name="checkout-button"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error('ShoppingCart component error:', error);
        reportError(error);
        return null;
    }
}
