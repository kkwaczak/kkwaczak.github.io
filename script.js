// --- Konfiguracja układu współrzędnych ---
var warstwa = JSON.parse(
    '[{ "mapTileLayer": "PLAN_1936", "mapSource": "PLAN_1936", "dataSource": "DANE_WAWA", "format": "JPEG", "xyzStorageScheme": "true", "utfgrid": "false", "transparent": false, "coordSys": { "srid": 2178, "type": "PROJECTED", "distConvFactor": 1.0, "minX": 7340000.0, "minY": 5700000.0, "maxX": 7670000.0, "maxY": 5890000.0 }, "zoomLevels": [{ "zoomLevel": 0, "name": "level0", "scale": "1023999.9999999999", "tileWidth": 69358.93333333332, "tileHeight": 69358.93333333332, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 1, "name": "level1", "scale": "511999.99999999994", "tileWidth": 34679.46666666666, "tileHeight": 34679.46666666666, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 2, "name": "level2", "scale": "255999.99999999997", "tileWidth": 17339.73333333333, "tileHeight": 17339.73333333333, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 3, "name": "level3", "scale": "127999.99999999999", "tileWidth": 8669.866666666665, "tileHeight": 8669.866666666665, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 4, "name": "level4", "scale": "63999.99999999999", "tileWidth": 4334.9333333333325, "tileHeight": 4334.9333333333325, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 5, "name": "level5", "scale": "31999.999999999996", "tileWidth": 2167.4666666666662, "tileHeight": 2167.4666666666662, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 6, "name": "level6", "scale": "25000.0", "tileWidth": 1693.3333333333333, "tileHeight": 1693.3333333333333, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 7, "name": "level7", "scale": "15999.999999999998", "tileWidth": 1083.7333333333331, "tileHeight": 1083.7333333333331, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 8, "name": "level8", "scale": "12000.0", "tileWidth": 812.8, "tileHeight": 812.8, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 9, "name": "level9", "scale": "7999.999999999999", "tileWidth": 541.8666666666666, "tileHeight": 541.8666666666666, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 10, "name": "level10", "scale": "6000.0", "tileWidth": 406.4, "tileHeight": 406.4, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 11, "name": "level11", "scale": "5000.000000000001", "tileWidth": 338.6666666666667, "tileHeight": 338.6666666666667, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 12, "name": "level12", "scale": "3999.9999999999995", "tileWidth": 270.9333333333333, "tileHeight": 270.9333333333333, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 13, "name": "level13", "scale": "3000.0", "tileWidth": 203.2, "tileHeight": 203.2, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 14, "name": "level14", "scale": "1999.9999999999998", "tileWidth": 135.46666666666664, "tileHeight": 135.46666666666664, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 15, "name": "level15", "scale": "999.9999999999999", "tileWidth": 67.73333333333332, "tileHeight": 67.73333333333332, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 16, "name": "level16", "scale": "499.99999999999994", "tileWidth": 33.86666666666666, "tileHeight": 33.86666666666666, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 17, "name": "level17", "scale": "249.99999999999997", "tileWidth": 16.93333333333333, "tileHeight": 16.93333333333333, "tileImageWidth": 256, "tileImageHeight": 256 }, { "zoomLevel": 18, "name": "level18", "scale": "124.99999999999996", "tileWidth": 8.466666666666663, "tileHeight": 8.466666666666663, "tileImageWidth": 256, "tileImageHeight": 256 }] }]',
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
        var mapName = this.options.mapname;
        if (y < 0 || x < 0) return "";
        return "https://testmapa.um.warszawa.pl/mapviewer/mcserver?" +
               "request=gettile&format=PNG" + 
               "&zoomlevel=" + zoom +
               "&mapcache=" + mapName +
               "&mx=" + x + "&my=" + y;
    }
});

// --- KONFIGURACJA WARSTW ---
var mapOptions = { minZoom: 0, maxZoom: resolutions.length - 1, noWrap: true, continuousWorld: true };

var lindley1 = new L.podkladWarszawski('', { ...mapOptions, mapname: "DANE_WAWA.LINDLEY" });
var lindley2 = new L.podkladWarszawski('', { ...mapOptions, mapname: "DANE_WAWA.LINDLEY_2500_H" });
var lindley3 = new L.podkladWarszawski('', { ...mapOptions, mapname: "DANE_WAWA.LINDLEY_2500_S_1900" });
var lindley4 = new L.podkladWarszawski('', { ...mapOptions, mapname: "DANE_WAWA.LINDLEY_2500_S" });
var planBos = new L.podkladWarszawski('', { ...mapOptions, mapname: "DANE_WAWA.PLAN_BOS" });
var plan1936 = new L.podkladWarszawski('', { ...mapOptions, mapname: "DANE_WAWA.PLAN_1936" });
var warszawaPodklad = new L.podkladWarszawski('', { ...mapOptions, mapname: "DANE_WAWA.WARSZAWA_PODKLAD_WEKTOR" });

