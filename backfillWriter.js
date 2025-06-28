// backend/backfillWriter.js
require("dotenv").config();             // .env에서 MONGO_URI 읽어오기
const mongoose = require("mongoose");
const Product = require("./src/models/Product");
const User = require("./src/models/User");

async function backfill() {
  // 1) DB 연결
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // 2) writer가 없는 상품만 찾아서, 임시로 admin 유저의 _id를 채워넣음
  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("⚠️ admin 유저를 찾을 수 없습니다.");
    process.exit(1);
  }

  const result = await Product.updateMany(
    { writer: { $exists: false } },
    { $set: { writer: admin._id } }
  );
  console.log(
    `✅ 기존 상품 중 writer가 없던 ${result.nModified}건에 admin(${admin._id}) 할당 완료`
  );

  process.exit(0);
}

backfill().catch((err) => {
  console.error("❌ 백필 작업 중 오류:", err);
  process.exit(1);
});
