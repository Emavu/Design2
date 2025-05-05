// Wait for Firebase to be initialized
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebase && window.firebase.db) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.firebase && window.firebase.db) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        }
    });
}

async function createBlogPost(title, content, imageUrl) {
    try {
        await waitForFirebase();
        const docRef = await window.firebase.db.collection('blog').add({
            title,
            content,
            imageUrl,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        return { objectId: docRef.id };
    } catch (error) {
        console.error('Error creating blog post:', error);
        throw error;
    }
}

async function createProduct(name, description, price, imageUrl) {
    try {
        await waitForFirebase();
        const docRef = await window.firebase.db.collection('products').add({
            name,
            description,
            price,
            imageUrl,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        return { objectId: docRef.id };
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

async function createWork(title, description, imageUrl, modelUrl, gallery, details, category) {
    try {
        await waitForFirebase();
        const docRef = await window.firebase.db.collection('works').add({
            title,
            description,
            imageUrl,
            modelUrl,
            gallery,
            details,
            category,
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        return { objectId: docRef.id };
    } catch (error) {
        console.error('Error creating work:', error);
        throw error;
    }
}

async function getBlogPosts() {
    try {
        await waitForFirebase();
        const snapshot = await window.firebase.db.collection('blog')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        return snapshot.docs.map(doc => ({
            objectId: doc.id,
            objectData: doc.data()
        }));
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        throw error;
    }
}

async function getProducts() {
    try {
        await waitForFirebase();
        const snapshot = await window.firebase.db.collection('products')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        return snapshot.docs.map(doc => ({
            objectId: doc.id,
            objectData: doc.data()
        }));
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
}

async function getWorks() {
    try {
        await waitForFirebase();
        const snapshot = await window.firebase.db.collection('works')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        return snapshot.docs.map(doc => ({
            objectId: doc.id,
            objectData: doc.data()
        }));
    } catch (error) {
        console.error('Error fetching works:', error);
        throw error;
    }
}

// Get all categories
async function getCategories() {
    try {
        await waitForFirebase();
        const snapshot = await window.firebase.db.collection('categories').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting categories:', error);
        throw error;
    }
}

// Add category
async function addCategory(categoryData) {
    try {
        await waitForFirebase();
        const docRef = await window.firebase.db.collection('categories').add({
            name: categoryData.name,
            slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding category:', error);
        throw error;
    }
}

// Make functions available globally
window.database = {
    createBlogPost,
    createProduct,
    createWork,
    getBlogPosts,
    getProducts,
    getWorks
};

// Database service for Firestore operations
const databaseService = {
    // Blog Posts
    async getBlogPosts() {
        try {
            const snapshot = await window.firebase.db.collection('blogPosts').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting blog posts:', error);
            return [];
        }
    },

    async createBlogPost(post) {
        try {
            const docRef = await window.firebase.db.collection('blogPosts').add({
                ...post,
                createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: docRef.id, ...post };
        } catch (error) {
            console.error('Error creating blog post:', error);
            throw error;
        }
    },

    async updateBlogPost(id, post) {
        try {
            await window.firebase.db.collection('blogPosts').doc(id).update({
                ...post,
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id, ...post };
        } catch (error) {
            console.error('Error updating blog post:', error);
            throw error;
        }
    },

    async deleteBlogPost(id) {
        try {
            await window.firebase.db.collection('blogPosts').doc(id).delete();
            return id;
        } catch (error) {
            console.error('Error deleting blog post:', error);
            throw error;
        }
    },

    // Works
    async getWorks() {
        try {
            const snapshot = await window.firebase.db.collection('works').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting works:', error);
            return [];
        }
    },

    async createWork(work) {
        try {
            const docRef = await window.firebase.db.collection('works').add({
                ...work,
                createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: docRef.id, ...work };
        } catch (error) {
            console.error('Error creating work:', error);
            throw error;
        }
    },

    async updateWork(id, work) {
        try {
            await window.firebase.db.collection('works').doc(id).update({
                ...work,
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id, ...work };
        } catch (error) {
            console.error('Error updating work:', error);
            throw error;
        }
    },

    async deleteWork(id) {
        try {
            await window.firebase.db.collection('works').doc(id).delete();
            return id;
        } catch (error) {
            console.error('Error deleting work:', error);
            throw error;
        }
    },

    // Products
    async getProducts() {
        try {
            const snapshot = await window.firebase.db.collection('products').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting products:', error);
            return [];
        }
    },

    async createProduct(product) {
        try {
            const docRef = await window.firebase.db.collection('products').add({
                ...product,
                createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id: docRef.id, ...product };
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    async updateProduct(id, product) {
        try {
            await window.firebase.db.collection('products').doc(id).update({
                ...product,
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            return { id, ...product };
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    async deleteProduct(id) {
        try {
            await window.firebase.db.collection('products').doc(id).delete();
            return id;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    // Categories
    async getCategories() {
        try {
            await waitForFirebase();
            const snapshot = await window.firebase.db.collection('categories').get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting categories:', error);
            return [];
        }
    },

    async addCategory(categoryData) {
        try {
            await waitForFirebase();
            const docRef = await window.firebase.db.collection('categories').add({
                name: categoryData.name,
                slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
                createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    }
};

// Make database service available globally
window.db = databaseService;
