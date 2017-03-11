var camera, scene, render, container;
var W, H;

var white = 0xE5E5E5;
var yellow = 0xFFFF00;
var red = 0xFF0000;
var orange = 0xFFA500;
var blue = 0x0000FF;
var green = 0x008000;

var pink = 0xFF69B4;
var black = 0x000000;

//делальность триангуляции сторон кубиков: Значение "1" - 1 треугольник, "2" - 2 треугольника на стороне относительно оси и т.д.
var geomX = 1;
var geomY = 1;
var geomZ = 1;

////
//В общем - строится n-ное количество кубов, относительно центра, из которых собирается большой кубик рубика. Хранятся они в трехмерном массиве
//Некоторые комментарии на английском - писались во время написания диплома
////

var SUBCUBE_SIZE = 300; //размер одного маленького кубика
var SUBCUBE_DISTANCE_INDEX = 1.1; // отступ между маленькими кубами
var ROTATION_STEP = 100;

/* текстурки, отложенные в долгий ящик
var paper_white = new THREE.TextureLoader().load( 'paper_white.jpg');
var paper_yellow = new THREE.TextureLoader().load( 'paper_yellow.jpg');
var paper_red = new THREE.TextureLoader().load( 'paper_red.jpg');
var paper_orange = new THREE.TextureLoader().load( 'paper_orange.jpg');
var paper_green = new THREE.TextureLoader().load( 'paper_green.jpg');
var paper_blue = new THREE.TextureLoader().load( 'paper_blue.jpg');
 */

var CUBE_DIMENSION = 13; ////////////////////////////////----------//////////////////////////////////////// Размерность нашего кубика

