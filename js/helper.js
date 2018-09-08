function generateUuid() {
    var uuid = "", i, random;
    for (i = 0; i < 32; i++) {
        random = Math.random() * 16 | 0;

        if (i == 8 || i == 12 || i == 16 || i == 20) {
            uuid += "-"
        }
        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;
}

function clearProfileSidebar() {
    document.getElementById("profile-name").parentElement.MaterialTextfield.change("");
    document.getElementById("profile-chat").parentElement.MaterialTextfield.change("");
    document.getElementById("profile-email").parentElement.MaterialTextfield.change("");
    $("#layer-id").val("");
    $("#layer-geo-json").val("");
}

function updateProfileSidebar(doc) {
    document.getElementById("profile-name").parentElement.MaterialTextfield.change(doc.name);
    document.getElementById("profile-chat").parentElement.MaterialTextfield.change(doc.chat);
    document.getElementById("profile-email").parentElement.MaterialTextfield.change(doc.email);
    $("#layer-id").val(doc._id);
    $("#layer-geo-json").val(doc.geojson);
}

function pushToDatabase (layerid, layergeojson, name, chat, email) {
    db.get(layerid).catch(function (err) { // get latest object in db
        if (err.name === 'not_found') {
            console.log("pushToDatabase: This is a new object!");
            // check for null or undefined and set defaults
            if (typeof name === 'undefined' || name == null) { name = ""; }
            if (typeof email === 'undefined' || email == null) { email = ""; }
            if (typeof chat === 'undefined' || chat == null) { chat = ""; }
            if (typeof layergeojson === 'undefined' || layergeojson == null) { layergeojson = ""; }
            return { // build our new object and pass to 'put' function
                _id: layerid,
                timestamp: new Date().toISOString(),
                name: name,
                email: email,
                chat: chat,
                geojson: layergeojson
            };
        } else { // hm, some other error
            console.log("pushToDatabase: error upon get");
            throw err;
        }
    }).then(function (doc) {
        // update the existing doc with new values
        doc.timestamp = new Date().toISOString();
        // check for null or undefined before updating the doc; only update what needs updating
        if (name) { doc.name = name; }
        if (email) { doc.email = email; }
        if (chat) { doc.chat = chat; }
        if (layergeojson) { doc.geojson = layergeojson; }
        db.put(doc, function callback(err, result) {
            if (!err) {
                console.log('Successfully posted to database!\n' + JSON.stringify(doc));
            }
        });
    }).catch(function (err) {
        console.log("pushToDatabase: error upon put");
        throw err;
    });
}

function loadFromDatabase() {
    db.allDocs({
        include_docs: true
    }).then(function (result) {
        console.log("loadFromDatabase received " + result.rows.length + " records. processing... ");
        var i = 0;
        // handle result
        result.rows.map(function (row) {
            i++;
            var doc = row.doc;
            var layerid = doc._id;
            var layergeojson = doc.geojson;
            var name = doc.name;
            console.log(i + "; name:" + name + ", layerid: " + layerid + ", geojson: " + layergeojson);
            if (drawnItems.getLayerById(layerid)) {
                console.log("already on the map")
            } else {
                console.log("loading onto map")
                var layer = L.geoJSON(JSON.parse(layergeojson));
                layer.id = layerid;
                addLayerOnClick(layer);
                layer.bindTooltip(name);
                layer.addTo(drawnItems);
            }
        });
    }).catch(function (err) {
        console.log(err);
    });
}

function addLayerOnClick(layer) {
    layer.on({
        click: function (event) {
            // update the profile sidebar with user clicked data -- get from pouchdb entry with layer.id uuid
            var layerid = event.target.id;
            db.get(layerid).then(function (doc) {
                console.log("Retrieved doc from db: " + JSON.stringify(doc));
                updateProfileSidebar(doc);
            });
            sidebar.open("profile");
            L.DomEvent.stop(event); // kill event
        }
    });
}
