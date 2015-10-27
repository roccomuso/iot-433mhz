--aREST Library for the ESP8266 chip using the NodeMCU firmware

-- Module declaration
local aREST = {}

-- Attributes
local _name
local _id

function aREST.set_id(id)
  _id = id
end

function aREST.set_name(name)
  _name = name
end

function aREST.handle(conn, request)

-- Variables
local pin
local command
local value
local answer = {}
local mode
local variables = {}

-- ID and name
answer['id'] = _id
answer["name"] = _name

-- Variables
variables["temperature"] = 30

-- Find start
local e = string.find(request, "/")
local request_handle = string.sub(request, e + 1)

-- Cut end
e = string.find(request_handle, "HTTP")
request_handle = string.sub(request_handle, 0, (e-2))

-- Find mode
e = string.find(request_handle, "/")
if e == nil then
  mode = request_handle
else
  mode = string.sub(request_handle, 0, (e-1))
  
  -- Find pin & command
  request_handle = string.sub(request_handle, (e+1))
  e = string.find(request_handle, "/")

  if e == nil then
    pin = request_handle
    pin = tonumber(pin)
  else
    pin = string.sub(request_handle, 0, (e-1))
    pin = tonumber(pin)
    request_handle = string.sub(request_handle, (e+1))
    command = request_handle
  end
end

-- Debug output
print('Mode: ', mode)
print('Pin: ', pin)
print('Command: ', command)

-- Apply command
if pin == nil then
  for key,value in pairs(variables) do
     if key == mode then answer[key] = value end
  end
end

if mode == "mode" then
  if command == "o" then
    gpio.mode(pin, gpio.OUTPUT)
    answer['message'] = "Pin D" .. pin .. " set to output" 
  elseif command == "i" then
    gpio.mode(pin, gpio.INPUT)
    answer['message'] = "Pin D" .. pin .. " set to input"
  elseif command == "p" then
    pwm.setup(pin, 100, 0)
    pwm.start(pin)
    answer['message'] = "Pin D" .. pin .. " set to PWM"
  end 
end

if mode == "digital" then
  
  if command == "0" then 
    gpio.write(pin, gpio.LOW)
    answer['message'] = "Pin D" .. pin .. " set to 0"   
  elseif command == "1" then
    gpio.write(pin, gpio.HIGH)
    answer['message'] = "Pin D" .. pin .. " set to 1" 
  elseif command == "r" then
    value = gpio.read(pin)
    answer['return_value'] = value
  elseif command == nil then
    value = gpio.read(pin) 
    answer['return_value'] = value
  end
end

if mode == "analog" then
  if command == nil then
    value = adc.read(pin)
    answer['return_value'] = value
  else
    pwm.setduty(pin, command)
    answer['message'] = "Pin D" .. pin .. " set to " .. command  
  end
end

conn:send("HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\n\r\n" .. table_to_json(answer) .. "\r\n")

end

function table_to_json(json_table)

local json = ""
json = json .. "{"

for key,value in pairs(json_table) do
  json = json .. "\"" .. key .. "\": \"" .. value .. "\", "
end

json = string.sub(json, 0, -3)
json = json .. "}"

return json
end

return aREST