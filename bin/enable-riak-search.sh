cd /etc/riak &&  sudo sed -i.bak -e 0,/"enabled, false"/{s/"enabled, false"/"enabled, true"/} app.config
