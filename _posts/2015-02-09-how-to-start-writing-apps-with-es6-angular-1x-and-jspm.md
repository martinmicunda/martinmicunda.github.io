---
layout: post

title: How to start writing apps with ES6, Angular 1.x and JSPM
subtitle: "ES6 development and production workflow with JSPM"

excerpt: "Couple weeks ago I have started to work on one of my personal projects (Employee Scheduling) and at that time I didn't think I will write any of my code in ES6 not because I wouldn't want to try one of the cool ES6 features but I was more concerned how to automating my development workflow with ES6 and I also want to get my code to production until I watched Guy Bedford video from JSConf2014 where he was talking about ES6 modules workflow using JSPM."

author:
  name: Martin Micunda
  twitter: martinmicunda
  bio: Full Stack Software Engineer
---
Couple weeks ago I have started to work on one of my personal projects ([Employee Scheduling](https://github.com/martinmicunda/employee-scheduling-ui)) and at that time I didn't think I will write any of my code in ES6 not because  I wouldn't want to try one of the cool [ES6 features](https://github.com/lukehoban/es6features) but I was more concerned how to automating my development workflow with ES6 and I also want to get my code to production until I watched Guy Bedford [video](https://www.youtube.com/watch?v=szJjsduHBQQ) from JSConf2014 where he was talking about ES6 modules workflow using JSPM. As you may guess JSPM solves a lot of my concerns and today I want to share my ES6 development and production workflow using JSPM.
The Employee Scheduling application screenshot:
![Employee Scheduling]({{ site.url }}/images/posts/employee-scheduling.png "Employee Scheduling")
Before we start describing my workflow I want to mention that I am using Angular 1.x for my project but you could use similar ES6 workflow with EmberJS or ReactJS.

##Project Setup
First clone an `employee-scheduling-ui` repo and then install dependencies:
{% highlight bash %}
git clone git@github.com:martinmicunda/employee-scheduling-ui.git
cd employee-scheduling-ui
npm install
{% endhighlight %}
> I have set npm postinstall script to run `jspm install` so when you execute `npm install` it will also install jspm packages under `jspm_packages` folder.

Next when you open `package.json` you can see jspm block that configures  packages for jspm. The jspm block can be created manually or through `jspm init` command and if you want to add a jspm packages just add them manually or through `jspm install <package>` command:

{% highlight json %}
"jspm": {
    "directories": {
        "lib": "src"
    },
    "configFile": "jspm.conf.js",
    "dependencies": {
        "angular": "1.3.8",
        .....
    },
    "devDependencies": {
      "babel": "npm:babel-core@5.8.24",
      "babel-runtime": "npm:babel-runtime@5.8.24",
      "core-js": "npm:core-js@1.1.4"
    }
}
{% endhighlight %}

Next open `jspm.config.js` which tells SystemJS how to find modules (if you look closer you can see that configuration is similar like in require.js)
{% highlight javascript %}
System.config({
    baseURL: "./",
    defaultJSExtensions: true,
    transpiler: "babel",
    babelOptions: {
      "optional": [
        "runtime"
      ],
      "stage": 1
    },
    paths: {
      "employee-scheduling-ui/*": "src/*.js",
      "github:*": "jspm_packages/github/*",
      "npm:*": "jspm_packages/npm/*"
    },
    "map": {
      "angular": "github:angular/bower-angular@1.3.8",
  	  ...
    }
});
{% endhighlight %}

 As the last thing open `src/index.html` where we are loading `system.js`, `jspm.config.js` files and importing `app/bootstrap` module with all dependencies:

{% highlight html %}
<script src="jspm_packages/system.js"></script>
<script src="jspm.conf.js"></script>
<script>
	System.import('app/bootstrap')
	.catch(console.error.bind(console));
</script>
{% endhighlight %}

The SystemJS is build on top of [ES6 Module Loader Polyfill](https://github.com/ModuleLoader/es6-module-loader) that mean we can use the future [Javascript Module Loader](http://whatwg.github.io/loader/) today and if you open your browser console you can see how ES6 Module Loader Polyfill load `app/bootstrap` module with all dependencies.
![Image of ES6 Module Loader]({{ site.url }}/images/posts/es6-module-loder-console.png)
The SystemJS library use `Traceur` or `6to5` (it depends on your configuration) to compile your ES6 to ES5 code and all this happened in the browser automatically so there is no need for any build steps. If you turn on `JavaScript source maps` in the browser console you can also see ES6 code.
![Image of ES6 Source Map]({{ site.url }}/images/posts/es6-source-map.png)
## Development
As I mentioned in previous section there is no build step required as all compilation from ES6 to ES5 happened in the browser so only thing that you want to set is to watch for changes and refresh the browser by using gulp or some other tool.


### Bootstrap Angular 1.x Application
As we are using ES6 with Angular 1.x we can't use `ng-app` directive to bootstrap the application as modules are loaded asynchronously instead of that we need to bootstrap the application manually:

{% highlight javascript %}
import angular from 'angular';
import mainModule from './main';

angular.element(document).ready(function() {
    angular.bootstrap(document, [mainModule.name]);
});
{% endhighlight %}

### Controllers
{% highlight javascript %}
class EmployeesAddController {
    constructor(languages, positions, roles, EmployeeResource, $state, $modalInstance) {
        this.$modalInstance = $modalInstance;
        this.EmployeeResource = EmployeeResource;
        this.employee = {};
        this.languages = languages;
        this.positions = positions;
        this.roles = roles;
        this.profileComplete = EmployeeResource.calculateProfileCompleteness({});
        this.$state = $state;
    }

    cancel() {
        this.$modalInstance.dismiss('cancel');
    }
}
EmployeesAddController.$inject = ['languages', 'positions', 'roles', 'EmployeeResource', '$state', '$modalInstance'];

export default EmployeesAddController;
{% endhighlight %}

### Services
{% highlight javascript %}
class RoleService {
    constructor(Restangular) {
        this.Restangular = Restangular;
    }

    getList(query) {
        return this.Restangular
            .all('roles')
            .withHttpConfig({cache: true})
            .getList(query);
    }
}
RoleService.$inject = ['Restangular'];

export default RoleService;
{% endhighlight %}

### Routes
{% highlight javascript %}
function employeesRoute($stateProvider) {
    $stateProvider
        .state('employees', {
            url: '/employees',
            templateUrl: 'app/states/employees/employees.html',
            controller: 'EmployeesController as vm',
            resolve: {
                employees: ['EmployeeResource', EmployeeResource => EmployeeResource.getList()],
                languages: ['LanguageResource', LanguageResource => LanguageResource.getList()],
                positions: ['PositionResource', PositionResource => PositionResource.getList({lang: 'en'})],
                roles: ['RoleResource', RoleResource => RoleResource.getList({lang: 'en'})]
            }
        });
}
employeesRoute.$inject = ['$stateProvider'];

export default employeesRoute;
{% endhighlight %}
### Directives
{% highlight javascript %}
function mmScrollUp($location, $anchorScroll) {
    let directive = {
        restrict: 'AC',
        link: link
    };
    return directive;

    function link(scope, element, attrs) {
        element.on('click', function() {
            $location.hash(attrs.uiScroll);
            $anchorScroll();
        });
    }
}
mmScrollUp.$inject = ['$location', '$anchorScroll'];

export default angular.module('mmScrollUp', [])
    .directive('mmScrollUp', mmScrollUp);
{% endhighlight %}
### Configs
{% highlight javascript %}
export function onConfig($locationProvider, $urlRouterProvider, RestangularProvider) {

    // set restful base API Route
    RestangularProvider.setBaseUrl('/api/v1');

    // use the HTML5 History API
    $locationProvider.html5Mode(true);

    // for any unmatched url, send to 404 page (Not page found)
    $urlRouterProvider.otherwise('/employees');

    // the `when` method says if the url is `/` redirect to `/dashboard` what is basically our `home` for this application
    $urlRouterProvider.when('/', '/employees');
}
onConfig.$inject = ['$locationProvider', '$urlRouterProvider', 'RestangularProvider'];
{% endhighlight %}

## Production
If you run `employee-scheduling` app and open the browser console you can see there are over 100 requests and with so many requests you probably don't want to go to production so let's create production bundle with `systemjs-builder` by running `gulp bundle`. This task will create self-executing bundle with all the modules imported by `src/app/bootstrap.js` that can run without needing SystemJS by adding a micro-loader implementation and traceur-runtime into one bundle.

{% highlight javascript %}
gulp.task('bundle', 'Create JS production bundle', ['jshint'], function (cb) {
    const Builder = require('systemjs-builder');
    const builder = new Builder();
    const inputPath = 'src/app/bootstrap';
    const outputFile = `${path.tmp.scripts}build.js`;
    const outputOptions = { sourceMaps: true, config: {sourceRoot: path.tmp.scripts} };
    
    builder.loadConfig(`${path.root}/jspm.conf.js`)
         .then(() => {
             builder.buildStatic(inputPath, outputFile, outputOptions)
                 .then(() => cb())
                 .catch((ex) => cb(new Error(ex)));
         });
});
{% endhighlight %}
> At the moment you have to add  traceur-runtime.js manually as there is open [issue](https://github.com/systemjs/builder/issues/46) against it.

If you want to run my production code just run `npm start -- --env=PROD` that will create production code under `build/dist` directory and it will run code from this directory.

## Conclusion
I think by now you have at least some idea how to start writing apps with ES6, JSPM and how you can start preparing for Angular 2 as it will be written in ES6.  I have still plan to continue on this app and add some tests and slowly migrate to Angular 2 in the future. You can find the complete app code here: [https://github.com/martinmicunda/employee-scheduling-ui](https://github.com/martinmicunda/employee-scheduling-ui)


