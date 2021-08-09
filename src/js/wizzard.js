window.addEventListener("load", windowLoadHandler, false);
let sphereRad = 1080; // радиус
let scale = 1.5; // масштаб
function windowLoadHandler() {
    canvasApp();
}
function canvasApp() {
    let theCanvas = document.getElementById("sphere");
    let sphere_wrap = document.getElementById("sphere-wrap");
    let context = theCanvas.getContext("2d");
    let displayWidth;
    let displayHeight;
    let timer;
    let wait;
    let count;
    let numToAddEachFrame;
    let particleList;
    let recycleBin;
    let particleAlpha;
    let fLen;
    let m;
    let projCenterX;
    let projCenterY;
    let zMax;
    let turnAngle;
    let turnSpeed;
    let sphereCenterX, sphereCenterY, sphereCenterZ;
    let particleRad;
    let zeroAlphaDepth;
    let randAccelX, randAccelY, randAccelZ;
    let gravity;
    let rgbString;
    let p;
    let outsideTest;
    let nextParticle;
    let sinAngle;
    let cosAngle;
    let rotX, rotZ;
    let depthAlphaFactor;
    let i;
    let theta, phi;
    let x0, y0, z0;    
    init();
    window.addEventListener('resize', init, false);
    function init() {
        wait = 1;
        count = wait - 1;
        numToAddEachFrame = 8;
        rgbString = "rgba(169,195,238,0.1)"; // цвет частиц
        particleAlpha = 1;        
        displayWidth = theCanvas.width = sphere_wrap.offsetWidth;
        displayHeight = theCanvas.height = sphere_wrap.offsetHeight;    
        fLen = 320;
        projCenterX = displayWidth/3; // центр сферы по оси X
        projCenterY = displayHeight/2; // центр сферы по оси Y
        zMax = fLen-2;
        particleList = {};
        recycleBin = {};
        randAccelX = 0.1;
        randAccelY = 0.1;
        randAccelZ = 0.1;
        gravity = -0;
        particleRad = 2.4; // размер частиц
        sphereCenterX = 0;
        sphereCenterY = 0;
        sphereCenterZ = -3 - sphereRad;
        zeroAlphaDepth = -750; 
        turnSpeed = 2*Math.PI/8000; // скорость вращения сферы
        turnAngle = 0; 
        timer = setInterval(onTimer, 10/24);
    }
    function onTimer() {    
        count++;
        if (count >= wait) {        
            count = 0;
            for (i = 0; i < numToAddEachFrame; i++) {
                theta = Math.random()*2*Math.PI;
                phi = Math.acos(Math.random()*2-1);
                x0 = sphereRad*Math.sin(phi)*Math.cos(theta);
                y0 = sphereRad*Math.sin(phi)*Math.sin(theta);
                z0 = sphereRad*Math.cos(phi);
                let p = addParticle(x0, sphereCenterY + y0, sphereCenterZ + z0, 0.002*x0, 0.002*y0, 0.002*z0);
                p.attack = 50;
                p.hold = 50;
                p.decay = 100;
                p.initValue = 0;
                p.holdValue = particleAlpha;
                p.lastValue = 0;
                p.stuckTime = 90 + Math.random()*20;
                p.accelX = 0;
                p.accelY = gravity;
                p.accelZ = 0;
            }
        }
        turnAngle = (turnAngle + turnSpeed) % (2*Math.PI);
        sinAngle = Math.sin(turnAngle);
        cosAngle = Math.cos(turnAngle);
        context.clearRect(0, 0, displayWidth, displayHeight);
        p = particleList.first;
        while (p != null) {
            nextParticle = p.next;
            p.age++;
            if (p.age > p.stuckTime) {    
                p.velX += p.accelX + randAccelX*(Math.random()*2 - 1);
                p.velY += p.accelY + randAccelY*(Math.random()*2 - 1);
                p.velZ += p.accelZ + randAccelZ*(Math.random()*2 - 1);
                p.x += p.velX;
                p.y += p.velY;
                p.z += p.velZ;
            }
            rotX =  cosAngle*p.x + sinAngle*(p.z - sphereCenterZ);
            rotZ =  -sinAngle*p.x + cosAngle*(p.z - sphereCenterZ) + sphereCenterZ;
            m = scale * fLen/(fLen - rotZ);
            p.projX = rotX*m + projCenterX;
            p.projY = p.y*m + projCenterY;
            if (p.age < p.attack+p.hold+p.decay) {
                if (p.age < p.attack) {
                    p.alpha = (p.holdValue - p.initValue)/p.attack*p.age + p.initValue;
                    } else if (p.age < p.attack+p.hold) {
                    p.alpha = p.holdValue;
                    } else if (p.age < p.attack+p.hold+p.decay) {
                    p.alpha = (p.lastValue - p.holdValue)/p.decay*(p.age-p.attack-p.hold) + p.holdValue;
                }
                } else {
                p.dead = true;
            }
            if ((p.projX > displayWidth)||(p.projX<0)||(p.projY<0)||(p.projY>displayHeight)||(rotZ>zMax)) {
                outsideTest = true;
                } else {
                outsideTest = false;
            }
            
            if (outsideTest||p.dead) {
                recycle(p);
                } else {
                depthAlphaFactor = (1-rotZ/zeroAlphaDepth);
                depthAlphaFactor = (depthAlphaFactor > 1) ? 1 : ((depthAlphaFactor<0) ? 0 : depthAlphaFactor);
                context.fillStyle = rgbString + depthAlphaFactor*p.alpha + ")";
                context.beginPath();
                context.arc(p.projX, p.projY, m*particleRad, 0, 2*Math.PI, false);
                context.closePath();
                context.fill();
            }
            p = nextParticle;
        }
    }
    function addParticle(x0,y0,z0,vx0,vy0,vz0) {
        let newParticle;
        let color;
        if (recycleBin.first != null) {
            newParticle = recycleBin.first;
            if (newParticle.next != null) {
                recycleBin.first = newParticle.next;
                newParticle.next.prev = null;
                } else {
                recycleBin.first = null;
            }
            } else {
            newParticle = {};
        }
        if (particleList.first == null) {
            particleList.first = newParticle;
            newParticle.prev = null;
            newParticle.next = null;
            } else {
            newParticle.next = particleList.first;
            particleList.first.prev = newParticle;
            particleList.first = newParticle;
            newParticle.prev = null;
        }
        newParticle.x = x0;
        newParticle.y = y0;
        newParticle.z = z0;
        newParticle.velX = vx0;
        newParticle.velY = vy0;
        newParticle.velZ = vz0;
        newParticle.age = 0;
        newParticle.dead = false;
        if (Math.random() < 0.5) {
            newParticle.right = true;
            } else {
            newParticle.right = false;
        }
        return newParticle;        
    }
    function recycle(p) {
        if (particleList.first == p) {
            if (p.next != null) {
                p.next.prev = null;
                particleList.first = p.next;
                } else {
                particleList.first = null;
            }
            } else {
            if (p.next == null) {
                p.prev.next = null;
                } else {
                p.prev.next = p.next;
                p.next.prev = p.prev;
            }
        }
        if (recycleBin.first == null) {
            recycleBin.first = p;
            p.prev = null;
            p.next = null;
            } else {
            p.next = recycleBin.first;
            recycleBin.first.prev = p;
            recycleBin.first = p;
            p.prev = null;
        }
    }    
}