function parseGPX(gpxText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxText, "application/xml");

  const name = xmlDoc.getElementsByTagName("name")[0]?.textContent || "Unnamed Route";
  const trkpts = xmlDoc.getElementsByTagName("trkpt");
  const coordinates = [];

  for (let i = 0; i < trkpts.length; i++) {
      const trkpt = trkpts[i];
      const lat = parseFloat(trkpt.getAttribute("lat"));
      const lon = parseFloat(trkpt.getAttribute("lon"));
      const ele = parseFloat(trkpt.getElementsByTagName("ele")[0]?.textContent);
      const time = trkpt.getElementsByTagName("time")[0]?.textContent;
      const extensions = trkpt.getElementsByTagName("gpxtpx:TrackPointExtension")[0];
      const atemp = extensions ? parseFloat(extensions.getElementsByTagName("gpxtpx:atemp")[0]?.textContent) : null;
      const hr = extensions ? parseFloat(extensions.getElementsByTagName("gpxtpx:hr")[0]?.textContent) : null;
      const cad = extensions ? parseFloat(extensions.getElementsByTagName("gpxtpx:cad")[0]?.textContent) : null;

      coordinates.push({ lat, lon, ele, time, atemp, hr, cad });
  }

  return { name, coordinates };
}
