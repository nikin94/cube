'use strict';
var Cube = new Object();
Cube.camera, Cube.scene, Cube.render,Cube.container;
Cube.W, Cube.H;

var white = 0xE5E5E5,
    yellow = 0xFFFF00,
    red = 0xFF0000,
    orange = 0xFFA500,
    blue = 0x0000FF,
    green = 0x008000,
    black = 0x000000;

//делальность триангуляции сторон кубиков: Значение "1" - 1 треугольник, "2" - 2 треугольника на стороне относительно оси и т.д.
Cube.geomX = 1;
Cube.geomY = 1;
Cube.geomZ = 1;

////
//В общем - строится n-ное количество кубов, относительно центра, из которых собирается большой кубик рубика. Хранятся они в трехмерном массиве
//Некоторые комментарии на английском - писались во время написания диплома
////

Cube.SUBCUBE_SIZE = 300; //размер одного маленького кубика
Cube.SUBCUBE_DISTANCE_INDEX = 1.1; // отступ между маленькими кубами
Cube.ROTATION_STEP = 100;
Cube.CUBE_DIMENSION = 13; ////////////////////////////////----------//////////////////////////////////////// Размерность нашего кубика

/* текстурки, отложенные в долгий ящик
var paper_white = new THREE.TextureLoader().load( 'paper_white.jpg');
var paper_yellow = new THREE.TextureLoader().load( 'paper_yellow.jpg');
var paper_red = new THREE.TextureLoader().load( 'paper_red.jpg');
var paper_orange = new THREE.TextureLoader().load( 'paper_orange.jpg');
var paper_green = new THREE.TextureLoader().load( 'paper_green.jpg');
var paper_blue = new THREE.TextureLoader().load( 'paper_blue.jpg');
 */


Cube.Side = function(faces, sideName) {//устанавливаем цвета на грани
    this.faces = faces || [];
    this.sideName = sideName;
    switch(sideName){
        case "right":
            this.color = red;
            break;
        case "left":
            this.color = orange;
            break;
        case "up":
            this.color = white;
            break;
        case "down":
            this.color = yellow;
            break;
        case "front":
            this.color = green;
            break;
        case "back":
            this.color = blue;
            break;
    }
}

Cube.Side.prototype.IsFaceOnSide = function (face){
    for(var i in this.faces){
        if(this.faces[i] == face) return true;
    }
    return false;
};

//собираем цвета. Фигуры в three.js триангулированы и у каждого треугольника свой порядковый номер. Формула определяем, с какого номера начинать "красить"
Cube.right = new Cube.Side([Cube.geomX * 0, Cube.geomX * 2 - 1], "right");//0,1
Cube.left = new Cube.Side([Cube.geomX * 2, Cube.geomX * 4 - 1], "left");//2,3

Cube.up = new Cube.Side([Cube.geomX * 4 + Cube.geomY * 0, Cube.geomX * 4 + Cube.geomY * 2 - 1], "up");
Cube.down = new Cube.Side([Cube.geomX * 4 + Cube.geomY * 2, Cube.geomX * 4 + Cube.geomY * 4 - 1], "down");

Cube.front = new Cube.Side([Cube.geomX * 4 + Cube.geomY * 4 + Cube.geomZ * 0, Cube.geomX * 4 + Cube.geomY * 4 + Cube.geomZ * 2 - 1], "front");
Cube.back = new Cube.Side([Cube.geomX * 4 + Cube.geomY * 4 + Cube.geomZ * 2, Cube.geomX * 4 + Cube.geomY * 4 + Cube.geomZ * 4 - 1], "back");

Cube.cubeFaces = [Cube.right, Cube.left, Cube.up, Cube.down, Cube.front, Cube.back];

Cube.cubePieces = [];
Cube.cubeOneDimention = [];


Cube.sizeShift = ~~(Cube.CUBE_DIMENSION / 2); //целое от деления размерности пополам
Cube.centerShift = Cube.CUBE_DIMENSION % 2 == 0 ? 0.5 : 0; //смещение центра относительно нуля координат. Нужно для четных и нечетных кубов - Нечетные строятся с центром в среднем кубике, четные - центральные кубики лежат на оси гранями