function Side(faces, sideName) {//устанавливаем цвета на грани
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

Side.prototype.IsFaceOnSide = function (face){
    for(var i in this.faces){
        if(this.faces[i] == face) return true;
    }
    return false;
};

//собираем цвета. Фигуры в three.js триангулированы и у каждого треугольника свой порядковый номер. Формула определяем, с какого номера начинать "красить"
var right = new Side([geomX * 0, geomX * 2 - 1], "right");//0,1
var left = new Side([geomX * 2, geomX * 4 - 1], "left");//2,3

var up = new Side([geomX * 4 + geomY * 0, geomX * 4 + geomY * 2 - 1], "up");
var down = new Side([geomX * 4 + geomY * 2, geomX * 4 + geomY * 4 - 1], "down");

var front = new Side([geomX * 4 + geomY * 4 + geomZ * 0, geomX * 4 + geomY * 4 + geomZ * 2 - 1], "front");
var back = new Side([geomX * 4 + geomY * 4 + geomZ * 2, geomX * 4 + geomY * 4 + geomZ * 4 - 1], "back");

var cubeFaces = [right, left, up, down, front, back];

var cubePieces = [];
var cubeOneDimention = [];


var sizeShift = ~~(CUBE_DIMENSION / 2); //целое от деления размерности пополам
var centerShift = CUBE_DIMENSION % 2 == 0 ? 0.5 : 0; //смещение центра относительно нуля координат. Нужно для четных и нечетных кубов - Нечетные строятся с центром в среднем кубике, четные - центральные кубики лежат на оси гранями

var AXIS_X = new THREE.Vector3(1, 0, 0);//оси кординат
var AXIS_Y = new THREE.Vector3(0, 1, 0);
var AXIS_Z = new THREE.Vector3(0, 0, 1);

W = window.innerWidth - 40; //hardcode - disable scrollbars TODO fix tomorow...
H = window.innerHeight - 40;//убирает полосы прокрутки. Комментарий выше написан очень давно =)

container = document.createElement('div');//собираем контейнер, в котором всё будет происходить.
document.body.appendChild(container);

var cameraMaxLength = CUBE_DIMENSION * 5000 + 3000;//расстояние камеры до куба. Зависит от размерности
camera = new THREE.PerspectiveCamera(60, W / H, 1, cameraMaxLength);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = CUBE_DIMENSION * 500 + 1000;
scene = new THREE.Scene();

//scene.add(new THREE.AxisHelper(CUBE_DIMENSION * 300)); // X - red. Y green. Z  blue. ---- визуально отображаемые оси на сцене. Помогало при написании

var light1 = new THREE.PointLight();//освещение
var light2 = new THREE.PointLight();
var a = CUBE_DIMENSION * 5000;
light1.position.set(a, a, a);
light2.position.set(-a, -a, -a);
light1.intensity = 1.7;
light2.intensity = 1.7;
scene.add(light1);
scene.add(light2);

render = new THREE.WebGLRenderer();//рендеринг
render.setSize(W, H);
container.appendChild(render.domElement);
// render.setClearColor(0xffffff,1);

//в three.js порядок построения 3d графики таков - сцена, камера, построение геометрии, на нее кладется текстура, рендерится

function modifiedCubeGeometry(vector) {//creating subCube geometry and painting
    var geom = new THREE.CubeGeometry(SUBCUBE_SIZE, SUBCUBE_SIZE, SUBCUBE_SIZE, geomX, geomY, geomZ);
    var colorShift = CUBE_DIMENSION % 2 == 0 ? 1 : 0;
    if (vector.x == sizeShift - colorShift) {
        for (var i = right.faces[0]; i <= right.faces[1]; i++) {
            geom.faces[i].color.setHex(right.color);
        }
    } else if (vector.x == -sizeShift) {
        for (var i = left.faces[0]; i <= left.faces[1]; i++) {
            geom.faces[i].color.setHex(left.color);
        }
    }

    if (vector.y == sizeShift - colorShift) {
        for (var i = up.faces[0]; i <= up.faces[1]; i++) {
            geom.faces[i].color.setHex(up.color);
        }
    } else if (vector.y == -sizeShift) {
        for (var i = down.faces[0]; i <= down.faces[1]; i++) {
            geom.faces[i].color.setHex(down.color);
        }
    }

    if (vector.z == sizeShift - colorShift) {
        for (var i = front.faces[0]; i <= front.faces[1]; i++) {
            geom.faces[i].color.setHex(front.color);
        }
    } else if (vector.z == -sizeShift) {
        for (var i = back.faces[0]; i <= back.faces[1]; i++) {
            geom.faces[i].color.setHex(back.color);
        }
    }

    return geom;
}

//adding subCube on scene by vector coordinates
function addSubCube(vector) {
    var subCubeGeom = modifiedCubeGeometry(vector);
    var subCube = new THREE.Mesh(subCubeGeom, material);

    //calculating real coordinates by indexes in array
    subCube.position.set(
        SUBCUBE_SIZE * (vector.x + centerShift) * SUBCUBE_DISTANCE_INDEX, //x
        SUBCUBE_SIZE * (vector.y + centerShift) * SUBCUBE_DISTANCE_INDEX, //y
        SUBCUBE_SIZE * (vector.z + centerShift) * SUBCUBE_DISTANCE_INDEX //z
    );
    scene.add(subCube);//добавляем на сцену
    return subCube;
}



//var material = new THREE.MeshLambertMaterial( { map: paper_red, overdraw: 0.5} );
var material = new THREE.MeshPhongMaterial({//накладываем материал
        vertexColors : THREE.FaceColors
    });
material.ambient = material.color;

//creating array with subCubes without middle part of mainCube

var cubePiecesTemp = [];
for (var x = 0; x < CUBE_DIMENSION; x++) {
    cubePieces[x] = [];
    for (var y = 0; y < CUBE_DIMENSION; y++) {
        cubePieces[x][y] = [];
        for (var z = 0; z < CUBE_DIMENSION; z++) {
            var vector = new THREE.Vector3(x - sizeShift, y - sizeShift, z - sizeShift);
            cubePieces[x][y].push(addSubCube(vector));
            if (!(x == 0 || y == 0 || z == 0 || x == CUBE_DIMENSION - 1 || y == CUBE_DIMENSION - 1 || z == CUBE_DIMENSION - 1)) {
                cubePieces[x][y][z].visible = false;//тут проблемка. Центральные кубики невидимы, но они есть и это потребяет ресурсы. Если их не строить - при перетасовке элементов в массиве undefined'ы все портят и куб криво перемешивается.
            }
        }
    }
}

function getRotatedIndex(x, y, clockWise = true) {//функция для изменения индексов т.е. поворота, по часовой - по-умолчанию. В картинках есть визуализация
    var indexes = {};
    if (clockWise) {
        indexes = {
            y : x,
            x : (CUBE_DIMENSION - y - 1)
        };
    } else {
        indexes = { 
            y : (CUBE_DIMENSION - x - 1),
            x : y
        };
    }
    return indexes;
}

function Attach(child, Parent) {//две функции, упрощающие написание метода для сборки элементов для поворота в группу и дальнейшей разборки. С группировкой возился больше всего - косяки и недостаток возможностей самого three.js
    return THREE.SceneUtils.attach(child, scene, Parent);
}

function Detach(child, Parent) {
    return THREE.SceneUtils.detach(child, Parent, scene);
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

function rotateLayer(axis, layerNum, clockWise = true) {//поворот слоя - ось, номер слоя, направление
    var rotateGroup = new THREE.Object3D();
    var rotateAngle = Math.PI / 2;

    if (axis == 0) {// 0 - это ось x, 1-y, 2-z
        for (var i = 0; i < CUBE_DIMENSION; i++) {
            for (var j = 0; j < CUBE_DIMENSION; j++) {
                if (cubePieces[layerNum][i][j]) {
                    Attach(cubePieces[layerNum][i][j], rotateGroup); //собираем один слой в группу для вращения
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

        for (var i = 0; i < CUBE_DIMENSION; i++) {
            for (var j = 0; j < CUBE_DIMENSION; j++) {
                if (cubePieces[layerNum][i][j]) {
                    if (i <= j && (j < CUBE_DIMENSION - 1 - i || i == j && i <= CUBE_DIMENSION / 2) && CUBE_DIMENSION % 2 != 0) {//исключаем "повторяющиеся куски". На каждой грани есть уникальные части - в картинках есть пояснение
                        var t1 = getRotatedIndex(i, j);
                        var t2 = getRotatedIndex(t1.x, t1.y);
                        var t3 = getRotatedIndex(t2.x, t2.y);
                        var tmp = cubePieces[layerNum][i][j];
                        if(clockWise){
                            cubePieces[layerNum][i][j] = cubePieces[layerNum][t3.x][t3.y];//выглядит нагроможденно. Изменение индексов в трехмерном массиве по кругу. 4 элемента + temp
                            cubePieces[layerNum][t3.x][t3.y] = cubePieces[layerNum][t2.x][t2.y];
                            cubePieces[layerNum][t2.x][t2.y] = cubePieces[layerNum][t1.x][t1.y];
                            cubePieces[layerNum][t1.x][t1.y] = tmp;
                            // cubePieces[layerNum][i][j] = cubePieces[layerNum][t1.x][t1.y];
                            // cubePieces[layerNum][t1.x][t1.y] = cubePieces[layerNum][t2.x][t2.y];
                            // cubePieces[layerNum][t2.x][t2.y] = cubePieces[layerNum][t3.x][t3.y];
                            // cubePieces[layerNum][t3.x][t3.y] = tmp;
                        }else{
                            cubePieces[layerNum][i][j] = cubePieces[layerNum][t1.x][t1.y];
                            cubePieces[layerNum][t1.x][t1.y] = cubePieces[layerNum][t2.x][t2.y];
                            cubePieces[layerNum][t2.x][t2.y] = cubePieces[layerNum][t3.x][t3.y];
                            cubePieces[layerNum][t3.x][t3.y] = tmp;
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
        for (var i = 0; i < CUBE_DIMENSION; i++) {
            for (var j = 0; j < CUBE_DIMENSION; j++) {
                if (cubePieces[i][layerNum][j]) {
                    Attach(cubePieces[i][layerNum][j], rotateGroup);
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

        for (var i = 0; i < CUBE_DIMENSION; i++) {
            for (var j = 0; j < CUBE_DIMENSION; j++) {
                if (cubePieces[i][layerNum][j]) {
                    if (i <= j && (j < CUBE_DIMENSION - 1 - i || i == j && i <= CUBE_DIMENSION / 2) && CUBE_DIMENSION % 2 != 0) {
                        var t1 = getRotatedIndex(i, j);
                        var t2 = getRotatedIndex(t1.x, t1.y);
                        var t3 = getRotatedIndex(t2.x, t2.y);
                        var tmp = cubePieces[i][layerNum][j];
                        if(clockWise){
                            cubePieces[i][layerNum][j] = cubePieces[t1.x][layerNum][t1.y];
                            cubePieces[t1.x][layerNum][t1.y] = cubePieces[t2.x][layerNum][t2.y];
                            cubePieces[t2.x][layerNum][t2.y] = cubePieces[t3.x][layerNum][t3.y];
                            cubePieces[t3.x][layerNum][t3.y] = tmp;
                            // cubePieces[i][layerNum][j] = cubePieces[t3.x][layerNum][t3.y];
                            // cubePieces[t3.x][layerNum][t3.y] = cubePieces[t2.x][layerNum][t2.y];
                            // cubePieces[t2.x][layerNum][t2.y] = cubePieces[t1.x][layerNum][t1.y];
                            // cubePieces[t1.x][layerNum][t1.y] = tmp;
                        }else{
                            cubePieces[i][layerNum][j] = cubePieces[t3.x][layerNum][t3.y];
                            cubePieces[t3.x][layerNum][t3.y] = cubePieces[t2.x][layerNum][t2.y];
                            cubePieces[t2.x][layerNum][t2.y] = cubePieces[t1.x][layerNum][t1.y];
                            cubePieces[t1.x][layerNum][t1.y] = tmp;
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
        for (var i = 0; i < CUBE_DIMENSION; i++) {
            for (var j = 0; j < CUBE_DIMENSION; j++) {
                if (cubePieces[i][j][layerNum]) {
                    Attach(cubePieces[i][j][layerNum], rotateGroup);
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

        for (var i = 0; i < CUBE_DIMENSION; i++) {
            for (var j = 0; j < CUBE_DIMENSION; j++) {
                if (cubePieces[i][j][layerNum]) {
                    if (i <= j && (j < CUBE_DIMENSION - 1 - i || i == j && i <= CUBE_DIMENSION / 2) && CUBE_DIMENSION % 2 != 0) {
                        var t1 = getRotatedIndex(i, j);
                        var t2 = getRotatedIndex(t1.x, t1.y);
                        var t3 = getRotatedIndex(t2.x, t2.y);
                        var tmp = cubePieces[i][j][layerNum];
                        if(clockWise){
                            cubePieces[i][j][layerNum] = cubePieces[t3.x][t3.y][layerNum];
                            cubePieces[t3.x][t3.y][layerNum] = cubePieces[t2.x][t2.y][layerNum];
                            cubePieces[t2.x][t2.y][layerNum] = cubePieces[t1.x][t1.y][layerNum];
                            cubePieces[t1.x][t1.y][layerNum] = tmp;
                            // cubePieces[i][j][layerNum] = cubePieces[t1.x][t1.y][layerNum];
                            // cubePieces[t1.x][t1.y][layerNum] = cubePieces[t2.x][t2.y][layerNum];
                            // cubePieces[t2.x][t2.y][layerNum] = cubePieces[t3.x][t3.y][layerNum];
                            // cubePieces[t3.x][t3.y][layerNum] = tmp;
                        }else{
                            cubePieces[i][j][layerNum] = cubePieces[t1.x][t1.y][layerNum];
                            cubePieces[t1.x][t1.y][layerNum] = cubePieces[t2.x][t2.y][layerNum];
                            cubePieces[t2.x][t2.y][layerNum] = cubePieces[t3.x][t3.y][layerNum];
                            cubePieces[t3.x][t3.y][layerNum] = tmp;
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

function cubeScramble() {//Месим кубик
    for (var i = 0; i < CUBE_DIMENSION * CUBE_DIMENSION * CUBE_DIMENSION; i++) {
        var rand = Math.floor(Math.random() * 2);
        var a = Math.floor(Math.random() * 3);
        var b = Math.floor(Math.random() * CUBE_DIMENSION);
        rotateLayer(a, b/*, rand*/);
    }
}

///////////////////////////////////////////////////////////////////////

var mouseDown = false,
mouseX = 0,
mouseY = 0;
var cathetus = (CUBE_DIMENSION + 2) / 2 * SUBCUBE_SIZE;
var hypotenuse = Math.sqrt(2 * cathetus * cathetus);






///////////////////////////////////////////////////////////////////////

document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mouseup', onMouseUp);
document.addEventListener('mousemove', onMouseMove, false );
//document.addEventListener('mouseover', onMouseOver);

var xIndex, yIndex, zIndex;
var raycaster = new THREE.Raycaster();//луч, исходящий из камеры и проходящий через указатель. Нужно для определения нажатого элемента
raycaster.linePrecision = 0.1;
var mouse = new THREE.Vector2();
var mouseOverStart = new THREE.Vector2();
var mouseOverEnd = new THREE.Vector2();
var isMouseDown = false;
var intersectedElem;

function onMouseDown(event) {//ищем выбранный кусок
    if(event.ctrlKey) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    mouseOverStart.x = event.clientX;
    mouseOverStart.y = event.clientY;
    raycaster.setFromCamera(mouse, camera);
    isMouseDown = true;
    var intersects = raycaster.intersectObjects(scene.children);//пересечения с лучом
    if(intersects[0]){
        intersectedElem = intersects[0];
        // intersects[0].object.position.x += 300 ;
        // SUBCUBE_SIZE * (vector.x + centerShift) * SUBCUBE_DISTANCE_INDEX,
        xIndex = Math.round((intersects[0].object.position.x+centerShift)/(SUBCUBE_SIZE*SUBCUBE_DISTANCE_INDEX) + sizeShift);
        yIndex = Math.round((intersects[0].object.position.y+centerShift)/(SUBCUBE_SIZE*SUBCUBE_DISTANCE_INDEX) + sizeShift);
        zIndex = Math.round((intersects[0].object.position.z+centerShift)/(SUBCUBE_SIZE*SUBCUBE_DISTANCE_INDEX) + sizeShift);
        console.log(xIndex,yIndex,zIndex);
        console.log(intersects[0].faceIndex);
    }
    console.log(camera.position.x,camera.position.y,camera.position.z);
}

function onMouseUp( event ) {
    if(event.ctrlKey) return;
    intersectedElem = null;
    isMouseDown = false;
}

function onMouseMove( event ) {//поворот грани при зажатой LMB относительно того, куда повели указатель
    if(event.ctrlKey) return;
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    mouseOverEnd.x = event.clientX;
    mouseOverEnd.y = event.clientY;
    
    if(isMouseDown && intersectedElem &&
                (mouseOverEnd.x - mouseOverStart.x < -ROTATION_STEP || mouseOverEnd.y - mouseOverStart.y < -ROTATION_STEP ||
                mouseOverEnd.x - mouseOverStart.x > ROTATION_STEP || mouseOverEnd.y - mouseOverStart.y > ROTATION_STEP)) {
        isMouseDown = false;
        //axis, layerNum, clockWise
       var side;
       for(var i in cubeFaces){
           if(cubeFaces[i].IsFaceOnSide(intersectedElem.faceIndex)){
               side = cubeFaces[i];
               break;
           }
           
       }
       console.log(side.sideName);
       
       if(mouseOverEnd.x - mouseOverStart.x < -ROTATION_STEP){
            rotateLayer(1,yIndex,false);
        }else if(mouseOverEnd.x - mouseOverStart.x > ROTATION_STEP){
            rotateLayer(1,yIndex,true);
        }else if(mouseOverEnd.y - mouseOverStart.y < -ROTATION_STEP){
            rotateLayer(0,xIndex,false);
        }else if(mouseOverEnd.y - mouseOverStart.y > ROTATION_STEP){
            rotateLayer(0,xIndex,true);
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


animate();//стандартная функция, чтобы все двигалось :)



function animate() {
    requestAnimationFrame(animate);
    
    camera.lookAt(scene.position);
    render.render(scene, camera);
}
    
new THREE.OrbitControls(camera, render.domElement); // вращение камеры. Тут доже очень долго пытался написать вращения камеры самостоятельно, пока не узнал, что велосипед уже изобрели. Повороты камеры при зажатом CTRL

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {//меняем размеры окна - меняется сцена

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    render.setSize(window.innerWidth, window.innerHeight);

}
window.onload = function () {};
