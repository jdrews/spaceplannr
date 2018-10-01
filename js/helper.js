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
    document.getElementById("profile-title").parentElement.MaterialTextfield.change("");
    document.getElementById("profile-department").parentElement.MaterialTextfield.change("");
    document.getElementById("profile-phone").parentElement.MaterialTextfield.change("");
    document.getElementById("profile-extension").parentElement.MaterialTextfield.change("");
    document.getElementById("profile-details").parentElement.MaterialTextfield.change("");
    $("#layer-id").val("");
    $("#layer-geo-json").val("");
}

function updateProfileSidebar(doc) {
    document.getElementById("profile-name").parentElement.MaterialTextfield.change(doc.name);
    document.getElementById("profile-chat").parentElement.MaterialTextfield.change(doc.chat);
    document.getElementById("profile-email").parentElement.MaterialTextfield.change(doc.email);
    document.getElementById("profile-title").parentElement.MaterialTextfield.change(doc.title);
    document.getElementById("profile-department").parentElement.MaterialTextfield.change(doc.department);
    document.getElementById("profile-phone").parentElement.MaterialTextfield.change(doc.phone);
    document.getElementById("profile-extension").parentElement.MaterialTextfield.change(doc.extension);
    document.getElementById("profile-details").parentElement.MaterialTextfield.change(doc.details);
    $("#layer-id").val(doc._id);
    $("#layer-geo-json").val(doc.geojson);
}

function saveProfile() {
    var name = $("#profile-name").val();
    var email = $("#profile-email").val();
    var chat = $("#profile-chat").val();
    var title = $("#profile-title").val();
    var department = $("#profile-department").val();
    var phone = $("#profile-phone").val();
    var extension = $("#profile-extension").val();
    var details = $("#profile-details").val();
    var layerid = $("#layer-id").val();
    var layergeojson = $("#layer-geo-json").val();
    pushToDatabase(layerid, layergeojson, name, chat, email, title, department, phone, extension, details);
    var layer = drawnItems.getLayerById(layerid);
    layer.setTooltipContent(name);
    var alttext = [name, title, department, phone, extension].join(', ');
    layer.alt = alttext;
    layer.title = name;
    layer.options.alt = alttext;
    layer.options.title = name;
    layer.feature.properties.alt = alttext;
    layer.feature.properties.title = name;
    sidebar.close();
    clearProfileSidebar();
}

function pushToDatabase (layerid, layergeojson, name, chat, email, title, department, phone, extension, details) {
    db.get(layerid).catch(function (err) { // get latest object in db
        if (err.name === 'not_found') {
            console.log("pushToDatabase: This is a new object!");
            // check for null or undefined and set defaults
            if (typeof name === 'undefined' || name == null) { name = ""; }
            if (typeof email === 'undefined' || email == null) { email = ""; }
            if (typeof chat === 'undefined' || chat == null) { chat = ""; }
            if (typeof title === 'undefined' || title == null) { title = ""; }
            if (typeof department === 'undefined' || department == null) { department = ""; }
            if (typeof phone === 'undefined' || phone == null) { phone = ""; }
            if (typeof extension === 'undefined' || extension == null) { extension = ""; }
            if (typeof details === 'undefined' || details == null) { details = ""; }
            if (typeof layergeojson === 'undefined' || layergeojson == null) { layergeojson = ""; }
            return { // build our new object and pass to 'put' function
                _id: layerid,
                timestamp: new Date().toISOString(),
                name: name,
                email: email,
                chat: chat,
                title: title,
                department: department,
                phone: phone,
                extension: extension,
                details: details,
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
        if (title) { doc.title = title; }
        if (department) { doc.department = department; }
        if (phone) { doc.phone = phone; }
        if (extension) { doc.extension = extension; }
        if (details) { doc.details = details; }
        if (layergeojson) { doc.geojson = layergeojson; }
        db.put(doc, function callback(err, result) {
            if (!err) {
                console.log('Successfully posted to database!\n' + JSON.stringify(doc));
                var notification = document.querySelector('.mdl-js-snackbar');
                notification.MaterialSnackbar.showSnackbar(
                    {
                        message: 'Saved!'
                    }
                );
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
                console.log("loading onto map");
                // Leaflet-draw does not like LayerGroups on it's edit.featureGroup (drawnItems).
                // Get the actual layer
                var layergroup = L.geoJSON(JSON.parse(layergeojson)); // returns a LayerGroup
                var layers = layergroup.getLayers();
                if (layers.length !== 1) {
                    console.error("More than one layer in this layergroup: " + layers.toString())
                }
                var layer = layers[0]; // the actual layer
                layer.id = layerid;
                addLayerOnClick(layer);
                layer.bindTooltip(name);
                var alttext = [doc.name, doc.title, doc.department, doc.phone, doc.extension].join(', ');
                layer.alt = alttext;
                layer.title = doc.name;
                layer.options.alt = alttext;
                layer.options.title = doc.name;
                layer.feature.properties.alt = alttext;
                layer.feature.properties.title = doc.name;
                layer.addTo(drawnItems);
            }
        });
    }).catch(function (err) {
        console.log(err);
    });
    controlSearch.setLayer(drawnItems);
}

function deleteFromDatabase (layerid) {
    db.get(layerid).catch(function (err) { // get latest object in db
        if (err.name === 'not_found') {
            console.log("deleteFromDatabase: Doesn't exist in the database!");
        } else { // hm, some other error
            console.log("deleteFromDatabase: error upon get");
            throw err;
        }
    }).then(function (doc) {
        return db.remove(doc);
    }).catch(function (err) {
        console.log("deleteFromDatabase: error upon put");
        throw err;
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
            if (config.sidebarEnabled) {
                sidebar.open("profile");
            }
            L.DomEvent.stop(event); // kill event
        }
    });
}

function enableSave() {
    var saveButton = document.getElementById('profile-save');
    saveButton.removeAttribute("disabled");
    componentHandler.upgradeElement(saveButton);
}

function disableSave() {
    var saveButton = document.getElementById('profile-save');
    saveButton.setAttribute("disabled","");
    componentHandler.upgradeElement(saveButton);
}