Cube.AXIS_X = new THREE.Vector3(1, 0, 0);//оси кординат
Cube.AXIS_Y = new THREE.Vector3(0, 1, 0);
Cube.AXIS_Z = new THREE.Vector3(0, 0, 1);

Cube.W = window.innerWidth - 40; //hardcode - disable scrollbars TODO fix tomorow...
Cube.H = window.innerHeight - 40;//убирает полосы прокрутки. Комментарий выше написан очень давно =)

Cube.container = document.createElement('div');//собираем контейнер, в котором всё будет происходить.
document.body.appendChild(Cube.container);

Cube.cameraMaxLength = Cube.CUBE_DIMENSION * 5000 + 3000;//расстояние камеры до куба. Зависит от размерности
Cube.camera = new THREE.PerspectiveCamera(60, Cube.W / Cube.H, 1, Cube.cameraMaxLength);
Cube.camera.position.x = 0;
Cube.camera.position.y = 0;
Cube.camera.position.z = Cube.CUBE_DIMENSION * 500 + 1000;
Cube.scene = new THREE.Scene();

//scene.add(new THREE.AxisHelper(CUBE_DIMENSION * 300)); // X - red. Y green. Z  blue. ---- визуально отображаемые оси на сцене. Помогало при написании

Cube.light1 = new THREE.PointLight();//освещение
Cube.light2 = new THREE.PointLight();
Cube.a = Cube.CUBE_DIMENSION * 5000;
Cube.light1.position.set(Cube.a, Cube.a, Cube.a);
Cube.light2.position.set(-Cube.a, -Cube.a, -Cube.a);
Cube.light1.intensity = 1.7;
Cube.light2.intensity = 1.7;
Cube.scene.add(Cube.light1);
Cube.scene.add(Cube.light2);

Cube.render = new THREE.WebGLRenderer();//рендеринг
Cube.render.setSize(Cube.W, Cube.H);
Cube.container.appendChild(Cube.render.domElement);
// render.setClearColor(0xffffff,1);

//в three.js порядок построения 3d графики таков - сцена, камера, построение геометрии, на нее кладется текстура, рендерится

Cube.modifiedCubeGeometry = function(vector) {//creating subCube geometry and painting
    var geom = new THREE.CubeGeometry(this.SUBCUBE_SIZE, this.SUBCUBE_SIZE, this.SUBCUBE_SIZE, this.geomX, this.geomY, this.geomZ);
    var colorShift = this.CUBE_DIMENSION % 2 == 0 ? 1 : 0;
    if (vector.x == this.sizeShift - colorShift) {
        for (var i = this.right.faces[0]; i <= this.right.faces[1]; i++) {
            geom.faces[i].color.setHex(this.right.color);
        }
    } else if (vector.x == -this.sizeShift) {
        for (var i = this.left.faces[0]; i <= this.left.faces[1]; i++) {
            geom.faces[i].color.setHex(this.left.color);
        }
    }

    if (vector.y == this.sizeShift - colorShift) {
        for (var i = this.up.faces[0]; i <= this.up.faces[1]; i++) {
            geom.faces[i].color.setHex(this.up.color);
        }
    } else if (vector.y == -this.sizeShift) {
        for (var i = this.down.faces[0]; i <= this.down.faces[1]; i++) {
            geom.faces[i].color.setHex(this.down.color);
        }
    }

    if (vector.z == this.sizeShift - colorShift) {
        for (var i = this.front.faces[0]; i <= this.front.faces[1]; i++) {
            geom.faces[i].color.setHex(this.front.color);
        }
    } else if (vector.z == -this.sizeShift) {
        for (var i = this.back.faces[0]; i <= this.back.faces[1]; i++) {
            geom.faces[i].color.setHex(this.back.color);
        }
    }

    return geom;
}

