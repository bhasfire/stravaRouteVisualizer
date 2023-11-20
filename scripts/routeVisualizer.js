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
    // const elevationDisplay = document.getElementById('elevationDisplay'); 

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
    
                routeEntity.position = updatedPosition;
                routeEntity.orientation = Cesium.Transforms.headingPitchRollQuaternion(updatedPosition, new Cesium.HeadingPitchRoll(heading, 0, 0));
    
                const headingDifference = targetHeading - currentHeading;
                currentHeading += headingDifference * 0.1; // Adjust the 0.1 factor for smoother or quicker transition
    
                // Update the display elements with the data from the current point
                const dataIndex = floorIndex < data.coordinates.length ? floorIndex : 0;
                const currentDataPoint = data.coordinates[dataIndex];
                // const currentPoint = routeData.coordinates[Math.floor(currentIndex)];

                // document.getElementById('timeDisplay').textContent = `Time: ${formatTimeToLocal(currentPoint.time)}`;
                // document.getElementById('paceDisplay').textContent = `Pace: ${calculatePaceForCurrentIndex(currentIndex, routeData, useEstimatedPace)} min/mi`;
                document.getElementById('elevationDisplay').textContent = `Elevation: ${currentDataPoint.ele.toFixed(2)} meters`;
                document.getElementById('heartRateDisplay').textContent = `Heart Rate: ${currentDataPoint.hr || '--'} bpm`;
                document.getElementById('cadenceDisplay').textContent = `Cadence: ${currentDataPoint.cad || '--'} rpm`;
                document.getElementById('temperatureDisplay').textContent = `Temperature: ${currentDataPoint.atemp || '--'} °C`;
                    
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

function calculatePaceForCurrentIndex(currentIndex, routeData, useEstimatedPace) {
    const totalPoints = routeData.coordinates.length;
    const floorIndex = Math.floor(currentIndex);
    const nextIndex = (floorIndex + 1) % totalPoints;

    const pointA = routeData.coordinates[floorIndex];
    const pointB = routeData.coordinates[nextIndex];

    const segmentDistance = getDistanceBetweenPoints(pointA.lat, pointA.lon, pointB.lat, pointB.lon); // in kilometers
    let timeDifference; // in seconds

    if (useEstimatedPace) {
        const speedA = calculateSpeed(pointA.lat, pointA.lon, pointA.time, pointB.lat, pointB.lon, pointB.time);
        const speedThresholdKmH = 1;
        if (speedA >= speedThresholdKmH) {
            timeDifference = (new Date(pointB.time) - new Date(pointA.time)) / 1000;
        } else {
            // If the speed is below threshold, return a default pace value or previous pace value
            return "--:--";
        }
    } else {
        timeDifference = (new Date(pointB.time) - new Date(pointA.time)) / 1000;
    }

    const paceMinPerMile = (timeDifference / 60) / (segmentDistance / 1.60934); // Convert to min/mile
    return convertToMinSec(paceMinPerMile);
}

window.visualizeRoute = visualizeRoute; // Attach to global scope
