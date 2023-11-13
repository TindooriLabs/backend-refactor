# tunnel.sh
#!/bin/bash

ssh -L 5432:<RDS_endpoint>:5432 -N -i tindoori-test.pem ubuntu@${server_ip}
