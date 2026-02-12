/* Konfiguracja ukladu wspolrzednych */
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

var resolutions = [];
for (var r = 0; r < warstwaKonfig.zoomLevels.length; r++) {
    resolutions.push(warstwaKonfig.zoomLevels[r].tileWidth / 256);
}

var crs2178 = new L.Proj.CRS("EPSG:2178", "+proj=tmerc +lat_0=0 +lon_0=21 +k=0.999923 +x_0=7500000 +y_0=0 +ellps=GRS80 +units=m +no_defs", {
    resolutions: resolutions,
    origin: [warstwaKonfig.minX, warstwaKonfig.minY]
});

/* Definicja kafelkow (zaktualizowana klasa) */
L.PodkladWarszawski = L.TileLayer.extend({
    getTileUrl: function(coords) {
        var x = coords.x;
        var y = -coords.y - 1;
        var z = coords.z;
        if (y < 0 || x < 0) return "";
        
        // Bazowy URL serwera map UM Warszawa
        var base = "https://testmapa.um.warszawa.pl/mapviewer/mcserver?request=gettile&format=PNG";
        return base + "&zoomlevel=" + z + "&mapcache=" + this.options.mapname + "&mx=" + x + "&my=" + y;
    }
});

/* Definicja instancji warstw */
var commonOptions = {
    minZoom: 0,
    maxZoom: resolutions.length - 1,
    noWrap: true,
    continuousWorld: true
};

// 1. Lindley (Ogólny)
var lindley1 = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.LINDLEY" }, commonOptions));

// 2. Lindley 2500 H
var lindley2 = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.LINDLEY_2500_H" }, commonOptions));

// 3. Lindley 2500 S 1900
var lindley3 = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.LINDLEY_2500_S_1900" }, commonOptions));

// 4. Lindley 2500 S (Standard)
var lindley4 = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.LINDLEY_2500_S" }, commonOptions));

// 5. Plan BOS
var planBos = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.PLAN_BOS" }, commonOptions));

// 6. Plan 1936
var plan1936 = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.PLAN_1936" }, commonOptions));

// 7. Wektor (Współczesny)
var warszawaWektor = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.WARSZAWA_PODKLAD_WEKTOR" }, commonOptions));


/* Obiekt z warstwami do przełączania */
var baseMaps = {
    "Lindley (Ogólny)": lindley1,
    "Plan Lindleya z 1896-1906": lindley2,
    "Lindley (1900 S)": lindley3,
    "Lindley (2500 S)": lindley4,
    "Plan 1936": plan1936,
    "Plan BOS": planBos,
    "Wektor (Współczesny)": warszawaWektor
};

/* Inicjalizacja mapy */
// Domyślnie ładujemy 'Plan 1936' tak jak w Twoim nowym kodzie, 
// ale ustawiam widok na centrum Warszawy w wyższym przybliżeniu (16), 
// żeby było widać numery HIP (zoom 10 jest zbyt oddalony dla tej skali).
var map = L.map("map", {
    crs: crs2178,
    continuousWorld: true,
    worldCopyJump: false,
    layers: [plan1936] 
}).setView([52.2210, 21.0150], 16);

// Dodanie kontrolki warstw (przełącznik w rogu)
L.control.layers(baseMaps).setPosition("bottomleft").addTo(map);

// Warstwa na markery
var markersLayer = new L.LayerGroup().addTo(map);

/* Funkcje obsługi interfejsu */
window.zoomToPoint = function(lat, lon) {
    map.setView([lat, lon], 17);
};

function addMarkerToMap(hip, lat, lon) {
    var marker = L.circleMarker([lat, lon], {
        radius: 6,
        color: "#ffffff",
        fillColor: "#007bff",
        fillOpacity: 0.9,
        weight: 2
    });
    marker.options.title = hip.toString();
    marker.bindPopup("<b>hip." + hip + "</b>");
    markersLayer.addLayer(marker);
}

function renderTable(points) {
    var tbody = document.querySelector("#points-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    // Sortowanie numeryczne
    points.sort(function(a, b) {
        return a.hip.toString().localeCompare(b.hip.toString(), undefined, { numeric: true });
    });

    for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var tr = document.createElement("tr");
        var html = "<td><a href='#' class='point-link' onclick='zoomToPoint(" + p.gps.lat + "," + p.gps.lon + "); return false;'>" + p.hip + "</a></td>";
        tr.innerHTML = html;
        tbody.appendChild(tr);
    }
}

/* Wczytywanie danych z hip.txt */
fetch("hip.txt")
    .then(function(response) { return response.json(); })
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
        console.log("Blad wczytywania danych:", err);
    });

/* Wyszukiwarka (korzysta z markersLayer) */
var searchControl = new L.Control.Search({
    layer: markersLayer,
    propertyName: "title",
    initial: false,
    zoom: 18,
    marker: false,
    textPlaceholder: "Szukaj HIP..."
});
map.addControl(searchControl);

