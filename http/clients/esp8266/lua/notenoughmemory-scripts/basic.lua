-- Include aREST module
local rest = require "aREST"

-- Connect to Wifi
wifi.setmode(wifi.STATION)
wifi.sta.config("Vodafone-PensioneDiVece","dodide1333912")
print(wifi.sta.getip())

-- Set module ID & name
rest.set_id("1")
rest.set_name("megatron")

-- Create server
srv=net.createServer(net.TCP) 
print("Server started")

-- Start server
srv:listen(80,function(conn)
  conn:on("receive",function(conn,request)

    -- Handle requests
    rest.handle(conn, request)
  
  end)

  conn:on("sent",function(conn) conn:close() end)
end)