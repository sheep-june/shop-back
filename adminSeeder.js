const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./src/models/Admin'); 

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("DB 연결됨");

    await Admin.deleteMany({}); 

    await Admin.create({
      email: 'admin@example.com',
      password: 'admin123', 
    });

    console.log("관리자 계정 생성 완료!");
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
