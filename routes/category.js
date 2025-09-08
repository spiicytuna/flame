const express = require('express');
const router = express.Router();

const Category = require('../models/Category');

// middleware
const { auth, requireAuth } = require('../middleware');
const {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} = require('../controllers/categories');


router
  .route('/')
  .post(auth, requireAuth, createCategory)
  .get(auth, getAllCategories);

// if settings => interface => collapsable app cats => false => reset visibility
router.route('/expand-all').put(auth, requireAuth, async (req, res) => {
  try {
    await Category.update({ isCollapsed: false }, { where: {} });
    
    res.status(200).json({ success: true, message: 'All categories expanded.' });
  } catch (err) {
    console.error(`PUT /api/categories/expand-all failed`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router
  .route('/:id')
  .get(auth, getSingleCategory)
  .put(auth, requireAuth, updateCategory)
  .delete(auth, requireAuth, deleteCategory)
  .patch(auth, requireAuth, async (req, res) => {
    try {
      const { isCollapsed } = req.body;
      if (typeof isCollapsed !== 'boolean') {
        return res.status(400).json({ error: 'isCollapsed must be a boolean' });
      }

      const category = await Category.findByPk(req.params.id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      category.isCollapsed = isCollapsed;
      await category.save();

      res.status(200).json({ success: true, category });
    } catch (err) {
      console.error(`PATCH /api/categories/:id failed`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

router.route('/0/reorder').put(auth, requireAuth, reorderCategories);

module.exports = router;
