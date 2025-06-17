// const express = require("express"); //  Express 프레임워크 불러오기 (서버 기능 구현)
// const path = require("path"); //  Node 내장 모듈 – 경로(path) 관련 작업을 쉽게 처리
// const cors = require("cors"); //  CORS 설정용 – 도메인 간 통신 허용
// const helmet = require("helmet"); //  보안 HTTP 헤더 설정을 도와주는 미들웨어
// const csrf = require("csurf"); //  CSRF 토큰 미들웨어 – 요청 위조 방지
// const cookieParser = require("cookie-parser"); //  쿠키를 읽고 파싱하는 미들웨어
// const mongoose = require("mongoose"); //  MongoDB와 연결하고 데이터 다루는 ODM
// const dotenv = require("dotenv"); //  환경변수 파일(.env) 읽기
// dotenv.config(); // .env 파일 내용들을 process.env 로 등록

// const app = express(); // Express 앱 생성
// const port = 4000; // 서버가 열릴 포트 번호

// const allowedOrigins = [
//     "https://kauuru.vercel.app",
//     "https://kauuru-d541p8qsq-yangjuns-projects-672649fb.vercel.app",
//     "https://2b60-182-229-137-57.ngrok-free.app",
// ];


// app.use(
//     cors({
//         origin: function (origin, callback) {
//             if (!origin) return callback(null, true);
//             if (allowedOrigins.includes(origin)) {
//                 return callback(null, origin); // 🔥 기존 true → origin 로 변경
//             }
//             return callback(new Error("Not allowed by CORS"));
//         },
//         methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//         allowedHeaders: [
//             "Content-Type",
//             "Authorization",
//             "x-csrf-token",
//             "x-xsrf-token",
//         ],
//         credentials: true,
//     })
// );

// app.use(helmet({ crossOriginResourcePolicy: false }));
// app.use(cookieParser());
// app.use(express.json());

// app.use((req, res, next) => {
//     console.log("요청 Origin:", req.headers.origin);
//     console.log("요청 URL:", req.originalUrl);
//     next();
// });

// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// app.use("/ads", express.static(path.join(__dirname, "../uploads/ads")));
// app.use("/IMGads", express.static(path.join(__dirname, "../uploads/IMGads")));

// mongoose
//     .connect(process.env.MONGO_URI)
//     .then(() => console.log("MongoDB 연결 성공"))
//     .catch((err) => console.error("MongoDB 연결 실패:", err));

// app.use("/users", require("./routes/users"));
// app.use("/products", require("./routes/products"));
// app.use("/reviews", require("./routes/reviews"));
// app.use("/api/admin", require("./routes/admin"));
// app.use("/api/admin/ad-images", require("./routes/adminImageAds"));
// app.use("/api/faq", require("./routes/faq"));
// app.use("/api/question", require("./routes/question"));


// const csrfProtection = csrf({
//     cookie: {
//         httpOnly: false,
//         sameSite: "lax",
//         secure: false,
//     },
//     value: (req) => req.headers["x-csrf-token"],
// });

// // const csrfProtection = csrf({
// //     cookie: {
// //         httpOnly: false,
// //         sameSite: "lax",
// //         secure: false,
// //     },
// //     value: (req) => req.headers["x-xsrf-token"],
// // });

// // app.use((req, res, next) => {
// //     if (req.method === "OPTIONS") {
// //         return res.sendStatus(200);
// //     }
// //     const csrfNeeded = ["POST", "PUT", "DELETE"].includes(req.method);
// //     if (csrfNeeded) {
// //         return csrfProtection(req, res, next);
// //     }
// //     next();
// // });

// app.use((req, res, next) => {
//     if (req.method === "OPTIONS") {
//         return res.sendStatus(200);
//     }
//     next();
// });

// app.get("/csrf-token", csrfProtection, (req, res) => {
//     res.status(200).json({ csrfToken: req.csrfToken() });
// });

// app.get("/", (req, res) => {
//     res.send("서버 실행 중");
// });

// app.use((err, req, res, next) => {
//     console.error("에러 발생:", err);
//     res.status(err.status || 500).send(err.message || "서버 오류");
// });

// app.listen(port, () => {
//     console.log(`✅ 서버 실행 중: http://localhost:${port}`);
// });

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

// const allowedOrigins = [
//   "https://kauuru.vercel.app", // ✅ 실제 프로덕션 주소
//   "https://kauuru-d541p8qsq-yangjuns-projects-672649fb.vercel.app", // ✅ 프리뷰 주소
//   "https://0b79-182-229-137-57.ngrok-free.app" // ✅ 최신 ngrok 주소
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       console.log("🔗 요청 Origin:", origin);
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         console.log("❌ CORS 차단:", origin);
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );

const allowedOrigins = [
    "https://kauuru.vercel.app",
    "https://kauuru-d541p8qsq-yangjuns-projects-672649fb.vercel.app",
];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true); // allow Postman etc
//       if (allowedOrigins.includes(origin)) {
//         return callback(null, origin); // 👈 반드시 origin 그대로 넘겨야 함
//       } else {
//         return callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );
// app.use(
//     cors({
//         origin: function (origin, callback) {
//             // 1) Postman, 서버 자체 호출 등 Origin이 없는 경우 허용
//             if (!origin) return callback(null, true);

//             // 2) 실제 허용할 도메인 목록에 있으면, 그 값을 다시 넘겨준다.
//             if (allowedOrigins.includes(origin)) {
//                 // → 두 방식 다 가능하나, 아래처럼 true를 리턴하면
//                 //   cors 패키지가 자동으로 Access-Control-Allow-Origin: <요청Origin> 으로 설정해 준다.
//                 return callback(null, true);
//                 // ↳ 만약 callback(null, origin) 을 쓰면 실제 응답 헤더에 정확히 origin이 들어가야 하지만,
//                 //   가독성/일관성 때문에 callback(null, true) 권장
//             }

//             // 3) 그 외 Origin에서 온 요청은 차단
//             return callback(new Error("Not allowed by CORS"));
//         },
//         methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//         allowedHeaders: [
//             "Content-Type",
//             "Authorization",
//             "x-csrf-token", // 기존 헤더
//             "x-xsrf-token", // ← 여기에 반드시 추가
//         ],
//         credentials: true, // → 반드시 true여야 브라우저가 쿠키(자격증명)를 허용한다.
//     })
// );

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
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "x-csrf-token",
            "x-xsrf-token", // ← 반드시 추가해야 x-xsrf-token 헤더가 허용됩니다
        ],
        credentials: true, // ← 꼭 true로 유지
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

// const csrfProtection = csrf({
//     cookie: {
//         httpOnly: false,
//         sameSite: "lax",
//         secure: false,
//     },
//     value: (req) => req.headers["x-csrf-token"],
// });

const csrfProtection = csrf({
    cookie: {
        httpOnly: false,
        sameSite: "lax",
        secure: false,
    },
    value: (req) => req.headers["x-xsrf-token"], // ← "x-csrf-token" → "x-xsrf-token" 으로 변경
});

// app.use((req, res, next) => {
//     if (req.method === "OPTIONS") {
//         return res.sendStatus(200);
//     }
//     const csrfNeeded = ["POST", "PUT", "DELETE"].includes(req.method);
//     if (csrfNeeded) {
//         return csrfProtection(req, res, next);
//     }
//     next();
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