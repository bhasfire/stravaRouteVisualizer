//Visualize Route Function

function visualizeRoute(data, viewer, isAnimating, speed) {
    const positions = data.coordinates.map(point => 
        Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.ele));
    const totalPoints = positions.length;
    let currentIndex = 0;

    let currentHeading = 0;
    let targetHeading = 0;

    // Create the polyline
    viewer.entities.add({
        polyline: {
            positions: positions,
            width: 20,
            material: new Cesium.PolylineGlowMaterialProperty({
                color: Cesium.Color.RED.withAlpha(0.6)
            }),
            clampToGround: true
        }
    });

    // Create the arrow entity
    const routeEntity = viewer.entities.add({
        position: positions[0],
        model: {
            uri: './icons/Arrow_FBXImport_GLTFExport_01.gltf',
            minimumPixelSize: 64,
            scale: 0.1
        },
        label: {
            text: data.name,
            font: '14pt monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -9)
        }
    });

    const terrainProvider = viewer.terrainProvider;

    viewer.clock.onTick.addEventListener(() => {
        if (!animationControl.isAnimating) return;

        currentIndex += speedControl.speed;
        if (currentIndex >= totalPoints) currentIndex = 0;

        const floorIndex = Math.floor(currentIndex);
        const nextIndex = (floorIndex + 1) % totalPoints;
        const interpolationFactor = currentIndex - floorIndex;

        const interpolatedPosition = Cesium.Cartesian3.lerp(positions[floorIndex], positions[nextIndex], interpolationFactor, new Cesium.Cartesian3());

        // Calculate the heading
        const startCartographic = Cesium.Cartographic.fromCartesian(positions[floorIndex]);
        const endCartographic = Cesium.Cartographic.fromCartesian(positions[nextIndex]);
        let heading = Math.atan2(endCartographic.longitude - startCartographic.longitude, endCartographic.latitude - startCartographic.latitude);

        const headingOffset = Math.PI / 2; // Adjust this value as needed to align the arrow correctly
        heading += headingOffset;

        // Sample the terrain height and adjust the entity's position and orientation
        Cesium.sampleTerrainMostDetailed(terrainProvider, [Cesium.Cartographic.fromCartesian(interpolatedPosition)])
            .then((updatedPositions) => {
                const updatedPosition = Cesium.Cartesian3.fromRadians(
                    updatedPositions[0].longitude,
                    updatedPositions[0].latitude,
                    updatedPositions[0].height + 0.5 // Slight height above ground to avoid clipping
                );

                //console.log("Updated position with terrain height:", updatedPosition); // Log the updated position with terrain height

                routeEntity.position = updatedPosition;
                routeEntity.orientation = Cesium.Transforms.headingPitchRollQuaternion(updatedPosition, new Cesium.HeadingPitchRoll(heading, 0, 0));

                const headingDifference = targetHeading - currentHeading;
                currentHeading += headingDifference * 0.1; // Adjust the 0.1 factor for smoother or quicker transition

                // Smooth camera movement
                viewer.camera.lookAt(
                    updatedPosition, 
                    new Cesium.HeadingPitchRange(
                        currentHeading + -Math.PI,
                        Cesium.Math.toRadians(-30), // Pitch
                        100 // Range
                    )
                );
            });
    });
}
window.visualizeRoute = visualizeRoute; // Attach to global scope
