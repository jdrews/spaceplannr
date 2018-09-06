// ====== setup map interface =======

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
    //layer.id = //todo: generate a UUID to assign to this layer. Set the layer-id hidden field to this value for after the user clicks save. look at node-uuid library.
    // layer.bindTooltip("John Doe");
    layer.on({
        click: function (e) {
            // todo: update the profile sidebar with user clicked data
            sidebar.open("profile");
            L.DomEvent.stop(e); // kill event
        }
    });
    //todo: make profile sidebar editable and add the save button
    console.log("layer.id = " + layer.id);
    $("#layer-id").val(layer.id);
    console.log("layer-id = " + $("layer-id").val());
    sidebar.open("profile");
    drawnItems.addLayer(layer);
});
// if we didn't click anything else, close the sidebar
map.on('click', function () {
    sidebar.close();
});

var sidebar = L.control.sidebar('sidebar', {position: 'right'}).addTo(map);

// ====== setup form =======
$("#profile-save").click(function () {
    var name = $("profile-name").val();
    var chat = $("profile-chat").val();
    var email = $("profile-email").val();

});

// ====== begin pouchdb =======

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
