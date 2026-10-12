import pool from '../config/database.js';

export const auditLog = (tableName) => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);
    
    res.json = (body) => {
      // After successful mutation, log to audit_log
      if (res.statusCode >= 200 && res.statusCode < 300 && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        
        let recordId = null;
        if (body && body.data) {
           recordId = body.data.id || body.data.case_id || body.data.patient_id || body.data.investigation_id;
        } else if (req.params.id) {
           recordId = req.params.id;
        }

        const action = req.method === 'POST' ? 'CREATE' : req.method === 'PUT' ? 'UPDATE' : 'DELETE';
        const userId = req.user ? req.user.user_id : null;
        
        pool.query(
          'INSERT INTO audit_log (user_id, action, table_name, record_id, new_value, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
          [
             userId, 
             action, 
             tableName, 
             recordId, 
             JSON.stringify(body?.data || {}), 
             req.ip
          ]
        ).catch(err => console.error('Audit Log Error:', err));
      }
      return originalJson(body);
    };
    next();
  };
};
