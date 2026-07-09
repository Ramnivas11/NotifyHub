const express = require("express");

const app = express();
// app.use(express.json());

const logger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
};

app.use(logger);
app.get("/", (req, res) => {
    res.send("Welcome to NotifyHub 🚀");
});

app.post("/test",(req,res)=>{
    console.log(req.body)
    res.json({
        success:true,
        received:req.body
    })
})

app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});