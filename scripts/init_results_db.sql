CREATE TABLE monuments(
    oz_id      INTEGER,     -- id in Otwarte Zabytki db
    nid_id     INTEGER,     -- id in the NID db
    touched    INTEGER,     -- 0 for false, 1 for true
    name       TEXT,
    address    TEXT,
    date       TEXT,
    categories TEXT         -- intersecion of users added categories
);