//adding subCube on scene by vector coordinates
Cube.addSubCube = function(vector) {
    var subCubeGeom = this.modifiedCubeGeometry(vector);
    var subCube = new THREE.Mesh(subCubeGeom, this.material);

    //calculating real coordinates by indexes in array
    subCube.position.set(
        this.SUBCUBE_SIZE * (vector.x + this.centerShift) * this.SUBCUBE_DISTANCE_INDEX, //x
        this.SUBCUBE_SIZE * (vector.y + this.centerShift) * this.SUBCUBE_DISTANCE_INDEX, //y
        this.SUBCUBE_SIZE * (vector.z + this.centerShift) * this.SUBCUBE_DISTANCE_INDEX //z
    );
    this.scene.add(subCube);//добавляем на сцену
    return subCube;
}



//var material = new THREE.MeshLambertMaterial( { map: paper_red, overdraw: 0.5} );
Cube.material = new THREE.MeshPhongMaterial({//накладываем материал
        vertexColors : THREE.FaceColors
    });
Cube.material.ambient = Cube.material.color;

//creating array with subCubes without middle part of mainCube

Cube.cubePiecesTemp = [];
for (var x = 0; x < Cube.CUBE_DIMENSION; x++) {
    Cube.cubePieces[x] = [];
    for (var y = 0; y < Cube.CUBE_DIMENSION; y++) {
        Cube.cubePieces[x][y] = [];
        for (var z = 0; z < Cube.CUBE_DIMENSION; z++) {
            var vector = new THREE.Vector3(x - Cube.sizeShift, y - Cube.sizeShift, z - Cube.sizeShift);
            Cube.cubePieces[x][y].push(Cube.addSubCube(vector));
            if (!(x == 0 || y == 0 || z == 0 || x == Cube.CUBE_DIMENSION - 1 || y == Cube.CUBE_DIMENSION - 1 || z == Cube.CUBE_DIMENSION - 1)) {
                Cube.cubePieces[x][y][z].visible = false;//тут проблемка. Центральные кубики невидимы, но они есть и это потребяет ресурсы. Если их не строить - при перетасовке элементов в массиве undefined'ы все портят и куб криво перемешивается.
            }
        }
    }
}

Cube.getRotatedIndex = function(x, y, clockWise = true) {//функция для изменения индексов т.е. поворота, по часовой - по-умолчанию. В картинках есть визуализация
    var indexes = {};
    if (clockWise) {
        indexes = {
            y : x,
            x : (this.CUBE_DIMENSION - y - 1)
        };
    } else {
        indexes = {
            y : (this.CUBE_DIMENSION - x - 1),
            x : y
        };
    }
    return indexes;
}

Cube.Attach = function(child, Parent) {//две функции, упрощающие написание метода для сборки элементов для поворота в группу и дальнейшей разборки. С группировкой возился больше всего - косяки и недостаток возможностей самого three.js
    return THREE.SceneUtils.attach(child, Cube.scene, Parent);
}

Cube.Detach = function(child, Parent) {
    return THREE.SceneUtils.detach(child, Parent, Cube.scene);
}

///////попытки использовать иной способ группировки элементов на сцене для поворота

// function rotateAnimate(group){
    //var tween = new TWEEN.Tween( group.rotation ).to( {  x: group.rotation.x + Math.PI / 2}, 1000 ).easing( TWEEN.Easing.Quadratic.InOut);
    // tween.onComplete(
        // function() {
            // group.updateMatrixWorld();
            // while (group.children.length) {
                // Detach(group.children[0], group);
            // }
            // scene.remove(group);

        // }
    // );
    // tween.start();
// }

