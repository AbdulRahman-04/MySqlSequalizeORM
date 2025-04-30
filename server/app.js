import express from "express"
import colors from "colors"
import morgan from "morgan"
import config from "config"

const app = express()
const PORT = config.get("PORT")  || 8000

app.use(morgan('dev'));
app.use(express.json());


app.get("/", (req, res) => {
    try {
        res.status(200).json({ msg: "Hello world!"});
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: error.red });
    }
});

app.listen(PORT, ()=>{
    console.log(`SERVER IS LIVE AT PORT ${PORT}`.underline.blue.bgGreen);
    
})
