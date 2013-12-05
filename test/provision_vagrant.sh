#!/usr/bin/env bash

function install_from_apt {
  TOOL=$1
  echo "-----> Install $TOOL if needed"
  command -v $TOOL > /dev/null
  if [[ $? -eq 0 ]]; then
    echo "       $TOOL already installed"
    return
  fi
  echo "       $TOOL not installed, begin installation from apt"
  sudo apt-get install -qqy curl
  command -v $TOOL > /dev/null
  if [[ $? -eq 0 ]]; then
    echo "       $TOOL installed correctly"
    return
  fi
  echo "$TOOL failed to install correctly"
  exit 1
}

function install_node {
  echo "-----> Install nodejs if needed"
  command -v node > /dev/null
  if [[ $? -eq 0 ]]; then
    echo "       nodejs already installed"
    return
  fi
  echo "       nodejs not installed, begin installation from ppa now"
  sudo apt-get update
  sudo apt-get install -y -qq python-software-properties python g++ make
  sudo add-apt-repository -y ppa:chris-lea/node.js
  sudo apt-get update -y
  sudo apt-get install -qqy nodejs
  command -v node > /dev/null
  if [[ $? -eq 0 ]]; then
    echo "       nodejs installed correctly"
    return
  fi
  echo "nodejs failed to install correctly"
  exit 1
}

function install_riak {
  echo "-----> Install riak if needed"
  command -v riak > /dev/null
  if [[ $? -eq 0 ]]; then
    echo "       riak already installed"
    return
  fi
  echo "       riak not installed, begin installation from ppa now"
  curl http://apt.basho.com/gpg/basho.apt.key | sudo apt-key add -
  sudo bash -c "echo deb http://apt.basho.com $(lsb_release -sc) main > /etc/apt/sources.list.d/basho.list"
  sudo apt-get update
  sudo apt-get install riak
  command -v riak > /dev/null
  if [[ $? -ne 0 ]]; then
    echo "       riak failed to install correctly"
    exit 1
  fi

  # switch to leveldb as the riak backend
  echo "change riak backend to leveldb to support secondary indices"
  cd /etc/riak &&  sudo sed -i.bak -e s/riak_kv_bitcask_backend/riak_kv_eleveldb_backend/g app.config
  cd /etc/riak &&  sudo sed -i.bak -e 0,/"enabled, false"/{s/"enabled, false"/"enabled, true"/} app.config
  sudo riak start
  if [[ $? -ne 0 ]]; then
    echo "      riak failed to start correctly"
    exit 1
  fi
  echo "      riak start completed"
  sleep "5s"
  riak ping
  if [[ $? -ne 0 ]]; then
    echo "       riak failed to install correctly"
    exit 1
  fi
   echo "riak install correctly"
}

install_from_apt "curl"
install_node
install_riak
