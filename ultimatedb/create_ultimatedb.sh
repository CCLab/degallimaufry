#!/bin/bash

echo "Creating ultimate.db template"
sqlite3 ultimate.db < init_ultimate_db.sql
echo "Parse data from TERC.xml"
ruby parseTERC.rb
echo "Parse data from revision_history.csv"
ruby parse_rhcsv.rb
echo "Parse data from results database"
ruby parse_resultsdb.rb
echo "Finished"