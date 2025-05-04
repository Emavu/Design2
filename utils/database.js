function createBlogPost(title, content, imageUrl) {
    try {
        return trickleCreateObject('blog', {
            title,
            content,
            imageUrl,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating blog post:', error);
        throw error;
    }
}

function createProduct(name, description, price, imageUrl) {
    try {
        return trickleCreateObject('product', {
            name,
            description,
            price,
            imageUrl,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

function createWork(title, description, imageUrl, modelUrl, gallery, details, category) {
    try {
        return trickleCreateObject('work', {
            title,
            description,
            imageUrl,
            modelUrl,
            gallery,
            details,
            category,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating work:', error);
        throw error;
    }
}

async function getBlogPosts() {
    try {
        const response = await trickleListObjects('blog', 100, true);
        return response.items;
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        throw error;
    }
}

async function getProducts() {
    try {
        const response = await trickleListObjects('product', 100, true);
        return response.items;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

async function getWorks() {
    try {
        const response = await trickleListObjects('work', 100, true);
        return response.items;
    } catch (error) {
        console.error('Error fetching works:', error);
        throw error;
    }
}
