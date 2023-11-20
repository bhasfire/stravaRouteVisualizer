//require('dotenv').config();

// Cesium.Ion.defaultAccessToken = process.env.CESIUM_ION_TOKEN;
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTVkMzhjYS1kMDc4LTRlMzYtOWNkNy05ZTY4OTZiMzNkYWIiLCJpZCI6MTc4NjIwLCJpYXQiOjE3MDAyNjA4MDJ9.exY7Ym_WUi_59ZWn18FKzw8Ue62LzQhJmdKHCd8JxUE';


let viewer;  
let routeData; // Declare a variable to store the route data
let animationControl = { isAnimating: false, isFirstStart: true };
let speedControl = { speed: 0.1 }; 
// let useEstimatedPace = true; // Default value based on checkbox's initial state

document.addEventListener('DOMContentLoaded', async () => {
    const terrainProvider = await Cesium.createWorldTerrainAsync();
    viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: terrainProvider,
    });

    // Add Google's Photorealistic 3D Tiles
    Cesium.Cesium3DTileset.fromUrl('https://tile.googleapis.com/v1/3dtiles/root.json?key=AIzaSyCbWqOhzPZhDPVbRS_xd4p9KsHTZKbmju4')
    .then(tileset => {
        viewer.scene.primitives.add(tileset);
    })
    .catch(error => {
        console.error('Error loading 3D Tiles:', error);
    });

        document.getElementById('fileInput').addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const gpxText = e.target.result;
                    routeData = parseGPX(gpxText);
                    console.log(routeData);

                    document.getElementById('routeNameDisplay').textContent = `Route: ${routeData.name}`;
                    // Update the first data point's values as an example
                    const firstPoint = routeData.coordinates[0];
                    document.getElementById('elevationDisplay').textContent = `Elevation: ${firstPoint.ele} meters`;
                    document.getElementById('heartRateDisplay').textContent = `Heart Rate: ${firstPoint.hr || '--'} bpm`;
                    document.getElementById('cadenceDisplay').textContent = `Cadence: ${firstPoint.cad || '--'} rpm`;
                    document.getElementById('temperatureDisplay').textContent = `Temperature: ${firstPoint.atemp || '--'} °C`;

                    preloadTerrainData(routeData.coordinates, viewer.terrainProvider, () => {
                        console.log("Terrain data preloaded");
                        document.getElementById('startButton').disabled = false;
                    });
                    window.visualizeRoute(routeData, viewer, animationControl, speedControl);
                    window.processRouteForMileMarkers(routeData, viewer);
                };
                reader.readAsText(file);
            }
        });


        document.getElementById('startButton').addEventListener('click', () => {
            if (animationControl.isFirstStart && routeData) {
                // Ensure routeData is available before flying to start
                flyToStart(viewer, Cesium.Cartesian3.fromDegrees(routeData.coordinates[0].lon, routeData.coordinates[0].lat, routeData.coordinates[0].ele), () => {
                    animationControl.isAnimating = true;
                    animationControl.isFirstStart = false;
                });
            } else {
                animationControl.isAnimating = true;
            }
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
        console.log("Speed decreased to:", speedControl.speed); // Log the new speed
    });

    document.getElementById('togglePace').addEventListener('change', function() {
        const useEstimatedPace = this.checked;
        window.updateMileMarkers(viewer, routeData, useEstimatedPace);
    });
    
});

function flyToStart(viewer, startPosition, callback) {
    viewer.camera.flyTo({
        destination: startPosition,
        complete: callback,
        duration: 3 // Duration in seconds, adjust as needed
    });
}

function preloadTerrainData(coordinates, terrainProvider, callback) {
    console.log("Preloading terrain data..."); // Log preloading start
    const samplePoints = coordinates.map(point => Cesium.Cartographic.fromDegrees(point.lon, point.lat));
    Cesium.sampleTerrainMostDetailed(terrainProvider, samplePoints).then(() => {
        console.log("Terrain data loaded successfully"); // Log successful loading
        callback();
    });
}





