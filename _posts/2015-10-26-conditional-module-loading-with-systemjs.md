---
layout: post

title: Conditional module loading with SystemJS

excerpt: "Conditional module loading is new feature added by SystemJS that helps you to load your ES2015 (ES6) modules depend on the conditions that you specify."

author:
  name: Martin Micunda
  twitter: martinmicunda
  bio: Full Stack Software Engineer
---

Today I gonna describe `conditional module loading` feature that [SystemJS](https://github.com/systemjs/systemjs) added couple weeks ago. This feature helps you to load your ES2015 (ES6) modules depend on the conditions that you specify.

> Keep in mind this feature is still not stable but I am using it in my [Employee Scheduling](https://github.com/martinmicunda/employee-scheduling-ui) application already without any problem. 

##Use Case

In my application I am using [ES6 modules](http://www.2ality.com/2014/09/es6-modules-final.html) and creating production bundle with [SystemJS Builder](https://github.com/systemjs/builder). I have a case where I want to load different configuration files depend on environment and I also want to include mock data only for `test` environment and this is all possible now with new feature introduced in SystemJS.

![es6-conditional-folders](https://raw.githubusercontent.com/martinmicunda/martinmicunda.github.io/master/images/posts/es6-conditional-folders.png)

##Conditional Syntax
SystemJS supports two conditional syntaxes `Extension Conditions` and `Boolean Conditions` at the time of writing this blog. Before I start describing these syntaxes let's assume I create global env variables that look like this:

*env.conditions.js*

```js
export var mock = true;
export var environment = 'prod';
```

and then I add this file to  `jspm.config.js` like this:

```js
System.config({
  map: {
    "ENV": "env.conditions.js"
  }
});  
```

###Extension Conditions

The extension conditions syntax allows a condition module to alter the resolution of an import so I can use variables from previous section in my condition extension import:

```js
import './config.#{ENV|environment}.js';
```
and SystemJS will replace this variable with string value:

```js
import './config.prod.js';
```

###Boolean Conditions
The boolean conditions syntax allows a module not to be loaded if it's not needed:

```js
import './employee.mock.js#?ENV|mock';
```

In above example SystemJS will not load this module as `ENV.mock` is set to `false`. There is also support for negated conditions via `~` symbol:

```js
import './employee.mock.js#?~ENV|mock';
```

In this case module is loaded because value `ENV.mock` is negated to `true`.

There are not so many condition options that you can use but even with these few options I find SystemJS conditional import feature really powerful in my projects.

##Real Use Case

I have described conditional syntax but let's have look on some real example and how to get these conditions running with `SystemJS` and `SystemJS Builder` in real project.

In my projects I like to use `npm scripts` and hide all the logic there so when I want to run application I use follow commands:

```bash
npm start -- --env=DEV
npm start -- --env=TEST
npm start -- --env=PROD
```

The command `npm start` start the application and `env` arguments are passed through CLI into `gulp` or other build tool of your choice. These `env` values are important because we need to get them to SystemJS so here is my development flow.

###1.
I create gulp task that inject arguments passing through `cli` into file that we gonna create in second step. The reason why I inject these values instead manually add them is because these values are changing depends on arguments passing from `cli`.

```js
gulp.task('config', () => {
    return gulp.src(path.app.config.conditions)
        .pipe(inject(gulp.src('.'), {
            starttag: '/* inject:env */',
            endtag: '/* endinject */',
            transform: () => `export var mock = ${ENV.toLowerCase() === 'test'};\nexport var environment = '${env.toLowerCase()}';`
        }))
        .pipe(gulp.dest(path.root));
});
```

> **NOTE:** It's up to you what approach you decide to use to dynamically inject env variables to  `env.conditions.js` file. In my projects I use [gulp-inject](https://www.npmjs.com/package/gulp-inject).

###2.
I create [`env.conditions.js`](https://github.com/martinmicunda/employee-scheduling-ui/blob/master/src%2Fapp%2Fcore%2Fconfig%2Fenv.conditions.js) file where I inject all conditions via gulp task that we created in step 1.

```js
'use strict';

/* inject:env */
export var mock = false;
export var environment = 'prod';
/* endinject */
```

I also commit this file to git and then stop tracking changes in this file because you can chance environments quit often during development. 

```bash
# ask git to stop tracking any changes to env.conditions.js
git update-index --assume-unchanged env.conditions.js

# if you want to start tracking changes again to env.conditions.js
git update-index --no-assume-unchanged env.conditions.js
```

###3.
I add `env.conditions.js` file to [`jspm.config.js`](https://github.com/martinmicunda/employee-scheduling-ui/blob/master/jspm.conf.js) and register ENV module with SystemJS.

```js
System.config({
  map: {
    "ENV": "src/app/core/config/env.conditions.js"
  }
});  
```

###4.
Now you can start using these conditions in the project e.g:

[*config.js*](https://github.com/martinmicunda/employee-scheduling-ui/blob/master/src%2Fapp%2Fcore%2Fconfig%2Fconfig.js)

```js
'use strict';

import './config.#{ENV|environment}.js';
import {ACCESS_LEVELS} from '../constants/constants.js';
import {Config, Run, Inject} from '../../ng-decorators';
```

[*employee.js*](https://github.com/martinmicunda/employee-scheduling-ui/blob/master/src%2Fapp%2Fcore%2Fresources%2Femployee%2Femployee.js)

```js
'use strict';

import './employee.mock.js#?ENV|mock';

import AbstractResource from '../abstract-resource';
import {Service, Inject} from '../../../ng-decorators'; 
```

All previous steps describe development workflow when you are developing your application but at the end of day you want to create production code which mean create a bundle with SystemJS Builder. SFX bundles do support conditional builds but they work little a bit differently than conditions in development workflow. There is open ticket [#311](https://github.com/systemjs/builder/issues/311) to support multiple conditional variations. So for now you need to add conditions like is show in below gulp bundle task:

```js
gulp.task('bundle', ['jshint'], (cb) => {
    const Builder = require('systemjs-builder');
    const builder = new Builder();
    const inputPath = 'src/app/app';
    const outputFile = `${path.tmp.scripts}build.js`;
    const outputOptions = { conditions: { 'src/app/core/config/env.conditions.js|mock.js': ENV.toLowerCase() === 'test', 'src/app/core/config/env.conditions.js|environment': ENV.toLowerCase() }, sourceMaps: true, config: {sourceRoot: path.tmp.scripts} };

    builder.loadConfig(`${path.root}/jspm.conf.js`)
        .then(() => {
            builder.buildStatic(inputPath, outputFile, outputOptions)
                .then(() => cb())
                .catch((ex) => cb(new Error(ex)));
        });
});
```

##Conclusion
The real use case of SystemJS conditional import can be found in my [Employee Scheduling](https://github.com/martinmicunda/employee-scheduling-ui) project. Keep in mind this feature is still in development and it might change in the future. Currently you probably won't find any documentation for conditional import so I would suggest to look at [SystemJS source code](https://github.com/systemjs/systemjs/blob/master/lib%2Fconditionals.js) or [SystemJS test cases](https://github.com/systemjs/systemjs/blob/1cfd5fe623cd5df443667e57bf26148ee5647789/test%2Ftest.js) for more examples. 
 