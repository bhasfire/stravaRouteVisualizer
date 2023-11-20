//Visualize Route Function

function visualizeRoute(data, viewer, animationControl, speedControl, useEstimatedPace, distances) {
    const positions = data.coordinates.map(point => Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.ele));
    const totalPoints = positions.length;
    const terrainProvider = viewer.terrainProvider;
    let currentIndex = 0;

    let currentHeading = 0;
    let targetHeading = 0;

    // Create the polyline
    viewer.entities.add({
        polyline: {
            positions: positions,
            width: 50,
            material: new Cesium.PolylineGlowMaterialProperty({
                color: Cesium.Color.RED.withAlpha(0.1)
            }),
            clampToGround: true
        }
    });

    // Create the arrow entity
    const routeEntity = viewer.entities.add({
        position: positions[0],
        model: {
            uri: './icons/Arrow_FBXImport_GLTFExport_01.gltf',
            minimumPixelSize: 48,
            scale: 0.1
        },
        label: {
            text: data.name,
            font: 'bold 14pt Arial, sans-serif', // Increased size and made bold
            fillColor: Cesium.Color.LIGHTBLUE, // Set text color to light blue
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 5, // Slightly thicker outline for better visibility
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20) // Increased vertical offset to move the label higher
        }
    });

    viewer.clock.onTick.addEventListener(() => {
        if (!animationControl.isAnimating) return;

        currentIndex += speedControl.speed;
        if (currentIndex >= totalPoints) {
            currentIndex = 0;  // Reset index if it exceeds total points
        }

        const floorIndex = Math.floor(currentIndex);
        const nextIndex = (floorIndex + 1) % totalPoints;

        const distanceTraveled = distances[floorIndex]; // Use pre-calculated distance

         // Debugging logs
        //  console.log(`Current Index: ${currentIndex}`);
        //  console.log(`Floor Index: ${floorIndex}`);
        //  console.log(`Distance Traveled: ${distanceTraveled.toFixed(2)} miles`);

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
                const currentPoint = routeData.coordinates[Math.floor(currentIndex)];
    
                const currentPace = calculatePaceForCurrentIndex(currentIndex, data, useEstimatedPace);
                document.getElementById('distanceDisplay').textContent = `Distance: ${distanceTraveled.toFixed(2)} miles`;
                document.getElementById('timeDisplay').textContent = `Time: ${formatTimeToLocal(currentPoint.time)}`;
                document.getElementById('paceDisplay').textContent = `Pace: ${currentPace} min/mi`;
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
    // Define the number of points to include in the pace calculation for smoothing
    const smoothingFactor = 10; // Adjust as needed
    const totalPoints = routeData.coordinates.length;
    let segmentDistance = 0;
    let timeDifference = 0;

    for (let i = 0; i < smoothingFactor; i++) {
        const indexA = (Math.floor(currentIndex) - i + totalPoints) % totalPoints;
        const indexB = (indexA + 1) % totalPoints;

        const pointA = routeData.coordinates[indexA];
        const pointB = routeData.coordinates[indexB];

        segmentDistance += getDistanceBetweenPoints(pointA.lat, pointA.lon, pointB.lat, pointB.lon);
        const segmentTime = (new Date(pointB.time) - new Date(pointA.time)) / 1000;

        if (useEstimatedPace) {
            const speed = calculateSpeed(pointA.lat, pointA.lon, pointA.time, pointB.lat, pointB.lon, pointB.time);
            const speedThresholdKmH = 1;
            if (speed >= speedThresholdKmH) {
                timeDifference += segmentTime;
            }
        } else {
            timeDifference += segmentTime;
        }
    }

    if (timeDifference === 0) {
        // Avoid division by zero
        return "--:--";
    }

    const paceMinPerMile = (timeDifference / 60) / (segmentDistance / 1.60934);
    return convertToMinSec(paceMinPerMile);
}

function calculateTotalDistances(coordinates) {
    let distances = [0]; // Starting with 0 for the first point
    let totalDistance = 0;

    for (let i = 1; i < coordinates.length; i++) {
        let segmentDistance = getDistanceBetweenPoints(coordinates[i - 1].lat, coordinates[i - 1].lon, coordinates[i].lat, coordinates[i].lon) / 1.60934; // Convert to miles
        totalDistance += segmentDistance;
        distances.push(totalDistance);
    }
    return distances; // Returns an array of cumulative distances at each point
}

window.visualizeRoute = visualizeRoute; // Attach to global scope
