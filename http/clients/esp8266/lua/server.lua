BOARD_NAME = "minitron"
-- wifi connection
    IPADR = "192.168.1.112" --Requested static IP address for the ESP
	IPROUTER = "192.168.1.1" --IP address for the Wifi router
	wifi.setmode(wifi.STATION)
	wifi.sta.autoconnect(1)
	wifi.sta.setip({ip=IPADR,netmask="255.255.255.0",gateway=IPROUTER})
    wifi.sta.config("Vodafone-PensioneDiVece","dodide1333912")
print(wifi.sta.getip())
led1 = 3
led2 = 4
gpio.mode(led1, gpio.OUTPUT)
gpio.mode(led2, gpio.OUTPUT)
-- entrambi pin HIGH all'avvio (per il collegamento fatto al relay HIGH lo mantiene spento)

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
		
		client:send("HTTP/1.1 200 OK\r\nConnection: keep-alive\r\nAccept: */*\r\n")
		header = "Content-Type: application/json\n\n"
		
		if (_GET.ping=="board")then
			client:send(header.."{\"active\": true, \"nome_board\": \""..BOARD_NAME.."\", \"chip_id\": "..node.chipid()..", \"ip_address\": \""..wifi.sta.getip().."\", \"heap\": "..node.heap().."}")
		elseif(_GET.toggle=="1") then
			new_s = (gpio.read(led1)==1 and gpio.LOW or gpio.HIGH)
            gpio.write(led1, new_s);
            current_status = (new_s==gpio.LOW and 0 or 1);
			client:send(header.."{\"pin\":1, \"off\": "..current_status.."}")
		elseif(_GET.toggle=="2") then
			new_s = (gpio.read(led2)==1 and gpio.LOW or gpio.HIGH)
            gpio.write(led2, new_s);
            current_status = (new_s==gpio.LOW and 0 or 1);
			client:send(header.."{\"pin\":2, \"off\": "..current_status.."}") 
		elseif (_GET.get=="1") then
			client:send(header.."{\"gpio_number\": 1, \"off\": "..gpio.read(led1).."}");
		elseif(_GET.get=="2") then
			client:send(header.."{\"gpio_number\": 2, \"off\": "..gpio.read(led2).."}");
		elseif(_GET.pin == "off1")then
			gpio.write(led1, gpio.HIGH);
			client:send(header.."{\"gpio_number\": 1, \"off\": 1}");
		elseif(_GET.pin == "on1")then
			gpio.write(led1, gpio.LOW);
			client:send(header.."{\"gpio_number\": 1, \"off\": 0}");
		elseif(_GET.pin == "off2")then
			gpio.write(led2, gpio.HIGH);
			client:send(header.."{\"gpio_number\": 2, \"off\": 1}");
		elseif(_GET.pin == "on2")then
			gpio.write(led2, gpio.LOW);
			client:send(header.."{\"gpio_number\": 2, \"off\": 0}");
		else
			
			client:send("Content-Type: text/html\n\n")
			buf = buf.."<h1>ESP8266 Web Server</h1>";
			buf = buf.."<p>GPIO0 <a href=\"?pin=on1\"><button>ON</button></a>&nbsp;<a href=\"?pin=off1\"><button>OFF</button></a> - "..gpio.read(led1).."</p>";
			buf = buf.."<p>GPIO2 <a href=\"?pin=on2\"><button>ON</button></a>&nbsp;<a href=\"?pin=off2\"><button>OFF</button></a> - "..gpio.read(led2).."</p>";
			client:send(buf);
		end
		
        
        client:close();
        collectgarbage();
    end)
end)
