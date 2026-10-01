
const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const path=require("path");
const app=express(), server=http.createServer(app), io=new Server(server);
app.use(express.static(path.join(__dirname,"public")));
const state={
 power:420,
 alarms:[
  {time:"10:20",device:"MSB",msg:"Dòng điện vượt ngưỡng",level:"danger",status:"Chưa xử lý"},
  {time:"11:30",device:"HVAC tầng 5",msg:"Nhiệt độ cao",level:"warning",status:"Chưa xử lý"}
 ],
 history:[],
 equipment:{"HVAC":"Đang chạy","Chiếu sáng":"Bật","Máy bơm":"Hoạt động"}
};
function sync(){io.emit("bms:state",state);}
io.on("connection",s=>{
 s.emit("bms:state",state);
 s.on("user:join",x=>s.data.user=x.name||"Người dùng");
 s.on("alarm:ack",x=>{
  const a=state.alarms[x.index]; if(!a||a.status==="Đã xử lý") return;
  a.status="Đã xử lý";
  state.history.unshift({time:new Date().toLocaleString("vi-VN"),device:a.device,msg:a.msg,action:(x.user||"Người dùng")+" xác nhận cảnh báo"});
  sync();
 });
 s.on("equipment:toggle",x=>{
  if(!(x.name in state.equipment)) return;
  const old=state.equipment[x.name];
  state.equipment[x.name]=/Đang chạy|Bật|Hoạt động/.test(old)?"Đã tắt":"Đang chạy";
  state.history.unshift({time:new Date().toLocaleString("vi-VN"),device:x.name,msg:`Thay đổi trạng thái: ${old} → ${state.equipment[x.name]}`,action:(x.user||"Người dùng")+" thao tác"});
  sync();
 });
});
setInterval(()=>{
 state.power=Math.max(350,Math.min(480,state.power+(Math.random()*6-3)));
 const active=state.alarms.some(a=>a.device==="MSB"&&a.msg==="Công suất vượt giới hạn"&&a.status==="Chưa xử lý");
 if(state.power>450&&!active) state.alarms.unshift({time:new Date().toLocaleTimeString("vi-VN"),device:"MSB",msg:"Công suất vượt giới hạn",level:"danger",status:"Chưa xử lý"});
 sync();
},2000);
server.listen(3000,"0.0.0.0",()=>console.log("SMART BMS: http://localhost:3000"));
