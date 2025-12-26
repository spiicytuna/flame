const { DataTypes } = require('sequelize');
const { BOOLEAN } = DataTypes;

const up = async (query) => {
  await query.addColumn('apps', 'invertIcon', {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await query.addColumn('bookmarks', 'invertIcon', {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
};

const down = async (query) => {
  await query.removeColumn('apps', 'invertIcon');
  await query.removeColumn('bookmarks', 'invertIcon');
};

module.exports = {
  up,
  down,
};
