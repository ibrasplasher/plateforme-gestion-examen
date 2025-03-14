const db = require("../config/db");

const createCorrection = (copyId, userId, score, comments, callback) => {
  const query =
    "INSERT INTO corrections (copy_id, user_id, score, comments) VALUES (?, ?, ?, ?)";
  db.query(query, [copyId, userId, score, comments], callback);
};

module.exports = {
  createCorrection,
};
