/** @format */
import { BufferGeometryUtils, OBJLoader } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

onmessage = (ev) => {
  if (ev.data[0] == "generate") {
    //load candy
    const objLoader = new OBJLoader();
    const candy: THREE.BufferGeometry[] = [];
    objLoader.load("/models/Candycane.obj", (data) => {
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

      function generateCloud(COF1 = 20, COF2 = 100) {
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
        arr.forEach((g) => g.dispose());
        return figuresGeometry;
      }

      const geom = generateCloud(ev.data[1], ev.data[2]);
      postMessage(["generated", geom.attributes]);
    });
  }
};
