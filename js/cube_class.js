'use strict';
var white = 0xE5E5E5;
var yellow = 0xFFFF00;
var red = 0xFF0000;
var orange = 0xFFA500;
var blue = 0x0000FF;
var green = 0x008000;
var black = 0x000000;

class Cube{

    constructor() {

        this.geomX = 1;
        this.geomY = 1;
        this.geomZ = 1;

        this.SUBCUBE_SIZE = 300; //размер одного маленького кубика
        this.SUBCUBE_DISTANCE_INDEX = 1.1; // отступ между маленькими кубами
        this.ROTATION_STEP = 100;
        this.CUBE_DIMENSION = 13; ////////////////////////////////----------//////////////////////////////////////// Размерность нашего кубика


        //собираем цвета. Фигуры в three.js триангулированы и у каждого треугольника свой порядковый номер. Формула определяем, с какого номера начинать "красить"
        this.right = new Side([this.geomX * 0, this.geomX * 2 - 1], "right");//0,1
        this.left = new Side([this.geomX * 2, this.geomX * 4 - 1], "left");//2,3

        this.up = new Side([this.geomX * 4 + this.geomY * 0, this.geomX * 4 + this.geomY * 2 - 1], "up");
        this.down = new Side([this.geomX * 4 + this.geomY * 2, this.geomX * 4 + this.geomY * 4 - 1], "down");

        this.front = new Side([this.geomX * 4 + this.geomY * 4 + this.geomZ * 0, this.geomX * 4 + this.geomY * 4 + this.geomZ * 2 - 1], "front");
        this.back = new Side([this.geomX * 4 + this.geomY * 4 + this.geomZ * 2, this.geomX * 4 + this.geomY * 4 + this.geomZ * 4 - 1], "back");

        this.cubeFaces = [this.right, this.left, this.up, this.down, this.front, this.back];

        this.cubePieces = [];

        this.sizeShift = ~~(this.CUBE_DIMENSION / 2); //целое от деления размерности пополам
        this.centerShift = this.CUBE_DIMENSION % 2 == 0 ? 0.5 : 0; //смещение центра относительно нуля координат. Нужно для четных и нечетных кубов - Нечетные строятся с центром в среднем кубике, четные - центральные кубики лежат на оси граням
        //var material = new THREE.MeshLambertMaterial( { map: paper_red, overdraw: 0.5} );
        this.material = new THREE.MeshPhongMaterial({//накладываем материал
            vertexColors: THREE.FaceColors
        });
        this.material.ambient = this.material.color;

    }

    Attach(child, Parent) {//две функции, упрощающие написание метода для сборки элементов для поворота в группу и дальнейшей разборки. С группировкой возился больше всего - косяки и недостаток возможностей самого three.js
        return THREE.SceneUtils.attach(child, this.scene, Parent);
    }

    Detach(child, Parent) {
        return THREE.SceneUtils.detach(child, Parent, this.scene);
    }

    getRotatedIndex (x, y, clockWise = true){//функция для изменения индексов т.е. поворота, по часовой - по-умолчанию. В картинках есть визуализация
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



    modifiedCubeGeometry(vector) {//creating subCube geometry and painting
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


    rotateLayer(axis, layerNum, clockWise = true) {//поворот слоя - ось, номер слоя, направление
        var rotateGroup = new THREE.Object3D();
        var rotateAngle = Math.PI / 2;

        if (axis == 0) {// 0 - это ось x, 1-y, 2-z
            for (var i = 0; i < this.CUBE_DIMENSION; i++) {
                for (var j = 0; j < this.CUBE_DIMENSION; j++) {
                    if (this.cubePieces[layerNum][i][j]) {
                        this.Attach(this.cubePieces[layerNum][i][j], rotateGroup); //собираем один слой в группу для вращения
                    }
                }
            }

            if(clockWise){
                rotateGroup.rotation.x += rotateAngle;
            }else{
                rotateGroup.rotation.x -= rotateAngle;
            }
            rotateGroup.updateMatrixWorld();
            while (rotateGroup.children.length) {
                this.Detach(rotateGroup.children[0], rotateGroup);
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
                        this.Attach(this.cubePieces[i][layerNum][j], rotateGroup);
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
                this.Detach(rotateGroup.children[0], rotateGroup);
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
                        this.Attach(this.cubePieces[i][j][layerNum], rotateGroup);
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
                this.Detach(rotateGroup.children[0], rotateGroup);
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

    cubeScramble() {//Месим кубик
        for (var i = 0; i < Math.pow(this.CUBE_DIMENSION, 3); i++) {
            var rand = Math.floor(Math.random() * 2);
            var a = Math.floor(Math.random() * 3);
            var b = Math.floor(Math.random() * this.CUBE_DIMENSION);
            this.rotateLayer(a, b/*, rand*/);
        }
    }

}

class Side {//устанавливаем цвета на грани
    constructor(faces, sideName){
        this.faces = faces || [];
        this.sideName = sideName;
        switch (sideName) {
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
}

Side.prototype.IsFaceOnSide = function (face){
    for(var i in this.faces){
        if(this.faces[i] == face) return true;
    }
    return false;
};

var CUBE = new Cube();