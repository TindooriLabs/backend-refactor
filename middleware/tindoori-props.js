export function clearTindooriProps(req, _res, next) {
    req.tindooriProps = {};
  
    next();
  }
  