// scripts/gpxParser.js

function parseGPX(gpxText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, "application/xml");

  const name = xmlDoc.getElementsByTagName("name")[0]?.textContent; // Extract route name
  const trkpts = xmlDoc.getElementsByTagName("trkpt");
  const route = [];

  for (let i = 0; i < trkpts.length; i++) {
      const trkpt = trkpts[i];
      const lat = parseFloat(trkpt.getAttribute("lat"));
      const lon = parseFloat(trkpt.getAttribute("lon"));
      const ele = parseFloat(trkpt.getElementsByTagName("ele")[0].textContent);
      const time = trkpt.getElementsByTagName("time")[0]?.textContent; // Extract time
      route.push({ lat, lon, ele, time });
  }

  return { name, coordinates: route };
}
