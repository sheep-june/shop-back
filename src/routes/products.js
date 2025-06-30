const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const multer = require("multer");
const path = require("path");
const Review = require("../models/Review");

const storage = multer.diskStorage({
    // destination: (req, file, cb) => cb(null, "uploads/"),
    destination: (req, file, cb) =>
        cb(null, path.join(__dirname, "../../uploads")),
    filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage }).single("file");

router.post("/image", auth, (req, res) => {
    upload(req, res, (err) => {
        if (err) return res.status(500).send(err);
        return res.json({ fileName: res.req.file.filename });
    });
});

router.get("/:id", async (req, res, next) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        const product = await Product.findById(req.params.id).populate(
            "writer"
        );
        const reviews = await Review.find({ product: req.params.id }).populate(
            "user",
            "name"
        );
        const averageRating = reviews.length
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
            : 0;
        if (req.query.type === "single") {
            return res.status(200).json([
                {
                    ...product.toObject(),
                    reviews,
                    averageRating,
                },
            ]);
        }
        return res.status(200).json({
            product,
            reviews,
            averageRating,
        });
    } catch (error) {
        next(error);
    }
});

// router.get("/", async (req, res) => {
//     try {
//         // const { skip = 0, limit = 20, searchTerm = "", sort } = req.query;
//         const { skip = 0, limit = 20, searchTerm = "", sort } = req.query;
//         let filters = {};

//         if (typeof req.query.filters === "string") {
//             // filters = JSON.parse(req.query.filters);
//             try {
//                 if (typeof req.query.filters === "string") {
//                     filters = JSON.parse(req.query.filters);
//                 }
//             } catch (e) {
//                 console.error("❌ filters 파싱 실패:", e.message);
//                 filters = {};
//             }
//         } else if (typeof req.query.filters === "object") {
//             filters = req.query.filters;
//         }

//         const query = {};

//         if (searchTerm) {
//             query.$or = [
//                 { title: { $regex: searchTerm, $options: "i" } },
//                 { description: { $regex: searchTerm, $options: "i" } },
//             ];
//         }

//         if (filters.continents && filters.continents.length > 0) {
//             query.category = { $in: filters.continents };
//         }

//         if (filters.price && filters.price.length === 2) {
//             query.price = {
//                 $gte: filters.price[0],
//                 $lte: filters.price[1],
//             };
//         }

//         // const rawProducts = await Product.find(query)
//         //     .skip(parseInt(skip))
//         //     .limit(parseInt(limit));

//         let rawProductsQuery = Product.find(query);
//         // sold 정렬이면 DB 레벨에서 바로 sort → limit
//         if (sort === "sold") {
//             rawProductsQuery = rawProductsQuery
//                 .sort({ sold: -1 }) // 판매량 내림차순
//                 .skip(parseInt(skip))
//                 .limit(parseInt(limit));
//         } else {
//             // 나머지 sort 타입은 기존 로직 유지
//             rawProductsQuery = rawProductsQuery
//                 .skip(parseInt(skip))
//                 .limit(parseInt(limit));
//         }
//         const rawProducts = await rawProductsQuery;

//         const productsWithRating = await Promise.all(
//             rawProducts.map(async (product) => {
//                 const reviews = await Review.find({ product: product._id });
//                 const avg =
//                     reviews.reduce((acc, r) => acc + r.rating, 0) /
//                     (reviews.length || 1);
//                 return {
//                     ...product._doc,
//                     averageRating: reviews.length
//                         ? parseFloat(avg.toFixed(1))
//                         : 0,
//                 };
//             })
//         );

//         let sorted = [...productsWithRating];
//         switch (sort) {
//             case "views":
//                 sorted.sort((a, b) => b.views - a.views);
//                 break;
//             case "rating":
//                 sorted.sort((a, b) => b.averageRating - a.averageRating);
//                 break;
//             case "lowPrice":
//                 sorted.sort((a, b) => a.price - b.price);
//                 break;
//             case "highPrice":
//                 sorted.sort((a, b) => b.price - a.price);
//                 break;
//             case "sold":
//                 sorted.sort((a, b) => b.sold - a.sold);
//                 break;
//             default:
//                 sorted.sort(
//                     (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//                 );
//         }

//         const totalCount = await Product.countDocuments(query);
//         const hasMore = parseInt(skip) + parseInt(limit) < totalCount;

