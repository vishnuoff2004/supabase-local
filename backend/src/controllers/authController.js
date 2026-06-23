const authService = require('../services/authService');
const { validateRegister, validateLogin } = require('../validations/authValidation');

async function register(req, res, next) {
  try {
    const validation = validateRegister(req.body);
    if (validation.error) {
      return res.status(400).json({
        message: validation.error.details[0].message,
        errors: validation.error.details.map(d => d.message),
      });
    }
    const result = await authService.register({
      ...req.body,
      licenseDocUrl: req.licenseDocUrl,
      vehicleRcUrl: req.vehicleRcUrl,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ message: err.message });
    if (err.status === 400) return res.status(400).json({ message: err.message });
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json(user);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    next(err);
  }
}

async function setupRole(req, res, next) {
  try {
    const result = await authService.setupRole(req.user.id, req.body);
    res.status(200).json(result);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    const allowedFields = ['name', 'phone'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });
    await user.save();
    res.status(200).json({ message: 'Profile updated', user: user });
  } catch (err) {
    next(err);
  }
}

async function completeRegistration(req, res, next) {
  try {
    const result = await authService.completeRegistration(req.body);
    res.status(200).json(result);
  } catch (err) {
    if (err.status === 401) return res.status(401).json({ message: err.message });
    if (err.status === 404) return res.status(404).json({ message: err.message });
    if (err.status === 409) return res.status(409).json({ message: err.message });
    next(err);
  }
}

async function oauthSetup(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const result = await authService.oauthSetup({ ...req.body, accessToken: token });
    res.status(200).json(result);
  } catch (err) {
    if (err.status === 401) return res.status(401).json({ message: err.message });
    if (err.status === 400) return res.status(400).json({ message: err.message });
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (typeof validateLogin === 'function') {
      const validation = validateLogin(req.body);
      if (validation && validation.error) {
        return res.status(400).json({ message: validation.error.details[0].message });
      }
    }
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    if (err.status === 401) return res.status(401).json({ message: err.message });
    if (err.status === 403) return res.status(403).json({ message: err.message });
    if (err.status === 404) return res.status(404).json({ message: err.message });
    if (err.status === 429) return res.status(429).json({ message: err.message });
    next(err);
  }
}

module.exports = { register, login, completeRegistration, getMe, setupRole, updateProfile, oauthSetup };
