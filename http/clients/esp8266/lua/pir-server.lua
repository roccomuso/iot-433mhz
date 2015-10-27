BOARD_NAME = "legolas"
-- wifi connection
    IPADR = "192.168.1.113" --Requested static IP address for the ESP
	IPROUTER = "192.168.1.1" --IP address for the Wifi router
	RPI_IP = "192.168.1.111"
	wifi.setmode(wifi.STATION)
	wifi.sta.autoconnect(1)
	wifi.sta.setip({ip=IPADR,netmask="255.255.255.0",gateway=IPROUTER})
    wifi.sta.config("Vodafone-PensioneDiVece","dodide1333912")
print(wifi.sta.getip())

inpin= 4 -- Select input pin 
gpio.mode(inpin,gpio.INT,gpio.PULLUP) -- attach interrupt to inpin
stat = "OFF"
notification = false

function notify(z)
-- A simple http client
    conn=net.createConnection(net.TCP, 0)
    conn:on("receive", function(conn, payload) print(payload) end )
    conn:connect(8266,RPI_IP)
    conn:send("GET /board/"..BOARD_NAME.."/pir/"..z.." HTTP/1.1\r\nHost: "..RPI_IP.."\r\n"
        .."Connection: keep-alive\r\nAccept: */*\r\n\r\n")
    print("Richiesta GET inviata al RPi: "..RPI_IP.." board: "..BOARD_NAME.." pir: "..z)
    conn:on("sent",function(conn) conn:close() end)
end

    function motion()
         print("Motion Detection : ON!") 
         stat = "ON"
		 if (notification) then
			notify(stat)
		 end
         gpio.trig(inpin,"down",nomotion)  -- trigger on falling edge
         return stat
     end

 
	function nomotion()
        print("Motion Detection : OFF!") 
        stat = "OFF" 
        gpio.trig(inpin,"up",motion)  -- trigger on rising edge
        return stat
    end

gpio.trig(inpin,"up",motion)

srv=net.createServer(net.TCP)
  srv:listen(80,
     function(conn)
        conn:on("receive",function(conn,request)
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
		
		conn:send("HTTP/1.1 200 OK\r\n")
		
		if (_GET.notification == "true") then
			notification = true
			conn:send("Content-Type: application/json\n\n")
			conn:send("{ \"notification\": true}")
		elseif(_GET.notification == "false") then
			notification = false
			conn:send("Content-Type: application/json\n\n")
			conn:send("{ \"notification\": false}")
		elseif (_GET.notification == "json") then
			conn:send("Content-Type: application/json\n\n")
			conn:send("{ \"notification\": "..tostring(notification).."}")
		elseif (_GET.ping == "board") then
			conn:send("Content-Type: application/json\n\n")
			conn:send("{\"active\": true, \"nome_board\": \""..BOARD_NAME.."\", \"chip_id\": "..node.chipid()..", \"ip_address\": \""..wifi.sta.getip().."\", \"heap\": "..node.heap().."}")
		elseif (_GET.pir == "json") then
			conn:send("Content-Type: application/json\n\n")
			if (stat == "ON") then
				conn:send("{\"motion_detected\": true }")
			else
				conn:send("{\"motion_detected\": false }")
			end
			
		else
			conn:send("Content-Type: text/html\n\n")
			conn:send("<META HTTP-EQUIV=\"REFRESH\" CONTENT=\"2\">")
			conn:send("<html><title>PIR Motion Detector Server - ESP8266</title><body>")
			conn:send("<h1>PIR Motion Detector Server - ESP8266</h1><BR>")
			conn:send('Status: ')
            if (stat == "ON") then conn:send('<B><font color=red>Movement Detected!</font></B>')
            elseif (stat == "OFF") then conn:send('<B><font color=green>No Movement</font></B>')
              else                      
                conn:send(stat)
                conn:send('%')
            end
			conn:send("<BR><BR><br>Node.HEAP : <b>" .. node.heap() .. "</b><BR><BR>")
			conn:send("IP ADDR    : <b>".. wifi.sta.getip() .. "</b><BR>")
			conn:send("TMR.NOW    : <b>" .. tmr.now() .. "</b><BR<BR><BR>")
			conn:send("</html></body>")
		end		
		
        conn:on("sent",function(conn) conn:close() end)

		end)
end)