//         res.status(200).json({
//             products: sorted,
//             hasMore,
//             totalCount,
//         });
//     } catch (err) {
//         console.error(" 상품 목록 조회 실패:", err);
//         res.status(400).send("상품 목록 조회 실패");
//     }
// });








// router.get("/", async (req, res) => {
//     try {
//         // 1) 클라이언트에서 전달된 파라미터 해석
//         const { skip = 0, limit = 20, searchTerm = "", sort } = req.query;
//         let filters = {};

//         // filters 파싱 (string 또는 object 처리)
//         if (typeof req.query.filters === "string") {
//             try {
//                 filters = JSON.parse(req.query.filters);
//             } catch (e) {
//                 console.error("❌ filters 파싱 실패:", e.message);
//             }
//         } else if (typeof req.query.filters === "object") {
//             filters = req.query.filters;
//         }

//         // 2) MongoDB query 객체 구성
//         const query = {};
//         if (searchTerm) {
//             query.$or = [
//                 { title:    { $regex: searchTerm, $options: "i" } },
//                 { description:{ $regex: searchTerm, $options: "i" } },
//             ];
//         }
//         if (filters.continents?.length) {
//             query.category = { $in: filters.continents };
//         }
//         if (Array.isArray(filters.price) && filters.price.length === 2) {
//             query.price = {
//                 $gte: Number(filters.price[0]),
//                 $lte: Number(filters.price[1]),
//             };
//         }

//         // 3) 정렬 로직: sold/views/price는 DB에서, rating만 메모리 정렬
//         let rawProductsQuery = Product.find(query);
//         switch (sort) {
//             case "sold":
//                 rawProductsQuery = rawProductsQuery.sort({ sold: -1 });
//                 break;
//             case "views":
//                 rawProductsQuery = rawProductsQuery.sort({ views: -1 });
//                 break;
//             case "lowPrice":
//                 rawProductsQuery = rawProductsQuery.sort({ price: 1 });
//                 break;
//             case "highPrice":
//                 rawProductsQuery = rawProductsQuery.sort({ price: -1 });
//                 break;
//             default:
//                 // rating 및 기타(신상품)는 createdAt 기준 내림차순
//                 rawProductsQuery = rawProductsQuery.sort({ createdAt: -1 });
//         }

//         // 4) 페이징 적용
//         const rawProducts = await rawProductsQuery
//             .skip(parseInt(skip, 10))
//             .limit(parseInt(limit, 10));

//         // 5) 평균 평점 계산
//         const productsWithRating = await Promise.all(
//             rawProducts.map(async (product) => {
//                 const reviews = await Review.find({ product: product._id });
//                 const avg =
//                     reviews.reduce((sum, r) => sum + r.rating, 0) /
//                     (reviews.length || 1);
//                 return {
//                     ...product._doc,
//                     averageRating: reviews.length ? Number(avg.toFixed(1)) : 0,
//                 };
//             })
//         );

//         // 6) rating 정렬 (DB에서 못 한 경우)
//         let sortedProducts = [...productsWithRating];
//         if (sort === "rating") {
//             sortedProducts.sort((a, b) => b.averageRating - a.averageRating);
//         }

//         // 7) 전체 개수 & hasMore 플래그
//         const totalCount = await Product.countDocuments(query);
//         const hasMore = parseInt(skip, 10) + parseInt(limit, 10) < totalCount;

//         // 8) 응답
//         res.status(200).json({
//             products: sortedProducts,
//             totalCount,
//             hasMore,
//         });
//     } catch (err) {
//         console.error("상품 목록 조회 실패:", err);
//         res.status(400).send("상품 목록 조회 실패");
//     }
// });

