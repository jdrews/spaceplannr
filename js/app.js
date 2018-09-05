// create the map
var map = L.map('map', {
    center: [0, 0],
    zoom: 9
});

// create the image
var imageUrl = 'floorplans/Sample_Floorplan.svg',
    imageBounds = [[-1, -1], [1, 1]];
L.imageOverlay(imageUrl, imageBounds).addTo(map);

// add in draw components
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    }
});
map.addControl(drawControl);

// add draw layers upon creation
map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;
    layer.bindTooltip("John Doe");
    layer.on({
        click: function (e) {
            sidebar.open("profile");
            L.DomEvent.stop(e); // kill event
        }
    });
    drawnItems.addLayer(layer);
});
// if we didn't click anything else, close the sidebar
map.on('click', function () {
    sidebar.close();
});

var sidebar = L.control.sidebar('sidebar', {position: 'right'}).addTo(map);

var syncDom = document.getElementById('sync-wrapper');
var db = new PouchDB('spaceplannr');
var remoteCouch = 'http://dbsvr:5984/spaceplannr';

function syncError() {
    syncDom.setAttribute('data-sync-state', 'error');
}

function sync() {
    syncDom.setAttribute('data-sync-state', 'syncing');
    var opts = {live: true};
    db.replicate.to(remoteCouch, opts, syncError);
    db.replicate.from(remoteCouch, opts, syncError);
}

function addData (text) {
    var data = {
        _id: new Date().toISOString(),
        name: "myname",
        chathandle: "chathandle",
        email: "email",
        geojson: "geojson"
    };
    db.put(data, function callback(err, result) {
        if (!err) {
            console.log('Successfully posted a data!\n' + data);
        }
    });
}

if (remoteCouch) {
    sync();
}

addData("New Data: " + new Date().toISOString());
