// scripts/mileMarker.js

let mileMarkers = [];

function updateMileMarkers(viewer, routeData, useEstimatedPace) {
    // Remove existing mile markers
    mileMarkers.forEach(marker => viewer.entities.remove(marker));
    mileMarkers = [];

    // Add new mile markers with updated pace calculation
    processRouteForMileMarkers(routeData, viewer, useEstimatedPace);
}

// Helper function to format time
function formatTimeToLocal(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString(); // Local time format HH:mm:ss
}

// Helper function to convert pace to min:sec format
function convertToMinSec(pace) {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper function to calculate pace (min/mile)
function calculatePace(distanceKm, movingTimeSeconds) {
    // Convert distance to miles
    const distanceMiles = distanceKm / 1.60934;
    const paceMinPerMile = movingTimeSeconds / 60 / distanceMiles;
    return convertToMinSec(paceMinPerMile);
}

// Helper function to calculate speed in km/h between two points
function calculateSpeed(lat1, lon1, time1, lat2, lon2, time2) {
    const distanceKm = getDistanceBetweenPoints(lat1, lon1, lat2, lon2);
    const timeHours = ((new Date(time2) - new Date(time1)) / 1000) / 3600;
    return distanceKm / timeHours;
}

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

function addMileMarker(viewer, lat, lon, mileNumber, labelContent) {
    var positions = [Cesium.Cartographic.fromDegrees(lon, lat)];

    Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions)
        .then(function(updatedPositions) {
            const entity = viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lon, lat, updatedPositions[0].height + 2),
                point: {
                    pixelSize: 15,
                    color: Cesium.Color.BLUE,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                label: {
                    text: labelContent,
                    font: '14pt sans-serif',
                    pixelOffset: new Cesium.Cartesian2(0, 15),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
            mileMarkers.push(entity);
        });
}


function processRouteForMileMarkers(routeData, viewer, useEstimatedPace = false) {
    let cumulativeDistance = 0; // Distance in kilometers
    let movingTimeSeconds = 0; // Moving time in seconds for estimated pace
    let elapsedTimeSeconds = 0; // Elapsed time in seconds for total elapsed pace
    let lastPoint = routeData.coordinates[0];
    let mileCounter = 0;

    const speedThresholdKmH = 1; // Define a speed threshold, below which is considered paused

    routeData.coordinates.forEach((point, index) => {
        if (index > 0) {
            const speed = calculateSpeed(lastPoint.lat, lastPoint.lon, lastPoint.time, point.lat, point.lon, point.time);
            
            const segmentDistance = getDistanceBetweenPoints(lastPoint.lat, lastPoint.lon, point.lat, point.lon);
            cumulativeDistance += segmentDistance;
            elapsedTimeSeconds += (new Date(point.time) - new Date(lastPoint.time)) / 1000;

            if (useEstimatedPace && speed >= speedThresholdKmH) {
                movingTimeSeconds += (new Date(point.time) - new Date(lastPoint.time)) / 1000;
            }

            if (cumulativeDistance >= 1.60934) { // Check if 1 mile is covered
                mileCounter++;
                let pace;
                if (useEstimatedPace) {
                    pace = calculatePace(cumulativeDistance, movingTimeSeconds); // Use moving time for this mile
                } else {
                    pace = calculatePace(cumulativeDistance, elapsedTimeSeconds); // Use elapsed time for this mile
                }

                console.log(`Mile ${mileCounter}: Time - ${formatTimeToLocal(point.time)}, Pace - ${pace} min/mi`);
                
                const labelContent = `Mile ${mileCounter}\nTime: ${formatTimeToLocal(point.time)}\nPace: ${pace} min/mi`;
                addMileMarker(viewer, point.lat, point.lon, mileCounter, labelContent);
                
                // Reset distance and time for the next mile
                cumulativeDistance = 0;
                movingTimeSeconds = 0;
                elapsedTimeSeconds = 0;
            }
            lastPoint = point;
        }
    });
}

window.processRouteForMileMarkers = processRouteForMileMarkers;