router.get("/", async (req, res) => {
    try {
        // 1) 파라미터 해석
        const { skip = 0, limit = 1000, searchTerm = "", sort } = req.query;
        const skipNum = parseInt(skip, 10);
        const limitNum = parseInt(limit, 10);
        let filters = {};

        if (typeof req.query.filters === "string") {
            try {
                filters = JSON.parse(req.query.filters);
            } catch (e) {
                console.error("❌ filters 파싱 실패:", e.message);
            }
        } else if (typeof req.query.filters === "object") {
            filters = req.query.filters;
        }

        // 2) MongoDB query 작성
        const query = {};
        if (searchTerm) {
            query.$or = [
                { title:       { $regex: searchTerm, $options: "i" } },
                { description: { $regex: searchTerm, $options: "i" } },
            ];
        }
        if (Array.isArray(filters.continents) && filters.continents.length) {
            query.category = { $in: filters.continents };
        }
        if (Array.isArray(filters.price) && filters.price.length === 2) {
            query.price = {
                $gte: Number(filters.price[0]),
                $lte: Number(filters.price[1]),
            };
        }

        // 3) sort === "rating" 전용 처리
        if (sort === "rating") {
            // 3-1) 전체 matching products 가져오기
            const allProducts = await Product.find(query);
            // 3-2) 평균 평점 계산
            const allWithRating = await Promise.all(
                allProducts.map(async (p) => {
                    const reviews = await Review.find({ product: p._id });
                    const avg =
                        reviews.reduce((sum, r) => sum + r.rating, 0) /
                        (reviews.length || 1);
                    return {
                        ...p._doc,
                        averageRating: reviews.length
                            ? Number(avg.toFixed(1))
                            : 0,
                    };
                })
            );
            // 3-3) 내림차순 정렬
            const sortedAll = allWithRating.sort(
                (a, b) => b.averageRating - a.averageRating
            );
            // 3-4) 페이징
            const paginated = sortedAll.slice(skipNum, skipNum + limitNum);
            const totalCount = sortedAll.length;
            const hasMore = skipNum + limitNum < totalCount;

            return res.status(200).json({
                products: paginated,
                totalCount,
                hasMore,
            });
        }

        // 4) 그 외 정렬: DB 레벨에서 처리
        let rawQ = Product.find(query);
        switch (sort) {
            case "sold":
                rawQ = rawQ.sort({ sold: -1 });
                break;
            case "views":
                rawQ = rawQ.sort({ views: -1 });
                break;
            case "lowPrice":
                rawQ = rawQ.sort({ price: 1 });
                break;
            case "highPrice":
                rawQ = rawQ.sort({ price: -1 });
                break;
            default:
                rawQ = rawQ.sort({ createdAt: -1 });
        }

        // 5) 페이징 적용
        const rawProducts = await rawQ.skip(skipNum).limit(limitNum);

        // 6) 평균 평점 계산해서 붙이기
        const productsWithRating = await Promise.all(
            rawProducts.map(async (p) => {
                const reviews = await Review.find({ product: p._id });
                const avg =
                    reviews.reduce((s, r) => s + r.rating, 0) /
                    (reviews.length || 1);
                return {
                    ...p._doc,
                    averageRating: reviews.length
                        ? Number(avg.toFixed(1))
                        : 0,
                };
            })
        );

        // 7) 응답
        const totalCount = await Product.countDocuments(query);
        const hasMore = skipNum + limitNum < totalCount;

        res.status(200).json({
            products: productsWithRating,
            totalCount,
            hasMore,
        });
    } catch (err) {
        console.error("상품 목록 조회 실패:", err);
        res.status(400).send("상품 목록 조회 실패");
    }
});



// router.post("/", auth, async (req, res, next) => {
//     try {
//         const product = new Product(req.body);
//         await product.save();
//         return res.sendStatus(201);
//     } catch (error) {
//         next(error);
//     }
// });

router.post("/", auth, async (req, res) => {
  try {
    // req.body 안에 들어있는 필드들과 함께 writer를 추가
    const newProduct = new Product({
      ...req.body,
      writer: req.user._id
    });
    await newProduct.save();
    return res.status(201).json({ product: newProduct });
  } catch (err) {
    console.error("상품 생성 실패:", err);
    return res.status(500).send("서버 오류");
  }
});


router.delete("/:id", auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send("상품을 찾을 수 없습니다.");
        if (product.writer.toString() !== req.user._id.toString()) {
            return res.status(403).send("삭제 권한이 없습니다.");
        }

        await Product.findByIdAndDelete(req.params.id);
        res.send("상품이 삭제되었습니다.");
    } catch (err) {
        console.error("상품 삭제 오류:", err);
        res.status(500).send("서버 오류로 삭제에 실패했습니다.");
    }
});

router.put("/:id", auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send("상품을 찾을 수 없습니다.");
        if (product.writer.toString() !== req.user._id.toString()) {
            return res.status(403).send("수정 권한이 없습니다.");
        }

        await Product.findByIdAndUpdate(req.params.id, req.body);
        res.send("상품이 수정되었습니다.");
    } catch (err) {
        res.status(500).send("상품 수정 실패");
    }
});

module.exports = router;
