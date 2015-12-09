---
layout: post

title: Learn how to set up a Couchbase Server with Vagrant, Docker and Ansible
subtitle: "Prepare the development environment with Vagrant, Docker and Ansible"

excerpt: "For last couple of months I have been working on Employee Scheduling application that use lot of latest technologies like ES2015/ES2016, NodeJS, KoaJS, Couchbase, AngularJS and when you been following my blog you my noticed I been writing mainly front-end posts regarding to this project so it’s time to start writing some back-end posts and my plan for next couple of months is to write posts about Couchbase Server, NodeJS and ES2015/ES2016."

author:
  name: Martin Micunda
  twitter: martinmicunda
  bio: Full Stack Software Engineer
---

For last couple of months I have been working on `Employee Scheduling` application that use lot of latest technologies like `ES2015/ES2016`, `NodeJS`, `KoaJS`, `Couchbase`, `AngularJS`  and when you been following my blog you my noticed I been writing mainly front-end posts regarding to this project so it's time to start writing some back-end posts and my plan for next couple of months is to write posts about `Couchbase Server`, `NodeJS` and `ES2015/ES2016`.

In this post we look how to setup `Couchbase Server` with `Vagrant`, `Docker` and `Ansible` which let us reuse this dev environment for similar projects in the future or if you are working in the team and new person join the project it's really easy to setup dev environment for this person. 

 - **Learn how to set up a Couchbase Server with Vagrant, Docker and Ansible**
 - Learn how to set up a NodeJS app using Couchbase Server, KoaJS and ES6/ES7
 - Learn how to do CRUD operations with Couchbase Server, NodeJS, ES6/ES7 and N1QL 
 - Learn how to do advanced CRUD operations with Couchbase Server, NodeJS, ES6/ES7 and N1QL 
 - Learn how to create unique constraints with Couchbase Server and NodeJS

