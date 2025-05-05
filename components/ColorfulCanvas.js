function ColorfulCanvas({ id, position = { x: 0, y: 0, z: -10 }, scale = 10, height = 100 }) {
    const CANVAS_HEIGHT = height;
    const canvasRef = React.useRef(null);
    const sceneRef = React.useRef(null);
    const modelRef = React.useRef(null);
    const rendererRef = React.useRef(null);
    const cameraRef = React.useRef(null);
    const animationRef = React.useRef(null);
    const hueRef = React.useRef(0);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !window.THREE) return;

        // Set canvas width and height to viewport
        canvas.width = window.innerWidth;
        canvas.height = CANVAS_HEIGHT;

        // Scene setup
        const scene = new window.THREE.Scene();
        sceneRef.current = scene;

        // Camera setup
        const camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / CANVAS_HEIGHT, 0.1, 1000);
        camera.position.z = 5;
        cameraRef.current = camera;

        // Renderer setup
        const renderer = new window.THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true
        });
        renderer.setSize(window.innerWidth, CANVAS_HEIGHT);
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
        rendererRef.current = renderer;

        // Lights
        const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Load 3D Model
        const loader = new window.THREE.GLTFLoader();
        loader.load(
            './3d models/new2.glb',
            (gltf) => {
                const model = gltf.scene;
                modelRef.current = model;

                // Center and scale the model
                const box = new window.THREE.Box3().setFromObject(model);
                const center = box.getCenter(new window.THREE.Vector3());
                model.position.sub(center);
                model.scale.set(scale, scale, scale);
                model.position.set(position.x, position.y, position.z);

                // Create gradient material
                const material = new window.THREE.MeshPhongMaterial({
                    color: "black",
                    transparent: true,
                    opacity: 1,
                    shininess: 100
                });

                // Apply material to all meshes in the model
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.material = material;
                    }
                });

                scene.add(model);
            },
            undefined,
            (error) => {
                console.error('Error loading GLB model:', error);
            }
        );

        // Animation
        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);
            if (modelRef.current) {
                modelRef.current.rotation.y += 0.001;
            }
            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = CANVAS_HEIGHT;
            renderer.setSize(window.innerWidth, CANVAS_HEIGHT);
            camera.aspect = window.innerWidth / CANVAS_HEIGHT;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            renderer.dispose();
        };
    }, [position, scale, height]);

    return (
        <div style={{ position: 'relative', width: '100vw', left: '50%', right: '50%', transform: 'translateX(-50%)', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ width: '100vw', height: `${CANVAS_HEIGHT}px`, display: 'block' }} />
        </div>
    );
} 