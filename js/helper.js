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
    $("#profile-name").val("");
    $("#profile-chat").val("");
    $("#profile-email").val("");
    $("#layer-id").val("");
    $("#layer-geo-json").val("");
}

function updateProfileSidebar(doc) {
    $("#profile-name").val(doc.name);
    $("#profile-chat").val(doc.chat);
    $("#profile-email").val(doc.email);
    $("#layer-id").val(doc._id);
    $("#layer-geo-json").val(doc.geojson);
}

function pushToDatabase (name, chat, email, layerid, layergeojson) {
    db.get(layerid).catch(function (err) { // get latest object in db
        if (err.name === 'not_found') {
            console.log("pushToDatabase: This is a new object!");
            return { // build our new object and pass to put function
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
        doc.name = name;
        doc.email = email;
        doc.chat = chat;
        doc.geojson = layergeojson;
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
