cd /etc/riak &&  sudo sed -i.bak -e 0,/"enabled, false"/{s/"enabled, false"/"enabled, true"/} app.config
cd /etc/riak &&  sudo sed -i.bak -e s/riak_kv_bitcask_backend/riak_kv_eleveldb_backend/g app.config

