/**
 * KONFIGURACJA UKŁADU WSPÓŁRZĘDNYCH (EPSG:2178 - Układ Warszawski)
 */
var warstwaKonfig = {
    "minX": 7340000.0, "minY": 5700000.0, "maxX": 7670000.0, "maxY": 5890000.0,
    "zoomLevels": [
        { "tileWidth": 69358.93333333332 }, { "tileWidth": 34679.46666666666 },
        { "tileWidth": 17339.73333333333 }, { "tileWidth": 8669.866666666665 },
        { "tileWidth": 4334.9333333333325 }, { "tileWidth": 2167.4666666666662 },
        { "tileWidth": 1693.3333333333333 }, { "tileWidth": 1083.7333333333331 },
        { "tileWidth": 812.8 }, { "tileWidth": 541.8666666666666 },
        { "tileWidth": 406.4 }, { "tileWidth": 338.6666666666667 },
        { "tileWidth": 270.9333333333333 }, { "tileWidth": 203.2 },
        { "tileWidth": 135.46666666666664 }, { "tileWidth": 67.73333333333332 },
        { "tileWidth": 33.86666666666666 }, { "tileWidth": 16.93333333333333 },
        { "tileWidth": 8.466666666666663 }
    ]
};

var resolutions = warstwaKonfig.zoomLevels.map(function(l) { return l.tileWidth / 256; });
var crs2178 = new L.Proj.CRS('EPSG:2178', "+proj=tmerc +lat_0=0 +lon_0=21 +k=0.999923 +x_0=7500000 +y_0=0 +ellps=GRS80 +units=m +no_defs", {
    resolutions: resolutions,
    origin: [warstwaKonfig.minX, warstwaKonfig.minY]
});

/**
 * KLASA PODKŁADU MAPY WARSZAWY
 */
L.PodkladWarszawski = L.TileLayer.extend({
    getTileUrl: function(coords) {
        var x = coords.x;
        var y = -coords.y - 1;
        var zoom = coords.z;
        if (y < 0 || x < 0) return "";
        return "https://testmapa.um.warszawa.pl/mapviewer/mcserver?request=gettile&format=PNG&zoomlevel=" + zoom + "&mapcache=" + this.options.mapname + "&mx=" + x + "&my=" + y;
    }
});

var mapOptions = { minZoom: 0, maxZoom: resolutions.length - 1, noWrap: true };

// Warstwy kafelkowe
var baseMaps = {
    "Lindley (Plan S)": new L.PodkladWarszawski('', { minZoom: 0, maxZoom: 18, noWrap: true, mapname: "DANE_WAWA.LINDLEY_2500_S" }),
    "Plan 1936": new L.PodkladWarszawski('', { minZoom: 0, maxZoom: 18, noWrap: true, mapname: "DANE_WAWA.PLAN_1936" }),
    "Plan BOS": new L.PodkladWarszawski('', { minZoom: 0, maxZoom: 18, noWrap: true, mapname: "DANE_WAWA.PLAN_BOS" }),
    "Wektor": new L.PodkladWarszawski('', { minZoom: 0, maxZoom: 18, noWrap: true, mapname: "DANE_WAWA.WARSZAWA_PODKLAD_WEKTOR" })
};

/**
 * INICJALIZACJA MAPY
 */
var map = L.map('map', {
    crs: crs2178,
    layers: [baseMaps["Lindley (Plan S)"]]
}).setView([52.2210, 21.0150], 16);

L.control.layers(baseMaps).setPosition("bottomleft").addTo(map);

var markersLayer = new L.LayerGroup().addTo(map);

/**
 * FUNKCJE OBSŁUGI PUNKTÓW
 */

window.zoomToPoint = function(lat, lon) {
    map.setView([lat, lon], 17);
};

function addMarkerToMap(hip, lat, lon) {
    var marker = L.circleMarker([lat, lon], {
        radius: 6,
        color: '#ffffff',
        fillColor: '#007bff',
        fillOpacity: 0.9,
        weight: 2
    });
    
    marker.options.title = hip.toString(); 
    marker.bindPopup("<strong>Numer HIP: " + hip + "</strong><br>Współrzędne: " + lat.toFixed(5) + ", " + lon.toFixed(5));
    markersLayer.addLayer(marker);
}

function renderTable(points) {
    var tbody = document.querySelector('#points-table tbody');
    if (!tbody) return;

    points.sort(function(a, b) { 
        return a.hip.toString().localeCompare(b.hip.toString(), undefined, { numeric: true }); 
    });

    tbody.innerHTML = ''; 
    points.forEach(function(item) {
        var row = document.createElement('tr');
        var link = '<a href="#" class="point-link" onclick="zoomToPoint(' + item.gps.lat + ', ' + item.gps.lon + '); return false;">' + item.hip + '</a>';
        row.innerHTML = '<td>' + link + '</td>';
        tbody.appendChild(row);
    });
}

/**
 * POBIERANIE DANYCH Z PLIKU hip.txt
 */
fetch('hip.txt')
    .then(function(response) {
        if (!response.ok) throw new Error('Błąd HTTP: ' + response.status);
        return response.json();
    })
    .then(function(data) {
        if (data && data.hipy) {
            data.hipy.forEach(function(item) {
                if(item.gps && item.gps.lat && item.gps.lon) {
                    addMarkerToMap(item.hip, item.gps.lat, item.gps.lon);
                }
            });
            renderTable(data.hipy);
        }
    })
    .catch(function(error) {
        console.error('Błąd:', error);
        var tbody = document.querySelector('#points-table tbody');
        if (tbody) tbody.innerHTML = '<tr><td style="color:red">Blad danych: ' + error.message + '</td></tr>';
    });

/**
 * KONFIGURACJA WYSZUKIWARKI
 */
var searchControl = new L.Control.Search({
    layer: markersLayer,
    propertyName: 'title',
    initial: false,
    zoom: 18,
    marker: false,
    textPlaceholder: 'Szukaj HIP...'
});

map.addControl(searchControl);
