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

    // Center based on volume-weighted centroid (approximates center of mass)
    const { offsetX, offsetY, offsetZ, scale } = useMemo(() => {
        let totalVolume = 0;
        const weightedCenter = new THREE.Vector3();
        const tempCenter = new THREE.Vector3();
        const tempSize = new THREE.Vector3();

        // Calculate volume-weighted centroid across all meshes
        clonedObj.traverse((child) => {
            if (child instanceof THREE.Mesh && child.geometry) {
                child.geometry.computeBoundingBox();
                const box = child.geometry.boundingBox;
                if (box) {
                    box.getCenter(tempCenter);
                    box.getSize(tempSize);
                    // Apply world transform to get actual position
                    child.localToWorld(tempCenter);
                    // Volume approximation
                    const volume = tempSize.x * tempSize.y * tempSize.z;
                    weightedCenter.add(tempCenter.multiplyScalar(volume));
                    totalVolume += volume;
                }
            }
        });

        // Finalize weighted center
        if (totalVolume > 0) {
            weightedCenter.divideScalar(totalVolume);
        } else {
            // Fallback to bounding box center
            const box = new THREE.Box3().setFromObject(clonedObj);
            box.getCenter(weightedCenter);
        }

        // Calculate scale based on overall bounding box
        const overallBox = new THREE.Box3().setFromObject(clonedObj);
        const size = new THREE.Vector3();
        overallBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.2 / maxDim; // Larger model

        return {
            offsetX: -weightedCenter.x,
            offsetY: -weightedCenter.y,
            offsetZ: -weightedCenter.z,
            scale
        };
    }, [clonedObj]);

    // Apply dark stainless steel silver material
    useEffect(() => {
        clonedObj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color('#2a2a2a'), // Dark stainless steel
                    metalness: 0.95,
                    roughness: 0.15,
                    emissive: new THREE.Color('#1a1a1a'),
                    emissiveIntensity: 0.05,
                    envMapIntensity: 2.0,
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
        <group ref={pivotRef} position={[0, -0.3, 0]}>
            {/* Object offset so its center aligns with pivot origin, lowered vertically */}
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
                    position: [1.2, 0, 4], // Off-center horizontally, zoomed out
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

                    <pointLight position={[0, 3, -6]} intensity={1.2} color="#ffffff" />
                    <pointLight position={[0, -4, 3]} intensity={0.4} color="#ffffff" />

                    <Environment preset="studio" />

                    <Model />
                </Suspense>
            </Canvas>
        </div>
    );
}
