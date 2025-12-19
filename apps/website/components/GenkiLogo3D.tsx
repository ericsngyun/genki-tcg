'use client';

import { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

function Model() {
    const pivotRef = useRef<THREE.Group>(null);
    const obj = useLoader(OBJLoader, '/assets/genki-logo.obj');

    // Clone to avoid mutating cached object
    const clonedObj = useMemo(() => obj.clone(), [obj]);

    // Center and scale the object
    const { offsetX, offsetY, offsetZ, scale } = useMemo(() => {
        // Compute bounding box of entire object
        const box = new THREE.Box3().setFromObject(clonedObj);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Calculate scale to fit nicely in view
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim; // Balanced scale

        return {
            offsetX: -center.x,
            offsetY: -center.y,
            offsetZ: -center.z,
            scale
        };
    }, [clonedObj]);

    // Apply material
    useEffect(() => {
        clonedObj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color('#DC2626'),
                    metalness: 0.9,
                    roughness: 0.12,
                    emissive: new THREE.Color('#DC2626'),
                    emissiveIntensity: 0.2,
                    envMapIntensity: 1.8,
                });
            }
        });
    }, [clonedObj]);

    // Rotate around the pivot (center)
    useFrame((state) => {
        if (pivotRef.current) {
            pivotRef.current.rotation.y += 0.004;
            pivotRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
        }
    });

    return (
        <group ref={pivotRef} position={[0, 0, 0]}>
            {/* Object offset so its center aligns with pivot origin */}
            <primitive
                object={clonedObj}
                position={[offsetX * scale, offsetY * scale, offsetZ * scale]}
                scale={[scale, scale, scale]}
            />
        </group>
    );
}

export default function GenkiLogo3D() {
    return (
        <div className="absolute inset-0 w-full h-full">
            <Canvas
                camera={{
                    position: [0, 0, 4], // Zoomed out
                    fov: 50,
                }}
                gl={{
                    antialias: true,
                    alpha: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.1,
                }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.6} />

                    <spotLight
                        position={[5, 5, 8]}
                        angle={0.4}
                        penumbra={1}
                        intensity={3}
                        color="#ffffff"
                    />

                    <spotLight
                        position={[-5, 3, 8]}
                        angle={0.4}
                        penumbra={1}
                        intensity={2}
                        color="#ffffff"
                    />

                    <pointLight position={[0, 3, -6]} intensity={1.2} color="#EF4444" />
                    <pointLight position={[0, -4, 3]} intensity={0.4} color="#ffffff" />

                    <Environment preset="studio" />

                    <Model />
                </Suspense>
            </Canvas>
        </div>
    );
}
