Cesium.Ion.defaultAccessToken = process.env.CESIUM_ION_TOKEN;

let viewer;  
let routeData; // Declare a variable to store the route data
let animationControl = { isAnimating: false, isFirstStart: true };
let speedControl = { speed: 0.1 }; 

document.addEventListener('DOMContentLoaded', () => {
    viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain(),

    });

    // Add Google's Photorealistic 3D Tiles
    const tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
        url: 'https://tile.googleapis.com/v1/3dtiles/root.json?key=${process.env.GOOGLE_TILESET_KEY}',
        showCreditsOnScreen: false,
    }));

    fetch('data/atx23_marathon.gpx')
        .then(response => response.text())
        .then(gpxText => {
            routeData = parseGPX(gpxText); // Assign data to the global variable
            console.log(routeData); // Log to check the route data

            // Call preloadTerrainData here
            preloadTerrainData(routeData.coordinates, viewer.terrainProvider, () => {
                console.log("Terrain data preloaded");
                document.getElementById('startButton').disabled = false;
            });

            window.visualizeRoute(routeData, viewer, animationControl, speedControl);

        })
        .catch(error => {
            console.error('Error fetching or parsing GPX file:', error);
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
        if (speedControl.speed < 0.1) speedControl.speed = 0.1; // Prevent negative speed
        console.log("Speed decreased to:", speedControl.speed); // Log the new speed
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





