CREATE TABLE monuments(
    oz_id      INTEGER,     -- id in Otwarte Zabytki db
    nid_id     INTEGER,     -- id in the NID db
    touched    INTEGER,     -- 0 for false, 1 for true
    categories TEXT         -- intersecion of users added categories
);

CREATE TABLE name(
    nid_id      INTEGER,
    value       TEXT,
    actions     TEXT,
    points      INTEGER,
    FOREIGN KEY(nid_id) REFERENCES monuments(nid_id)
);

CREATE TABLE address(
    nid_id      INTEGER,
    value       TEXT,
    actions     TEXT,
    points      INTEGER,
    FOREIGN KEY(nid_id) REFERENCES monuments(nid_id)
);

CREATE TABLE date(
    nid_id      INTEGER,
    value       TEXT,
    actions     TEXT,
    points      INTEGER,
    FOREIGN KEY(nid_id) REFERENCES monuments(nid_id)
);
