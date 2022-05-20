import { memo } from "react";
import { BufferAttribute, DoubleSide, Mesh, Plane as THREE_Plane, PlaneGeometry, Vector3, Vector3Tuple } from "three";
import { extend, Object3DNode } from "@react-three/fiber";
import { useXHR } from "@/utils/hooks";
import { useState } from "react";
import { useRef } from "react";
import { useEffect } from "react";

extend({ Plane: THREE_Plane });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      plane: Object3DNode<THREE_Plane, typeof THREE_Plane>;
    }
  }
}

interface IProps {
  url: string;
}

export const Plane = memo<IProps>(function Plane(props) {
  const { url } = props;
  const [plane, setPlane] = useState<PlaneGeometry>();
  const def = useXHR<any>(url, "GET", "json", undefined, (ev) => {
    // const res = (ev.target as XMLHttpRequest).response;
    // const plane = new PlaneGeometry();
    // plane.setAttribute("normal", new BufferAttribute(new Float32Array([...res.normal, ...res.normal, ...res.normal, ...res.normal]), 3));
    // setPlane(plane)
  });
  const ref = useRef<Mesh>();

  //   return def ? (
  //     <planeHelper size={1}>
  //       <plane attach="plane" normal={def.normal} constant={def.distance} />
  //     </planeHelper>
  //   ) : null;
  return def ? (
    <group>
      <mesh ref={ref} position={def.position} rotation={def.euler}>
        <planeGeometry />
        <meshBasicMaterial color="red" side={DoubleSide} />
      </mesh>
      <planeHelper size={1}>
        <plane attach="plane" normal={def.normal} constant={def.distance} />
      </planeHelper>
    </group>
  ) : null;
});
