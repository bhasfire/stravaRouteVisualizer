//require('dotenv').config();

// Cesium.Ion.defaultAccessToken = process.env.CESIUM_ION_TOKEN;
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTVkMzhjYS1kMDc4LTRlMzYtOWNkNy05ZTY4OTZiMzNkYWIiLCJpZCI6MTc4NjIwLCJpYXQiOjE3MDAyNjA4MDJ9.exY7Ym_WUi_59ZWn18FKzw8Ue62LzQhJmdKHCd8JxUE';


let viewer;  
let routeData; // Declare a variable to store the route data
let animationControl = { isAnimating: false, isFirstStart: true };
let speedControl = { speed: 0.1 }; 
let useEstimatedPace = true; // Default value based on checkbox's initial state

document.addEventListener('DOMContentLoaded', async () => {
    const terrainProvider = await Cesium.createWorldTerrainAsync();
    viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: terrainProvider,
        // Enable lighting effects
        scene3DOnly: true,
        shadows: true,
        shouldAnimate: true,
        sunlight: true,
        moonlight: true
    });
    const isDynamicLightingEnabled = document.getElementById('toggleDynamicLighting').checked;
    viewer.scene.globe.enableLighting = isDynamicLightingEnabled;
    
    // Add Google's Photorealistic 3D Tiles
    Cesium.Cesium3DTileset.fromUrl('https://tile.googleapis.com/v1/3dtiles/root.json?key=AIzaSyCbWqOhzPZhDPVbRS_xd4p9KsHTZKbmju4')
    .then(tileset => {
        viewer.scene.primitives.add(tileset);
    })
    .catch(error => {
        console.error('Error loading 3D Tiles:', error);
    });


    //File input handling
    document.getElementById('fileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const gpxText = e.target.result;
                routeData = parseGPX(gpxText);
                console.log(routeData);

                let distances = calculateTotalDistances(routeData.coordinates);

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
                window.visualizeRoute(routeData, viewer, animationControl, speedControl, useEstimatedPace, distances);
                window.processRouteForMileMarkers(routeData, viewer, useEstimatedPace);

                // Initialize sub-checkboxes based on the main checkbox's state
                const initialShowMileMarkers = document.getElementById('toggleMileMarkers').checked;
                document.getElementById('togglePaceDisplay').disabled = !initialShowMileMarkers;
                document.getElementById('toggleTimeDisplay').disabled = !initialShowMileMarkers;

                // Event listener for the main checkbox
                document.getElementById('toggleMileMarkers').addEventListener('change', function() {
                    const shouldShow = this.checked;
                    window.toggleMileMarkers(shouldShow);

                    // Enable or disable sub-checkboxes
                    document.getElementById('togglePaceDisplay').disabled = !shouldShow;
                    document.getElementById('toggleTimeDisplay').disabled = !shouldShow;

                    // Update display settings based on the new state
                    const showPace = document.getElementById('togglePaceDisplay').checked;
                    const showTime = document.getElementById('toggleTimeDisplay').checked;
                    window.updateMileMarkerDisplay({ showPace: shouldShow && showPace, showTime: shouldShow && showTime });
                });
            };
            reader.readAsText(file);
        }
    });

    //Button Controls
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
        useEstimatedPace = this.checked;
        window.updateMileMarkers(viewer, routeData, useEstimatedPace);
    });

    // Event listeners for sub-checkboxes
    document.getElementById('togglePaceDisplay').addEventListener('change', function() {
        const showPace = this.checked;
        window.updateMileMarkerDisplay({ showPace });
    });

    document.getElementById('toggleTimeDisplay').addEventListener('change', function() {
        const showTime = this.checked;
        window.updateMileMarkerDisplay({ showTime });
    });
    document.getElementById('toggleDynamicLighting').addEventListener('change', function() {
        viewer.scene.globe.enableLighting = this.checked;
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





