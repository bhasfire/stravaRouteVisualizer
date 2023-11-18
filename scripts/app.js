Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTVkMzhjYS1kMDc4LTRlMzYtOWNkNy05ZTY4OTZiMzNkYWIiLCJpZCI6MTc4NjIwLCJpYXQiOjE3MDAyNjA4MDJ9.exY7Ym_WUi_59ZWn18FKzw8Ue62LzQhJmdKHCd8JxUE';

let viewer;  // Declare the viewer at the top scope
let isAnimating = false; // Flag to control the animation

document.addEventListener('DOMContentLoaded', () => {
    viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain(),

    });

    // Add Google's Photorealistic 3D Tiles
    const tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url: 'https://tile.googleapis.com/v1/3dtiles/root.json?key=AIzaSyCbWqOhzPZhDPVbRS_xd4p9KsHTZKbmju4',
        showCreditsOnScreen: false,
    }));

    fetch('data/route.gpx')
        .then(response => response.text())
        .then(gpxText => {
            const data = parseGPX(gpxText);
            console.log(data); // Log to check the route data

            // Call preloadTerrainData here
            preloadTerrainData(data.coordinates, viewer.terrainProvider, () => {
                console.log("Terrain data preloaded");
                document.getElementById('startButton').disabled = false;
            });

            visualizeRoute(data);
        })
        .catch(error => {
            console.error('Error fetching or parsing GPX file:', error);
        });


    // Event listener for the start button
    document.getElementById('startButton').addEventListener('click', () => {
        isAnimating = true;
    });

    // Event listener for the pause button
    document.getElementById('pauseButton').addEventListener('click', () => {
        isAnimating = false;
    });
});

function preloadTerrainData(coordinates, terrainProvider, callback) {
    const samplePoints = coordinates.map(point => Cesium.Cartographic.fromDegrees(point.lon, point.lat));
    Cesium.sampleTerrainMostDetailed(terrainProvider, samplePoints).then(callback);
}

function visualizeRoute(data) {
    const positions = data.coordinates.map(point => 
        Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.ele));
    const totalPoints = positions.length;
    let currentIndex = 0;
    const speed = 0.1;

    // Create the polyline
    viewer.entities.add({
        polyline: {
            positions: positions,
            width: 10,
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
            uri: './data/Arrow_FBXImport_GLTFExport_01.gltf',
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
        if (!isAnimating) return;

        currentIndex += speed;
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

                // Smooth camera movement
                viewer.camera.lookAt(
                    updatedPosition, 
                    new Cesium.HeadingPitchRange(
                        Cesium.Math.toRadians(0), // Heading
                        Cesium.Math.toRadians(-30), // Pitch
                        100 // Range
                    )
                );
            });
    });
}


