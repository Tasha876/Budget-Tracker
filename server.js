const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const compression = require("compression");

const PORT = process.env.port || 3000;

const app = express();

app.use(logger("dev"));

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

// const uri = "mongodb+srv://nfray:JpNkUoBRVhuCEKue@cluster0.jhsyl.mongodb.net/budget-tracker?retryWrites=true&w=majority";

mongoose.connect(
  "mongodb+srv://nfray:JpNkUoBRVhuCEKue@cluster0.jhsyl.mongodb.net/budget-tracker?retryWrites=true&w=majority" || process.env.MONGODB_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    }, (e) => {
      if (e) console.log(e)
    }
)

// routes
app.use(require("./routes/api.js"));

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
});
