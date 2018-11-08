/* global addPointToCanvas, getMousePosition, connectAndSubscribe */

var app = (function () {
    var room=null;
    var tnewpoint=null;
    var tnewpolygon=null;
    var tnewdibujo=null;
    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;

        }
        }
    
    var stompClient = null;

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function (room,name) {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            tnewpoint=stompClient.subscribe("/topic/newpoint."+room , function (eventbody) {
                //alert("Publicado el evento en la sala: "+ room);
                var val=JSON.parse(eventbody.body);
                addPointToCanvas(val);
                
                
            });
            tnewpolygon=stompClient.subscribe('/topic/newpolygon.' + room, function (data) {
                var ob = JSON.parse(data.body);
                //alert("x: "+ob.x+" y: "+ob.y);
                var c = document.getElementById("canvas");
                var ctx = c.getContext("2d");
                ctx.fillStyle = '#26C8ED';
                ctx.beginPath();
                ctx.moveTo(ob[0].x, ob[0].y);
                for (i = 1; i < ob.length; i++) {
                    ctx.lineTo(ob[i].x, ob[i].y);
                }
                ctx.closePath();
                ctx.stroke();
            });
            tnewdibujo=stompClient.subscribe('/topic/colaborations.'+ room, function (data) {
                var ob = JSON.parse(data.body);
                var markup=ob.map(function (val){
                    return "<tr><td>" + val+ "</td></tr>";
                });
                $("table tbody tr").remove();
                $("table tbody").append(markup);
            });
            stompClient.send("/app/colaborations."+room, {}, name);
        });
        
    };
    
    

    return {

        init: function () {
            var can = document.getElementById("canvas");
            can.addEventListener('mousedown',function (evento){
               var pos=getMousePosition(evento);
               var pt=new Point(pos.x,pos.y);
               var room=document.getElementById("Topic").value;
               stompClient.send("/app/newpoint."+room, {}, JSON.stringify(pt));
            });
            
        },
        
        publishPoint: function(px,py,room){
            //var room=document.getElementById("Topic").value;
            var pt=new Point(px,py);
            console.info("publishing point at "+pt);
            //addPointToCanvas(pt);
            stompClient.send("/topic/newpoint."+room, {}, JSON.stringify(pt)); 
        },
        conect: function (idsala,name){ 
            if(room!=null){
                if(room!=idsala){
                    $("table tbody tr").remove();
                    tnewpoint.unsubscribe(room);
                    tnewpolygon.unsubscribe(room);
                    tnewdibujo.unsubscribe(room);
                    room=idsala;
                    var can = document.getElementById("canvas");
                    can.heigth=can.heigth;
                    can.width=can.width;
                }
            }else{
                room=idsala;
            }
            connectAndSubscribe(room,name);
            
        },
        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();