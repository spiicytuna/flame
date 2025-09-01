const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Category = sequelize.define(
  'Category',
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    isPublic: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'bookmarks', // 'apps' | 'bookmarks'
      validate: {
        isIn: [['apps', 'bookmarks']],
      },
    },
  },
  {
    tableName: 'categories',
    indexes: [
      // mirrors: CREATE UNIQUE INDEX unique_name_section ON categories (name, section);
      { unique: true, fields: ['name', 'section'] },
    ],
  }
);

module.exports = Category;