// --- KONFIGURACJA MAPY ---
var map = L.map('map', {
    crs: crs2178,
    continuousWorld: true,
    worldCopyJump: false,
    layers: [lindley4]
}).setView([52.22878, 21.0033], 13);

var markersLayer = new L.LayerGroup().addTo(map);

var baseMaps = {
    "Mapa Warszawy": warszawaPodklad,
    "Plan BOS": planBos,
    "Plan 1936": plan1936,
    "Lindley1": lindley1,
    "Lindley2": lindley2,
    "Lindley3": lindley3,
    "Lindley4": lindley4
};

L.control.layers(baseMaps).setPosition("bottomleft").addTo(map);

// --- LOGIKA PUNKTÓW I TABELI ---
let allPoints = [];

window.zoomToPoint = function(lat, lon) {
    map.setView([lat, lon], 17);
};

function renderTable() {
    const tbody = document.querySelector('#points-table tbody');
    if (!tbody) return;
    tbody.innerHTML = ''; 

    allPoints.sort((a, b) => {
        return a.hip.toString().localeCompare(b.hip.toString(), undefined, { numeric: true, sensitivity: 'base' });
    });

    allPoints.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <a href="javascript:void(0)" class="point-link" onclick="zoomToPoint(${item.gps.lat}, ${item.gps.lon})">
                    ${item.hip}
                </a>
            </td>
            <td>
                <button class="btn-delete" onclick="deletePoint('${item.hip}')">Usuń</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addMarkerToMap(hipNumber, lat, lon) {
    var marker = L.circleMarker([lat, lon], {
        radius: 5.0,          
        color: '#0000FF',     
        fillColor: '#0000FF', 
        fillOpacity: 1,       
        weight: 1,            
        title: hipNumber      
    });

    marker.options.title = hipNumber;
    marker.bindPopup(`<strong>HIP: ${hipNumber}</strong><br><br><button onclick="deletePoint('${hipNumber}')">Usuń</button>`);
    markersLayer.addLayer(marker);
}

window.deletePoint = function(hip) {
    if (confirm("Usunąć " + hip + "?")) {
        fetch('/api/delete/' + encodeURIComponent(hip), { method: 'DELETE' })
        .then(res => {
            if (res.ok) {
                markersLayer.eachLayer(l => { 
                    if (l.options.title === hip) markersLayer.removeLayer(l); 
                });
                allPoints = allPoints.filter(p => p.hip !== hip);
                renderTable();
            }
        });
    }
};

// --- START: WCZYTYWANIE DANYCH Z PLIKU hip.txt (Struktura JSON) ---
function loadData() {
    fetch('hip.txt')
        .then(response => {
            if (!response.ok) throw new Error('Nie można załadować pliku hip.txt');
            return response.json();
        })
        .then(data => {
            // Używamy data["hip"] zgodnie ze strukturą pliku
            if (data && data["hip"]) {
                allPoints = data["hip"];
                allPoints.forEach(item => {
                    if (item.gps && item.gps.lat && item.gps.lon) {
                        addMarkerToMap(item.hip, item.gps.lat, item.gps.lon);
                    }
                });
                renderTable();
            }
        })
        .catch(err => console.error("Błąd wczytywania punktów:", err));
}

loadData();

// --- OBSŁUGA KLIKNIĘCIA (DODAWANIE NOWYCH) ---
map.on('click', function(e) {
    var hip = prompt("Podaj numer HIP: ");
    if (hip && hip.trim() !== "") {
        hip = hip.trim();
        if (allPoints.some(p => p.hip === hip)) return alert("Istnieje!");
        
        var newEntry = { "hip": hip, "gps": { "lat": e.latlng.lat, "lon": e.latlng.lng } };
        
        fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEntry)
        }).then(res => {
            if (res.ok) {
                allPoints.push(newEntry);
                addMarkerToMap(hip, e.latlng.lat, e.latlng.lng);
                renderTable();
            }
        });
    }
});

map.addControl(new L.Control.Search({ layer: markersLayer, initial: false, zoom: 15, marker: false }));

