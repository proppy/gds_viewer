import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2()

const camera = new THREE.PerspectiveCamera(50, canvasElement.width / canvasElement.height, 0.1, 10000);

console.log(camera);
camera.position.x = 50;
camera.position.y = 130;
camera.position.z = -50;
camera.up.x = 0;
camera.up.y = 0;
camera.up.z = -1;

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasElement });

scene.background = new THREE.Color(0x202020);
const ambient_light = new THREE.AmbientLight(0x808080); // soft white light
scene.add(ambient_light);


RectAreaLightUniformsLib.init();

const width = 1000;
const height = 1000;
const intensity = 0.8;

const rectLight1 = new THREE.RectAreaLight(0xffffA0, intensity, width, height);
rectLight1.position.set(200, 400, -200);
rectLight1.lookAt(200, 0, -200);
scene.add(rectLight1)

const rectLight2 = new THREE.RectAreaLight(0xA0A0ff, intensity, width, height);
rectLight2.position.set(0, 400, 0);
rectLight2.lookAt(200, 0, -200);
scene.add(rectLight2)



var controls = new OrbitControls(camera, canvasElement);
controls.target.set(50, 0, -50);
controls.update();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

animate();

const gui = new GUI({container: guiElement});
const guiViewSettings = gui.addFolder("View Settings");
guiViewSettings.open();
const guiStatsFolder = gui.addFolder("Stats");
guiStatsFolder.close();

let viewSettings = {
    "toggleFillerCells": function () {
        actionToggleFillerCellsVisibility();
    },
    "toggleTopCellGeometry": function () {
        actionToggleTopCelGeometryVisibility();
    },
    "materials": [],
    "materials_visibility": []
};

guiViewSettings.add(viewSettings, "toggleFillerCells");
guiViewSettings.add(viewSettings, "toggleTopCellGeometry");


const gltf_loader = new GLTFLoader();

const sceneLoaded = function (gltf) {
        console.log('scene loaded', gltf)
        gltf.scene.rotation.x = -Math.PI / 2;

        scene.add(gltf.scene);

        gltf.scene.rotation.x = -Math.PI / 2;

        const box = new THREE.Box3();
        box.setFromObject(gltf.scene);
        const helper = new THREE.Box3Helper(box, 0xff00ff);
        scene.add(helper);
        const objWorldPos = new THREE.Vector3();
        box.getCenter(objWorldPos);
        console.log(objWorldPos);
        camera.position.x = objWorldPos.x;
        camera.position.y = 100;
        camera.position.z = objWorldPos.z; //200;
        camera.up.x = 0;
        camera.up.y = 0;
        camera.up.z = -1;
        controls.target.set(objWorldPos.x, 0, objWorldPos.z);
        controls.update();

        let cell_stats = [];
        for (var i = 0; i < scene.children.length; i++) {
            for (var j = 0; j < scene.children[i].children.length; j++) {
                for (var k = 0; k < scene.children[i].children[j].children.length; k++) {
                    var node = scene.children[i].children[j].children[k];
                    if (node instanceof THREE.Object3D) {
                        // console.log(node.userData["type"]);
                        const cell_type = node.userData["type"];
                        if (cell_stats[cell_type] == undefined) {
                            cell_stats[cell_type] = 0;
                        }
                        cell_stats[cell_type]++;
                    }

                }

            }

            console.log(viewSettings.materials);
            console.log(viewSettings.materials_visibility);
        }

        for (var cell_name in cell_stats) {
            guiStatsFolder.add(cell_stats, cell_name);
        }


        scene.traverse(function (object) {
            if (object.material) {
                if (viewSettings.materials[object.material.name] == undefined) {
                    viewSettings.materials[object.material.name] = object.material;
                    viewSettings.materials_visibility[object.material.name] = true;
                    // console.log(object.material.name);
                    guiViewSettings.add(viewSettings.materials_visibility, object.material.name).onChange(function (new_value) {
                        viewSettings.materials[this._name].visible = new_value;// viewSettings.materials_visibility[node.material.name];
                    });
                }
            }
        })                

    };
if (gltfElement.value.includes("gltf_data") === false) {
  gltf_loader.parse(
    gltfElement.value,
    "",
    sceneLoaded,
    function (error) {
        console.log('error parsing gds layout from template', error);
    }
  );
} else {
  gltf_loader.load(
      "layout.gds.gltf",
      sceneLoaded,
      function (error) {
          console.log('error parsing external gds layout', error);
      }
  );    
}
const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0x50f050 });
highlightMaterial.name = "HIGHLIGHT";
var previousMaterials = null;
var highlightedObjects = null;

var cellDetailMode = false;

window.onmousemove = function (event) {
    if (event.buttons != 0 || cellDetailMode)
        return;

    const canvasRect = canvasElement.getBoundingClientRect();
    mouse.x = ((event.clientX - canvasRect.x) / canvasRect.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasRect.y) / canvasRect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObject(scene, true);

    turnOffHighlight();

    if (intersects.length > 0) {
        for (var i = 0; i < intersects.length; i++) {
            var object = intersects[i].object;
	    console.log(object);
            if (object.parent && object.parent.parent && object.parent.parent.name != "" && object.parent.visible) {
                informationElement.innerHTML = ("Mouse over: " + object.parent.name + " (" + object.parent.userData["type"] + ")");

                if (highlightedObjects == null) {
                    highlightedObjects = [];
                    previousMaterials = [];
                }
                if (highlightedObjects.indexOf(object) == -1) {
                    previousMaterials.push(object.material);
                    highlightedObjects.push(object);
                    object.material = highlightMaterial;
                }


            }
            // object.material.color.set(Math.random() * 0xffffff);
        }
    }
}

function turnOffHighlight() {            
    if (highlightedObjects != null) {
        for (var i = 0; i < highlightedObjects.length; i++) {
            // console.log(highlightedObjects[i]);
            highlightedObjects[i].material = previousMaterials[i];
            // highlightedObjects[i].visible = false;// = null;
        }
        highlightedObjects = null;
        previousMaterials = null;
    }
}

function actionToggleFillerCellsVisibility() {
    for (var i = 0; i < scene.children.length; i++) {
        for (var j = 0; j < scene.children[i].children.length; j++) {
            for (var k = 0; k < scene.children[i].children[j].children.length; k++) {
                var node = scene.children[i].children[j].children[k];
                if (node.userData["type"] != undefined) {
                    if (node.userData["type"].indexOf("fill") != -1
                        ||
                        node.userData["type"].indexOf("decap") != -1
                        ||
                        node.userData["type"].indexOf("tap") != -1
                    ) {
                        node.visible = !node.visible;
                    }
                }
            }
        }
    }
}

function actionToggleTopCelGeometryVisibility() {
    for (var i = 0; i < scene.children.length; i++) {
        for (var j = 0; j < scene.children[i].children.length; j++) {
            for (var k = 0; k < scene.children[i].children[j].children.length; k++) {
                var node = scene.children[i].children[j].children[k];
                if (node instanceof THREE.Mesh) {
                    // console.log(node);
                    if (node.material.name != "substrate")
                        node.visible = !node.visible;
                }
            }
        }
    }
}
