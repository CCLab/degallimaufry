var csv = require('csv');
var fs  = require('fs');

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('../dbs/score.db', parse_file);

function parse_file() {
    var results = {};

    console.log('>>> parsing file');
    csv().fromPath('./relics_history.csv', {columns: true})
        .transform(function (row, index) {
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
                type           : row.nid_kind
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
            var insert = function (obj) {
                // add monument object
                db.serialize(function () {
                    // add monument singular data: ids, state and categories
                    db.run("INSERT INTO monuments VALUES(?,?,?,?,?,?)",
                           [obj.oz_id, obj.nid_id, !!obj.touched ? 1 : 0, 0, 0, (obj.cats.join(',') || null)]); 
                                
                    // add names
                    for(value in obj.names) { if(obj.names.hasOwnProperty(value)) {
                        db.run("INSERT INTO name VALUES(?,?,?,?)", 
                               [obj.nid_id, value, obj.names[value].actions.join(','), obj.names[value].points]);
                    }};
                    // add addresses
                    for(value in obj.addresses) { if(obj.addresses.hasOwnProperty(value)) {
                        db.run("INSERT INTO address VALUES(?,?,?,?)",
                               [obj.nid_id, value, obj.addresses[value].actions.join(','), obj.addresses[value].points ]);
                    }};
                    // add dates
                    for(value in obj.dates) { if(obj.dates.hasOwnProperty(value)) {
                        db.run("INSERT INTO date VALUES(?,?,?,?)",
                               [obj.nid_id, value, obj.dates[value].actions.join(','), obj.dates[value].points ]);
                    }};
                });
            };

            db.serialize(function () {
                console.log('>>> cleaning up data');
                db.run('BEGIN');
                for(key in results) {
                    insert(validate(results[key]));
                }
                console.log('>>> pushing data into db');
                db.run('COMMIT');
                // just a simple feedback
                db.each('select * from monuments where categories is not null limit 5', function (e, r) {
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
        cats      : [],
        names     : {},
        addresses : {},
        dates     : {}
    };
    var tmp_cats = {};
    var score = {
        edit     : 2,
        revision : 1,
        confirm  : 1,
        skip     : 0
    };

    revisions.forEach(function (revision) {
        var name        = revision.name || '';
        var name_action = revision.name_action;

        var address        = revision.address || '';
        var address_action = revision.address_action;

        var date        = revision.date || '';
        var date_action = revision.date_action;
       
        var categories = (revision.categories || '').split(','); 

        if(!!name.trim()) {
            name  = parse_name(name, revision.type === 'OZ' || revision.type === 'SA');
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
        if(!!categories.length) {
            categories.forEach(function (category) {
                tmp_cats[category] = (tmp_cats[category] || 0) + 1;
            });
        }
    });

    for(cat in tmp_cats) {
        // collect only categories selected by all revisioners
        if(tmp_cats[cat] === (revisions.length - 1)) {
            result.cats.push(cat);
        }
    }

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
            // TODO - deal with comma
            name = match[1] + (match[3] ? match[3] : '');
            console.log(name);
        }
    }
    return name;
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
    address = address.replace(/^\s*"?\s*|\s*"?\s*$/g, '');
    
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
    return date;
}

