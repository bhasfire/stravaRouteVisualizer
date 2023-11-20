// scripts/mileMarker.js

let mileMarkers = [];
let showMileMarkers = true; // Default value
let showPace = true;
let showTime = true;

function updateMileMarkers(viewer, routeData, useEstimatedPace) {
    // Remove existing mile markers
    clearMileMarkers(viewer);

    // Add new mile markers with updated pace calculation
    processRouteForMileMarkers(routeData, viewer, useEstimatedPace);
}

function updateMileMarkerDisplay(options) {
    if (options.hasOwnProperty('showPace')) {
        showPace = options.showPace;
    }
    if (options.hasOwnProperty('showTime')) {
        showTime = options.showTime;
    }
    // Re-process the route to update mile markers
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
            // Split the label content by line breaks to separate mile, time, and pace
            let contentParts = labelContent.split('\n');

            // Based on settings, filter out pace or time from the label
            if (!showPace) {
                contentParts = contentParts.filter(part => !part.includes('Pace'));
            }
            if (!showTime) {
                contentParts = contentParts.filter(part => !part.includes('Time'));
            }

            // Re-join the parts to form the final label content
            let finalLabelContent = contentParts.join('\n');

            // Add the mile marker with the updated label content
            const entity = viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lon, lat, updatedPositions[0].height + 2),
                billboard: {
                    image: './icons/pin3.png', // Path to your checkpoint image
                    scale: 1, // Adjust scale as needed
                    pixelOffset: new Cesium.Cartesian2(0, -25), // Adjust offset to position the icon correctly relative to the label
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 20000) // Adjust max distance as needed
                },
                label: {
                    text: finalLabelContent,
                    font: 'bold 9pt Arial, sans-serif', // Increased font size
                    fillColor: Cesium.Color.WHITE, // Bright font color
                    pixelOffset: new Cesium.Cartesian2(0, -50),
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 5, // Thicker outline
                    outlineColor: Cesium.Color.BLACK, // Dark outline for contrast
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    scaleByDistance: new Cesium.NearFarScalar(1e2, 1.5, 1.5e7, 0.5), // Adjust values for your need
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10000), // Adjust max distance as needed
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    translucencyByDistance: new Cesium.NearFarScalar(1e3, 1.0, 1.5e7, 0.5) // Glow effect
                }
            });
            
            mileMarkers.push(entity);
        });
}


function processRouteForMileMarkers(routeData, viewer, useEstimatedPace = false) {
    clearMileMarkers(viewer);

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

            if (useEstimatedPace && speed >= speedThresholdKmH) {
                movingTimeSeconds += (new Date(point.time) - new Date(lastPoint.time)) / 1000;
            } else {
                elapsedTimeSeconds += (new Date(point.time) - new Date(lastPoint.time)) / 1000;
            }

            if (cumulativeDistance >= 1.60934) { // Check if 1 mile is covered
                mileCounter++;
                let pace = useEstimatedPace ? calculatePace(cumulativeDistance, movingTimeSeconds) : calculatePace(cumulativeDistance, elapsedTimeSeconds);

                console.log(`Mile ${mileCounter}: Time - ${formatTimeToLocal(point.time)}, Pace - ${pace} min/mi`);

                if (showMileMarkers) {
                    const labelContent = `Mile ${mileCounter}\nTime: ${formatTimeToLocal(point.time)}\nPace: ${pace} min/mi`;
                    addMileMarker(viewer, point.lat, point.lon, mileCounter, labelContent);
                }

                // Reset distance and time for the next mile
                cumulativeDistance = 0;
                movingTimeSeconds = 0;
                elapsedTimeSeconds = 0;
            }
            lastPoint = point;
        }
    });
}

function toggleMileMarkers(shouldShow) {
    showMileMarkers = shouldShow;
    if (!shouldShow) {
        mileMarkers.forEach(marker => viewer.entities.remove(marker));
        mileMarkers = [];
    } else {
        // Re-process the route to show mile markers
        processRouteForMileMarkers(routeData, viewer, useEstimatedPace);
    }
}

function clearMileMarkers(viewer) {
    mileMarkers.forEach(marker => viewer.entities.remove(marker));
    mileMarkers = [];
}

window.updateMileMarkerDisplay = updateMileMarkerDisplay;
window.toggleMileMarkers = toggleMileMarkers;
window.processRouteForMileMarkers = processRouteForMileMarkers;
