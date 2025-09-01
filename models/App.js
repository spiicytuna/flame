const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const Category = require('./Category');

const App = sequelize.define(
  'App',
  {
    name: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING, allowNull: false, defaultValue: 'cancel' },
    isPinned: { type: DataTypes.BOOLEAN, defaultValue: false },
    orderId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    isPublic: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    description: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },

    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'categories', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
  },
  { tableName: 'apps' }
);

// Associations (kept local to avoid touching the rest of the codebase)
App.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

if (!Category.associations?.apps) {
  Category.hasMany(App, { as: 'apps', foreignKey: 'categoryId' });
}

module.exports = App;
