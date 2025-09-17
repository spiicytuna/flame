const Category = require('../../models/Category');
const Logger = require('../../utils/Logger');
const loadConfig = require('../../utils/loadConfig');
const logger = new Logger();

module.exports = async function createCategory(req, res) {
  try {
    const {
      name,
      isPublic,
      isPinned,
      section,        // 'apps' | 'bookmarks'
      abbreviation,   // optional, <= 3 chars
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const cfg = await loadConfig();
    const normalizedSection = section === 'apps' ? 'apps' : 'bookmarks';
    
    const defaultPinned =
      normalizedSection === 'apps'
        ? !!cfg.pinAppCategoriesByDefault
        : !!cfg.pinCategoriesByDefault;
    
    let normalizedPinned;
    if (isPinned === 0 || isPinned === '0') {
      normalizedPinned = false;
    } else if (isPinned === 1 || isPinned === '1') {
      normalizedPinned = true;
    } else if (typeof isPinned === 'boolean') {
      normalizedPinned = isPinned;
    } else {
      normalizedPinned = defaultPinned;
    }
    
    const payload = {
      name: String(name).trim(),
      // in DB this is INTEGER(0/1); normalize truthy/falsy
      isPublic: (isPublic === 0 || isPublic === '0') ? 0 : 1,
      isPinned: normalizedPinned,
      section: normalizedSection,
      abbreviation: (abbreviation ?? '—').toString().slice(0, 3) || '—',
    };

    const created = await Category.create(payload);
    return res.json({ success: true, data: created });
  } catch (err) {
    if (err && err.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(409)
        .json({ success: false, message: 'Category name already exists in this section' });
    }
    logger.error(err);
    return res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};
