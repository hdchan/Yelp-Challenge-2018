const sqlite3 = require('sqlite3').verbose();

exports.query = function(query, callback) {
    let db = new sqlite3.Database('app/data/project.db', sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error(err.message);
        }
        if (debug) console.log('Connected to the database.');
    });

    db.all(query, callback);

    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        if (debug) console.log('Close the database connection.');
    });
}