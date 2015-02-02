---
layout: post

title: How to start writing apps with ES6, Angular 1.x and JSPM
subtitle: "ES6 development and production workflow with JSPM"

excerpt: "Incorporated provides a great typography, responsive design, author details, semantic markup and more."

author:
  name: Martin Micunda
  twitter: martinmicunda
  bio: Full Stack Software Engineer
---
![Employee Scheduling]({{ site.url }}/images/employee-scheduling.png "Employee Scheduling")
Couple weeks ago I have started to work on one of my personal projects ([Employee Scheduling](https://github.com/martinmicunda/employee-scheduling-ui)) and at that time I didn't think I will write any of my code in ES6 not because  I wouldn't want to try one of the cool [ES6 features](https://github.com/lukehoban/es6features) but I was more concerned how to automating my development workflow with ES6 and I also want to get my code to production until I watched Guy Bedford [video](https://www.youtube.com/watch?v=szJjsduHBQQ) from JSConf2014 where he was talking about ES6 modules workflow using JSPM. As you may guess JSPM solves a lot of my concerns and today I want to share my ES6 development and production workflow using JSPM.

Before we start describing my workflow I want to mention that I am using Angular 1.3 for my project but you could use same ES6 workflow with EmberJS or React.

If you want to know more about JSPM there is great article


describe jspm config in package.json file | show how to add package a show where packages are installes


Install `JSPM` as a global through `NPM`:
{% highlight bash %}
npm install jspm -g
{% endhighlight %}

Create a project:
{% highlight bash %}
cd employee-scheduling-ui
jspm init

Package.json file does not exist, create it? [yes]:
Would you like jspm to prefix the jspm package.json properties under jspm? [yes]:
Enter a name for the project (optional):
Enter baseURL (public folder) path [.]:
Enter project code folder [./lib]:
Enter jspm packages folder [./jspm_packages]:
Enter config file path [./config.js]: jspm.config.js
Configuration file config.js doesn't exist, create it? [yes]:
Which ES6 transpiler would you like to use, Traceur or 6to5? [traceur]:
{% endhighlight %}


{% highlight javascript %}
/* Some pointless Javascript */
var rawr = ["r", "a", "w", "r"];
{% endhighlight %}
