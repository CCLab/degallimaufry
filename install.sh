cd scripts
echo ""
echo ">>> downloading monuments revision history file"
wget http://otwartezabytki.pl/system/relics_history.csv
echo ""
echo ">>> creating dbs"
mkdir ../dbs
sqlite3 ../dbs/score.db < init_score_db.sql
sqlite3 ../dbs/results.db < init_results_db.sql
echo ""
echo ">>> installing node dependencies"
npm install
echo ""
echo ">>> verifying data"
node score.js
#rm relics_history.csv
#rm -rf node_modules
echo ""
echo ">>> score db is ready to use"
cd ..
echo ">>> installing express dependencies"
npm install
node app.js
