/* Konfiguracja ukladu wspolrzednych */
var warstwaKonfig = {
  minX: 7340000.0,
  minY: 5700000.0,
  zoomLevels: [
    { tileWidth: 69358.93333333332 },
    { tileWidth: 34679.46666666666 },
    { tileWidth: 17339.73333333333 },
    { tileWidth: 8669.866666666665 },
    { tileWidth: 4334.9333333333325 },
    { tileWidth: 2167.4666666666662 },
    { tileWidth: 1693.3333333333333 },
    { tileWidth: 1083.7333333333331 },
    { tileWidth: 812.8 },
    { tileWidth: 541.8666666666666 },
    { tileWidth: 406.4 },
    { tileWidth: 338.6666666666667 },
    { tileWidth: 270.9333333333333 },
    { tileWidth: 203.2 },
    { tileWidth: 135.46666666666664 },
    { tileWidth: 67.73333333333332 },
    { tileWidth: 33.86666666666666 },
    { tileWidth: 16.93333333333333 },
    { tileWidth: 8.466666666666663 },
  ],
};

var resolutions = [];
for (var r = 0; r < warstwaKonfig.zoomLevels.length; r++) {
  resolutions.push(warstwaKonfig.zoomLevels[r].tileWidth / 256);
}

var crs2178 = new L.Proj.CRS(
  "EPSG:2178",
  "+proj=tmerc +lat_0=0 +lon_0=21 +k=0.999923 +x_0=7500000 +y_0=0 +ellps=GRS80 +units=m +no_defs",
  {
    resolutions: resolutions,
    origin: [warstwaKonfig.minX, warstwaKonfig.minY],
  },
);

L.PodkladWarszawski = L.TileLayer.extend({
  getTileUrl: function (coords) {
    var x = coords.x;
    var y = -coords.y - 1;
    var z = coords.z;
    if (y < 0 || x < 0) return "";

    var base =
      "https://testmapa.um.warszawa.pl/mapviewer/mcserver?request=gettile&format=PNG";
    return (
      base +
      "&zoomlevel=" +
      z +
      "&mapcache=" +
      this.options.mapname +
      "&mx=" +
      x +
      "&my=" +
      y
    );
  },
});

var commonOptions = {
  minZoom: 0,
  maxZoom: resolutions.length - 1,
  noWrap: true,
  continuousWorld: true,
};

var lindley1 = new L.PodkladWarszawski(
  "",
  L.extend({ mapname: "DANE_WAWA.LINDLEY" }, commonOptions),
);
var lindley2 = new L.PodkladWarszawski(
  "",
  L.extend({ mapname: "DANE_WAWA.LINDLEY_2500_H" }, commonOptions),
);
var lindley3 = new L.PodkladWarszawski(
  "",
  L.extend({ mapname: "DANE_WAWA.LINDLEY_2500_S_1900" }, commonOptions),
);
var lindley4 = new L.PodkladWarszawski(
  "",
  L.extend({ mapname: "DANE_WAWA.LINDLEY_2500_S" }, commonOptions),
);
var planBos = new L.PodkladWarszawski(
  "",
  L.extend({ mapname: "DANE_WAWA.PLAN_BOS" }, commonOptions),
);
var plan1936 = new L.PodkladWarszawski(
  "",
  L.extend({ mapname: "DANE_WAWA.PLAN_1936" }, commonOptions),
);
var warszawaWektor = new L.PodkladWarszawski(
  "",
  L.extend({ mapname: "DANE_WAWA.WARSZAWA_PODKLAD_WEKTOR" }, commonOptions),
);

var layerColors = {
  "Plan inwentaryzacji zniszczeń z lat 1945-1946": "#ff0000", // Czerwony
  "Plan z 1936": "#ff8800", // Pomarańczowy
  "Plan Lindleya z lat 1891-1908": "#008000", // Ciemnozielony
  "Plan Lindleya z lat 1896-1906": "#00ff00", // Jasnozielony
  "Plan Lindleya z lat 1897-1901": "#0000ff", // Niebieski (domyślny Lindley4)
  "Plan Lindleya z lat 1900-1901": "#800080", // Fioletowy
  OSM: "#000000", // Czarny
};
var defaultColor = "#007bff";

var baseMaps = {
  "Plan inwentaryzacji zniszczeń z lat 1945-1946": planBos,
  "Plan z 1936": plan1936,
  "Plan Lindleya z lat 1891-1908": lindley1,
  "Plan Lindleya z lat 1896-1906": lindley2,
  "Plan Lindleya z lat 1897-1901": lindley4,
  "Plan Lindleya z lat 1900-1901": lindley3,
  "Podkład warszawski": warszawaWektor,
};

var map = L.map("map", {
  crs: crs2178,
  continuousWorld: true,
  worldCopyJump: false,
  layers: [lindley4],
}).setView([52.221, 21.015], 16);

L.control.layers(baseMaps).setPosition("bottomleft").addTo(map);

var markersLayer = new L.LayerGroup().addTo(map);
var allPoints = [];
var areAllPointsVisible = false;

/* Funkcje obsługi interfejsu */

