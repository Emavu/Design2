function ModelViewer({ modelUrl }) {
    try {
        const containerRef = React.useRef(null);
        const [loading, setLoading] = React.useState(true);
        const [error, setError] = React.useState(null);
        
        React.useEffect(() => {
            if (!containerRef.current) return;

            let camera, scene, renderer, model;
            let isMouseDown = false;
            let mouseX = 0;
            let mouseY = 0;
            let targetRotation = 0;
            let targetRotationY = 0;

            const init = () => {
                // Scene setup
                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
                
                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
                renderer.setClearColor(0xffffff, 0);
                containerRef.current.appendChild(renderer.domElement);

                // Lights
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
                scene.add(ambientLight);

                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(0, 1, 1);
                scene.add(directionalLight);

                // Position camera
                camera.position.z = 5;

                // Load model
                const loader = new THREE.GLTFLoader();
                loader.load(
                    modelUrl,
                    (gltf) => {
                        model = gltf.scene;
                        
                        // Center the model
                        const box = new THREE.Box3().setFromObject(model);
                        const center = box.getCenter(new THREE.Vector3());
                        model.position.sub(center);
                        
                        // Scale the model to fit view
                        const size = box.getSize(new THREE.Vector3());
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const scale = 2 / maxDim;
                        model.scale.multiplyScalar(scale);

                        scene.add(model);
                        setLoading(false);
                    },
                    (progress) => {
                        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                    },
                    (error) => {
                        console.error('Error loading 3D model:', error);
                        setError('Failed to load 3D model');
                        setLoading(false);
                    }
                );
            };

            const onMouseDown = (event) => {
                isMouseDown = true;
                mouseX = event.clientX;
                mouseY = event.clientY;
            };

            const onMouseMove = (event) => {
                if (!isMouseDown || !model) return;

                const deltaX = event.clientX - mouseX;
                const deltaY = event.clientY - mouseY;

                targetRotation += deltaX * 0.01;
                targetRotationY += deltaY * 0.01;

                mouseX = event.clientX;
                mouseY = event.clientY;
            };

            const onMouseUp = () => {
                isMouseDown = false;
            };

            const animate = () => {
                requestAnimationFrame(animate);

                if (model) {
                    // Smooth rotation
                    model.rotation.y += (targetRotation - model.rotation.y) * 0.1;
                    model.rotation.x += (targetRotationY - model.rotation.x) * 0.1;
                }

                renderer.render(scene, camera);
            };

            init();
            animate();

            // Event listeners
            const canvas = renderer.domElement;
            canvas.addEventListener('mousedown', onMouseDown);
            canvas.addEventListener('mousemove', onMouseMove);
            canvas.addEventListener('mouseup', onMouseUp);
            canvas.addEventListener('mouseleave', onMouseUp);

            // Handle resize
            const handleResize = () => {
                if (!containerRef.current) return;
                
                const width = containerRef.current.clientWidth;
                const height = containerRef.current.clientHeight;

                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            };

            window.addEventListener('resize', handleResize);

            return () => {
                if (containerRef.current && renderer.domElement) {
                    containerRef.current.removeChild(renderer.domElement);
                }
                window.removeEventListener('resize', handleResize);
                canvas.removeEventListener('mousedown', onMouseDown);
                canvas.removeEventListener('mousemove', onMouseMove);
                canvas.removeEventListener('mouseup', onMouseUp);
                canvas.removeEventListener('mouseleave', onMouseUp);
            };
        }, [modelUrl]);

        return (
            <div 
                ref={containerRef} 
                className="w-full h-full relative"
                data-name="model-viewer"
            >
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                            <i className="fas fa-spinner fa-spin text-3xl text-gray-400 mb-2"></i>
                            <p className="text-gray-600">Loading 3D Model...</p>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="text-center text-red-500">
                            <i className="fas fa-exclamation-circle text-3xl mb-2"></i>
                            <p>{error}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    } catch (error) {
        console.error('ModelViewer component error:', error);
        reportError(error);
        return null;
    }
}

// Make ModelViewer component available globally
window.ModelViewer = ModelViewer;
