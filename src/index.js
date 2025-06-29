const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
// const port = 4000;
const port = process.env.PORT || 4000;

const allowedOrigins = [
    "https://kauuru.vercel.app",
    "https://kauuru-d541p8qsq-yangjuns-projects-672649fb.vercel.app",

    //밑에는 배포시 무조건 주석처리할것
    // "http://localhost:5173",
    // "http://localhost:4000",
];

app.use(
    cors({
        origin: function (origin, callback) {
            // 1) Postman이나 로컬(Origin이 없는 경우) 허용
            if (!origin) return callback(null, true);

            // 2) allowedOrigins 목록에 있으면 해당 Origin으로 허용
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // 3) 그 외의 Origin은 차단
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "x-csrf-token",
            "x-xsrf-token", // ← 반드시 추가해야 x-xsrf-token 헤더가 허용됩니다
        ],
        credentials: true, // ← 꼭 true로 유지
        exposedHeaders: ["x-csrf-token", "x-xsrf-token"],
    })
);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cookieParser());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/ads", express.static(path.join(__dirname, "../uploads/ads")));
app.use("/IMGads", express.static(path.join(__dirname, "../uploads/IMGads")));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB 연결 성공"))
    .catch((err) => console.error("❌ MongoDB 연결 실패:", err));

app.use("/users", require("./routes/users"));
app.use("/products", require("./routes/products"));
app.use("/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin/ad-images", require("./routes/adminImageAds"));
app.use("/api/faq", require("./routes/faq"));
app.use("/api/question", require("./routes/question"));

//배포용 코드
const csrfProtection = csrf({
    cookie: {
        httpOnly: false,
        sameSite: "none",
        secure: true,
    },
    value: (req) => req.headers["x-xsrf-token"],
});

//로컬용 개발 코드
// const csrfProtection = csrf({
//     cookie: {
//         httpOnly: false,
//         sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//         secure: process.env.NODE_ENV === "production",
//     },
//     value: (req) => req.headers["x-xsrf-token"],
// });

app.use((req, res, next) => {
    if (req.method === "OPTIONS") return res.sendStatus(200);
    const csrfNeeded = ["POST", "PUT", "DELETE"].includes(req.method);
    if (csrfNeeded) return csrfProtection(req, res, next);
    next();
});

app.get("/csrf-token", csrfProtection, (req, res) => {
    res.status(200).json({ csrfToken: req.csrfToken() });
});

app.get("/", (req, res) => {
    res.send("서버 실행 중");
});

app.use((err, req, res, next) => {
    console.error("에러 발생:", err);
    res.status(err.status || 500).send(err.message || "서버 오류");
});

app.listen(port, () => {
    console.log(`✅ 서버 실행 중: PORT ${port}`);
});
