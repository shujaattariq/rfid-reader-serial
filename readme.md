# RFID Reader (Serial Port)

This a barebone test code i created sometime back. It demonstrates a few basic concepts

- Serial Port Communication in Node.js
- Binary Buffer and Parsing
- Binary Data in Serial Port 
- Data stream handling
- Handling fragmentation of frames
- CRC16 (Cyclic Redundancy Check for Data errors)

This code was specifically written for Chafon's CF-RU6403 Reader, but with some changes it should work with most RFID Readers using the Impinj R2000 module.

Since the data frames/protocol would remain the same, with some additional code this should work over TCP/IP or bluetooth connections as well.
