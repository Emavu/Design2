function ServicesLine() {
    try {
        const services = [
            { id: 1, name: "Package Design & Logo", icon: "✱" },
            { id: 2, name: "Furniture design", icon: "✱" },
            { id: 3, name: "Renders", icon: "✱" },
            { id: 4, name: "UI/UX Design", icon: "✱" },
        ];

        // Duplicate services to create seamless loop
        const duplicatedServices = [...services, ...services];

        return (
            <div className="moving-line" data-name="services-line">
                <div className="moving-line-content" data-name="services-line-content">
                    {duplicatedServices.map((service, index) => (
                        <div 
                            key={`${service.id}-${index}`} 
                            className="moving-line-item"
                            data-name={`service-item-${service.id}`}
                        >
                            <span className="moving-line-icon" data-name={`service-icon-${service.id}`}>
                                {service.icon}
                            </span>
                            {service.name}
                        </div>
                    ))}
                </div>
            </div>
        );
    } catch (error) {
        console.error('ServicesLine component error:', error);
        reportError(error);
        return null;
    }
}
