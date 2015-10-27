
       inpin=4                        -- Select input pin - GPIO12  
       gpio.mode(inpin,gpio.INT,gpio.PULLUP)  -- attach interrupt to inpin
	   
	   
      function motion()
          print("Motion Detected!") -- movimento rilevato
          tmr.delay(5000000)           -- delay time for marking the movement
          print("fine timer")
      end
	  
	   gpio.trig(inpin,"up",motion)
	   
	   print("running...")