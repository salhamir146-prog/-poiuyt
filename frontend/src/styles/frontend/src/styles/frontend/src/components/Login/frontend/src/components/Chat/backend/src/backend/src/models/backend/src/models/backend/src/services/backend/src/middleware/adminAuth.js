const ADMIN_SECRET = 'Amidhjsos62627@_897';

const adminAuth = (req, res, next) => {
  // بررسی توکن مدیریت
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'دسترسی غیرمجاز - نیاز به احراز هویت' });
  }

  // بررسی رمز مدیریت
  const { password } = req.body;
  
  if (password === ADMIN_SECRET || token === ADMIN_SECRET) {
    req.isAdmin = true;
    next();
  } else {
    res.status(403).json({ error: 'رمز مدیریت اشتباه است' });
  }
};

module.exports = adminAuth;
