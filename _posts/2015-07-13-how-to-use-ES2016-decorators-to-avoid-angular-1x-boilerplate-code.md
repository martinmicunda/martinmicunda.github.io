---
layout: post

title: How to use ES2016 decorators to avoid Angular 1.x and ES2015 boilerplate code

excerpt: "This article describes usage of ES2016 decorators with Angular 1.x and ES2015 to avoid writing boilerplate code and get one step closer to make migration from Angular 1.x to Angular 2 easier."

author:
  name: Martin Micunda
  twitter: martinmicunda
  bio: Full Stack Software Engineer
---

This article is following [How to start writing apps with ES6, Angular 1.x and JSPM](http://martinmicunda.com/2015/02/09/how-to-start-writing-apps-with-es6-angular-1x-and-jspm/) post that I wrote a couple of months ago when I have started to work on my personal [Employee Scheduling](https://github.com/martinmicunda/employee-scheduling-ui) project and it describes usage of [ES2016 decorators](https://github.com/wycats/javascript-decorators) with Angular 1.x and ES2015 to avoid writing boilerplate code and get one step closer to make migration from Angular 1.x to Angular 2 easier. 

After a couple of months writing applications with ES2015 and Angular 1.x I found myself in position where I start writing a lot of boilerplate Angular 1.x code but I also want to move little a bit closer to Angular 2 syntax (there are already plenty of articles and videos about Angular 2 so we have at least some idea how Angular 2 syntax will look like).

The most clean Angular 1.x and ES2015 code I been writing so far looks like this:

*account.controller.js*

```js
'use strict';

class AccountController {
    constructor(employee, EmployeeResource) {
        'ngInject';
        this.EmployeeResource = EmployeeResource;
        this.employee = employee;
    }
}

export default AccountController;
```

*account.route.js*

```js
'use strict';

import template from './account.html!text';

function accountRoute($stateProvider) {
    'ngInject';
    return $stateProvider
        .state('account', {
            url: '/account',
            template: template,
            controller: 'AccountController as vm',
            resolve: {
                employee: EmployeeResource => EmployeeResource.get('1')
            }
        });
}

export default accountRoute;
```

*account.js*

```js
'use strict';

import './account-details/account-details';
import './contact-details/contact-details';
import './password/password';
import accountRoute from './account.route';
import AccountController from './account.controller';

export default angular.module('app.account', [
    accountDetailsModule.name,
    contactDetailsModule.name,
    passwordModule.name
]).config(accountRoute)
    .controller('AccountController', AccountController);
```    

The above *account.js* file contains a lot of Angular 1.x boilerplate code that I need to repeat over and over in other modules/components files and as we are using ECMAScript 2015 modules already it would be nice if we could somehow hide Angular 1.x modules and all these *.controller*, *.config*, *.directove* etc. syntax and the way how we can do that is using ES2016 decorators. If you want to know more about ES2016 decorators you can read [Addy Osmani](https://twitter.com/addyosmani) article [Exploring ES2016 Decorators](https://medium.com/google-developers/exploring-es7-decorators-76ecb65fb841).	

##Dependencies

I stopped using [ng-annotate](https://github.com/olov/ng-annotate) and instead of I create `@Inject` decorator that inject Angular 1.x module dependencies and it looks similar like [Angular 2 DI](https://angular.io/docs/js/latest/api/di/). 

*Source code:*

```js
function Inject(...dependencies) {
    return function decorator(target, key, descriptor) {
        // if it's true then we injecting dependencies into function and not Class constructor
        if(descriptor) {
            const fn = descriptor.value;
            fn.$inject = dependencies;
        } else {
            target.$inject = dependencies;
        }
    };
}
```

*Usage:*

```js
'use strict';

import {Inject} from './ng-decorators'; 

@Inject('employee', 'EmployeeService')
class Account {
    constructor(employee, EmployeeService) {
        this.EmployeeService = EmployeeService;
        this.employee = employee;
    }
}
```

> **Note:** This example inject module dependencies to Class constructor.

```js
'use strict';

import {Inject} from './ng-decorators'; 

class AppConfig {
	@Inject('$compileProvider', '$httpProvider')
	static config($compileProvider, $httpProvider) {
	    ....
	}
}
```    

> **Note:** This example inject module dependencies to Class function.

##Filters
`@Filter` decorator must contains filter name property as this name is important during the minification. Filter, Run and Config blocks are factories in Angular 1.x and current proposal for decorators only work with classes (at least that's my understanding as it would be nice to use decorators with factories functions) so if we want to use Filter, Run and Config blocks you have to define these functions inside of class.

*Source code:*

```js
function Filter(filter) {
    return function decorator(target, key, descriptor) {
        if (!filter.filterName) {
            throw new Error('@Filter() must contains filterName property!');
        }
        app.filter(filter.filterName, descriptor.value);
    };
}
```

*Usage:*

```js
'use strict';

import {Filter} from './ng-decorators'; 

class PaginationFilters {
    @Filter({
        filterName: 'startFrom'
    })
    static startFromFilter() {
        return (input, start) => {
            start = +start;  
            return input.slice(start);
        };
    }
}
```

##Config

*Source code:*

```js
function Config() {
    return function decorator(target, key, descriptor) {
        app.config(descriptor.value);
    };
}
```

*Usage:*

```js
'use strict';

import {Config, Inject} from './ng-decorators'; 

class ConfigurationProd {
    @Config()
    @Inject('$compileProvider', '$httpProvider')
    static configFactory($compileProvider, $httpProvider){
        $compileProvider.debugInfoEnabled(false);
        $httpProvider.useApplyAsync(true);
    }
}
```

##Run

*Source code:*

```js
function Run() {
    return function decorator(target, key, descriptor) {
        app.run(descriptor.value);
    };
}
```

*Usage:*

```js
'use strict';

import {Run, Inject} from './ng-decorators'; 

class OnRunTest {
    @Run()
    @Inject('$httpBackend')
    static runFactory($httpBackend){
        $httpBackend.whenGET(/^\w+.*/).passThrough();
        $httpBackend.whenPOST(/^\w+.*/).passThrough();
    }
}
```

##Services
`@Service` decorator must contains `serviceName` property as this name is important during minification of your code. If you would try use `target.name` instead of `serviceName` your app wouldn't work after minification. 

*Source code:*

```js
function Service(options) {
    return function decorator(target) {
        if (!options.serviceName) {
            throw new Error('@Service() must contains serviceName property!');
        }
        app.service(options.serviceName, target);
    };
}
```

*Usage:*

```js
'use strict';

import {Service, Inject} from './ng-decorators'; 

@Service({
    serviceName: 'PositionService'
})
@Inject('Restangular')
class PositionService {
    constructor(Restangular) {
        this.positions = [];
        this.Restangular = Restangular;
    }

    getPositions() {
        return this.positions;
    }

    setPositions(positions) {
        positions = this.Restangular.stripRestangular(positions);
        this.positions = positions;
    }

    addPosition(position) {
        this.positions.push(position);
    }
}
```

##Components
Angular 2 brings concept of components so basically there will be one root component that contains all other components, read this [article](http://victorsavkin.com/post/118372404541/the-core-concepts-of-angular-2) from [VICTOR SAVKIN](https://twitter.com/victorsavkin) if you want to know more. I tried to use components with my routes however I quick bump to few problems e.g. use resolve, modals etc. with `ui-router` states (see this open [issue](https://github.com/angular-class/NG6-starter/issues/12) in  [NG6-starter](https://github.com/angular-class/NG6-starter)). In the end I decided not to use components with routes and I have created  `@RouteConfig` decorator as you will see in the next section. In Angular 1.x I am using components when I need to only embed views e.g. navigation, footer and directives when I need to add behavior to a DOM element (this is exactly how Angular 2 will work except you can also use components with routes). 

*Source code:*

```js
function Component(component) {
    return function decorator(target) {
        if (typeof component !== 'object') {
            throw new Error('@Component() must be defined!');
        }

        if (target.$initView) {
            target.$initView(component.selector);
        }

        target.$isComponent = true;
    };
}

function View(view) {
    let options = view;
    const defaults = {
        template: view.template,
        restrict: 'E',
        scope: {},
        bindToController: true,
        controllerAs: 'vm'
    };
    return function decorator(target) {
        if (target.$isComponent) {
            throw new Error('@View() must be placed after @Component()!');
        }

        target.$initView = function(directiveName) {
            if (typeof directiveName === 'object') {
                options = directiveName;
                directiveName = pascalCaseToCamelCase(target.name);
            } else {
                directiveName = pascalCaseToCamelCase(directiveName);
            }
            options = options || (options = {});
            options.bindToController = options.bindToController || options.bind || {};

            app.directive(directiveName, function () {
                return Object.assign(defaults, { controller: target }, options);
            });
        };

        target.$isView = true;
    };
}
```

*Usage:*

```js
'use strict';

import template from './footer.html!text';
import {View, Component} from './ng-decorators'; // jshint unused: false

@Component({
    selector: 'footer'
})
@View({
    template: template
})
class Footer {
    constructor() {
        this.copyrightDate = new Date();
    }
}
```
 
##Routes

As I mentioned in `Components` section I had problem get run components with routes in some cases so I decided to create `@RouteConfig` decorator which basically is extension around `ui-router` and as you can see from source code it also add `controller` to `ui-router` state behind scene. `@RouteConfig` takes two parameters, first is state name and second are options that you know from ui-router.

*Source code:*

```js
function RouteConfig(stateName, options) {
    return function decorator(target) {
        app.config(['$stateProvider', ($stateProvider) => {
            $stateProvider.state(stateName, Object.assign({
                controller: target,
                controllerAs: 'vm'
            }, options));
        }]);
        app.controller(target.name, target);
    };
}
```

*Example code:*

```js
'use strict';

import template from './account.html!text';
import {RouteConfig, Inject} from '../../../ng-decorators';  

@RouteConfig('app.account', {
    url: '/account',
    template: template,
    resolve: {
        employee: ['EmployeeResource', EmployeeResource => EmployeeResource.get('1')]
    }
})
@Inject('employee', 'EmployeeService')
class Account {
    constructor(employee, EmployeeService) {
        this.EmployeeService = EmployeeService;
        this.employee = employee;
    }
}
``` 

 

##Conclusion
The idea behind this post was to show how you can simplify your Angular 1.x and ES2015 code with ES2016 decorators. It's really up to you how and where else you want to use decorators. The project that use all these decorators mention in this article can be found on the [GitHub](https://github.com/martinmicunda/employee-scheduling-ui).
