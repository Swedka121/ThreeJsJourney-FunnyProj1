/** @format */
import {
  BufferGeometryUtils,
  FBXLoader,
  FontLoader,
  OBJLoader,
  OrbitControls,
  TextGeometry,
} from "three/examples/jsm/Addons.js";
import { HDRLoader } from "three/examples/jsm/Addons.js";
import "./style.css";
import * as THREE from "three";
import GUI from "lil-gui";
import { texture } from "three/tsl";

//canvas set up
const CANVAS: HTMLCanvasElement | null = document.querySelector("#three");

if (!CANVAS) throw new Error("Canvas is undefined!");

let WIDTH = CANVAS.clientWidth;
let HEIGHT = CANVAS.clientHeight;

//set up debug ui
const gui = new GUI();

//scene set up
const scene = new THREE.Scene();

//create texture loader
const textureLoader = new THREE.TextureLoader();
const matcap1 = textureLoader.load("/textures/matcaps/8.png");

// material
const material = new THREE.MeshMatcapMaterial({});
gui.add(material, "wireframe");
matcap1.colorSpace = THREE.SRGBColorSpace;
material.matcap = matcap1;

//add axes helper
const axesHelper = new THREE.AxesHelper();
scene.add(axesHelper);
axesHelper.visible = false;

gui.add(axesHelper, "visible").name("Show axeses");

//import font and generate text geom
const fontLoader = new FontLoader();
fontLoader.load("/fonts/Mulish_Regular.json", (font) => {
  const geom = new TextGeometry("Swedka121", {
    font,
    size: 0.5,
    curveSegments: 5,
    depth: 0.2,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelSegments: 2,
    bevelThickness: 0.03,
  });

  // geom.computeBoundingBox();
  // console.log(geom.boundingBox);
  // geom.translate(
  //   -((geom.boundingBox?.max.x || 0) - 0.02) * 0.5,
  //   -((geom.boundingBox?.max.y || 0) - 0.02) * 0.5,
  //   -((geom.boundingBox?.max.z || 0) - 0.03) * 0.5
  // );
  geom.center();
  const textMesh = new THREE.Mesh(geom, material);
  scene.add(textMesh);
});

//load candy
const objLoader = new OBJLoader();
const candy: THREE.BufferGeometry[] = [];
const data = await objLoader.loadAsync("/models/Candycane.obj");
data.traverse((child) => {
  console.log(child.type);
  if (child.type == "Mesh") {
    return candy.push((child as THREE.Mesh).geometry);
  }
});

console.log(candy);

//add another objects
const geo = new THREE.TorusGeometry(1, 0.5, 12, 48);
const geo2 = new THREE.BoxGeometry(1, 1, 1);
const geoms = [geo, geo2, candy[1]].map((g) => {
  let finalGeo = g.index ? g.toNonIndexed() : g.clone();

  if (!finalGeo.attributes.normal) finalGeo.computeVertexNormals();
  if (!finalGeo.attributes.uv) {
    const uvs = new Float32Array(finalGeo.attributes.position.count * 2);
    finalGeo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  }

  return finalGeo;
});

async function generateCloud(COF1 = 20, COF2 = 100) {
  const arr = Array.from({ length: COF2 }, () => {
    return geoms[Math.floor(Math.random() * geoms.length)]
      .clone()
      .translate(
        Math.random() * COF1,
        Math.random() * COF1,
        Math.random() * COF1
      )
      .rotateX(Math.random() * 2 * Math.PI)
      .rotateY(Math.random() * 2 * Math.PI)
      .rotateZ(Math.random() * 2 * Math.PI);
  });

  const figuresGeometry = BufferGeometryUtils.mergeGeometries(arr);
  return new THREE.Mesh(figuresGeometry, material);
}

async function addCountGui() {
  let mesh = await generateCloud();
  scene.add(mesh);
  let numberOfObjects = { number: 100 };
  gui
    .add(numberOfObjects, "number")
    .name("Count of objects")
    .onChange(async (v: number) => {
      scene.remove(mesh);
      mesh = await generateCloud(20, v);
      scene.add(mesh);
    })
    .min(1)
    .max(10000)
    .step(1);
}

addCountGui();

//camera set up
const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.01, 1000);
const orbitControls = new OrbitControls(camera, CANVAS);
camera.position.set(2, 2, 2);
camera.lookAt(0, 0, 0);

//renderer
const renderer = new THREE.WebGLRenderer({
  canvas: CANVAS,
});

renderer.setSize(WIDTH, HEIGHT);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

function render() {
  orbitControls.update();
  renderer.clear();

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

render();

window.addEventListener("resize", (ev) => {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
});
