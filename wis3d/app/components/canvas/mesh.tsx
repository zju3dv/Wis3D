import { useLoader } from "@/utils/hooks";
import { memo, useRef, useMemo, useLayoutEffect, MutableRefObject } from "react";
import { FrontSide, Material, Side } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { centerOnDbClick } from "./trackball-controls";

interface IProps {
  url: string;
  material?: string;
  color?: string;
  visible?: boolean;
  wireframe?: boolean;
  vertexColors?: boolean;
  side?: Side;
  flatShading?: boolean;
  shininess?: number;
}

function getMaterial(
  material: string,
  ref: MutableRefObject<Material>,
  vertexColors: boolean,
  color: string | number,
  wireframe: boolean,
  flatShading: boolean,
  shininess: number,
  side: Side
) {
  switch (material) {
    case "MeshStandardMaterial":
      return (
        <meshStandardMaterial
          ref={ref}
          vertexColors={vertexColors}
          color={color}
          wireframe={wireframe}
          side={side}
          flatShading={flatShading}
        />
      );
    case "MeshNormalMaterial":
      return (
        <meshNormalMaterial
          ref={ref}
          vertexColors={vertexColors}
          color={color}
          wireframe={wireframe}
          side={side}
          flatShading={flatShading}
        />
      );
    case "MeshPhongMaterial":
      return (
        <meshPhongMaterial
          ref={ref}
          vertexColors={vertexColors}
          color={color}
          wireframe={wireframe}
          side={side}
          flatShading={flatShading}
          shininess={shininess}
        />
      );
    case "MeshBasicMaterial":
    default:
      return (
        <meshBasicMaterial ref={ref} vertexColors={vertexColors} color={color} wireframe={wireframe} side={side} />
      );
  }
}

const ObjMesh = memo<IProps>(function ObjMesh(props) {
  const { url /* , vertexColors, color, visible, wireframe, side, flatShading, shininess */ } = props;
  const obj = useLoader(OBJLoader, url);

  return obj && <primitive object={obj} />;
});

const PlyMesh = memo<IProps>(function PlyMesh(props) {
  const { url, vertexColors, material, color, visible, wireframe, side, flatShading, shininess } = props;
  const geometry = useLoader(PLYLoader, url);
  const materialRef = useRef<Material>();
  const useVertexColors = useMemo(() => geometry?.hasAttribute("color") && vertexColors, [geometry, vertexColors]);

  if (geometry && !geometry.hasAttribute("normal")) {
    geometry.computeVertexNormals();
  }

  useLayoutEffect(() => {
    if (materialRef.current) materialRef.current.needsUpdate = true;
  }, [vertexColors, flatShading]);

  return geometry ? (
    <mesh visible={visible} geometry={geometry} onDoubleClick={visible && centerOnDbClick}>
    {
      getMaterial(material, materialRef, vertexColors, useVertexColors ? 0xffffff : color, wireframe, flatShading, shininess, side)
    }
    </mesh>
  ) : null;
});

export const Mesh = memo<IProps>(function Mesh(props) {
  return props.url.endsWith("ply") ? <PlyMesh {...props} /> : <ObjMesh url={props.url} />;
});

export default Mesh;
