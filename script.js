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

/* Definicja kafelkow */
L.PodkladWarszawski = L.TileLayer.extend({
    getTileUrl: function(coords) {
        var x = coords.x;
        var y = -coords.y - 1;
        var z = coords.z;
        if (y < 0 || x < 0) return "";
        
        var base = "https://testmapa.um.warszawa.pl/mapviewer/mcserver?request=gettile&format=PNG";
        return base + "&zoomlevel=" + z + "&mapcache=" + this.options.mapname + "&mx=" + x + "&my=" + y;
    }
});

var commonOptions = {
    minZoom: 0,
    maxZoom: resolutions.length - 1,
    noWrap: true,
    continuousWorld: true
};

var lindley1 = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.LINDLEY" }, commonOptions));
var lindley2 = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.LINDLEY_2500_H" }, commonOptions));
var lindley3 = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.LINDLEY_2500_S_1900" }, commonOptions));
var lindley4 = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.LINDLEY_2500_S" }, commonOptions));
var planBos = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.PLAN_BOS" }, commonOptions));
var plan1936 = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.PLAN_1936" }, commonOptions));
var warszawaWektor = new L.PodkladWarszawski("", L.extend({ mapname: "DANE_WAWA.WARSZAWA_PODKLAD_WEKTOR" }, commonOptions));

var baseMaps = {
    "Plan inwentaryzacji zniszczeń z lat 1945-1946": planBos,
    "Plan z 1936": plan1936,
    "Plan Lindleya z lat 1891-1908": lindley1,
    "Plan Lindleya z lat 1896-1906": lindley2,
    "Plan Lindleya z lat 1897-1901": lindley4,
    "Plan Lindleya z lat 1900-1901": lindley3,    
    "Podkład warszawski": warszawaWektor
};

var map = L.map("map", {
    crs: crs2178,
    continuousWorld: true,
    worldCopyJump: false,
    layers: [lindley4] 
}).setView([52.2210, 21.0150], 16);

L.control.layers(baseMaps).setPosition("bottomleft").addTo(map);

var markersLayer = new L.LayerGroup().addTo(map);
var allPoints = []; 
var areAllPointsVisible = false; // Flaga stanu przycisku

/* Funkcje obsługi interfejsu */

// Funkcja pomocnicza do resetowania przycisku "Pokaż wszystkie"
function resetButtonState() {
    areAllPointsVisible = false;
    var btn = document.getElementById("toggle-all-btn");
    if (btn) btn.innerText = "Pokaż wszystkie punkty na mapie";
}

// Funkcja wywoływana po kliknięciu w punkt w tabeli
window.zoomToPoint = function(lat, lon, hip) {
    // 1. Czyścimy markery i resetujemy stan przycisku
    markersLayer.clearLayers();
    resetButtonState();
    
    // 2. Dodajemy tylko ten jeden konkretny marker
    var marker = L.circleMarker([lat, lon], {
        radius: 6,
        color: "#ffffff",
        fillColor: "#007bff",
        fillOpacity: 0.9,
        weight: 2
    });
    marker.bindPopup("<b>hip." + hip + "</b>");
    markersLayer.addLayer(marker);
    
    // 3. Centrujemy mapę i otwieramy popup
    map.setView([lat, lon], 15);
    marker.openPopup();
};

function renderTable(points) {
    var tbody = document.querySelector("#points-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    // AKTUALIZACJA LICZNIKA
    var counter = document.getElementById("points-counter");
    if (counter) {
        counter.innerText ="Dodano: " + points.length + " punktów";
    }
    
    var sortedPoints = points.slice().sort(function(a, b) {
        return a.hip.toString().localeCompare(b.hip.toString(), undefined, { numeric: true });
    });

    for (var i = 0; i < sortedPoints.length; i++) {
        var p = sortedPoints[i];
        var tr = document.createElement("tr");
        var html = "<td><a href='#' class='point-link' onclick='zoomToPoint(" + p.gps.lat + "," + p.gps.lon + ", \"" + p.hip + "\"); return false;'>" + p.hip + "</a></td>";
        tr.innerHTML = html;
        tbody.appendChild(tr);
    }
}

function setupInterface() {
    var table = document.querySelector("#points-table");
    if (!table) return;

    var container = document.createElement("div");
    container.style.marginBottom = "10px";

    // 1. Przycisk Pokaż/Ukryj wszystkie
    var toggleBtn = document.createElement("button");
    toggleBtn.id = "toggle-all-btn";
    toggleBtn.innerText = "Pokaż wszystkie punkty na mapie";
    toggleBtn.style.display = "block";
    toggleBtn.style.width = "100%";
    toggleBtn.style.padding = "8px";
    toggleBtn.style.marginBottom = "10px";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.style.backgroundColor = "#007bff";
    toggleBtn.style.color = "white";
    toggleBtn.style.border = "none";
    toggleBtn.style.borderRadius = "4px";

    toggleBtn.addEventListener("click", function() {
        if (!areAllPointsVisible) {
            // Pokaż wszystkie
            markersLayer.clearLayers();
            // Używamy filteredPoints jeśli istnieje (żeby pokazać tylko przefiltrowane), 
            // w przeciwnym razie allPoints. Tutaj dla uproszczenia zawsze allPoints, 
            // chyba że chcemy powiązać to z wyszukiwarką.
            // Przyjmijmy wersję: pokazuje WSZYSTKIE dostępne dane.
            
            var pointsToShow = allPoints; 

            pointsToShow.forEach(function(p) {
                var marker = L.circleMarker([p.gps.lat, p.gps.lon], {
                    radius: 4,
                    color: "#ffffff",
                    fillColor: "#dc3545", // Inny kolor dla widoku zbiorczego
                    fillOpacity: 0.8,
                    weight: 1
                });
                marker.bindPopup("<b>hip." + p.hip + "</b>");
                markersLayer.addLayer(marker);
            });
            
            toggleBtn.innerText = "Ukryj punkty";
            areAllPointsVisible = true;
        } else {
            // Ukryj wszystkie
            markersLayer.clearLayers();
            toggleBtn.innerText = "Pokaż wszystkie punkty na mapie";
            areAllPointsVisible = false;
        }
    });

    // 2. Pole wyszukiwania
    var searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "table-search";
    searchInput.placeholder = "Filtruj listę punktów...";
    searchInput.style = "padding: 8px; width: 60%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;";
    
    // 3. Licznik punktów
    var counterSpan = document.createElement("span");
    counterSpan.id = "points-counter";
    counterSpan.style.marginLeft = "10px";
    counterSpan.style.fontWeight = "bold";
    counterSpan.style.fontSize = "14px";
    
    // Składanie elementów
    container.appendChild(toggleBtn);
    container.appendChild(searchInput);
    container.appendChild(counterSpan);
    
    table.parentNode.insertBefore(container, table);

    // Obsługa szukania
    searchInput.addEventListener("input", function(e) {
        var term = e.target.value.toLowerCase();
        var filtered = allPoints.filter(function(p) {
            return p.hip.toString().toLowerCase().indexOf(term) > -1;
        });
        renderTable(filtered);
    });
}

/* Wczytywanie danych z hip.txt */
fetch("hip.txt")
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data && data.hipy) {
            allPoints = data.hipy;
            
            setupInterface(); // Nowa funkcja budująca UI
            renderTable(allPoints);
        }
    })
    .catch(function(err) {
        console.log("Blad wczytywania danych:", err);
    });

