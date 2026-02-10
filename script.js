// --- Konfiguracja układu współrzędnych ---
var warstwa = JSON.parse(
    '[{ "mapTileLayer": "PLAN_1936", "coordSys": { "srid": 2178, "minX": 7340000.0, "minY": 5700000.0, "maxX": 7670000.0, "maxY": 5890000.0 }, "zoomLevels": [{ "zoomLevel": 0, "scale": "1023999.9999999999", "tileWidth": 69358.93333333332, "tileImageWidth": 256 }, { "zoomLevel": 1, "scale": "511999.99999999994", "tileWidth": 34679.46666666666, "tileImageWidth": 256 }, { "zoomLevel": 2, "scale": "255999.99999999997", "tileWidth": 17339.73333333333, "tileImageWidth": 256 }, { "zoomLevel": 3, "scale": "127999.99999999999", "tileWidth": 8669.866666666665, "tileImageWidth": 256 }, { "zoomLevel": 4, "scale": "63999.99999999999", "tileWidth": 4334.9333333333325, "tileImageWidth": 256 }, { "zoomLevel": 5, "scale": "31999.999999999996", "tileWidth": 2167.4666666666662, "tileImageWidth": 256 }, { "zoomLevel": 6, "scale": "25000.0", "tileWidth": 1693.3333333333333, "tileImageWidth": 256 }, { "zoomLevel": 7, "scale": "15999.999999999998", "tileWidth": 1083.7333333333331, "tileImageWidth": 256 }, { "zoomLevel": 8, "scale": "12000.0", "tileWidth": 812.8, "tileImageWidth": 256 }, { "zoomLevel": 9, "scale": "7999.999999999999", "tileWidth": 541.8666666666666, "tileImageWidth": 256 }, { "zoomLevel": 10, "scale": "6000.0", "tileWidth": 406.4, "tileImageWidth": 256 }, { "zoomLevel": 11, "scale": "5000.000000000001", "tileWidth": 338.6666666666667, "tileImageWidth": 256 }, { "zoomLevel": 12, "scale": "3999.9999999999995", "tileWidth": 270.9333333333333, "tileImageWidth": 256 }, { "zoomLevel": 13, "scale": "3000.0", "tileWidth": 203.2, "tileImageWidth": 256 }, { "zoomLevel": 14, "scale": "1999.9999999999998", "tileWidth": 135.46666666666664, "tileImageWidth": 256 }, { "zoomLevel": 15, "scale": "999.9999999999999", "tileWidth": 67.73333333333332, "tileImageWidth": 256 }, { "zoomLevel": 16, "scale": "499.99999999999994", "tileWidth": 33.86666666666666, "tileImageWidth": 256 }, { "zoomLevel": 17, "scale": "249.99999999999997", "tileWidth": 16.93333333333333, "tileImageWidth": 256 }, { "zoomLevel": 18, "scale": "124.99999999999996", "tileWidth": 8.466666666666663, "tileImageWidth": 256 }]} ]'
)[0];

var resolutions = warstwa.zoomLevels.map(l => l.tileWidth / l.tileImageWidth);
var crs2178 = new L.Proj.CRS('EPSG:2178', "+proj=tmerc +lat_0=0 +lon_0=21 +k=0.999923 +x_0=7500000 +y_0=0 +ellps=GRS80 +units=m +no_defs", {
    resolutions: resolutions,
    origin: [warstwa.coordSys.minX, warstwa.coordSys.minY]
});

// --- DEFINICJA KLASY PODKŁADU ---
L.podkladWarszawski = L.TileLayer.extend({
    getTileUrl: function(coords) {
        var x = coords.x;
        var y = -coords.y - 1;
        var zoom = coords.z;
        if (y < 0 || x < 0) return "";
        return "https://testmapa.um.warszawa.pl/mapviewer/mcserver?request=gettile&format=PNG&zoomlevel=" + zoom + "&mapcache=" + this.options.mapname + "&mx=" + x + "&my=" + y;
    }
});

var mapOptions = { minZoom: 0, maxZoom: resolutions.length - 1, noWrap: true };

// --- WARSTWY ---
var baseMaps = {
    "Lindley (Plan S)": new L.podkladWarszawski('', { ...mapOptions, mapname: "DANE_WAWA.LINDLEY_2500_S" }),
    "Plan 1936": new L.podkladWarszawski('', { ...mapOptions, mapname: "DANE_WAWA.PLAN_1936" }),
    "Plan BOS": new L.podkladWarszawski('', { ...mapOptions, mapname: "DANE_WAWA.PLAN_BOS" }),
    "Wektor": new L.podkladWarszawski('', { ...mapOptions, mapname: "DANE_WAWA.WARSZAWA_PODKLAD_WEKTOR" })
};

var map = L.map('map', {
    crs: crs2178,
    layers: [baseMaps["Lindley (Plan S)"]]
}).setView([52.2210, 21.0150], 16);

L.control.layers(baseMaps).setPosition("bottomleft").addTo(map);

var markersLayer = new L.LayerGroup().addTo(map);

// --- FUNKCJE WYŚWIETLANIA ---
window.zoomToPoint = function(lat, lon) {
    map.setView([lat, lon], 17);
};

function addMarkerToMap(hip, lat, lon) {
    var marker = L.circleMarker([lat, lon], {
        radius: 5,
        color: '#0000FF',
        fillColor: '#0000FF',
        fillOpacity: 1,
        weight: 1
    });
    marker.options.title = hip;
    marker.bindPopup(`<strong>HIP: ${hip}</strong>`);
    markersLayer.addLayer(marker);
}

function renderTable(points) {
    const tbody = document.querySelector('#points-table tbody');
    if (!tbody) return;
    
    points.sort((a, b) => a.hip.toString().localeCompare(b.hip.toString(), undefined, { numeric: true }));

    points.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `<td><a href="#" class="point-link" onclick="zoomToPoint(${item.gps.lat}, ${item.gps.lon}); return false;">${item.hip}</a></td>`;
        tbody.appendChild(row);
    });
}

// --- ŁADOWANIE DANYCH Z PLIKU ---
fetch('hip.txt')
    .then(response => response.json())
    .then(data => {
        if (data.hipy) {
            data.hipy.forEach(item => addMarkerToMap(item.hip, item.gps.lat, item.gps.lon));
            renderTable(data.hipy);
        }
    })
    .catch(err => console.error("Błąd ładowania pliku hip.txt:", err));

map.addControl(new L.Control.Search({ layer: markersLayer, initial: false, zoom: 17, marker: false }));
