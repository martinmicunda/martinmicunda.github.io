---
layout: post

title: How to start writing unit tests with ES6, Angular 1.x and JSPM
subtitle: "ES6 unit tests workflow with Karma, JSPM, Istanbul and Jasmine"

excerpt: "For last couple of months I have been working on Employee Scheduling application that is fully written in ES2015 and ES2016 with Angular 1.x and came to the point where I had to start writing some unit tests. Currently I am running over 900 unit tests and in this post I gonna describe how I got running all these tests with ES2015, Angular 1.x, Karma, JSPM, Istanbul and Jasmine."

author:
  name: Martin Micunda
  twitter: martinmicunda
  bio: Full Stack Software Engineer
---

For last couple of months I have been working on [Employee Scheduling](https://github.com/martinmicunda/employee-scheduling-ui) application that is fully written in ES2015 and ES2016 with Angular 1.x (if you want to know more about how to write apps with ES2015, Angular 1.x and JSPM check my blog post [here](http://martinmicunda.com/2015/02/09/how-to-start-writing-apps-with-es6-angular-1x-and-jspm/)) and came to the point where I had to start writing some unit tests.

Currently I am running over [**900 unit tests**](https://travis-ci.org/martinmicunda/employee-scheduling-ui/builds/85759582#L1041) and in this post I gonna describe how I got running all these tests with ES2015, Angular 1.x, Karma, JSPM, Istanbul and Jasmine. 

Writing unit tests with ES2015 is really easy and in some cases you don't depend on `angular-mocks` at all as you only test vanilla JavaScript code. To give you some example let's have look how we can test authentication service written in ES2015 and Angular 1.x:

[*authentication.js*](https://github.com/martinmicunda/employee-scheduling-ui/blob/master/src%2Fapp%2Fcore%2Fservices%2Fauthentication.js)

```js
import {Service, Inject} from '../../ng-decorators';

@Service({
    serviceName: 'AuthenticationService'
})
@Inject('AuthenticationResource', 'TokenModel')
class AuthenticationService {
    constructor(AuthenticationResource, TokenModel) {
        this.TokenModel = TokenModel;
        this.AuthenticationResource = AuthenticationResource;
    }

    logout() {
        return this.AuthenticationResource.logout().then(() => {
            this.TokenModel.remove();
        });
    }
}

export default AuthenticationService;
```

> **NOTE:** I am using `ES2016 decorators` in my code to avoid boilerplate code. If you want to know more about decorators read my blog post [How to use ES2016 decorators to avoid Angular 1.x and ES2015 boilerplate code](http://martinmicunda.com/2015/07/13/how-to-use-ES2016-decorators-to-avoid-angular-1x-boilerplate-code/).

In below test I do not need to inject any dependencies with Angular and instead I take advantage of ES2015 modules also I do not use `$q` promise instead I am using [ES2015 promise](http://www.2ality.com/2014/10/es6-promises-api.html) and then I resolve these promises with tiny library called [jasmine-async-sugar](https://github.com/tomastrajan/jasmine-async-sugar) (we gonna talk about this library later on in this blog).

[*authentication.spec.js*](https://github.com/martinmicunda/employee-scheduling-ui/blob/master/src%2Fapp%2Fcore%2Fservices%2Fauthentication.spec.js)

```js
'use strict';

import TokenModel from '../models/token.js';
import AuthenticationResource from '../resources/authentication/authentication.js';
import AuthenticationService from './authentication.js';

describe('AuthenticationService', () => {

    let authenticationService, authenticationResource, tokenModel;

    beforeEach(() => {
        tokenModel = new TokenModel();
        authenticationResource = new AuthenticationResource();
    });

    itAsync('should logout and remove token', () => {
        spyOn(authenticationResource, 'logout').and.returnValue(Promise.resolve());
        spyOn(tokenModel, 'remove');

        authenticationService = new AuthenticationService(authenticationResource, tokenModel);

        return authenticationService.logout().then(() => {
            expect(authenticationResource.logout).toHaveBeenCalled();
            expect(tokenModel.remove).toHaveBeenCalled();
        });
    });
});
```

As I mentioned early I have written over `900` unit tests so if you want to see how to test `config`, `directives`, `routes`, `components` etc.  then have look at [Employee Scheduling](https://github.com/martinmicunda/employee-scheduling-ui) project.

##Setting up Karma with JSPM

To get running unit tests written in ES2015 we need to install extra libraries so let's install follow packages:

```bash
npm install --save-dev jasmine-core phantomjs karma karma-jasmine karma-phantomjs-launcher karma-jspm jasmine-async-sugar
```

###1.
We start with basic settings where we add `frameworks` block:

```js
'use strict';

module.exports = function (config) {
    config.set({

        frameworks: ['jspm', 'jasmine'],
        
    });
};
```

###2.
We use PhantomJS as our headless test browser so we need to add polyfill to fix [issue](https://github.com/ariya/phantomjs/issues/10522) with `Function.bind()` that is not supported by PhantomJS 1.x. The `bind()` function is use by SystemJS and it might be use in other libraries so it is good idea to include this polyfill with PhantomJS 1.x.

I also like to use tiny [`jasmine-async-sugar`](https://github.com/tomastrajan/jasmine-async-sugar) library that enhance testing of async (promise) functionality in Angular 1.X applications. To give you quick taste have look on the follow code:

```js
it('tests async functionality in standard way', (done) => {
    AsyncService.resolveAsync()
        .then(function(response) {
            expect(response).toBe('response');
            done();
        });
        
    $rootScope.$digest();
});
```
and here is same code with `jasmine-async-sugar` library where we don't need to use `angular $rootScope`:

```js
itAsync('tests async functionality without "done", manual "$rootScope.$digest" triggering', () => {
    return AsyncService.resolveAsync()
        .then(function(response) {
            expect(response).toBe('response');
        });
});
```


Add below `files` block to `karma.conf.js` file:

```js
files: [
    'node_modules/karma-babel-preprocessor/node_modules/babel-core/browser-polyfill.js',
    'node_modules/jasmine-async-sugar/jasmine-async-sugar.js'
]
```

> **TIP:** I stopped using Angular [`$q`](https://docs.angularjs.org/api/ng/service/$q) promise in my application, test code and instead I am using [ES2015 promise](http://www.2ality.com/2014/10/es6-promises-api.html). 

###3.
In below lines we configure [`karma-jspm`](https://github.com/Workiva/karma-jspm). The `loadFiles` configuration tells karma-jspm which files should be dynamically loaded via SystemJS before the tests run. The `serveFiles` configuration will only load these files when and if the `loadFiles`  files require them. The [`src/app/app.js`](https://github.com/martinmicunda/employee-scheduling-ui/blob/master/src/app/app.js) is the main file that bootstrap angular app and includes all app sub-modules.

```js
jspm: {
    config: 'jspm.conf.js',
    loadFiles: ['src/app/app.js', 'src/app/**/*.spec.js'],
    serveFiles: ['test/helpers/**/*.js','src/app/**/*.+(js|html|css|json)']
}
```

> **TIP:** I saw a few times that people try only load test files in `loadFiles` and then application files in `serveFiles` and I would not recommend this if you are planning to generate coverage thresholds for your code. If you gonna load only test files in `loadFiles` then coverage thresholds will be generate only for these files e.g.: you have app files `A.js, B.js, C.js` and you write test only for file `A.spec.js` then you get only coverage for file `A.js` with `100%` coverage which is incorrect from application point of view because I would expect coverage under `100%` as files `B.js and C.js` haven't been tested. This can be easily missed in large applications when some developer might forgot to write test. 

Depends on your application file structure you might see `404` error when you run your test. To fix this error you need to proxy your paths to `/base/` prefix e.g.:

```js
proxies: {
    '/test/': '/base/test/',
    '/src/app/': '/base/src/app/',
    '/jspm_packages/': '/base/jspm_packages/'
}
```

> **NOTE:** This is bug in `karma-jspm` and it might be fix in the future so you will not need to proxy anything.

###4.
The `karma.conf.js` file is available [here](https://github.com/martinmicunda/employee-scheduling-ui/blob/master/karma.conf.js) and you should be able to run your ES2015 code with JSPM now. If you want to know how to run coverage for ES2015 code then just continue reading.

##Setting up coverage for ES2015 code
To get running coverage for ES2015 code we need to install extra libraries so let's install follow packages:

```bash
npm install --save-dev karma-coverage karma-babel-preprocessor isparta 
```

The `karma-babel-preprocessor` is transpiling ES2015 to ES5 code with babel since the coverage reporter throws error on ES6 syntax and the `isparta` is a instrumenter code coverage tool for ES2015 using babel. 

```js
preprocessors: {
    'src/**/!(*.spec|*.mock|*-mock|*.e2e|*.po|*.test).js': ['babel', 'coverage']
},

babelPreprocessor: {
    options: {
        stage: 1,
        sourceMap: 'inline'
    }
},

coverageReporter: {
    instrumenters: { isparta : require('isparta') },
    instrumenter: {
        'src/**/*.js': 'isparta'
    },
    dir: 'test-reports/coverage/',
    reporters: [
        {type: 'html'},
        {type: 'text-summary'}
    ]
}
```
> **TIP:** Make sure you don't forget include `sourceMap: 'inline'` to babel options otherwise you might see error like this  `[TypeError: Cannot read property 'text' of undefined]`.

After you run tests the coverage reports can be found in the `test-reports/coverage/` folder. The ES2015 coverage report for `Employee Scheduling` project is available [here](http://martinmicunda.com/employee-scheduling-ui/test-reports/coverage/firefox/).

![es6-coverage](https://raw.githubusercontent.com/martinmicunda/martinmicunda.github.io/master/images/posts/coverage.png)

![es6-coverage-code](https://raw.githubusercontent.com/martinmicunda/martinmicunda.github.io/master/images/posts/coverage-code.png)

At the time of writing this blog there are a few issues with ES2015 coverage so let's have look on these issues and how to fix them.

### Issue 1
The current `karma-coverage` is only showing ES5 code and not ES2015 as you would expect so to fix this problem we need to use a fork version that was created by [Douglas Duteil](https://github.com/douglasduteil). 

```
"karma-coverage": "douglasduteil/karma-coverage#next"
```

My understanding is that Douglas already [merged](https://github.com/karma-runner/karma-coverage/commit/626e7b0) his changes to origin `karma-coverage` repo and from this [comment](https://github.com/douglasduteil/isparta/issues/38#issuecomment-128466597) it should be clear that there is no need for the fork anymore however I tried `karma-coverage v0.5.x` and I was not able to get ES2015 output. I have opened [issue](https://github.com/karma-runner/karma-coverage/issues/175) regarding to this problem.  

### Issue 2
When you generate ES2015 coverage reports you might see error like this:

```bash
ERROR [coverage]: [TypeError: Cannot read property 'text' of undefined]
TypeError: Cannot read property 'text' of undefined
```

This is an issue with Istanbul and source maps so to fix this problem we need use Istanbul branch that has fix for this issue:

```
"istanbul": "gotwarlost/istanbul.git#source-map",
```

##Conclusion
When I started to write applications in ES2015 a couple months ago I wasn't really confident to go to production because I really struggled to get run the tests and coverage for these applications however as I got running over [**900 unit tests**](https://travis-ci.org/martinmicunda/employee-scheduling-ui/builds/85759582#L1041)  in one of my project I can say that I am really confident to push these applications to production now. All code and test examples mentioned in this post with `karma.conf.js` file can be found in my [Employee Scheduling](https://github.com/martinmicunda/employee-scheduling-ui) project. 