Cube.rotateLayer = function (axis, layerNum, clockWise = true) {//поворот слоя - ось, номер слоя, направление
    var rotateGroup = new THREE.Object3D();
    var rotateAngle = Math.PI / 2;

    if (axis == 0) {// 0 - это ось x, 1-y, 2-z
        for (var i = 0; i < this.CUBE_DIMENSION; i++) {
            for (var j = 0; j < this.CUBE_DIMENSION; j++) {
                if (this.cubePieces[layerNum][i][j]) {
                    Attach(this.cubePieces[layerNum][i][j], rotateGroup); //собираем один слой в группу для вращения
                }
            }
        }

        /////еще одна незавершенная функция
    // var step = function(){   //обработка плавности проворота TODO
        // setTimeout(step, 100);
        //...действие...
    // }
    // step();

        if(clockWise){
            rotateGroup.rotation.x += rotateAngle;
        }else{
            rotateGroup.rotation.x -= rotateAngle;
        }
        rotateGroup.updateMatrixWorld();
        while (rotateGroup.children.length) {
            Detach(rotateGroup.children[0], rotateGroup);
        }

        for (var i = 0; i < this.CUBE_DIMENSION; i++) {
            for (var j = 0; j < this.CUBE_DIMENSION; j++) {
                if (this.cubePieces[layerNum][i][j]) {
                    if (i <= j && (j < this.CUBE_DIMENSION - 1 - i || i == j && i <= this.CUBE_DIMENSION / 2) && this.CUBE_DIMENSION % 2 != 0) {//исключаем "повторяющиеся куски". На каждой грани есть уникальные части - в картинках есть пояснение
                        var t1 = this.getRotatedIndex(i, j);
                        var t2 = this.getRotatedIndex(t1.x, t1.y);
                        var t3 = this.getRotatedIndex(t2.x, t2.y);
                        var tmp = this.cubePieces[layerNum][i][j];
                        if(clockWise){
                            this.cubePieces[layerNum][i][j] = this.cubePieces[layerNum][t3.x][t3.y];//выглядит нагроможденно. Изменение индексов в трехмерном массиве по кругу. 4 элемента + temp
                            this.cubePieces[layerNum][t3.x][t3.y] = this.cubePieces[layerNum][t2.x][t2.y];
                            this.cubePieces[layerNum][t2.x][t2.y] = this.cubePieces[layerNum][t1.x][t1.y];
                            this.cubePieces[layerNum][t1.x][t1.y] = tmp;
                            // cubePieces[layerNum][i][j] = cubePieces[layerNum][t1.x][t1.y];
                            // cubePieces[layerNum][t1.x][t1.y] = cubePieces[layerNum][t2.x][t2.y];
                            // cubePieces[layerNum][t2.x][t2.y] = cubePieces[layerNum][t3.x][t3.y];
                            // cubePieces[layerNum][t3.x][t3.y] = tmp;
                        }else{
                            this.cubePieces[layerNum][i][j] = this.cubePieces[layerNum][t1.x][t1.y];
                            this.cubePieces[layerNum][t1.x][t1.y] = this.cubePieces[layerNum][t2.x][t2.y];
                            this.cubePieces[layerNum][t2.x][t2.y] = this.cubePieces[layerNum][t3.x][t3.y];
                            this.cubePieces[layerNum][t3.x][t3.y] = tmp;
                            // cubePieces[layerNum][i][j] = cubePieces[layerNum][t3.x][t3.y];
                            // cubePieces[layerNum][t3.x][t3.y] = cubePieces[layerNum][t2.x][t2.y];
                            // cubePieces[layerNum][t2.x][t2.y] = cubePieces[layerNum][t1.x][t1.y];
                            // cubePieces[layerNum][t1.x][t1.y] = tmp;
                        }
                    }
                }
            }
        }
    }

    if (axis == 1) {
        for (var i = 0; i < this.CUBE_DIMENSION; i++) {
            for (var j = 0; j < this.CUBE_DIMENSION; j++) {
                if (this.cubePieces[i][layerNum][j]) {
                    Attach(Cube.cubePieces[i][layerNum][j], rotateGroup);
                }
            }
        }
        if(clockWise){
            rotateGroup.rotation.y += rotateAngle;
        }else{
            rotateGroup.rotation.y -= rotateAngle;
        }
        rotateGroup.updateMatrixWorld();
        while (rotateGroup.children.length) {
            Detach(rotateGroup.children[0], rotateGroup);
        }

        for (var i = 0; i < this.CUBE_DIMENSION; i++) {
            for (var j = 0; j < this.CUBE_DIMENSION; j++) {
                if (this.cubePieces[i][layerNum][j]) {
                    if (i <= j && (j < this.CUBE_DIMENSION - 1 - i || i == j && i <= this.CUBE_DIMENSION / 2) && this.CUBE_DIMENSION % 2 != 0) {
                        var t1 = this.getRotatedIndex(i, j);
                        var t2 = this.getRotatedIndex(t1.x, t1.y);
                        var t3 = this.getRotatedIndex(t2.x, t2.y);
                        var tmp = this.cubePieces[i][layerNum][j];
                        if(clockWise){
                            this.cubePieces[i][layerNum][j] = this.cubePieces[t1.x][layerNum][t1.y];
                            this.cubePieces[t1.x][layerNum][t1.y] = this.cubePieces[t2.x][layerNum][t2.y];
                            this.cubePieces[t2.x][layerNum][t2.y] = this.cubePieces[t3.x][layerNum][t3.y];
                            this.cubePieces[t3.x][layerNum][t3.y] = tmp;
                            // cubePieces[i][layerNum][j] = cubePieces[t3.x][layerNum][t3.y];
                            // cubePieces[t3.x][layerNum][t3.y] = cubePieces[t2.x][layerNum][t2.y];
                            // cubePieces[t2.x][layerNum][t2.y] = cubePieces[t1.x][layerNum][t1.y];
                            // cubePieces[t1.x][layerNum][t1.y] = tmp;
                        }else{
                            this.cubePieces[i][layerNum][j] = this.cubePieces[t3.x][layerNum][t3.y];
                            this.cubePieces[t3.x][layerNum][t3.y] = this.cubePieces[t2.x][layerNum][t2.y];
                            this.cubePieces[t2.x][layerNum][t2.y] = this.cubePieces[t1.x][layerNum][t1.y];
                            this.cubePieces[t1.x][layerNum][t1.y] = tmp;
                            // cubePieces[i][layerNum][j] = cubePieces[t1.x][layerNum][t1.y];
                            // cubePieces[t1.x][layerNum][t1.y] = cubePieces[t2.x][layerNum][t2.y];
                            // cubePieces[t2.x][layerNum][t2.y] = cubePieces[t3.x][layerNum][t3.y];
                            // cubePieces[t3.x][layerNum][t3.y] = tmp;
                        }
                    }
                }
            }
        }
    }
    if (axis == 2) {
        for (var i = 0; i < this.CUBE_DIMENSION; i++) {
            for (var j = 0; j < this.CUBE_DIMENSION; j++) {
                if (this.cubePieces[i][j][layerNum]) {
                    Attach(Cube.cubePieces[i][j][layerNum], rotateGroup);
                }
            }
        }
        if(clockWise){
            rotateGroup.rotation.z += rotateAngle;
        }else{
            rotateGroup.rotation.z -= rotateAngle;
        }
        rotateGroup.updateMatrixWorld();
        while (rotateGroup.children.length) {
            Detach(rotateGroup.children[0], rotateGroup);
        }

        for (var i = 0; i < this.CUBE_DIMENSION; i++) {
            for (var j = 0; j < this.CUBE_DIMENSION; j++) {
                if (this.cubePieces[i][j][layerNum]) {
                    if (i <= j && (j < this.CUBE_DIMENSION - 1 - i || i == j && i <= this.CUBE_DIMENSION / 2) && this.CUBE_DIMENSION % 2 != 0) {
                        var t1 = this.getRotatedIndex(i, j);
                        var t2 = this.getRotatedIndex(t1.x, t1.y);
                        var t3 = this.getRotatedIndex(t2.x, t2.y);
                        var tmp = this.cubePieces[i][j][layerNum];
                        if(clockWise){
                            this.cubePieces[i][j][layerNum] = this.cubePieces[t3.x][t3.y][layerNum];
                            this.cubePieces[t3.x][t3.y][layerNum] = this.cubePieces[t2.x][t2.y][layerNum];
                            this.cubePieces[t2.x][t2.y][layerNum] = this.cubePieces[t1.x][t1.y][layerNum];
                            this.cubePieces[t1.x][t1.y][layerNum] = tmp;
                            // cubePieces[i][j][layerNum] = cubePieces[t1.x][t1.y][layerNum];
                            // cubePieces[t1.x][t1.y][layerNum] = cubePieces[t2.x][t2.y][layerNum];
                            // cubePieces[t2.x][t2.y][layerNum] = cubePieces[t3.x][t3.y][layerNum];
                            // cubePieces[t3.x][t3.y][layerNum] = tmp;
                        }else{
                            this.cubePieces[i][j][layerNum] = this.cubePieces[t1.x][t1.y][layerNum];
                            this.cubePieces[t1.x][t1.y][layerNum] = this.cubePieces[t2.x][t2.y][layerNum];
                            this.cubePieces[t2.x][t2.y][layerNum] = this.cubePieces[t3.x][t3.y][layerNum];
                            this.cubePieces[t3.x][t3.y][layerNum] = tmp;
                            // cubePieces[i][j][layerNum] = cubePieces[t3.x][t3.y][layerNum];
                            // cubePieces[t3.x][t3.y][layerNum] = cubePieces[t2.x][t2.y][layerNum];
                            // cubePieces[t2.x][t2.y][layerNum] = cubePieces[t1.x][t1.y][layerNum];
                            // cubePieces[t1.x][t1.y][layerNum] = tmp;
                        }
                    }
                }
            }
        }
    }
};

