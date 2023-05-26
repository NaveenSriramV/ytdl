const express = require("express");
const ytdl = require("ytdl-core");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const AWS = require("aws-sdk");
var cors = require("cors");
ffmpeg.setFfmpegPath(ffmpegPath);
const app = express();
const {
  BUCKET_NAME,
  S3_ID,
  S3_SECRET,
  S3_REGION,
  S3_SIGNATURE,
  FILE_EXPIRATION_TIME,
} = require("./s3-config");
app.use(express.json());
app.use(express.static("public"));
app.use(cors());
const s3 = new AWS.S3({
  accessKeyId: S3_ID,
  secretAccessKey: S3_SECRET,
  signatureVersion: S3_SIGNATURE,
  region: S3_REGION,
});

const uploadToS3 = (fileParams, callBack) => {
  return new Promise((resolve, reject) => {
    try {
      s3.upload(fileParams, function (err, data) {
        if (err) {
          return reject(err);
        } else {
          callBack(data);
          resolve("file uploaded");
        }
      });
    } catch (error) {
      return reject(error);
    }
  });
};
app.get("/download", async function (req, res) {
  const downloadVideoPath = __dirname + "/public/video.mp4";
  var videoUrl = req.query.videoUrl;
  var duration = req.query.duration || "5";
  const itag = "18";
  var videoReadableStream = ytdl(videoUrl, {
    filter: (format) => format.itag == itag,
  });

  var videoWritableStream = fs.createWriteStream(downloadVideoPath);

  var stream = videoReadableStream.pipe(videoWritableStream);

  stream.on("finish", function () {
    ffmpeg(downloadVideoPath)
      .setStartTime("00:00:00")
      .setDuration(duration)
      .size("1280x720")
      .fps(40)
      .output("output.gif")
      .on("end", function (err) {
        if (!err) {
          const fileName = "output.gif";
          const fileContent = fs.readFileSync(fileName);
          let params = {
            Bucket: BUCKET_NAME,
            ContentType: "image/gif",
            Key: fileName,
            Body: fileContent,
          };
          uploadToS3(params, (data) => {
            try {
              fs.unlink(__dirname + "/public/video.mp4", (err) => {
                if (err) {
                  console.log("err in deleting video file", err);
                }
              });
              fs.unlink(__dirname + "/output.gif", (err) => {
                if (err) console.log("err is deleting gif", err);
              });
            } catch (error) {
              console.log("error in deleting files", error);
            }

            let preSignedURL = s3.getSignedUrl("getObject", {
              Bucket: BUCKET_NAME,
              Key: fileName,
              Expires: parseInt(FILE_EXPIRATION_TIME),
            });
            res.status(200).send({
              preSignedURL,
              unsignedURL: data.Location,
            });
          }).catch((err) => {
            console.log("error", err);
            res.status(500).send("Unable to Upload the File");
          });
        }
      })
      .on("error", (err) => {
        console.log("error: ", err);
        res.status(500).send("Something broke!");
      })
      .run();
  });
});
app.listen(8000, () => {
  console.log("started in 8000");
});
