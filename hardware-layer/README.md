The Hardware-layer sketches are built for Arduino and only if running on platform different from RPi (or on RPI but with the <code>use-external-arduino</code> option setted on <code>true</code> in the <code>config.json</code> file).

In this directory you'll find <code>sender</code>, <code>receiver</code> and a <code>single-arduino-tx-rx</code> that's a single sketch both for sending and receiving with only one arduino board.

Use the last one in production environment.