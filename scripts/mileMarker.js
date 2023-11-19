// scripts/mileMarker.js

function getDistanceBetweenPoints(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

function addMileMarker(viewer, lat, lon, mileNumber) {
    var positions = [Cesium.Cartographic.fromDegrees(lon, lat)];

    Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions)
        .then(function(updatedPositions) {
            // Use the updated position with the correct altitude
            viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lon, lat, updatedPositions[0].height + 2), // Adjust height as needed
                point: {
                    pixelSize: 15,
                    color: Cesium.Color.BLUE,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                label: {
                    text: `Mile ${mileNumber}`,
                    font: '14pt sans-serif',
                    pixelOffset: new Cesium.Cartesian2(0, 15),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
        });
}



function processRouteForMileMarkers(routeData, viewer) {
    let cumulativeDistance = 0;
    let lastPoint = routeData.coordinates[0];
    let mileCounter = 0;

    routeData.coordinates.forEach((point, index) => {
        if (index > 0) {
            cumulativeDistance += getDistanceBetweenPoints(lastPoint.lat, lastPoint.lon, point.lat, point.lon);
            if (cumulativeDistance >= 1.60934) { // 1 mile in kilometers
                mileCounter++;
                addMileMarker(viewer, point.lat, point.lon, mileCounter);
                cumulativeDistance = 0;
            }
            lastPoint = point;
        }
    });
}


window.processRouteForMileMarkers = processRouteForMileMarkers;