function resetButtonState() {
  areAllPointsVisible = false;
  var btn = document.getElementById("toggle-all-btn");
  if (btn) btn.innerText = "Pokaż wszystkie punkty na mapie";
}

// Funkcja nanosząca wszystkie punkty i dopasowująca widok
function showAllPointsOnMap() {
  markersLayer.clearLayers();
  var latLngs = [];

  allPoints.forEach(function (p) {
    var pos = [p.gps.lat, p.gps.lon];
    latLngs.push(pos);

    var pointColor = defaultColor;
    if (p.layer && layerColors[p.layer]) {
      pointColor = layerColors[p.layer];
    } else {
      pointColor = "#999999";
    }

    var marker = L.circleMarker(pos, {
      radius: 6,
      color: "#ffffff",
      fillColor: pointColor,
      fillOpacity: 0.8,
      weight: 1,
    });
    marker.bindPopup("<b>hip." + p.hip + "</b>");
    markersLayer.addLayer(marker);
  });

  if (latLngs.length > 0) {
    var bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [20, 20] });
  }

  areAllPointsVisible = true;
  var btn = document.getElementById("toggle-all-btn");
  if (btn) btn.innerText = "Ukryj punkty";
}

window.zoomToPoint = function (lat, lon, hip, layer) {
  markersLayer.clearLayers();
  resetButtonState();

  var pointColor = defaultColor;
  if (layer && layerColors[layer]) {
    pointColor = layerColors[layer];
  } else {
    pointColor = "#999999";
  }

  var marker = L.circleMarker([lat, lon], {
    radius: 8,
    color: "#ffffff",
    fillColor: pointColor,
    fillOpacity: 0.9,
    weight: 3,
  });
  marker.bindPopup("<b>hip." + hip + "</b>");
  markersLayer.addLayer(marker);

  map.setView([lat, lon], 15);
  marker.openPopup();
  marker.on("popupclose", async function (e) {
    await setTimeout(2000);
    marker.remove();
  });
};

function renderTable(points) {
  var tbody = document.querySelector("#points-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  var counter = document.getElementById("points-counter");
  if (counter) {
    counter.innerText = "Wyświetlono: " + points.length + " punktów";
  }

  var sortedPoints = points.slice().sort(function (a, b) {
    return a.hip
      .toString()
      .localeCompare(b.hip.toString(), undefined, { numeric: true });
  });

  for (var i = 0; i < sortedPoints.length; i++) {
    var p = sortedPoints[i];
    var pointColor = defaultColor;
    if (p.layer && layerColors[p.layer]) {
      pointColor = layerColors[p.layer];
    }
    var tr = document.createElement("tr");
    var html =
      "<td><span style='display:inline-block;width:10px;height:10px;border-radius:50%;background-color:" +
      pointColor +
      ";margin-right:5px;'></span><a href='#' class='point-link' onclick='zoomToPoint(" +
      p.gps.lat +
      "," +
      p.gps.lon +
      ', "' +
      p.hip +
      '", "' +
      p.layer +
      "\"); return false;'>" +
      p.hip +
      "</a></td>";
    tr.innerHTML = html;
    tbody.appendChild(tr);
  }
}

function setupInterface() {
  var table = document.querySelector("#points-table");
  if (!table) return;

  var container = document.createElement("div");
  container.style.marginBottom = "10px";

  var toggleBtn = document.createElement("button");
  toggleBtn.id = "toggle-all-btn";
  toggleBtn.innerText = "Pokaż wszystkie punkty na mapie";
  toggleBtn.style =
    "display: block; width: 100%; padding: 8px; margin-bottom: 10px; cursor: pointer; background-color: #007bff; color: white; border: none; border-radius: 4px;";

  toggleBtn.addEventListener("click", function () {
    if (!areAllPointsVisible) {
      showAllPointsOnMap();
    } else {
      markersLayer.clearLayers();
      toggleBtn.innerText = "Pokaż wszystkie punkty na mapie";
      areAllPointsVisible = false;
    }
  });

  var searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "table-search";
  searchInput.placeholder = "Filtruj listę punktów...";
  searchInput.style =
    "padding: 8px; width: 60%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;";

  var counterSpan = document.createElement("span");
  counterSpan.id = "points-counter";
  counterSpan.style = "margin-left: 10px; font-weight: bold; font-size: 14px;";

  container.appendChild(toggleBtn);
  container.appendChild(searchInput);
  container.appendChild(counterSpan);

  table.parentNode.insertBefore(container, table);

  searchInput.addEventListener("input", function (e) {
    var term = e.target.value.toLowerCase();
    var filtered = allPoints.filter(function (p) {
      return p.hip.toString().toLowerCase().indexOf(term) > -1;
    });
    renderTable(filtered);
  });
}

/* Wczytywanie danych z hip.txt */
fetch("hip.json")
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    if (data && data.hipy) {
      allPoints = data.hipy;

      setupInterface();
      renderTable(allPoints);
      // NOWOŚĆ: Automatyczne pokazanie wszystkich punktów po starcie
      showAllPointsOnMap();
    }
  })
  .catch(function (err) {
    console.log("Blad wczytywania danych:", err);
  });