Cube.cubeScramble = function() {//Месим кубик
    for (var i = 0; i < Math.pow(this.CUBE_DIMENSION, 3); i++) {
        var rand = Math.floor(Math.random() * 2);
        var a = Math.floor(Math.random() * 3);
        var b = Math.floor(Math.random() * this.CUBE_DIMENSION);
        rotateLayer(a, b/*, rand*/);
    }
}

///////////////////////////////////////////////////////////////////////

Cube.mouseDown = false;
Cube.cathetus = (Cube.CUBE_DIMENSION + 2) / 2 * Cube.SUBCUBE_SIZE;
Cube.hypotenuse = Math.sqrt(2 * Cube.cathetus * Cube.cathetus);






///////////////////////////////////////////////////////////////////////

document.addEventListener('mousedown', Cube.onMouseDown);
document.addEventListener('mouseup', Cube.onMouseUp);
document.addEventListener('mousemove', Cube.onMouseMove, false );
//document.addEventListener('mouseover', onMouseOver);

Cube.xIndex;
Cube.yIndex;
Cube.zIndex;
Cube.raycaster = new THREE.Raycaster();//луч, исходящий из камеры и проходящий через указатель. Нужно для определения нажатого элемента
Cube.raycaster.linePrecision = 0.1;
Cube.mouse = new THREE.Vector2();
Cube.mouseOverStart = new THREE.Vector2();
Cube.mouseOverEnd = new THREE.Vector2();
Cube.isMouseDown = false;
Cube.intersectedElem;

