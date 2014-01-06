# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at vagrantup.com.

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  config.vm.network :forwarded_port, guest: 8087, host: 8087
  config.vm.network :forwarded_port, guest: 8098, host: 8098

  config.vm.provision "docker" do |docker|
    docker.pull_images "nisaacson/riak"
    docker.run "nisaacson/riak",
      args: "-p 3333:22 -p 8087:8087 -p 8098:8098"
  end

  config.vm.provision "shell", path: "test/provision_vagrant.sh"

  # override box and box_url when using the "--provider vmware_fusion" flag
  config.vm.provider :vmware_fusion do |v, override|
    override.vm.box = "precise64_fusion"
    override.vm.box_url = "http://files.vagrantup.com/precise64_vmware.box"
  end

  # override box and box_url when using the "--provider virtualbox" flag
  config.vm.provider :virtualbox do |v, override|
    override.vm.box = "precise64_virtualbox"
    override.vm.box_url = "http://files.vagrantup.com/precise64.box"
  end
end
