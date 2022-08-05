import connectDB from '../../../db';
import Software from '../../../models/softwareModel';

const handler = async (req, res) => {
  try {
    const {method} = req;
    if (method !== 'POST') res.json({status: 'ERROR', message: '此接口只支持POST方法'})
    await connectDB();

    console.log(req.body)

    // 需要做字段处理 安全性
    await Software.create(req.body)

    return res.json({
      status: 'OK'
    })
  } catch(error) {
    console.log(error)
    return res.json({
      status: 'ERROR'
    })
  }
}

export default handler;