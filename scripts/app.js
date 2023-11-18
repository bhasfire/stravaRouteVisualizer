Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTVkMzhjYS1kMDc4LTRlMzYtOWNkNy05ZTY4OTZiMzNkYWIiLCJpZCI6MTc4NjIwLCJpYXQiOjE3MDAyNjA4MDJ9.exY7Ym_WUi_59ZWn18FKzw8Ue62LzQhJmdKHCd8JxUE';

let viewer;  // Declare the viewer at the top scope

document.addEventListener('DOMContentLoaded', () => {
    viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain(),

    });

    // Add Google's Photorealistic 3D Tiles
    const tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url: 'https://tile.googleapis.com/v1/3dtiles/root.json?key=AIzaSyCbWqOhzPZhDPVbRS_xd4p9KsHTZKbmju4',
        showCreditsOnScreen: true,
    }));

    fetch('data/route.gpx')
        .then(response => response.text())
        .then(gpxText => {
            const route = parseGPX(gpxText);
            console.log(route);  // Log to check the route data
            visualizeRoute(route);
        })
        .catch(error => {
            console.error('Error fetching or parsing GPX file:', error);
        });
});

function visualizeRoute(route) {
    const positions = route.map(point => Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.ele));
    const totalPoints = positions.length;
    let currentIndex = 0;
    const speed = 0.1;

    // Create the route polyline
    viewer.entities.add({
        polyline: {
            positions: positions,
            width: 5,
            material: Cesium.Color.RED,
            clampToGround: true
        }
    });

    // Create an entity to represent the current position
    const routeEntity = viewer.entities.add({
        position: positions[0],
        point: {
            pixelSize: 10,
            color: Cesium.Color.BLUE
        }
    });

    const terrainProvider = viewer.terrainProvider;

    viewer.clock.onTick.addEventListener(() => {
        currentIndex = (currentIndex + speed) % totalPoints;
        const floorIndex = Math.floor(currentIndex);
        if (floorIndex < totalPoints) {
            const currentPosition = positions[floorIndex];

            if (currentPosition) {
                // Sample the terrain height at the current position
                Cesium.sampleTerrainMostDetailed(terrainProvider, [Cesium.Cartographic.fromCartesian(currentPosition)])
                    .then((updatedPositions) => {
                        const updatedPosition = Cesium.Cartesian3.fromRadians(
                            updatedPositions[0].longitude,
                            updatedPositions[0].latitude,
                            updatedPositions[0].height
                        );
                        routeEntity.position = updatedPosition;
                    });

                // Update camera view
                viewer.camera.lookAt(
                    currentPosition, // The target position to look at
                    new Cesium.HeadingPitchRange(
                        viewer.camera.heading,
                        Cesium.Math.toRadians(-30),
                        100
                    )
                );
            }
        }
    });
}


