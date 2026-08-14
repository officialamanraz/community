const db = require('../database/mysql');
const createReport = async(req,res)=>{
    const {reported_by, item_type, item_id, reason}=req.body;
    try{
        const [result]=await db.execute('insert into reports (reported_by, item_type, item_id, reason) values(?,?,?,?)',[reported_by, item_type, item_id, reason]);
        return res.status(201).json(result);
    }catch(error){
        console.error('[report] failed to created the report you wanted',error.message);
        return res.status(500).json({
            success:false,
            message:"database problem"
        });
    };
};

const getAllReports = async(req,res)=>{
    try{
        const [result] = await db.execute('SELECT * FROM reports ORDER BY created_at DESC');
        return res.status(200).json(result)
    }catch(error){
        console.error('[report] failed to fetch data',error.message);
        return res.status(500).json({
            success:false,
            message:"failed to fetch data"
        });
    };
};

module.exports = { createReport, getAllReports };