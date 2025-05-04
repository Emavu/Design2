import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Function to initialize animations
export function initAnimations() {
    const elements = document.querySelectorAll('.about, .work-container, .blog-post, .product-card');
    
    if (elements.length === 0) {
        // If no elements found, try again after a short delay
        setTimeout(initAnimations, 100);
        return;
    }

    // Initialize elements with initial state
    gsap.set(elements, {
        opacity: 0,
        y: 100
    });

    // Animate elements on scroll
    elements.forEach(element => {
        ScrollTrigger.create({
            trigger: element,
            start: "top 75%",
            end: "top 25%",
            onEnter: () => {
                gsap.to(element, {
                    opacity: 1,
                    y: 0,
                    duration: 1.5,
                    ease: "power3.out"
                });
            },
            onLeaveBack: () => {
                gsap.to(element, {
                    opacity: 0,
                    y: 100,
                    duration: 0.5,
                    ease: "power3.in"
                });
            }
        });
    });

    // Header animation
    const header = document.querySelector('.header-block');
    if (header) {
        ScrollTrigger.create({
            trigger: "body",
            start: "top top",
            end: "max",
            onUpdate: (self) => {
                if (self.direction === 1) { // scrolling down
                    gsap.to(header, {
                        y: -5,
                        duration: 0.7,
                        ease: "power2.inOut"
                    });
                } else if (self.direction === -1) { // scrolling up
                    gsap.to(header, {
                        y: 0,
                        duration: 0.4,
                        ease: "power2.inOut"
                    });
                }
            }
        });
    }
}
 
