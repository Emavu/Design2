// Initialize Firestore collections with sample data
async function initializeCollections() {
    try {
        // Initialize Blog Posts Collection
        const blogPosts = [
            {
                title: "Getting Started with 3D Design",
                content: "Learn the basics of 3D design and how to create stunning visualizations...",
                excerpt: "A comprehensive guide to 3D design fundamentals...",
                image: "https://example.com/images/3d-design.jpg",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: "The Future of Digital Art",
                content: "Exploring the latest trends and technologies in digital art...",
                excerpt: "Discover how digital art is evolving in the modern era...",
                image: "https://example.com/images/digital-art.jpg",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Initialize Works Collection
        const works = [
            {
                title: "Modern Living Room Design",
                description: "A contemporary living room design with minimalist aesthetics...",
                image: "https://example.com/images/living-room.jpg",
                modelUrl: "https://example.com/models/living-room.glb",
                gallery: [
                    "https://example.com/images/living-room-1.jpg",
                    "https://example.com/images/living-room-2.jpg"
                ],
                category: "Interior Design",
                details: {
                    dimensions: "5m x 4m",
                    materials: "Wood, Glass, Metal",
                    year: "2023"
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: "Urban Office Space",
                description: "A modern office space designed for productivity and comfort...",
                image: "https://example.com/images/office-space.jpg",
                modelUrl: "https://example.com/models/office-space.glb",
                gallery: [
                    "https://example.com/images/office-1.jpg",
                    "https://example.com/images/office-2.jpg"
                ],
                category: "Office Design",
                details: {
                    dimensions: "8m x 6m",
                    materials: "Concrete, Steel, Glass",
                    year: "2023"
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Initialize Products Collection
        const products = [
            {
                name: "Minimalist Chair",
                description: "A sleek and comfortable chair designed for modern living spaces...",
                price: 299.99,
                image: "https://example.com/images/chair.jpg",
                category: "Furniture",
                specs: {
                    dimensions: "50cm x 50cm x 80cm",
                    weight: "5kg",
                    material: "Wood, Fabric",
                    warranty: "2 years"
                },
                gallery: [
                    "https://example.com/images/chair-1.jpg",
                    "https://example.com/images/chair-2.jpg"
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: "Smart Desk Lamp",
                description: "An intelligent desk lamp with adjustable brightness and color temperature...",
                price: 89.99,
                image: "https://example.com/images/lamp.jpg",
                category: "Gadgets",
                specs: {
                    dimensions: "30cm x 15cm x 15cm",
                    weight: "1.2kg",
                    material: "Aluminum, LED",
                    warranty: "1 year"
                },
                gallery: [
                    "https://example.com/images/lamp-1.jpg",
                    "https://example.com/images/lamp-2.jpg"
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        // Add documents to collections
        for (const post of blogPosts) {
            await window.db.createBlogPost(post);
        }

        for (const work of works) {
            await window.db.createWork(work);
        }

        for (const product of products) {
            await window.db.createProduct(product);
        }

        console.log('Collections initialized successfully!');
    } catch (error) {
        console.error('Error initializing collections:', error);
    }
}

// Make initialization function available globally
window.initializeCollections = initializeCollections; 