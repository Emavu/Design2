function animateOnScroll(element, animation) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(animation);
                }
            });
        },
        { threshold: 0.1 }
    );
    
    observer.observe(element);
}

function typeWriter(element, text, speed = 50) {
    let i = 0;
    const typing = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typing);
        }
    }, speed);
}
