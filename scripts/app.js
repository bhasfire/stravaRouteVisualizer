Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTVkMzhjYS1kMDc4LTRlMzYtOWNkNy05ZTY4OTZiMzNkYWIiLCJpZCI6MTc4NjIwLCJpYXQiOjE3MDAyNjA4MDJ9.exY7Ym_WUi_59ZWn18FKzw8Ue62LzQhJmdKHCd8JxUE';

let viewer;  // Declare the viewer at the top scope

document.addEventListener('DOMContentLoaded', () => {
    viewer = new Cesium.Viewer('cesiumContainer', {
        // ...viewer settings...
    });

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
    const totalPoints = positions.length; // Ensure this is accessible within the function
    let currentIndex = 0;
    const speed = 0.1; // Adjust speed as needed

    // Create the route polyline
    viewer.entities.add({
        polyline: {
            positions: positions,
            width: 5,
            material: Cesium.Color.RED
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

    const heightAboveTrack = 100; // Height above the route in meters
    const pitchAngle = -30; // Adjust for a better view

    viewer.clock.onTick.addEventListener(() => {
        currentIndex = (currentIndex + speed) % totalPoints;
        const floorIndex = Math.floor(currentIndex);
        if (floorIndex < totalPoints) {
            const currentPosition = positions[floorIndex];

            if (currentPosition) {
                routeEntity.position = currentPosition;

                // Using lookAt to position the camera
                viewer.camera.lookAt(
                    currentPosition, // The target position to look at
                    new Cesium.HeadingPitchRange(
                        viewer.camera.heading, // Keep current heading or adjust as needed
                        Cesium.Math.toRadians(pitchAngle), // Pitch angle
                        heightAboveTrack // Height above the target position
                    )
                );
            }
        }
    });

}

