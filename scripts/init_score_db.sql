CREATE TABLE monuments(
    id           INTEGER,
    oz_id        INTEGER,     
    nid_id       INTEGER,     
    touched      INTEGER,     
    reviewed     INTEGER,
    locked       INTEGER,
    edit_counter INTEGER,
    lat          REAL,
    lon          REAL
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

CREATE TABLE category(
    nid_id      INTEGER,
    value       TEXT,
    points      INTEGER,
    FOREIGN KEY(nid_id) REFERENCES monuments(nid_id)
);
