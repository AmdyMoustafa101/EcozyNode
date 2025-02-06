const express = require("express");
const cors = require("cors");
const { Client } = require("ssh2");

const app = express();
const sshConfig = {
  host: "192.168.1.24",
  port: 22,
  username: "bamba",
  password: "bamba123",
};

// Utiliser le middleware CORS
app.use(
  cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

let humidity = 0;
let brightness = 0;

const ssh = new Client();
ssh
  .on("ready", () => {
    console.log("SSH connection established");
    ssh.exec("python3 /home/bamba/Desktop/humidite.py", (err, stream) => {
      if (err) {
        console.error("Error executing command:", err);
        ssh.end();
        return;
      }
      stream
        .on("close", (code, signal) => {
          console.log(
            "Stream :: close :: code: " + code + ", signal: " + signal
          );
          ssh.end();
        })
        .on("data", (data) => {
          console.log("Received data:", data.toString());
          const match = data
            .toString()
            .match(/Humidité du sol : (\d+)% \| Luminosité : (\d+)%/);
          if (match) {
            humidity = parseInt(match[1], 10);
            brightness = parseInt(match[2], 10);
            console.log(
              `Updated humidity: ${humidity}, brightness: ${brightness}`
            );
          }
        })
        .stderr.on("data", (data) => {
          console.error("STDERR:", data.toString());
        });
    });
  })
  .on("error", (err) => {
    console.error("SSH connection error:", err);
  })
  .connect(sshConfig);

app.get("/api/sensor-data", (req, res) => {
  console.log("Request received for sensor data");
  res.json({ humidity, brightness });
});

app.listen(3002, () => {
  console.log("Server is running on port 3002");
});
