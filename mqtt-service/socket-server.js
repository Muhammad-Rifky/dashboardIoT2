const { Server } = require("socket.io");

let io;

function init(server){
  io = new Server(server,{
    cors:{
      origin:"*"
    }
  });

  io.on("connection",(socket)=>{
    console.log("Client connected");
  });
}

function sendSensorData(data){
  if(io){
    io.emit("sensor_update",data);
  }
}

function sendDeviceStatus(data) {
  if (io) {
    io.emit("device-status", data);
  }
}
module.exports = { init, sendSensorData, sendDeviceStatus };