var http = require('http');
var socketio = require('socket.io');
var server = http.createServer();
var io = socketio.listen(server);
server.listen(process.env.PORT);

io.set("log level", 1);
console.log("Server started.");

var player_infos = {}; // ログイン中プレイヤー情報をSocket IDから得る関数へのハッシュ

// 通信プロトコル
io.sockets.on("connection", function(socket) {
  console.log("connect new client.");

  // ログイン名を送ってきた時は新規ログインの処理
  socket.on("name", function(player_info) {
    console.log("name: " + player_info.login_name);
    if(player_infos[socket.id]) {    // すでに登録済み
        return;
    }
    socket.broadcast.emit("name", player_info);
    // それまでにログインしてるプレイヤー情報を送る
    for (var i in player_infos) {
      var other_player_info = player_infos[i]; // ログイン中プレイヤーリストからプレイヤー情報取得
      console.log("other_player_info name: " + other_player_info.login_name);
      socket.emit("name", other_player_info);
    }
    // ログイン中プレイヤーリストへの登録
    player_infos[socket.id] = player_info;
  });
  
  // 移動処理
  socket.on("position", function(pos) {
    var player_info = player_infos[socket.id];
    if(!player_info) {   // 登録されていない
        return;
    }
    // console.log("position:" + player.login_name + " " + text);
    player_info.x = pos.x;
    player_info.y = pos.y;
    player_info.direction = pos.direction;
    socket.broadcast.emit("position:" + player_info.login_name, pos);
  });

  // こちらがメッセージを受けた時の処理
  socket.on("message", function(text) {
    var player_info = player_infos[socket.id];
    if(!player_info) {   // 登録されていない
        return;
    }
    console.log("message:" + player_info.login_name + " " + text);
    player_info.message = text;
    socket.broadcast.emit("message:" + player_info.login_name, text);
  });

  // 切断した時の処理
  socket.on("disconnect", function() {
    var player_info = player_infos[socket.id];
    if(!player_info) {   // 登録されていない
        return;
    }
    console.log("disconnect:" + player_info.login_name);
    socket.broadcast.emit("disconnect:" + player_info.login_name);
    // ログイン中プレイヤーリストからの削除
    delete player_infos[socket.id];
  });
});
