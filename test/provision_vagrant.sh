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
  sudo apt-get install -qqy $TOOL
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
  sudo apt-get install -y -qq python-software-properties
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

function install_httpie {
  echo "-----> Install python"
  command -v http > /dev/null
  if [[ $? -eq 0 ]]; then
    echo "       httpie already installed"
    return
  fi
  echo "-----> Install pip"
  sudo apt-get install -qqy python-pip python-dev build-essential
  sudo pip install --upgrade pip
  echo "-----> Install httpie"
  sudo pip install --upgrade httpie
}

function enable_indexing_on_riak_buckets {
  echo "-----> Enable search on riak buckets"
  echo "       sleep for 3 seconds to give riak time to start"
  sleep "3s"
  BUCKET="search_test"
  URL="http://localhost:8098/riak/$BUCKET"
  DATA='{"props":{"precommit":[{"mod":"riak_search_kv_hook","fun":"precommit"}]}}'
  curl --silent -X PUT -H 'Content-Type: application/json' -d "$DATA" $URL
  echo "      enabled search on bucket: $BUCKET"
}

install_from_apt "curl"
install_node
enable_indexing_on_riak_buckets

