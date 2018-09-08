//===================
config = {}; // Dictionary to store all configs. Leave this alone.
//===================

// Edit the following config variables to setup spaceplannr

//===================
// CONFIG VARIABLES
//===================

// floorplan to use
config.floorplan = 'floorplans/Sample_Floorplan.svg';

// pouchdb database name
//      Note: usually the same name as your couchdb database
config.database_name = 'spaceplannr';

// URL of couchdb server
config.couchdb_server = 'http://dbsvr:5984/spaceplannr';

// sync to couchdb server?
//      true = yes, please sync to couchdb server
//      false = no, leave all my data on the client side in a pouchdb database
config.enableSync = true;


