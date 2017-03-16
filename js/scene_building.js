'use strict';
class Scene_building{
    constructor() {
        this.W = window.innerWidth - 40; //hardcode - disable scrollbars TODO fix tomorow...
        this.H = window.innerHeight - 40;//убирает полосы прокрутки. Комментарий выше написан очень давно =)
        this.container = document.createElement('div');//собираем контейнер, в котором всё будет происходить.
        document.body.appendChild(this.container);

        this.cameraMaxLength = Cube.CUBE_DIMENSION * 5000 + 3000;//расстояние камеры до куба. Зависит от размерности
        this.camera = new THREE.PerspectiveCamera(60, this.W / this.H, 1, this.cameraMaxLength);
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = Cube.CUBE_DIMENSION * 500 + 1000;
        this.scene = new THREE.Scene();

        //scene.add(new THREE.AxisHelper(CUBE_DIMENSION * 300)); // X - red. Y green. Z  blue.

        this.light1 = new THREE.PointLight();//освещение
        this.light2 = new THREE.PointLight();
        this.a = Cube.CUBE_DIMENSION * 5000;
        this.light1.position.set(this.a, this.a, this.a);
        this.light2.position.set(-this.a, -this.a, -this.a);
        this.light1.intensity = 1.7;
        this.light2.intensity = 1.7;
        this.scene.add(this.light1);
        this.scene.add(this.light2);

        this.render = new THREE.WebGLRenderer();//рендеринг
        this.render.setSize(this.W, this.H);
        this.container.appendChild(this.render.domElement);

        this.mouseDown = false;
        this.cathetus = (Cube.CUBE_DIMENSION + 2) / 2 * Cube.SUBCUBE_SIZE;
        this.hypotenuse = Math.sqrt(2 * this.cathetus * this.cathetus);



        this.raycaster = new THREE.Raycaster();//луч, исходящий из камеры и проходящий через указатель. Нужно для определения нажатого элемента
        this.raycaster.linePrecision = 0.1;
        this.mouse = new THREE.Vector2();
        this.mouseOverStart = new THREE.Vector2();
        this.mouseOverEnd = new THREE.Vector2();
        this.isMouseDown = false;

        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('mousemove', this.onMouseMove, false );

        animate();//стандартная функция, чтобы все двигалось :)

        new THREE.OrbitControls(this.camera, this.render.domElement); // вращение камеры. Тут доже очень долго пытался написать вращения камеры самостоятельно, пока не узнал, что велосипед уже изобрели. Повороты камеры при зажатом CTRL

        window.addEventListener('resize', this.onWindowResize, false);

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
        function animate() {
            requestAnimationFrame(animate);

            this.camera.lookAt(this.scene.position);
            this.render.render(this.scene, this.camera);
        }

    }

    addSubCube (vector) {
        var subCubeGeom = this.modifiedCubeGeometry(vector);
        var subCube = new THREE.Mesh(subCubeGeom, Cube.material);

        //calculating real coordinates by indexes in array
        subCube.position.set(
            Cube.SUBCUBE_SIZE * (vector.x + Cube.centerShift) * Cube.SUBCUBE_DISTANCE_INDEX, //x
            Cube.SUBCUBE_SIZE * (vector.y + Cube.centerShift) * Cube.SUBCUBE_DISTANCE_INDEX, //y
            Cube.SUBCUBE_SIZE * (vector.z + Cube.centerShift) * Cube.SUBCUBE_DISTANCE_INDEX //z
        );
        Scene_building.scene.add(subCube);//добавляем на сцену
        return subCube;
    }





    onWindowResize() {//меняем размеры окна - меняется сцена
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.render.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseDown(event) {//ищем выбранный кусок
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
            this.xIndex = Math.round((intersects[0].object.position.x+Cube.centerShift)/(Cube.SUBCUBE_SIZE*Cube.SUBCUBE_DISTANCE_INDEX) + Cube.sizeShift);
            this.yIndex = Math.round((intersects[0].object.position.y+Cube.centerShift)/(Cube.SUBCUBE_SIZE*Cube.SUBCUBE_DISTANCE_INDEX) + Cube.sizeShift);
            this.zIndex = Math.round((intersects[0].object.position.z+Cube.centerShift)/(Cube.SUBCUBE_SIZE*Cube.SUBCUBE_DISTANCE_INDEX) + Cube.sizeShift);
            console.log(this.xIndex,this.yIndex,this.zIndex);
            console.log(intersects[0].faceIndex);
        }
        console.log(this.camera.position.x,this.camera.position.y,this.camera.position.z);
    }

    onMouseUp( event ) {
        if(event.ctrlKey) return;
        this.intersectedElem = null;
        this.isMouseDown = false;
    }

    onMouseMove( event ) {//поворот грани при зажатой LMB относительно того, куда повели указатель
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
            for(var i in Cube.cubeFaces){
                if(Cube.cubeFaces[i].IsFaceOnSide(this.intersectedElem.faceIndex)){
                    side = Cube.cubeFaces[i];
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

        }
    }

}
var SCENE = new Scene_building();