Cube.onMouseDown = function(event) {//ищем выбранный кусок
    if(event.ctrlKey) return;
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    this.mouseOverStart.x = event.clientX;
    this.mouseOverStart.y = event.clientY;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.isMouseDown = true;
    var intersects = this.raycaster.intersectObjects(this.scene.children);//пересечения с лучом
    if(intersects[0]){
        this.intersectedElem = intersects[0];
        // intersects[0].object.position.x += 300 ;
        // SUBCUBE_SIZE * (vector.x + centerShift) * SUBCUBE_DISTANCE_INDEX,
        this.xIndex = Math.round((intersects[0].object.position.x+this.centerShift)/(this.SUBCUBE_SIZE*this.SUBCUBE_DISTANCE_INDEX) + this.sizeShift);
        this.yIndex = Math.round((intersects[0].object.position.y+this.centerShift)/(this.SUBCUBE_SIZE*this.SUBCUBE_DISTANCE_INDEX) + this.sizeShift);
        this.zIndex = Math.round((intersects[0].object.position.z+this.centerShift)/(this.SUBCUBE_SIZE*this.SUBCUBE_DISTANCE_INDEX) + this.sizeShift);
        console.log(this.xIndex,this.yIndex,this.zIndex);
        console.log(intersects[0].faceIndex);
    }
    console.log(this.camera.position.x,this.camera.position.y,this.camera.position.z);
}

