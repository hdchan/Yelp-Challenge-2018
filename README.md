## Getting Started
These instructions will get allow you to stand-up the project as a docker container in a Linux,
Mac or Windows environment.

## Pre-requisites
- Docker (18.09) - https://docs.docker.com/install/
- Docker Compose (1.8.0)- https://docs.docker.com/compose/install/

**NOTE:**  This should work with earlier versions of both Docker and Docker Compose.  For Windows it's
preferred that newer versions are used (not the legacy docker toolbox) due to important changes in Window's networking for containers.

## Installing and Running
These sections have been combined,  because this is handled by a single bash script, launch-app.sh.
Ensure that these operations are performed within the directory, webapp/.  You'll also need to ensure
that the user executing this script (for any given OS) has proper permission to use Docker and Docker Compose.

#####1. Ensure that script has proper permissions to run:

Linux or Mac:
```
chmod u+x launch-app.sh
```

Windows:
```
N/A
```
#####2. Execute launch-app.sh to build the container and run it.  

Linux or Mac:
```
./launch-app.sh
```

Windows:
```
launch-app.bat

```

**NOTE:** This build and execution will output a bit of context as it runs through the steps.
The example log below outlines some of the output from docker that shows that the app is
running.
```
Creating webapp_web_1 ... done
Attaching to webapp_web_1
web_1  |
web_1  | > webapp@1.0.0 start /usr/app
web_1  | > node app.js
web_1  |
web_1  | Running at Port 8080
web_1  | http://localhost:8080
web_1  | NOTE: To properly shut down the server, please use ctrl+C.
web_1  | Otherwise you'll need to manually kill the process using port 8080.
web_1  | Enjoy!
```

#####3. Access the web app
Open your browser and navigate to [http://localhost:8080](http://localhost:8080/). This web application
 has been optimized to run on [Chrome](https://www.google.com/chrome/) and [Firefox](https://www.mozilla.org/en-US/firefox/).

**NOTE:**   
With older versions of Docker and Docker Compose on Windows, there's a known issue/limitation where 
localhost/127.0.0.1 is inaccessible.  This is due to how Windows networked it's containers, see this
[Issue on Docker's Github](https://github.com/docker/for-win/issues/204) for more information and ways to 
workaround.

.