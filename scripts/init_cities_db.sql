CREATE TABLE cities(
    nid_id      INTEGER,
    city       TEXT,
    FOREIGN KEY(nid_id) REFERENCES monuments(nid_id)
);