Cube.onMouseUp = function ( event ) {
    if(event.ctrlKey) return;
    this.intersectedElem = null;
    this.isMouseDown = false;
}

Cube.onMouseMove = function( event ) {//поворот грани при зажатой LMB относительно того, куда повели указатель
    if(event.ctrlKey) return;
    event.preventDefault();
    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    this.mouseOverEnd.x = event.clientX;
    this.mouseOverEnd.y = event.clientY;

    if(this.isMouseDown && this.intersectedElem &&
                (this.mouseOverEnd.x - this.mouseOverStart.x < -this.ROTATION_STEP || this.mouseOverEnd.y - this.mouseOverStart.y < -this.ROTATION_STEP ||
                this.mouseOverEnd.x - this.mouseOverStart.x > this.ROTATION_STEP || this.mouseOverEnd.y - this.mouseOverStart.y > this.ROTATION_STEP)) {
        this.isMouseDown = false;
        //axis, layerNum, clockWise
       var side;
       for(var i in this.cubeFaces){
           if(this.cubeFaces[i].IsFaceOnSide(this.intersectedElem.faceIndex)){
               side = this.cubeFaces[i];
               break;
           }

       }
       console.log(side.sideName);

       if(this.mouseOverEnd.x - this.mouseOverStart.x < -this.ROTATION_STEP){
            rotateLayer(1,this.yIndex,false);
        }else if(this.mouseOverEnd.x - this.mouseOverStart.x > this.ROTATION_STEP){
            rotateLayer(1,yIndex,true);
        }else if(this.mouseOverEnd.y - this.mouseOverStart.y < -this.ROTATION_STEP){
            rotateLayer(0,this.xIndex,false);
        }else if(this.mouseOverEnd.y - this.mouseOverStart.y > this.ROTATION_STEP){
            rotateLayer(0,this.xIndex,true);
        }


        /*if(front.IsFaceOnSide(intersectedElem.faceIndex)){
            if(mouseOverEnd.x - mouseOverStart.x < -ROTATION_STEP){
                rotateLayer(1,yIndex,false);
            }else if(mouseOverEnd.x - mouseOverStart.x > ROTATION_STEP){
                rotateLayer(1,yIndex,true);
            }else if(mouseOverEnd.y - mouseOverStart.y < -ROTATION_STEP){
                rotateLayer(0,xIndex,false);
            }else if(mouseOverEnd.y - mouseOverStart.y > ROTATION_STEP){
                rotateLayer(0,xIndex,true);
            }
        }*/

        //rotateLayer()
    }
}




///////////////////////////////////////////////////////////////////////






Cube.animate = function() {
    requestAnimationFrame(Cube.animate);

    Cube.camera.lookAt(Cube.scene.position);
    Cube.render.render(Cube.scene, Cube.camera);
}

Cube.animate();//стандартная функция, чтобы все двигалось :)

new THREE.OrbitControls(Cube.camera, Cube.render.domElement); // вращение камеры. Тут доже очень долго пытался написать вращения камеры самостоятельно, пока не узнал, что велосипед уже изобрели. Повороты камеры при зажатом CTRL

window.addEventListener('resize', Cube.onWindowResize, false);

Cube.onWindowResize = function() {//меняем размеры окна - меняется сцена

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.render.setSize(window.innerWidth, window.innerHeight);

}
