/**
 * KONFIGURACJA UKŁADU WSPÓŁRZĘDNYCH
 */
var warstwaKonfig = {
    "minX": 7340000.0,
    "minY": 5700000.0,
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

var resolutions = warstwaKonfig.zoomLevels.map(function(l) { 
    return l.tileWidth / 256; 
});

var crs2178 = new L.Proj.CRS('EPSG:2178', "+proj=tmerc +lat_0=0 +lon_0=21 +k=0.999923 +x_0=7500000 +y_0=0 +ellps=GRS80 +units=m +no_defs", {
    resolutions: resolutions,
    origin: [warstwaKonfig.minX, warstwaKonfig.minY]
});

/**
 * DEFINICJA MAPY WARSZAWY
 */
L.PodkladWarszawski = L.TileLayer.extend({
    getTileUrl: function(coords) {
        var x = coords.x;
        var y = -coords.y - 1;
        var z = coords.z;
        if (y < 0 || x < 0) return "";
        var url = "https://testmapa.um.warszawa.pl/mapviewer/mcserver?request=gettile&format=PNG";
        url += "&zoomlevel=" + z;
        url += "&mapcache=" + this.options.mapname;
        url += "&mx=" + x;
        url += "&my=" + y;
        return url;
    }
});

var baseMaps = {
    "Lindley": new L.PodkladWarszawski('', { minZoom: 0, maxZoom: 18, mapname: "DANE_WAWA.LINDLEY_2500_S" }),
    "Plan 1936": new L.PodkladWarszawski('', { minZoom: 0, maxZoom: 18, mapname: "DANE_WAWA.PLAN_1936" }),
    "Plan BOS": new L.PodkladWarszawski('', { minZoom: 0, maxZoom: 18, mapname: "DANE_WAWA.PLAN_BOS" }),
    "Wektor": new L.PodkladWarszawski('', { minZoom: 0, maxZoom: 18, mapname: "DANE_WAWA.WARSZAWA_PODKLAD_WEKTOR" })
};

var map = L.map('map', {
    crs: crs2178,
    layers: [baseMaps["Lindley"]]
}).setView([52.2210, 21.0150], 16);

L.control.layers(baseMaps).setPosition("bottomleft").addTo(map);
var markersLayer = new L.LayerGroup().addTo(map);

/**
 * LOGIKA WYŚWIETLANIA
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
    marker.bindPopup("<strong>Numer HIP: " + hip + "</strong>");
    markersLayer.addLayer(marker);
}

function renderTable(points) {
    var tbody = document.querySelector('#points-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    points.sort(function(a, b) {
        return a.hip.toString().localeCompare(b.hip.toString(), undefined, { numeric: true });
    });

    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var row = document.createElement('tr');
        var link = '<a href="#" class="point-link" onclick="zoomToPoint(' + p.gps.lat + ',' + p.gps.lon + '); return false;">' + p.hip + '</a>';
        row.innerHTML = '<td>' + link + '</td>';
        tbody.appendChild(row);
    }
}

/**
 * POBIERANIE DANYCH
 */
fetch('hip.txt')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data && data.hipy) {
            for (var j = 0; j < data.hipy.length; j++) {
                var item = data.hipy[j];
                addMarkerToMap(item.hip, item.gps.lat, item.gps.lon);
            }
            renderTable(data.hipy);
        }
    })
    .catch(function(err) {
        console.log("Blad:", err);
    });

/**
 * SZUKAJKA
 */
var searchControl = new L.Control.Search({
    layer: markersLayer,
    propertyName: 'title',
    initial: false,
    zoom: 18,
    marker: false,
    textPlaceholder: 'Szukaj...'
});
map.addControl(searchControl);
