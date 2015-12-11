---
layout: post

title: Learn how to configure a Couchbase Server with NodeJS and ES6/ES7

excerpt: "In the last post we looked how to setup Couchbase Server with Vagrant, Docker, Ansible and then you had to manually configured Couchbase Server which is not always ideal specially when you need to repeat this configuration set up over and over. As I mention in the last post there is better way how to configure your fresh new server with just one simple command and in this post I will show you how to it. "

author:
  name: Martin Micunda
  twitter: martinmicunda
  bio: Full Stack Software Engineer
---

In the last [post](http://martinmicunda.com/2015/12/09/learn-how-to-set-up-a-couchbase-with-vagrant-docker-ansible) we looked how to setup Couchbase Server with Vagrant, Docker, Ansible  and then you had to manually configured Couchbase Server which is not always ideal specially when you need to repeat this configuration set up over and over (mainly when someone new start working on the project it would be nice to run only one command to setup Couchbase Server or when you decide to destroy docker container and then re-create new one). As I mention in the last post there is better way how to configure your fresh new server with just one simple command and in this post I will show you how to it. 

 - [Learn how to set up a Couchbase Server with Vagrant, Docker and Ansible](http://martinmicunda.com/2015/12/09/learn-how-to-set-up-a-couchbase-with-vagrant-docker-ansible)
 - **Learn how to configure a Couchbase Server with NodeJS and ES6/ES7**
 - Learn how to set up a NodeJS app using Couchbase Server, KoaJS and ES6/ES7
 - Learn how to do CRUD operations with Couchbase Server, NodeJS, ES6/ES7 and N1QL 
 - Learn how to do advanced CRUD operations with Couchbase Server, NodeJS, ES6/ES7 and N1QL 
 - Learn how to create unique constraints with Couchbase Server and NodeJS

The code for this project can be found on the GitHub ([API](https://github.com/martinmicunda/employee-scheduling-api), [UI](https://github.com/martinmicunda/employee-scheduling-ui)).

There are couple of ways how to configure Couchbase Server either manually or using REST API or CLI. In this post we gonna use REST API with NodeJS and [`async/await`](https://github.com/tc39/ecmascript-asyncawait) ES7 feature that makes code much cleaner and easy to read.

>**NOTE:** This post was heavily inspired by [https://github.com/couchbaselabs/try-cb-nodejs](https://github.com/couchbaselabs/try-cb-nodejs) project.

##Install Dependencies
Before we start write any code we need to install all dependencies that are required for the script to configure Couchbase Server. Create `package.json` file under `root` directory:

```bash
$ touch package.json
```

and copy below code to package.json:

```json
{
  "name": "configure-couchbase-server",
  "version": "0.0.0",
  "main": "setup.js",
  "scripts": {
    "setup": "node -r babel/register ./setup.js"
  },
  "dependencies": {
    "request-promise": "1.0.1",
    "mm-node-logger": "0.0.*",
    "dotenv": "1.2.0"
  },
  "devDependencies": {
    "babel": "5.8.23"
  }
}
```

then you run:

```bash
$ npm install
```

The `mm-node-logger` is just wrapper around `winston` logging library, `dotenv` is use for environment variables and  `request-promise` let you use `request` with promises as `async/await` doesn't work with callbacks.


##Configuration

If you have heard about "[The Twelve-Factor App](http://12factor.net/config)" then you probably know we should store config in environment variables so we don't need to create multiple config files for development, test, and production environments. For this reason we have installed [dotenv](https://github.com/motdotla/dotenv). Dotenv loads variables from a `.env` file into ENV when the environment is bootstrapped. If you want to use `dotenv` create `.env` file under `root` directory.

*.env*

```
COUCHBASE_HOST=localhost
COUCHBASE_PORT=8091
	.
	.
	.
```

> **NOTE:** I always add this file to `.gitignore` so it never happens I commit sensitive information.

I still prefer to have one config file for my environment variables in my app as an abstraction layer or at least defined the default values.

*config.js*

```javascript
'use strict';

import dotenv from 'dotenv';
dotenv.config({silent: process.env.NODE_ENV !== 'development'});

const config = Object.freeze({
    couchbase: {
        host: process.env.COUCHBASE_HOST || 'localhost',
        port: process.env.COUCHBASE_PORT || '8091',
        seedGlob: process.env.COUCHBASE_SEED_GLOB || '../**/fixtures/**/*.js',
        bucketRamQuota: process.env.COUCHBASE_BUCKET_RAM_QUOTA || 100,
        endPoint: isLinux ? 'couchbase://localhost' : `${process.env.COUCHBASE_HOST || 'localhost'}:${process.env.COUCHBASE_PORT || '8091'}`,
        n1qlService: `${process.env.COUCHBASE_HOST || 'localhost'}:${process.env.COUCHBASE_N1QL_PORT || '8093'}`,
        bucket: process.env.COUCHBASE_BUCKET || 'employee-scheduling',
        username: process.env.COUCHBASE_USERNAME || 'Administrator',
        password: process.env.COUCHBASE_PASSWORD || 'password',
        checkInterval: process.env.COUCHBASE_CHECK_INTERVAL || 3000,
        thresholdItemCount: 31565, 
        indexMemQuota: 1024,
        dataMemQuota: 512
    }
});

export default config;
```

##Couchbase Server Setup Script

Create `setup.js` file under `root` directory:

```bash
$ touch setup.js
```

Add setup script dependencies:

*setup.js*

```javascript
'use strict';

import config from './config';
import request from 'request-promise';
import mmLogger from 'mm-node-logger';

const logger = mmLogger(module);

async function instanceExists() {}
async function provisionServices() {}
async function provisionMemory() {}
async function provisionAdmin() {}
async function provisionBucket() {}
async function setup() {}

(() => setup())();
``` 

The `instanceExists` function checks if a couchbase instance exists (we want to configure only new instances so if couchbase instance already exist the setup script should not run at all):
 
```javascript
async function instanceExists() {
    logger.info(`    COUCHBASE INSTANCE: ${config.couchbase.host}:${config.couchbase.port}`);
    let data;

    try {
        data = await request.get({
            url: `http://${config.couchbase.host}:${config.couchbase.port}/pools/default/buckets`,
            auth: {
                user: config.couchbase.username,
                pass: config.couchbase.password
            },
            json: true
        });
    } catch(error) {
        logger.error(`   COUCHBASE INSTANCE: NOT FOUND`.red);
        throw error;
    }

    logger.info(`    COUCHBASE INSTANCE BUCKET: ${config.couchbase.bucket} CHECK IF PROVISIONED`);
    logger.info(`    COUCHBASE INSTANCE BUCKET COUNT: ${data.length} LISTED BELOW`);

    for (let i = 0; i < data.length; i++) {
        logger.info(`    COUCHBASE INSTANCE BUCKET: ${data[i].name}`);
        if (data[i].name == config.couchbase.bucket) {
            logger.info(`    COUCHBASE INSTANCE BUCKET: ${config.couchbase.bucket} ALREADY PROVISIONED, STOPPING`);
            return true;
        }
    }

    logger.info(`    COUCHBASE INSTANCE BUCKET: ${config.couchbase.bucket} NOT PROVISIONED, CONTINUING`);
    return false;
}
```

The `provisionServices` function provision a services with `kv,n1ql,index`:

```javascript
async function provisionServices() {
    logger.info(`      PROVISION SERVICES STARTED`);

    try {
        await request.post({
            url: `http://${config.couchbase.host}:${config.couchbase.port}/node/controller/setupServices`,
            form: {
                services: 'kv,n1ql,index'
            }
        });
    } catch(error) {
        logger.info(`      PROVISION SERVICES FAILED`.red);
        throw error;
    }

    logger.info(`      PROVISION SERVICES COMPLETED`);
}
```

The `provisionMemory` function provision a couchbase memory:

```javascript
async function provisionMemory() {
    logger.info(`      PROVISION MEMORY STARTED`);

    try {
        await request.post({
            url: `http://${config.couchbase.host}:${config.couchbase.port}/pools/default`,
            form: {
                indexMemoryQuota: config.couchbase.indexMemQuota,
                memoryQuota: config.couchbase.dataMemQuota
            }
        });
    } catch(error) {
        logger.info(`      PROVISION MEMORY FAILED`.red);
        throw error;
    }

    logger.info(`      PROVISION MEMORY COMPLETED`);
}
```

The `provisionAdmin` function provision an admin with credentials:

```javascript
async function provisionAdmin() {
    logger.info(`      PROVISION ADMIN USER STARTED`);

    try {
        await request.post({
            url: `http://${config.couchbase.host}:${config.couchbase.port}/settings/web`,
            form: {
                username: config.couchbase.username,
                password: config.couchbase.password,
                port: config.couchbase.port
            }
        });
    } catch(error) {
        logger.error(`     PROVISION ADMIN USER FAILED`.red);
        throw error;
    }

    logger.info(`      PROVISION ADMIN USER COMPLETED`);
}
```

The `provisionBucket` function provision a bucket:

```javascript
async function provisionBucket() {
    logger.info(`      PROVISION BUCKET STARTED`);

    try {
        await request.post({
            url: `http://${config.couchbase.host}:${config.couchbase.port}/pools/default/buckets`,
            form: {
                authType: 'sasl',
                name: config.couchbase.bucket,
                flushEnabled: 1,
                bucketType: 'couchbase',
                ramQuotaMB: config.couchbase.bucketRamQuota
            },
            auth: {
                user: config.couchbase.username,
                pass: config.couchbase.password
            }
        });
    } catch(error) {
        logger.info(`      PROVISION BUCKET FAILED`.red);
        throw error;
    }

    logger.info(`      PROVISION BUCKET COMPLETED`);
}
```

The `setup` function basically execute all previous functions:

```javascript
async function setup() {
    logger.info(' ⇒ SETUP: INITIATED');

    try {
        const exists = await instanceExists();
        if(exists){
            logger.info(' ⇐ SETUP: DONE');
            logger.info(`LOGIN AT http://${config.couchbase.host}:${config.couchbase.port} TO SEE COUCHBASE WEB UI CONSOLE`);
            return;
        }
        await provisionServices();
        await provisionMemory();
        await provisionAdmin();
        await provisionBucket();
    } catch(error) {
        logger.info(' ⇐ SETUP: FAILED');

        logger.error('====----===='.red);
        logger.error(`SETUP ERROR: ${error}`.red);
        logger.error('PLEASE CHECK config.js IS POINTING TO A VALID COUCHBASE INSTANCE'.red);
        logger.error('====----===='.red);
        process.exit(9);
    }

    logger.info(' ⇐ SETUP: DONE');
    logger.info(`LOGIN AT http://${config.couchbase.host}:${config.couchbase.port}`);
}
```

Now when we created the setup script we can execute this script and configure Couchbase Server with just one simple command:

```bash
npm run setup
```

##Conclusion

With `setup` script you can now easily configure your Couchbase Server so you do not need to go through manual steps each time you want to create new Couchbase Server. The script can be extended and you can add more features e.g. setup indexes. 

Full project you can be found on the [GitHub](https://github.com/martinmicunda/employee-scheduling-api).
