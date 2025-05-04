function SimpleFooter() {
    try {
        return (
            <footer className="bg-black text-white py-8" data-name="simple-footer">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-400">© {new Date().getFullYear()} All rights reserved</p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-gray-400 hover:text-white">
                                <i className="fab fa-facebook"></i>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white">
                                <i className="fab fa-linkedin"></i>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white">
                                <i className="fab fa-instagram"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        );
    } catch (error) {
        console.error('SimpleFooter component error:', error);
        reportError(error);
        return null;
    }
}
