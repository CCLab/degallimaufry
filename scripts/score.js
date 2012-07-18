var csv    = require('csv');
var sqlite = require('sqlite');

var results = {};
var counter = 0;

var db = new sqlite.Database();

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
        if(!results[row.id]) {
            results[row.id] = [];
        }
        results[row.id].push(row);
    })
    .on('end', function (count) {
        var key;
        var data;
        var save_to_db = function (obj) {
            // add monument object
            db.execute("INSERT INTO monuments VALUES(?, ?, ?, ?)",
                       [ obj.oz_id, obj.nid_id, !!obj.touched, obj.cats ],
                       function (err) { if(err) throw err; });
                        
            // add names
            for(value in obj.names) { if(obj.names.hasOwnProperty(value) {
                db.execute("INSERT INTO name VALUES(?, ?, ?, ?)",
                           [ obj.nid_id, value, obj.names[value].actions.join(', '), obj.names[value].points ],
                           function (err) { if(err) throw err; });
            }});
            // add addresses
            for(value in obj.addresses) { if(obj.addresses.hasOwnProperty(value) {
                db.execute("INSERT INTO address VALUES(?, ?, ?, ?)",
                           [ obj.nid_id, value, obj.addresses[value].actions.join(', '), obj.addresses[value].points ],
                           function (err) { if(err) throw err; });
            }});
            // add dates
            for(value in obj.dates) { if(obj.dates.hasOwnProperty(value) {
                db.execute("INSERT INTO name VALUES(?, ?, ?, ?)",
                           [ obj.nid_id, value, obj.dates[value].actions.join(', '), obj.dates[value].points ],
                           function (err) { if(err) throw err; });
            }});
        };

        db.open('../dbs/score.db', function (err) {
            if(err) throw err;

            for(key in results) {
                // validate only these monuments that where touched by people
                if(results[key].length > 1) {
                    data = validate(results[key]);
                }
                else {
                    data = results[key];
                }
                save_to_db(data);
            }
        });
    })
    .on('error', function (err) {
        console.log(err);
        process.exit();
    });


function validate(monument) {
    var result = {
        oz_id     : monument.relic_id,
        nid_id    : monument.nid_id,
        touched   : true,
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
        var name        = row.name.trim();
        var name_action = row.name_action;

        var address        = row.address.trim();
        var address_action = row.address_action;

        var date        = row.date.trim();
        var date_action = row.date_action;
        
        if(!!name) {
            name = name[0].toUpperCase() + name.slice(1);
            result.names[name] = result.names[name] || { points: 0, actions: [] };
            result.names[name].points = (result.names[name].points || 0) + score[name_action];
            result.names[name].actions += name_action + ', ';
        }
        if(!!address) {
            address = parse_address(address);
            result.addresses[address] = result.addresses[address] || { points: 0, actions: [] };
            result.addresses[address].points = (result.addresses[address].points || 0) + score[address_action];
            result.addresses[address].actions += address_action + ', ';
        }
        if(!!date) {
            date = parse_date(date);
            result.datees[date] = result.datees[date] || { points: 0, actions: [] };
            result.datees[date].points = (result.datees[date].points || 0) + score[date_action];
            result.datees[date].actions += date_action + ', ';
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
