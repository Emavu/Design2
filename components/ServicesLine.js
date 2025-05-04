function ServicesLine() {
    try {
        const services = [
            { id: 1, name: "Package Design & Logo" },
            { id: 2, name: "Furniture design" },
            { id: 3, name: "Renders" },
            { id: 4, name: "UI/UX Design" },
        ];

        // Double the services array for smooth infinite scroll
        const repeatedServices = [...services, ...services];

        return (
            <div className="bg-[#CCFF00] py-4 overflow-hidden" data-name="services-line">
                <div className="whitespace-nowrap animate-scroll" data-name="services-line-content">
                    <div className="inline-flex">
                        {repeatedServices.map((service, index) => (
                            <div 
                                key={`${service.id}-${index}`} 
                                className="flex items-center mx-16"
                                data-name={`service-item-${service.id}`}
                            >
                                <span className="text-2xl mr-3">✱</span>
                                <span className="text-lg font-medium">{service.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error('ServicesLine component error:', error);
        reportError(error);
        return null;
    }
}
