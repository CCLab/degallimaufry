var csv = require('csv');
var fs  = require('fs');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('../dbs/score.db', function () {
    fs.readFile('init_score_db.sql', 'utf-8', function (err, data) {
        db.exec(data, parse_file);
    });
});

function parse_file() {
    var results = {};

    console.log('>>> parsing file');
    csv().fromPath('./relics_history.csv', {columns: true})
        .transform(function (row, index) {
             return {
                relic_id      : row.relic_id,
                nid_id        : row.nid_id,
                name          : row.identification,
                name_action   : row.identification_action,
                street        : row.street,
                street_action : row.street_action,
                date          : row.dating,
                date_action   : row.dating_action
             };
        })
        .on('data', function (row, index) {
            if(!results[row.nid_id]) {
                results[row.nid_id] = [];
            }
            results[row.nid_id].push(row);
        })
        .on('end', function (count) {
            var key;
            var data;
            var save_to_db = function (obj) {
                // add monument object
                db.serialize(function () {
                    var mon_array = [obj.oz_id, obj.nid_id, !!obj.touched ? 1 : 0, obj.cats];
                    db.run("INSERT INTO monuments VALUES(?,?,?,?)",mon_array); 
                           
                                
                    // add names
                    for(value in obj.names) { if(obj.names.hasOwnProperty(value)) {
                        db.run("INSERT INTO name VALUES(?,?,?,?)", 
                               [obj.nid_id, value, obj.names[value].actions.join(', '), obj.names[value].points]);
                    }};
                    // add addresses
                    for(value in obj.addresses) { if(obj.addresses.hasOwnProperty(value)) {
                        db.run("INSERT INTO address VALUES(?,?,?,?)",
                               [obj.nid_id, value, obj.addresses[value].actions.join(', '), obj.addresses[value].points ]);
                    }};
                    // add dates
                    for(value in obj.dates) { if(obj.dates.hasOwnProperty(value)) {
                        db.run("INSERT INTO date VALUES(?,?,?,?)",
                               [obj.nid_id, value, obj.dates[value].actions.join(', '), obj.dates[value].points ]);
                    }};
                });
            };

            db.serialize(function () {
                console.log('>>> pushing data into db');
                db.run('BEGIN');
                for(key in results) {
                    data = validate(results[key]);
                    save_to_db(data);
                }
                db.run('COMMIT');
                db.each('select * from monuments limit 5', function (e, r) {
                    console.log(r);
                });
            });
            db.close();
        })
        .on('error', function (err) {
            console.log(err);
            process.exit();
        });
}

function validate(monument) {
    var result = {
        oz_id     : monument[0].relic_id,
        nid_id    : monument[0].nid_id,
        touched   : (monument.length > 1),
        cats      : "aa, bb, cc",
        names     : {},
        addresses : {},
        dates     : {}
    };
    var score = {
        edit     : 2,
        revision : 1,
        confirm  : 1,
        skip     : 0
    };

    monument.forEach(function (row) {
        var name        = row.name || '';
        var name_action = row.name_action;

        var address        = row.address || '';
        var address_action = row.address_action;

        var date        = row.date || '';
        var date_action = row.date_action;
        
        if(!!name.trim()) {
            name = name[0].toUpperCase() + name.slice(1);
            result.names[name] = result.names[name] || { points: 0, actions: [] };
            result.names[name].points = (result.names[name].points || 0) + score[name_action];
            result.names[name].actions.push(name_action);
        }
        if(!!address.trim()) {
            address = parse_address(address);
            result.addresses[address] = result.addresses[address] || { points: 0, actions: [] };
            result.addresses[address].points = (result.addresses[address].points || 0) + score[address_action];
            result.addresses[address].actions.push(address_action);
        }
        if(!!date.trim()) {
            date = parse_date(date);
            result.dates[date] = result.dates[date] || { points: 0, actions: [] };
            result.dates[date].points = (result.dates[date].points || 0) + score[date_action];
            result.dates[date].actions.push(date_action);
        }
    });

    return result;
} 

function parse_name(name) {
    // code here
    return name;
}

// converts address into address object
function parse_address(address) {
    // get rid of zip code and city name
    address = address.split(',')
                     .map(function (e) {
                         return e.replace(/\d\d-\d\d\d.*/, '');
                     })
                     .join('');

    // trim whitespaces and quotes
    address = address.replace(/^\s*"?\s*|\s*"?\s*$/g, '');
    
    // TODO unify 'ul.', 'al.' etc.
    // code here

    return address;
}

function parse_date(date) {
    // code here
    return date;
}

