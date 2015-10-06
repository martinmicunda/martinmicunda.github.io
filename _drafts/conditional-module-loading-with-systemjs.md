---
layout: post

title: Conditional module loading with SystemJS

excerpt: "Today I gonna describe `conditional module loading` feature that SystemJS added couple weeks ago."

author:
  name: Martin Micunda
  twitter: martinmicunda
  bio: Full Stack Software Engineer
---

Today I gonna describe `conditional module loading` feature that [SystemJS](https://github.com/systemjs/systemjs) added couple weeks ago.

> Keep in mind this feature is still not stable but I am using it in my [Employee Scheduling](https://github.com/martinmicunda/employee-scheduling-ui) application already without any problem. 

##Use Case

In my application I am using [ES6 modules](http://www.2ality.com/2014/09/es6-modules-final.html) and creating production bundle with [SystemJS Builder](https://github.com/systemjs/builder). I have a case where I want to load different configuration files depend on environment and I also want to include mock data only for `test` environment and this is all possible now with new feature introduced in SystemJS.

![es6-conditional-folders](https://raw.githubusercontent.com/martinmicunda/martinmicunda.github.io/master/images/posts/es6-conditional-folders.png)

##Conditional Syntax
SystemJS supports two conditional syntaxes `Extension Conditions` and `Boolean Conditions` at the time of writing this blog.

###Extension Conditions

The extension conditions syntax allows a condition module to alter the resolution of an import so let's assume I create global env variable that looks like this:

```js
window.ENV = {
    environment: 'test', 
    mock: false
};
```

then I can use this variable in my condition extension import:

```js
import './config.#{ENV|environment}.js';
```
and SystemJS will replace this variable with string value:

```js
import './config.test.js';
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

I have described conditional syntax but let's have look on some real example and how to get these conditions running with SystemJS and SystemJS Builder in real project.

In my projects I like to use `npm scripts` and hide all the logic there so when I want to run application I use follow commands:

```bash
npm start -- --env=DEV
npm start -- --env=TEST
npm start -- --env=PROD
```

The command `npm start` start the application and `env` arguments are passed through CLI into `gulp` or other build tool of your choice. These `env` values are important because we need to get them to SystemJS so here is my development flow.

###1.
I create gulp task to inject arguments passing through `cli` to file that we gonna create in second step. The reason why I inject these values instead manually add them is because these values are changing depends on arguments passing from `cli`.

```js
gulp.task('config', () => {
    return gulp.src(path.app.config.conditions)
        .pipe(inject(gulp.src('.'), {
            starttag: '<!-- inject:env -->',
            transform: () => `mock: ${ENV.toLowerCase() === 'test'}, environment: '${env.toLowerCase()}',`
        }))
        .pipe(gulp.dest(path.root));
});
```
###2.
I create `env.conditions.js` file in root directory where I inject all conditions via gulp task that we created in step 1 and register them with SystemJS.

```js
'use strict';

window.ENV = {
    <!-- inject:env -->
    mock: false, environment: 'dev',
    <!-- endinject -->
};

System.set('ENV', System.newModule({ 'default': window.ENV, __useDefault: true }));
```
I also commit this file to git and then stop tracking changes in this file because you can chance environments quit often during development. 

```bash
# ask git to stop tracking any changes to env.conditions.js
git update-index --assume-unchanged env.conditions.js

# if you want to start tracking changes again to env.conditions.js
git update-index --no-assume-unchanged env.conditions.js
```

###3.

Then I add required files to `index.html`. Keep in mind that order of these files is important.

```html
<script src="jspm_packages/system.js"></script>
<script src="jspm.conf.js"></script>
<script src="env.conditions.js"></script>
<script>         
System.import('app/app').catch(console.error.bind(console)); 
</script>
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
    const ENV = !!util.env.env ? util.env.env : 'DEV';
    const Builder = require('systemjs-builder');
    const builder = new Builder();
    const inputPath = 'src/app/app';
    const outputFile = `${path.tmp.scripts}build.js`;
    const outputOptions = { conditions: { 'ENV|mock': ENV.toLowerCase() === 'test', 'ENV|environment': ENV.toLowerCase() }, sourceMaps: true, config: {sourceRoot: path.tmp.scripts} };

    builder.loadConfig(`${path.root}/jspm.conf.js`)
        .then(() => {
            builder.buildStatic(inputPath, outputFile, outputOptions)
                .then(() => cb())
                .catch((ex) => cb(new Error(ex)));
        });
});
```

##Conclusion
The real use case of SystemJS conditional import can be found in my [Employee Scheduling](https://github.com/martinmicunda/employee-scheduling-ui) project. Keep in mind this feature is still in development and it might change in the future. Currently you probably won't find any documentation for conditional import so I would suggest to look at [SystemJS source code](https://github.com/systemjs/systemjs/blob/master/lib%2Fconditionals.js) or [SystemJS test cases](https://github.com/systemjs/systemjs/blob/1cfd5fe623cd5df443667e57bf26148ee5647789/test%2Ftest.js).
