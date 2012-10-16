CREATE TABLE monuments(
    id                          INTEGER,     -- id in Otwarte Zabytki db
    nid_id                      INTEGER,     -- id in the NID db
    parent_id                   INTEGER,
    child_order                 INTEGER,
    identification              TEXT,
    categories                  TEXT,
    existance                   TEXT,
    state                       TEXT,
    register_numer              TEXT,
    dating_of_obj               TEXT,
    street                      TEXT,
    place_id                    TEXT,
    commune_id                  TEXT,
    district_id                 TEXT,
    voivodeship_id              TEXT,
    latitude                    REAL,
    longitude                   REAL,
    coordinates_approval        BOOLEAN
);

CREATE TABLE terc(
    terc_code                   TEXT,
    name                        TEXT
);