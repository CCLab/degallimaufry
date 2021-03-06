var csv = require('csv');
var fs  = require('fs');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('../dbs/score.db', get_uploaded);

function get_uploaded() {
    db.all('SELECT nid_id FROM monuments', function (err, rows) {
        var uploaded = {};
        rows.forEach(function (row) {
            uploaded[row.nid_id.toString()] = true;
        });
        parse_file(uploaded);
    });
}

function parse_file(uploaded) {
    var results = {};

    console.log('>>> parsing file');
    csv().fromPath('./relics_history.csv', {columns: true})
        .transform(function (row, index) {
            // skip already uploaded
            if(uploaded.hasOwnProperty(row.nid_id)) {
                return;
            }
            else {
                return {
                    relic_id       : row.relic_id,
                    nid_id         : row.nid_id,
                    name           : row.identification,
                    name_action    : row.identification_action,
                    address        : row.street,
                    address_action : row.street_action,
                    date           : row.dating,
                    date_action    : row.dating_action,
                    categories     : row.categories,
                    type           : row.nid_kind,
                    lat            : row.latitude,
                    lon            : row.longitude,
                    gps_action     : row.coordinates_action
                };
            }
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
            var id_counter = 0;
            var insert = function (obj) {
                // add monument object
                db.serialize(function () {
                    // add monument singular data: ids, state and categories
                    db.run("INSERT INTO monuments VALUES(?,?,?,?,?,?,?,?,?)",
                           [id_counter, obj.oz_id, obj.nid_id, !!obj.touched ? 1 : 0, 0, 0, obj.rev_num, obj.lat, obj.lon]); 
                                
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
                    // add categories
                    for(value in obj.cats) { if(obj.cats.hasOwnProperty(value)) {
                        db.run("INSERT INTO category VALUES(?,?,?)",
                               [obj.nid_id, value, obj.cats[value] ]);
                    }};
                });
                id_counter += 1;
            };

            db.serialize(function () {
                console.log('>>> cleaning up data');
                db.run('BEGIN');
                for(key in results) {
                    // upload only these having more than or 4 revisions (1+3)
                    if(results[key].length >= 4) {
                        insert(validate(results[key]));
                    }
                }

                console.log('>>> pushing data into db');
                db.run('COMMIT');
                // just a simple feedback
                db.each('select * from monuments limit 5', function (e, r) {
                    console.log(r);
                });
                db.each('select * from name limit 5', function (e, r) {
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

function validate(revisions) {
    var result = {
        oz_id     : revisions[0].relic_id,
        nid_id    : revisions[0].nid_id,
        touched   : (revisions.length > 1),
        cats      : {},
        names     : {},
        addresses : {},
        dates     : {},
        lat       : 0.0,
        lon       : 0.0,
        rev_num   : revisions.length - 1
    };
    
    var score = {
        edit     : 2,
        revision : 1,
        confirm  : 1,
        skip     : 0
    };
    var actions = {
        revision : 'oryginalne',
        confirm  : 'potwierdzenie',
        edit     : 'edycja',
        skip     : 'pominięcie'
    };

    revisions.forEach(function (revision) {
        var name        = revision.name || '';
        var name_action = revision.name_action;

        var address        = revision.address || '';
        var address_action = revision.address_action;

        var date        = revision.date || '';
        var date_action = revision.date_action;
       
        var categories = !!revision.categories ? revision.categories.split(',') : [];
        
        if(!!name.trim()) {
            name  = parse_name(name, revision.type === 'OZ' || revision.type === 'SA');
            result.names[name] = result.names[name] || { points: 0, actions: [] };
            result.names[name].points = (result.names[name].points || 0) + score[name_action];
            result.names[name].actions.push(actions[name_action]);
        }
        if(!!address.trim()) {
            address = parse_address(address);
            result.addresses[address] = result.addresses[address] || { points: 0, actions: [] };
            result.addresses[address].points = (result.addresses[address].points || 0) + score[address_action];
            result.addresses[address].actions.push(actions[address_action]);
        }
        if(!!date.trim()) {
            date = parse_date(date);
            result.dates[date] = result.dates[date] || { points: 0, actions: [] };
            result.dates[date].points = (result.dates[date].points || 0) + score[date_action];
            result.dates[date].actions.push(actions[date_action]);
        }
        if(!!categories.length) {
            categories.forEach(function (category) {
                result.cats[category] = (result.cats[category] || 0) + 1;
            });
        }
        // TODO score it
        if(revision.gps_action !== 'skip') {
            result.lon = revision.lon;
            result.lat = revision.lat;
        }
        
    });

    return result;
} 


function parse_name(name, single) {
    var match;
    // the names were upper-changed in the middle of the project
    // so some names starts with upper case, some with lower case
    name = name[0].toUpperCase() + name.slice(1);
    
    if(single) {
        match = name.match(/(.*[^\(])( ?\(?w zespol.*)(ob(\.|ecnie) .*)?$/)
        if(!!match) {
            name = strip(match[1]) + (match[3] ? ', ' + strip(match[3]) : '');
        }
    }
    return strip(name);
}

// converts address into address object
function parse_address(address) {
    var types = {
        '^ul(ic[ea]|\.)?:? *'     : 'ul. ',
        '^al(ej[ea]|\.)? *'  : 'al. ',
        '^o[sś](iedle|\.)? *': 'os. '
    };
    var rx;
    var parts;

    // get rid of zip code and city name
    address = address.split(',')
                     .map(function (e) {
                         return e.replace(/\d\d-\d\d\d.*/, '');
                     })
                     .join('');

    // trim whitespaces and quotes
    address = strip(address);
    
    // unify 'ul.', 'al.' etc.
    for(rx in types) { if(types.hasOwnProperty(rx)) {
       parts = address.match(new RegExp(rx, 'i'));
       if(!!parts) {
            address = address.replace(parts[0], types[rx]);
            // quite this loop after unifying
            break;
       }
    }};

    return address;
}

function parse_date(date) {
    // code here
    return strip(date);
}


// like String.prototype.trim, but better ;)
function strip(str) {
    return str.replace(/^\s*"?\s*|\s*"?\s*$/, '');
}
