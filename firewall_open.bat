@echo off
echo Adding firewall rule for TravelApp Backend on port 5000...
netsh advfirewall firewall add rule name="TravelApp Backend 5000" dir=in action=allow protocol=TCP localport=5000
echo Done. Please refresh the app on your phone.
pause
