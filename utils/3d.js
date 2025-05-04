// Remove all imports since we're using CDN
function initBackground3D() {
    try {
        const canvas = document.getElementById('background-canvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        // Initialize scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            canvas,
            alpha: true,
            antialias: true
        });

        // Set initial size and color
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xffffff, 1);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Initialize composer
        const composer = new THREE.EffectComposer(renderer);
        composer.setSize(window.innerWidth, window.innerHeight);
        composer.setPixelRatio(window.devicePixelRatio);

        // Add render pass
        const renderPass = new THREE.RenderPass(scene, camera);
        composer.addPass(renderPass);

        // Add bloom pass
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.5,  // strength
            0.4,  // radius
            0.85  // threshold
        );
        composer.addPass(bloomPass);

        // Custom Chromatic Aberration Shader
        const chromaticAberrationShader = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: 0.005 },
                angle: { value: 0.5 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                uniform float angle;
                uniform vec2 resolution;
                varying vec2 vUv;

                void main() {
                    vec2 offset = amount * vec2(cos(angle), sin(angle));
                    vec4 cr = texture2D(tDiffuse, vUv + offset);
                    vec4 cg = texture2D(tDiffuse, vUv);
                    vec4 cb = texture2D(tDiffuse, vUv - offset);
                    gl_FragColor = vec4(cr.r, cg.g, cb.b, 1.0);
                }
            `
        };

        // Add chromatic aberration pass
        const chromaticAberrationPass = new THREE.ShaderPass(chromaticAberrationShader);
        composer.addPass(chromaticAberrationPass);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 1, 1);
        scene.add(directionalLight);

        // Position camera
        camera.position.z = 5;

        // Load model
        const loader = new THREE.GLTFLoader();
        let model;

        loader.load(
            './3d models/new2.glb',
            (gltf) => {
                model = gltf.scene;
                
                // Center the model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);
                
                // Scale the model if needed
                const scale = 40;
                model.scale.set(scale, scale, scale);
                
                // Initial position
                model.position.set(7, -7, -20);
                
                scene.add(model);
                
                // Log success
                console.log('3D model loaded successfully');
            },
            (progress) => {
                console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading 3D model:', error);
            }
        );

        // Mouse move handler
        const handleMouseMove = (event) => {
            if (model) {
                const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
                const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

                // Smooth rotation
                model.rotation.y += (mouseX * 0.5 - model.rotation.y) * 0.01;
                model.rotation.x += (mouseY * 0.3 - model.rotation.x) * 0.01;
                
                // Update chromatic aberration based on mouse position
                chromaticAberrationPass.uniforms.amount.value = 0.005 + Math.abs(mouseX) * 0.01;
                chromaticAberrationPass.uniforms.angle.value = mouseY * Math.PI;
                
                // Subtle color change based on mouse position
                model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        const hue = (mouseX + 1) * 0.5;
                        child.material.color.setHSL(hue, 0.5, 0.5);
                    }
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            if (model) {
                // Add subtle constant rotation
                model.rotation.y += 0.001;
            }
            
            composer.render();
        }

        // Handle window resize
        function handleResize() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const serviceLine = document.querySelector('[data-name="services-line"]');
            const serviceLineHeight = serviceLine ? serviceLine.offsetHeight : 0;
            const serviceLineTop = serviceLine ? serviceLine.offsetTop : 0;

            // Update camera
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            
            // Update renderer and composer with new dimensions
            renderer.setSize(width, serviceLineTop + serviceLineHeight);
            composer.setSize(width, serviceLineTop + serviceLineHeight);
            
            // Update passes
            bloomPass.setSize(width, serviceLineTop + serviceLineHeight);
            chromaticAberrationPass.uniforms.resolution.value.set(width, serviceLineTop + serviceLineHeight);
        }

        // Add resize observer for better performance
        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });

        resizeObserver.observe(canvas);
        window.addEventListener('resize', handleResize);

        // Start animation
        animate();

        // Return cleanup function
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            composer.dispose();
            renderer.dispose();
        };
    } catch (error) {
        console.error('Error initializing 3D scene:', error);
    }
}