The code for this project can be found on the GitHub ([API](https://github.com/martinmicunda/employee-scheduling-api), [UI](https://github.com/martinmicunda/employee-scheduling-ui)) and final app should look like this:

![Employee Scheduling Screenshots](https://raw.githubusercontent.com/martinmicunda/employee-scheduling-ui/master/screenshot.png "Employee Scheduling Screenshots")

##Prerequisites
You need to have installed follow tools on your machine for this project:

- [Virtualbox](https://www.virtualbox.org/wiki/Downloads) 5.0.6+
- [Vagrant](http://www.vagrantup.com/downloads.html) 1.7.4+
- [Ansible](http://docs.ansible.com/intro_installation.html) 1.9.4+

Create a directory to house this project:

```bash
$ mkdir employee-scheduling-api && cd employee-scheduling-api
```

##Create Ansible Playbook
First we need to install some ansible roles from Ansible Galaxy that we gonna use in our playbook:

```bash
$ ansible-galaxy install franklinkim.docker \
                       franklinkim.docker-compose \
                       moviedo.nvm \
                       --force
```
Verify that ansible roles were installed by running the list subcommand that will list the installed roles:

```bash
$ ansible-galaxy list
- franklinkim.docker, 1.5.0
- franklinkim.docker-compose, 1.1.0
- moviedo.nvm, v1.1.1
```

Let's create playbook for this project (run this command from root directory):

```bash
$ touch provision.yml
```

and copy below code:

```yaml
---
- name: Install Docker, Docker Compose and NVM
  hosts: all
  sudo: yes
  roles:
    - franklinkim.docker
    - franklinkim.docker-compose
    - moviedo.nvm
  tasks:
    - name: add user vagrant to the docker group to avoid type sudo for each docker command
      user: name=vagrant
            groups=docker
            append=yes
  vars:
    nvm_version: v0.29.0
    nvm_node_version: v4.2.2
```

The above ansible playbook installs following software in Vagrant box:

* [nvm](https://github.com/creationix/nvm)
* [node.js](https://nodejs.org/)
* [npm](https://www.npmjs.com/)
* [docker](https://www.docker.com/)
* [docker compose](https://docs.docker.com/compose/)

##Create Docker Compose file

We gonna use `docker-compose` to create Couchbase Server docker container and it also mean we can really easily link other docker containers in the future.

Let's create docker-compose file for this project (run this command from root directory):

```bash
$ touch docker-compose.yml
```

and copy below code:

```yaml
db:
  image: couchbase/server:enterprise-4.0.0
  ports:
    - "8091:8091"
    - "8093:8093"
    - "11210:11210"
```

##Create Vagrantfile
Download `ubuntu/trusty64`  virtualbox box:

```bash
vagrant box add ubuntu/trusty64
```

>**NOTE:** This process may take a while, as most Vagrant boxes will be at least **200 MB** big.

Verify that box was installed by running the `list` subcommand that will list the boxes installed within Vagrant along with the provider that backs the box:

```bash
$ vagrant box list
ubuntu/trusty64  (virtualbox, 14.04)
```

Create `Vagrantfile` in the root directory:

```bash
touch Vagrantfile
```
and copy below code:

```ruby
VAGRANTFILE_API_VERSION = "2"
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

			<add code here>

end
```

Add `ubuntu/trusty64`  virtualbox image:

```bash
config.vm.box = "ubuntu/trusty64"
```

The Node.js app API, Couchbase Server and Couchbase Server web UI will run inside of Vagrant box so we have to forward these ports to access them from host machine.

Forward port `3000` for our Node.js app API:

```
config.vm.network "forwarded_port", guest: 3000, host: 3000
```

Forward port `8091` for our Couchbase Web UI:

```
config.vm.network "forwarded_port", guest: 8091, host: 8091
```

Tells Vagrant to sync the `root` directory so we can edit the code with WebStorm or some other IDE:

```
config.vm.synced_folder ".", "/home/vagrant/api"
```

Configure virtualbox:

```ruby
config.vm.provider "virtualbox" do |vb|

			<add code here>

end
```


Add name that will be displayed in the VirtualBox Manager UI:

```
vb.name = "employee-scheduling-api"
```

Set the system memory for the virtual machine (this depends on your hardware):

```
vb.memory = 2048
```

Set the number of Physical CPUs to allocate (this depends on your hardware):

```
vb.cpus = 2
```

Provision the virtualbox with Ansible playbook that we created in section [create ansible playbook](#create-ansible-playbook):

```
config.vm.provision "ansible" do |ansible|
    ansible.playbook = "provision.yml"
    ansible.raw_arguments = ['-v']
end
```

The final `Vagrantfile` should look like this:

```ruby
VAGRANTFILE_API_VERSION = "2"
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
    config.vm.box = "ubuntu/trusty64"

    config.vm.network "forwarded_port", guest: 8091, host: 8091
    config.vm.network "forwarded_port", guest: 3000, host: 3000

    config.vm.synced_folder ".", "/home/vagrant/api"

    config.vm.provision "ansible" do |ansible|
        ansible.playbook = "provision.yml"
        ansible.raw_arguments = ['-v']
    end

    config.vm.provider "virtualbox" do |vb|
        vb.name = "employee-scheduling-api"
        vb.memory = 2048
        vb.cpus = 2
    end
end
```

##Create Vagrant Box
Now that we have created `ansible playbook`, `docker-compose` and  `Vagrantfile`, run vagrant up that will create and provisioning `default` VM box.

```bash
$ vagrant up
```

>**NOTE:** **Vagrant will provision the virtual machine only once on the first run, any subsequent provisioning must be executed with the** `--provision` **flag either** `vagrant up --provision` **or** `vagrant reload --provision` **or** `vagrant provision` **if vagrant box is already running. The provisioning will re-run also if you destroy the VM and rebuild it with** `vagrant destroy` **and** `vagrant up` **.**

If there have been no errors when executing the above commands, the machines  `default` should be created. The following command would outputs status of the vagrant machine:

```bash
$ vagrant status
Current machine states:
default                   running (virtualbox)
```

Now you should be able to ssh into box:

```bash
$ vagrant ssh
```

 and run Couchbase Server:
 
```bash
$ cd api
$ docker-compose up db
```

>**NOTE:** This process may take a while, when you run this command for the first time as it pull couchbase docker image from docker repository.

Now when Couchbase Server is up and running you can access Couchbase Web UI [http://localhost:8091](http://localhost:8091) and manually configured your Couchbase Server instance. In the next post I will show you how to configured API instance without any manual steps just with one simple command so stay tuned!

Full project you can be found on the [GitHub](https://github.com/martinmicunda/employee-scheduling-api).
