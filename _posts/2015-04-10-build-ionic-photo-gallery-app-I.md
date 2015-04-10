---
layout: post

title: Build a hybrid mobile app with Ionic, Cordova, Node.js, MongoDB, Redis, Ansible and Vagrant part I
subtitle: "Prepare the development environment with Vagrant and Ansible"

excerpt: "This is the first post of three-part blog series where we gonna build a hybrid mobile app with authentication that allows registered users view a gallery of photos they have uploaded via the camera phone."

author:
  name: Martin Micunda
  twitter: martinmicunda
  bio: Full Stack Software Engineer
---
This is the first post of three-part blog series where we gonna build a hybrid mobile app with authentication that allows registered users view a gallery of photos they have uploaded via the camera phone.

 - **part I - prepare the development environment with Vagrant and Ansible**
 - part II - build backend code with Node.js, MongoDB and Redis
 - part III - build hybrid mobile app with Ionic and Apache Cordova

The code for this project can be found on the [GitHub](https://github.com/martinmicunda/ionic-photo-gallery) and final app should look like this:
![Ionic Photo Gallery Screenshots I](https://raw.githubusercontent.com/martinmicunda/ionic-photo-gallery/master/ionic-photo-gallery-screenshots-I.jpg "Ionic Photo Gallery Screenshots I")
![Ionic Photo Gallery Screenshots II](https://raw.githubusercontent.com/martinmicunda/ionic-photo-gallery/master/ionic-photo-gallery-screenshots-II.jpg "Ionic Photo Gallery Screenshots II")

##Prerequisites
You need to have installed follow tools on your machine for this project:

- [Virtualbox](https://www.virtualbox.org/wiki/Downloads) 4.3.16+
- [Vagrant](http://www.vagrantup.com/downloads.html) 1.6.2+
- [Ansible](http://docs.ansible.com/intro_installation.html) 1.7.0+

##Development Architecture Diagram
![Ionic Photo Gallery Development Architecture Diagram](https://raw.githubusercontent.com/martinmicunda/ionic-photo-gallery/master/ionic-photo-gallery.jpg "Ionic Photo Gallery Development Architecture Diagram")

This architecture is running on my Macbook Pro. The laptop runs Vagrant that I use most of the time for my development and I would strongly advise you to start using it too. Instead of messing your laptop with different softwares and databases you create Vagrant box and if you don't like it or don't use it then you just simple destroy the box. With Vagrant you can also really easily reproduce your production environment which is huge plus or share the box between different OS systems.

I use Ansible for provisioning my machines so I can nicely reuse same playbooks between different machines and projects. Ansible and Vagrant is great combination to create a portable, consistant development environment to mirror your production server.

In this project we gonna use Node.js for our back-end code, MongoDB to store data, Redis to store JWT token when user login, Ionic and Apache Cordova for mobile hybrid app. So let's start preparing our development environment.

Create a directory to house this project:

```bash
$ mkdir ionic-photo-gallery && cd ionic-photo-gallery
```

##Create Ansible Playbook
First we need to install some ansible roles from Ansible Galaxy that we gonna use in our playbook:

```bash
$ ansible-galaxy install martinmicunda.common \
                       martinmicunda.nodejs \
                       martinmicunda.ionic \
                       laggyluke.direnv \
                       Stouts.mongodb \
                       DavidWittman.redis \
                       williamyeh.oracle-java \
                       nickp666.android-sdk \
                       --force
```
Verify that ansible roles were installed by running the list subcommand that will list the installed roles:

```bash
$ ansible-galaxy list
- DavidWittman.redis, 1.0.3
- laggyluke.direnv, v2.6.0
- martinmicunda.common, v1.0.1
- martinmicunda.ionic, v1.0.0
- martinmicunda.nodejs, v1.0.1
- nickp666.android-sdk, v0.0.1
- Stouts.mongodb, 2.1.8
- williamyeh.oracle-java, master
```

Let's create playbook for this project (run this command from root directory):

```bash
$ mkdir ansible && cd ansible
$ touch playbook.yml
```

and copy below code:

```yaml
---
- name: Install node.js, direnv, mongodb, redis, java, android-sdk and ionic
  hosts: all
  sudo: yes
  roles:
    - martinmicunda.common
    - martinmicunda.nodejs
    - martinmicunda.ionic
    - laggyluke.direnv
    - Stouts.mongodb
    - DavidWittman.redis
    - williamyeh.oracle-java
    - nickp666.android-sdk
  vars:
    java_version: 7
    android_sdk_download_location: http://dl.google.com/android/android-sdk_r24.1.2-linux.tgz
    android_sdk_install_location: /home/vagrant/android-sdk-linux
    android_sdk_dependency_packages:
      - "libncurses5:i386"
      - "libstdc++6:i386"
      - "zlib1g:i386"
      - "imagemagick"
      - "expect"
      - "ant"
      - "ccache"
      - "autoconf"
      - "automake"
      - "python-dev"
      - "zlibc"
      - "android-tools-adb"
    android_sdks_to_install: "platform-tool,build-tools-21.1.2,build-tools-20.0.0,build-tools-19.1.0,android-21,android-20,android-19"
```

The above ansible playbook installs following software in Vagrant box:

* [git](http://git-scm.com/)
* [node.js](https://nodejs.org/)
* [npm](https://www.npmjs.com/)
* [mongodb](https://www.mongodb.org/)
* [redis](http://redis.io/)
* [java 7](http://www.oracle.com/technetwork/java/javase/downloads/jre7-downloads-1880261.html)
* [android SDK](https://developer.android.com/sdk/index.html)
* [apache ant](http://ant.apache.org/)
* [apache cordova](https://cordova.apache.org/)
* [ionic CLI](http://ionicframework.com/docs/cli/)
* [direnv](http://direnv.net/)

The `mongodb` and `redis` services are started after vagrant provisioning takes place (see [create vagrant box](#create-vagrant-box) section for more info about vagrant provisioning).

##Create Vagrantfile
Download `ubuntu/trusty64`  virtualbox box:

```bash
vagrant box add trusty64 http://files.vagrantup.com/trusty64.box
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

The liverload, node.js and ionic app will run inside of Vagrant box so we have to forward these ports to access our app from host machine.
>**NOTE:** I am not forwarding MongoDB and Redis ports as I don't need them.

Forward port `3000` for our Node.js app:

```
config.vm.network "forwarded_port", guest: 3000, host: 3000
```

Forward port `8100` for our Ionic app:

```
config.vm.network "forwarded_port", guest: 8100, host: 8100
```

Forward port `35729` for livereload:

```
config.vm.network "forwarded_port", guest: 35729, host: 35729
```

Tells Vagrant to sync the `root` directory so we can edit the code with WebStorm or some other IDE:

```
config.vm.synced_folder ".", "/home/vagrant/ionic-photo-gallery"
```

Configure virtualbox:

```ruby
config.vm.provider "virtualbox" do |vb|

			<add code here>

end
```

Set the Video Ram to 128 megs:

```
vb.customize ["modifyvm", :id, "--vram", "128"]
```

Turn on the USB drivers so that we can connect:

```
vb.customize ["modifyvm", :id, "--usb", "on"]
```

Add a usb device filter for a Android Device:

```
vb.customize ["usbfilter", "add", "0", "--target", :id, "--name", "android", "--vendorid", "0x18d1"]
```

Add name that will be displayed in the VirtualBox Manager UI:

```
vb.name = "IonicBox"
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
    ansible.playbook = "ansible/playbook.yml"
    ansible.raw_arguments = ['-v']
end
```

The final `Vagrantfile` should look like this:

```ruby
VAGRANTFILE_API_VERSION = "2"
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
    config.vm.box = "ubuntu/trusty64"

    config.vm.network "forwarded_port", guest: 8100, host: 8100
    config.vm.network "forwarded_port", guest: 35729, host: 35729
    config.vm.network "forwarded_port", guest: 3000, host: 3000

    config.vm.synced_folder ".", "/home/vagrant/ionic-photo-gallery"

    config.vm.provision "ansible" do |ansible|
        ansible.playbook = "ansible/playbook.yml"
        ansible.raw_arguments = ['-v']
    end

    config.vm.provider "virtualbox" do |vb|
        vb.customize ["modifyvm", :id, "--vram", "128"]
        vb.customize ["modifyvm", :id, "--usb", "on"]
        vb.customize ["usbfilter", "add", "0", "--target", :id, "--name", "android", "--vendorid", "0x18d1"]
        vb.name = "IonicBox"
        vb.memory = 2048
        vb.cpus = 2
    end
end
```

##Create Vagrant Box
Now that we have created `ansible playbook` and  `Vagrantfile`, run vagrant up that will create and provisioning `default` VM box.

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

##Conclusion
In this post I have showed you how to prepare the development environment with Vagrant and Ansible for our `ionic photo gallery` application and it second post we will start writing the back-end code with authentication for ionic app.

Full project can be found on the [GitHub](https://github.com/martinmicunda/ionic-photo-gallery).
