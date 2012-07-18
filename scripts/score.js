var csv = require('csv');

var results = {};
var counter = 0;

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
    })
    .on('error', function (err) {
        console.log(err);
        process.exit();
    });

function save_to_db() {
}

function validate(monument) {
    var result = {
        name: {},
        address: {}
    };
//    var score = {
//        confirm  : 1,
//        revision : 1,
//        edit     : 2,
//        skip     : 0
//    };
//
//    monument.forEach(function (row) {
//        var name = row[13].trim();
//        var name_action = row[14];
//
//        var address = row[15].trim();
//        var address_action = row[16];
//
//        if(!!name) {
//            name = name[0].toUpperCase() + name.slice(1);
//            result.name[name] = result.name[name] || { points: 0, actions: [] };
//            result.name[name].points = (result.name[name].points || 0) + score[name_action];
//            result.name[name].actions += name_action + ', ';
//        }
//        if(!!address) {
//            address = parse_address(address);
//            result.address[address] = result.address[address] || { points: 0, actions: [] };
//            result.address[address].points = (result.address[address].points || 0) + score[address_action];
//            result.address[address].actions += address_action + ', ';
//        }
//    });

    return result;
} 

function parse_name(name) {
    // code here
}

// converts address into address object
function parse_address(address) {
    // get rid of zip code and city name
    address = address.split(',').map(function (e) {
        return e.trim().replace(/\d\d-\d\d\d.*/, '');
    }).join('').replace(/[Uu]l\.?/, '').trim();
    
    return address;
}

function parse_date(date) {
    // code here
}
