
let power=420;
let alarms=[
{time:"10:20",device:"MSB",msg:"Dòng điện vượt ngưỡng",level:"danger",status:"Chưa xử lý"},
{time:"11:30",device:"HVAC tầng 5",msg:"Nhiệt độ cao",level:"warning",status:"Chưa xử lý"}
];
let history=[];

let equipment={
"HVAC":"Đang chạy",
"Chiếu sáng":"Bật",
"Máy bơm":"Hoạt động"
};

function show(page){
let a=document.getElementById("app");

if(page=="dashboard"){
a.innerHTML=`
<h1>Tổng quan hệ thống</h1>
<div class="cards">
<div>Công suất<h2>${power.toFixed(1)} kW</h2></div>
<div>Điện năng<h2>2350 kWh</h2></div>
<div>Điện áp<h2>380 V</h2></div>
<div>Cosφ<h2>0.95</h2></div>
</div>`;
}

if(page=="building"){
let s="<h1>Giám sát tòa nhà 10 tầng</h1>";
for(let i=10;i>=1;i--)
s+=`<div class="box" onclick="floor(${i})">Tầng ${i} 🟢 Bình thường</div>`;
a.innerHTML=s;
}

if(page=="energy"){
a.innerHTML=`
<h1>Giám sát năng lượng</h1>
<div class="box">
Điện áp: 380V<br>
Dòng điện: 650A<br>
Công suất: ${power.toFixed(1)} kW<br>
Điện năng: 2350 kWh
</div>`;
}

if(page=="equipment"){
let s="<h1>Quản lý thiết bị</h1>";
for(let x in equipment)
s+=`<div class="box">${x}: ${equipment[x]}
<button onclick="change('${x}')">Bật/Tắt</button></div>`;
a.innerHTML=s;
}

if(page=="alarm"){
let s="<h1>Trung tâm cảnh báo</h1>";
alarms.forEach((x,i)=>{
s+=`
<div class="alarm ${x.level}">
<b>${x.level=="danger"?"🔴 Nguy hiểm":"🟡 Cảnh báo"}</b><br>
Thời gian: ${x.time}<br>
Thiết bị: ${x.device}<br>
Lỗi: ${x.msg}<br>
Trạng thái: ${x.status}<br>
<button onclick="confirmAlarm(${i})">Xác nhận</button>
</div>`;
});
a.innerHTML=s;
}

if(page=="history"){
let s="<h1>Lịch sử xử lý lỗi</h1>";
history.forEach(x=>{
s+=`<div class="box">
${x.time}<br>${x.device}<br>${x.msg}<br>${x.action}
</div>`;
});
a.innerHTML=s||"<h1>Chưa có lịch sử</h1>";
}

if(page=="control"){
a.innerHTML=`
<h1>Trung tâm điều khiển</h1>
<div class="box">
Điều khiển HVAC<br>
<button>START</button>
<button>STOP</button>
</div>`;
}

if(page=="report"){
a.innerHTML=`
<h1>Báo cáo năng lượng</h1>
<div class="box">
Tổng điện năng tháng: 68500 kWh<br>
Công suất lớn nhất: 420 kW
</div>`;
}
}

function floor(n){
document.getElementById("app").innerHTML=
`<h1>Tầng ${n}</h1>
<div class="box">
Công suất: ${20+n} kW<br>
HVAC: ON<br>
Chiếu sáng: ON<br>
Ổ cắm: Bình thường
</div>`;
}

function change(x){
equipment[x]="Đã thay đổi trạng thái";
show("equipment");
}

function confirmAlarm(i){
alarms[i].status="Đã xử lý";
history.push({
time:new Date().toLocaleString(),
device:alarms[i].device,
msg:alarms[i].msg,
action:"Người vận hành xác nhận"
});
show("alarm");
}

setInterval(()=>{
power+=Math.random()*6-3;
if(power>450){
alarms.push({
time:new Date().toLocaleTimeString(),
device:"MSB",
msg:"Công suất vượt giới hạn",
level:"danger",
status:"Chưa xử lý"
});
}
if(document.getElementById("app").innerHTML.includes("Tổng quan"))
show("dashboard");
},2000);

show("dashboard");

const socket=io();
let clientUser=prompt("Nhập tên người sử dụng:","Người vận hành")||"Người dùng";
socket.emit("user:join",{name:clientUser});
socket.on("bms:state",(s)=>{
  power=s.power; alarms=s.alarms; history=s.history; equipment=s.equipment;
  const title=document.querySelector("#app h1")?.textContent||"";
  if(title.includes("Tổng quan")) show("dashboard");
  else if(title.includes("Cảnh báo")) show("alarm");
  else if(title.includes("Lịch sử")) show("history");
  else if(title.includes("Thiết bị")) show("equipment");
});
const _confirm=window.confirmAlarm;
window.confirmAlarm=function(i){socket.emit("alarm:ack",{index:i,user:clientUser});};
const _change=window.change;
window.change=function(x){socket.emit("equipment:toggle",{name:x,user:clientUser});};
