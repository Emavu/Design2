function Footer() {
    try {
        return (
            <footer className="bg-white border-t border-gray-200 py-12" data-name="footer">
             <h1 className="font-bold mb-4">Domantas Garmus design</h3>
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        
                        <div data-name="footer-links">
                            <h3 className="font-bold mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                <li><a href="#works" className="text-gray-600 hover:text-black">Works</a></li>
                                <li><a href="#blog" className="text-gray-600 hover:text-black">Blog</a></li>
                                <li><a href="#shop" className="text-gray-600 hover:text-black">Shop</a></li>
                            </ul>
                        </div>
                        <div data-name="footer-contact">
                            <h3 className="font-bold mb-4">Contact</h3>
                            <ul className="space-y-2">
                                <li className="text-gray-600">Kaunas, Lithuania</li>
                                <li className="text-gray-600">+(2) 871 382 023</li>
                                <li className="text-gray-600">ryanwhite@yahoo.com</li>
                            </ul>
                        </div>
                        <div data-name="footer-social">
                            <h3 className="font-bold mb-4">Follow Us</h3>
                            <div className="flex space-x-4">
                                <a href="https://www.instagram.com/_garmus/" className="text-gray-600 hover:text-black text-xl">
                                    <i className="fab fa-instagram"></i>
                                </a>
                                <a href="https://www.linkedin.com/in/domantas-garmus-584b34294/?originalSubdomain=lt" className="text-gray-600 hover:text-black text-xl">
                                    <i className="fab fa-linkedin"></i>
                                </a>
                                <a href="https://www.behance.net/domantasgarmus" className="text-gray-600 hover:text-black text-xl">
                                    <i className="fab fa-behance"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
                        © {new Date().getFullYear()} All rights reserved
                    </div>
                </div>
            </footer>
        );
    } catch (error) {
        console.error('Footer component error:', error);
        reportError(error);
        return null;
    }
}
