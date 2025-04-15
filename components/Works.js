function Works() {
    try {
        const works = [
            {
                id: 1,
                title: "Creative Project 1",
                description: "A showcase of innovative design and functionality",
                image: "https://source.unsplash.com/random/800x600?design"
            },
            {
                id: 2,
                title: "Creative Project 2",
                description: "Exploring new frontiers in digital art",
                image: "https://source.unsplash.com/random/800x600?art"
            },
            {
                id: 3,
                title: "Creative Project 3",
                description: "Pushing boundaries in web development",
                image: "https://source.unsplash.com/random/800x600?development"
            }
        ];

        return (
            <section id="works" className="py-20 bg-gray-50" data-name="works">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold mb-12 text-center" data-name="works-heading">
                        My Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-name="works-grid">
                        {works.map(work => (
                            <div 
                                key={work.id} 
                                className="card bg-white"
                                data-name={`work-item-${work.id}`}
                            >
                                <img 
                                    src={work.image} 
                                    alt={work.title} 
                                    className="w-full h-48 object-cover mb-4"
                                    data-name={`work-image-${work.id}`}
                                />
                                <h3 className="text-xl font-bold mb-2" data-name={`work-title-${work.id}`}>
                                    {work.title}
                                </h3>
                                <p className="text-gray-600" data-name={`work-description-${work.id}`}>
                                    {work.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    } catch (error) {
        console.error('Works component error:', error);
        reportError(error);
        return null;
    }
}
