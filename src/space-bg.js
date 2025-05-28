import * as THREE from "three";

let scene, camera, renderer, stars, rocket;
const starCount = 5000;

function init() {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(
		60,
		window.innerWidth / window.innerHeight,
		1,
		1000
	);
	camera.position.z = 1; // Start a bit closer to see the rocket initially

	renderer = new THREE.WebGLRenderer({
		canvas: document.getElementById("bg-canvas"),
		antialias: true,
		alpha: true, // Make canvas transparent to see CSS background if needed (though we set body bg)
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x000000, 0); // Transparent clear color

	// Stars
	const starVertices = [];
	for (let i = 0; i < starCount; i++) {
		const x = THREE.MathUtils.randFloatSpread(2000); // Spread stars across a large area
		const y = THREE.MathUtils.randFloatSpread(2000);
		const z = THREE.MathUtils.randFloatSpread(2000);
		starVertices.push(x, y, z);
	}
	const starGeometry = new THREE.BufferGeometry();
	starGeometry.setAttribute(
		"position",
		new THREE.Float32BufferAttribute(starVertices, 3)
	);
	const starMaterial = new THREE.PointsMaterial({
		color: 0xffffff,
		size: 0.7,
		transparent: true,
		opacity: 0.8,
		blending: THREE.AdditiveBlending,
	});
	stars = new THREE.Points(starGeometry, starMaterial);
	scene.add(stars);

	// Simple Rocket (elongated cone or cylinder)
	const rocketGeometry = new THREE.ConeGeometry(0.02, 0.15, 8); // radius, height, segments
	const rocketMaterial = new THREE.MeshPhongMaterial({
		color: 0xcccccc,
		emissive: 0x333333, // Give it some body, not just flat
		shininess: 50,
	});
	rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
	rocket.rotation.x = Math.PI / 2; // Point it "forward" (along Z)
	rocket.position.set(0, -0.1, -1); // Start slightly below center, further back
	scene.add(rocket);

	// Simple flame for the rocket
	const flameGeometry = new THREE.ConeGeometry(0.015, 0.05, 8);
	const flameMaterial = new THREE.MeshBasicMaterial({
		color: 0xffa500, // Orange
		transparent: true,
		opacity: 0.8,
		blending: THREE.AdditiveBlending,
	});
	const flame = new THREE.Mesh(flameGeometry, flameMaterial);
	flame.position.y = -0.09; // Position at the base of the rocket cone
	rocket.add(flame); // Add flame as a child of the rocket

	// Lighting
	const ambientLight = new THREE.AmbientLight(0x404040, 1); // Soft ambient light
	scene.add(ambientLight);
	const pointLight = new THREE.PointLight(0xffffff, 1, 100);
	pointLight.position.set(0, 1, 2); // Light source for the rocket
	scene.add(pointLight);

	window.addEventListener("resize", onWindowResize, false);
	animate();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

let clock = new THREE.Clock();

function animate() {
	requestAnimationFrame(animate);
	const delta = clock.getDelta();

	// Star movement - subtle drift
	stars.rotation.x += 0.00005;
	stars.rotation.y += 0.00007;

	// Rocket movement - slowly moving forward (away from camera)
	rocket.position.z -= 0.05 * delta;

	// If rocket goes too far, reset its position (simple loop)
	if (rocket.position.z < -15) {
		rocket.position.z = 1; // Reset closer to camera
		rocket.position.x = THREE.MathUtils.randFloat(-0.2, 0.2); // Slight horizontal variation
		rocket.position.y = THREE.MathUtils.randFloat(-0.2, 0.1); // Slight vertical variation
	}

	// Subtle rocket bobbing/drifting
	rocket.position.x += Math.sin(clock.elapsedTime * 0.5) * 0.0002;
	rocket.rotation.z += Math.cos(clock.elapsedTime * 0.7) * 0.0005;

	renderer.render(scene, camera);
}

init();
