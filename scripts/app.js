Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTVkMzhjYS1kMDc4LTRlMzYtOWNkNy05ZTY4OTZiMzNkYWIiLCJpZCI6MTc4NjIwLCJpYXQiOjE3MDAyNjA4MDJ9.exY7Ym_WUi_59ZWn18FKzw8Ue62LzQhJmdKHCd8JxUE';

// import { visualizeRoute } from './scripts/routeVisualizer.js';

let viewer;  // Declare the viewer at the top scope
let animationControl = { isAnimating: false }; // Wrap isAnimating in an object
let speedControl = { speed: 0.1 }; // Wrap speed in an object

document.addEventListener('DOMContentLoaded', () => {
    viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain(),

    });

    // Add Google's Photorealistic 3D Tiles
    const tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url: 'https://tile.googleapis.com/v1/3dtiles/root.json?key=AIzaSyCbWqOhzPZhDPVbRS_xd4p9KsHTZKbmju4',
        showCreditsOnScreen: false,
    }));

    fetch('data/atx23_marathon.gpx')
        .then(response => response.text())
        .then(gpxText => {
            const data = parseGPX(gpxText);
            console.log(data); // Log to check the route data

            // Call preloadTerrainData here
            preloadTerrainData(data.coordinates, viewer.terrainProvider, () => {
                console.log("Terrain data preloaded");
                document.getElementById('startButton').disabled = false;
            });

            visualizeRoute(data, viewer, animationControl, speedControl); // Pass the speed object

        })
        .catch(error => {
            console.error('Error fetching or parsing GPX file:', error);
        });


    document.getElementById('startButton').addEventListener('click', () => {
        animationControl.isAnimating = true;
    });
    
    document.getElementById('pauseButton').addEventListener('click', () => {
        animationControl.isAnimating = false;
    });

    document.getElementById('speedUpButton').addEventListener('click', () => {
        speedControl.speed += 0.5; // Increase speed
        console.log("Speed increased to:", speedControl.speed); // Log the new speed
    });
    
    document.getElementById('speedDownButton').addEventListener('click', () => {
        speedControl.speed -= 0.5; // Decrease speed
        if (speedControl.speed < 0.1) speedControl.speed = 0.1; // Prevent negative speed
        console.log("Speed decreased to:", speedControl.speed); // Log the new speed
    });
    
});

function preloadTerrainData(coordinates, terrainProvider, callback) {
    console.log("Preloading terrain data..."); // Log preloading start
    const samplePoints = coordinates.map(point => Cesium.Cartographic.fromDegrees(point.lon, point.lat));
    Cesium.sampleTerrainMostDetailed(terrainProvider, samplePoints).then(() => {
        console.log("Terrain data loaded successfully"); // Log successful loading
        callback();
    });
}





