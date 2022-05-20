import { memo, useState, useCallback, useRef, useMemo } from "react";
import { extend, Object3DNode } from "@react-three/fiber";
import SpriteText from "three-spritetext";
import { Mesh, BufferGeometry, Vector3Tuple, Vector2 } from "three";
import { BoxProperties } from "../react/box-properties";
import { centerOnDbClick } from "./trackball-controls";

extend({ SpriteText });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      spriteText: Object3DNode<SpriteText, typeof SpriteText>;
    }
  }
}

interface IProps {
  position: Vector3Tuple;
  euler: Vector3Tuple;
  extent: Vector3Tuple;
  name?: string;
  color: string;
  label?: string;
  visible?: boolean;
  showAxes?: boolean;
  showLabel?: boolean;
  opacity?: number;
}

const axesArgs: [number] = [1.1];
const center = new Vector2(0, 1);
let portalRef: HTMLElement;

export const Box = memo<IProps>(function Box(props) {
  const { position, euler, extent, name, color, visible = true, label, showAxes, showLabel, opacity } = props;
  const mesh = useRef<Mesh>();
  const [geometry, setGeometry] = useState<BufferGeometry>();
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const labelPos = useMemo<Vector3Tuple>(() => [0, Math.max(...extent) + 0.2, 0], [extent]);

  const onPointerOver = useCallback((ev: PointerEvent) => setHovered(true), []);
  const onPointerOut = useCallback(() => setHovered(false), []);
  const onClick = useCallback(() => {
    if (!portalRef) portalRef = document.getElementById("property-docker");
    if ( portalRef.childElementCount != 0) {
      let prevName = (portalRef.firstChild as HTMLElement).className;
      document.getElementById(prevName).click();
    }
    setActive(true)
  }, []);
  const onClose = useCallback(() => setActive(false), []);

  return (
    <group visible={visible} position={position} rotation={euler}>
      <mesh ref={mesh} scale={extent} onPointerOver={onPointerOver} onPointerOut={onPointerOut} onClick={onClick} onDoubleClick={centerOnDbClick}>
        <boxBufferGeometry ref={setGeometry} />
        <meshBasicMaterial vertexColors={false} color={color} transparent={true} opacity={opacity} />
      </mesh>
      <axesHelper args={axesArgs} visible={showAxes} />
      {geometry && (
        <lineSegments scale={extent}>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color={hovered ? 0xff0000 : 0xffffff} />
        </lineSegments>
      )}
      {label && (
        <spriteText
          text={label}
          backgroundColor={color}
          center={center}
          textHeight={0.01}
          fontSize={30}
          padding={0.05}
          borderWidth={0.2}
          borderColor={active || hovered ? "red" : "white"}
          position={labelPos}
          visible={showLabel}
        />
      )}
      {active && <BoxProperties name={name} position={position} scale={extent} rotation={euler} onClose={onClose} />}
    </group>
  );
});

export default Box;
