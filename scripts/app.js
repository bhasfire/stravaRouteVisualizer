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
    // Use the already initialized viewer here
    const positions = route.map(point => Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.ele));

    viewer.entities.add({
        polyline: {
            positions: positions,
            width: 5,
            material: Cesium.Color.RED
        }
    });

    viewer.zoomTo(viewer.entities);
}
