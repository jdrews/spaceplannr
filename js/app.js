// ====== setup map interface =======

// create the map
var map = L.map('map', {
    center: [0, 0],
    zoom: 9
});

// create the image
var imageUrl = config.floorplan,
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

// add getLayerById to leaflet FeatureGroup
L.FeatureGroup.include({
    getLayerById: function (id) {
        for (var i in this._layers) {
            if (this._layers[i].id == id) {
                return this._layers[i];
            }
        }
        return null;
    }
});

// add draw layers upon creation
map.on(L.Draw.Event.CREATED, function (event) {
    clearProfileSidebar();
    var layer = event.layer;
    layer.id = generateUuid(); // generate a UUID to assign to this layer.
    $("#layer-id").val(layer.id); // Set the layer-id hidden field to this value for after the user clicks save.
    layer.bindTooltip(""); // note: to be updated once user inputs data in sidebar.
    addLayerOnClick(layer);
    console.log("layer.id = " + layer.id);
    console.log("layer-id = " + $("#layer-id").val());

    var layerGeoJSON = JSON.stringify(layer.toGeoJSON());
    console.log("layerGeoJSON = " + layerGeoJSON);
    $("#layer-geo-json").val(layerGeoJSON);

    sidebar.open("profile");
    drawnItems.addLayer(layer);
});

// pick up when someone edits
map.on(L.Draw.Event.EDITED, function (event) {
    var layers = event.layers;
    layers.eachLayer(function (layer) {
        //store this change in db
        var layerid = layer.id;
        var layergeojson = JSON.stringify(layer.toGeoJSON());
        console.log("layer change! --> " + layerid + "; " + layergeojson);
        //store this change in db
        pushToDatabase(layerid, layergeojson)
    });
});

// if we didn't click anything else, close the sidebar
map.on('click', function () {
    sidebar.close();
});

// if we start drawing, close the sidebar
map.on(L.Draw.Event.DRAWSTART, function (event) {
    sidebar.close();
});

// if we start editing, close the sidebar
map.on(L.Draw.Event.EDITSTART, function (event) {
    sidebar.close();
});

var sidebar = L.control.sidebar('sidebar', {position: 'right'}).addTo(map);

// ====== begin pouchdb =======

var syncDom = document.getElementById('sync-wrapper');
var db = new PouchDB(config.database_name);
var remoteCouch;

function syncError() {
    // syncDom.setAttribute('data-sync-state', 'error');
    console.log("syncing")
}

function sync() {
    // syncDom.setAttribute('data-sync-state', 'syncing');
    console.log("syncing")
    var opts = {live: true};
    db.replicate.to(remoteCouch, opts, syncError);
    db.replicate.from(remoteCouch, opts, syncError);
}

if (config.enableSync && config.couchdb_server) {
    remoteCouch = config.couchdb_server;
    sync();
}

loadFromDatabase();

$("#location > p").text(config.location);
$("#location-details > p").text(config.locationdetails);

// todo: handle changes coming from some other client. Skipping for now.
// db.changes({
//     since: 'now',
//     live: true,
//     include_docs: true
// }).on('change', function (change) {
//     // change.id contains the doc id, change.doc contains the doc
//     if (change.deleted) {
//         // document was deleted
//     } else {
//         // document was added/modified
//     }
// }).on('error', function (err) {
//     // handle errors
// });
