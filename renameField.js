const mongoose = require("mongoose");
require("dotenv").config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB 연결 성공");

    const result = await mongoose.connection.db
      .collection("products")
      .updateMany(
        { continents: { $exists: true } },
        { $rename: { continents: "category" } }
      );
    console.log(`필드명 변경 완료: ${result.modifiedCount}개 문서 수정됨`);
  } catch (err) {
    console.error("오류 발생:", err);
  } finally {
    mongoose.connection.close();
  }
}

main();
