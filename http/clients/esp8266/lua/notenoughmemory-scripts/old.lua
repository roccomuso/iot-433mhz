-- global variables:
server_port = 8000 -- local server port to receive commands from the RPi
rpi_ip_address = "192.168.1.111"
rpi_port = 8266 -- dedicata proprio agli esp8266
-- Wifi Settings
wifiSSID = "Vodafone-PensioneDiVece"
wifiPassword = "dodide1333912"


    ip = wifi.sta.getip()
    print(ip)
    --nil
    wifi.setmode(wifi.STATION)
    wifi.sta.config(wifiSSID,wifiPassword) -- connessione alla rete WIFI
print(wifi.sta.getip())

led1 = 3 -- GPIO0 (guarda mappa dei pin di NodeMCU)
led2 = 4 -- GPIO2
gpio.mode(led1, gpio.OUTPUT)
gpio.mode(led2, gpio.OUTPUT)

-- Server un ascolto sulla porta 80 per l'interfaccia grafica
srv=net.createServer(net.TCP)
srv:listen(80,function(conn)
    conn:on("receive", function(client,request)
        local buf = "";
        local _, _, method, path, vars = string.find(request, "([A-Z]+) (.+)?(.+) HTTP");
        if(method == nil)then
            _, _, method, path = string.find(request, "([A-Z]+) (.+) HTTP");
        end
        local _GET = {}
        if (vars ~= nil)then
            for k, v in string.gmatch(vars, "(%w+)=(%w+)&*") do
                _GET[k] = v
            end
        end
        
        local _on,_off = "",""
        if(_GET.pin == "ON1")then
              gpio.write(led1, gpio.HIGH);
        elseif(_GET.pin == "OFF1")then
              gpio.write(led1, gpio.LOW);
        elseif(_GET.pin == "ON2")then
              gpio.write(led2, gpio.HIGH);
        elseif(_GET.pin == "OFF2")then
              gpio.write(led2, gpio.LOW);
        end
        
        buf = buf.."<h1> ESP8266 Web Server</h1>";
        buf = buf.."<p>GPIO0 <a href=\"?pin=ON1\"><button>ON</button></a>&nbsp;<a href=\"?pin=OFF1\"><button>OFF</button></a> - Status: "..gpio.read(led1).."</p>";
        buf = buf.."<p>GPIO2 <a href=\"?pin=ON2\"><button>ON</button></a>&nbsp;<a href=\"?pin=OFF2\"><button>OFF</button></a> - Status: "..gpio.read(led2).."</p>";
        
        client:send(buf);
        client:close();
        collectgarbage();
    end)
end)

-- server che rimane in ascolto per i comandi arrivati tramite API dal RPi
serv=net.createServer(net.TCP)
serv:listen(server_port,function(conn)
    conn:on("receive", function(client,request)
        local buf = "";
        local _, _, method, path, vars = string.find(request, "([A-Z]+) (.+)?(.+) HTTP");
        if(method == nil)then
            _, _, method, path = string.find(request, "([A-Z]+) (.+) HTTP");
        end
        local _GET = {}
        if (vars ~= nil)then
            for k, v in string.gmatch(vars, "(%w+)=(%w+)&*") do
                _GET[k] = v
            end
        end
        
        buf = "NOT-executed"
        pin_number = nil
        current_status = nil
        local _on,_off = "",""
        
        if(_GET.pin == "on1")then
              gpio.write(led1, gpio.HIGH);
              buf = "OK-executed"
              pin_number = 1
              current_status = 1
        elseif(_GET.pin == "off1")then
              gpio.write(led1, gpio.LOW);
              buf = "OK-executed"
              current_status = 0
              pin_number = 1
        elseif(_GET.pin == "on2")then
              gpio.write(led2, gpio.HIGH);
              buf = "OK-executed"
              pin_number = 2
              current_status = 1
        elseif(_GET.pin == "off2")then
              gpio.write(led2, gpio.LOW);
              buf = "OK-executed"
              pin_number = 2
              current_status = 0
        elseif(_GET.pin == "get1")then
              current_status = gpio.read(led1);
              buf = "OK-executed"
              pin_number = 1
        elseif(_GET.pin == "get2")then
              current_status = gpio.read(led2);
              buf = "OK-executed"
              pin_number = 2
        elseif(_GET.pin == "toggle1")then
              new_s = (gpio.read(led1)==1 and gpio.LOW or gpio.HIGH)
              gpio.write(led1, new_s);
              current_status = (new_s==gpio.LOW and 0 or 1);
              buf = "OK-executed"
              pin_number = 1
        elseif(_GET.pin == "toggle2")then
              new_s = (gpio.read(led2)==1 and gpio.LOW or gpio.HIGH)
              gpio.write(led2, new_s);
              current_status = (new_s==gpio.LOW and 0 or 1);
              buf = "OK-executed"
              pin_number = 2
        end
        
        value = { outcome = buf, pin_n = pin_number, curr_status = current_status}
        json_text = cjson.encode(value)

        client:send(json_text);
        client:close();
        collectgarbage();
    end)
end)


-- Timer con funzione eseguita ogni 5 minuti (/esp8266/node_chip_id/ip_address/port)

tmr.alarm(1,300000,1,function()
	conn=net.createConnection(net.TCP, 0)
	conn:on("receive", function(conn, payload) print(payload) end )
	conn:connect(8266,rpi_ip_address)
	conn:send("GET /esp8266/"..node.chipid().."/"..wifi.sta.getip().."/"..server_port.." HTTP/1.1\r\nHost: 192.168.1.111\r\nConnection: keep-alive\r\nAccept: */*\r\n\r\n")
end)
