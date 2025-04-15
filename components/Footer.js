function Footer() {
    try {
        return (
            <footer className="bg-black text-white py-12" data-name="footer">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div data-name="footer-about">
                            <h3 className="text-xl font-bold mb-4" data-name="footer-about-heading">
                                About
                            </h3>
                            <p className="text-gray-400" data-name="footer-about-text">
                                A creative portfolio showcasing my works, blog posts, and unique products.
                            </p>
                        </div>
                        <div data-name="footer-links">
                            <h3 className="text-xl font-bold mb-4" data-name="footer-links-heading">
                                Quick Links
                            </h3>
                            <ul className="space-y-2">
                                <li><a href="#works" className="text-gray-400 hover:text-white" data-name="footer-works-link">Works</a></li>
                                <li><a href="#blog" className="text-gray-400 hover:text-white" data-name="footer-blog-link">Blog</a></li>
                                <li><a href="#shop" className="text-gray-400 hover:text-white" data-name="footer-shop-link">Shop</a></li>
                                <li><a href="#contact" className="text-gray-400 hover:text-white" data-name="footer-contact-link">Contact</a></li>
                            </ul>
                        </div>
                        <div data-name="footer-social">
                            <h3 className="text-xl font-bold mb-4" data-name="footer-social-heading">
                                Follow Me
                            </h3>
                            <div className="flex space-x-4">
                                <a href="https://www.instagram.com/_garmus?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" className="text-gray-400 hover:text-white text-2xl" data-name="footer-github">
                                <i class="fa-brands fa-instagram"></i>
                                </a>
                                <a href="https://www.linkedin.com/in/domantas-garmus-584b34294/" className="text-gray-400 hover:text-white text-2xl" data-name="footer-linkedin">
                                    <i className="fab fa-linkedin"></i>
                                </a>
                              
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400" data-name="footer-copyright">
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
