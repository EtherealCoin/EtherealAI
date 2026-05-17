function createSqliteRuntime(db) {
  function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function onRun(err) {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      });
    });
  }

  function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows);
      });
    });
  }

  function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row);
      });
    });
  }

  function checkDatabase() {
    return new Promise(resolve => {
      db.get('SELECT 1 AS ok', err => {
        resolve({
          ok: !err,
          message: err ? err.message : 'SQLite is reachable'
        });
      });
    });
  }

  return {
    dbRun,
    dbAll,
    dbGet,
    checkDatabase
  };
}

module.exports = {
  createSqliteRuntime
};
