import { memo, useState, useMemo, useRef, useCallback, useLayoutEffect, useEffect } from "react";
import { extend, Object3DNode, ThreeEvent } from "@react-three/fiber";
import { BufferGeometry, PerspectiveCamera, BufferAttribute, Vector3Tuple, CameraHelper, Line, Vector3 , Points} from "three";
import { useXHR } from "@/utils/hooks";
import { centerOnDbClick } from "./trackball-controls";

extend({ Line_: Line });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      line_: Object3DNode<Line, typeof Line>;
    }
  }
}

type Trajectory = {
  positions: Vector3Tuple[];
  eulers: Vector3Tuple[];
};

interface IProps {
  url: string;
  showCamera: boolean;
  visible?: boolean;
  lineColor?: string;
  pointSize?: number;
  pointColor?: string;
  defaultColor?: string;
  vertexColors?: boolean;
  onLoad?(pos: Vector3Tuple, euler: Vector3Tuple): void;
}

// const target = new Vector3(0, 0, -0.001);

const initalValue: Trajectory = { positions: [], eulers: [] };

export const CameraPose = memo<IProps>(function CameraPose(props) {
  const { url, showCamera, visible, lineColor = "#1f77b4", pointSize = 0.03, pointColor = "#ffffff", defaultColor, vertexColors, onLoad } = props;
  const { positions, eulers } = useXHR(url, "Get", "json", initalValue);
  const cameraHelper = useRef<CameraHelper>();
  const [geometry, setGeometry] = useState<BufferGeometry>();
  const [pointsRef, setPointsRef] = useState<Points>();
  const [camera, setCamera] = useState<PerspectiveCamera>();
  const [selection, setSelection] = useState(0);
  // const posAttr = useMemo(() => new BufferAttribute(new Float32Array(positions.flat()), 3), [positions]);

  useLayoutEffect(() => {
    const i = positions.length - 1;
    setSelection(i);
    onLoad?.(positions[i], eulers[i]);
  }, [positions, eulers]);

  // useLayoutEffect(() => {
  //   if(camera) {
  //     amera.lookAt(camera.localToWorld(target));
  //   }
  // }, [camera, selection])

  useEffect(() => {
    const newGeometry = new BufferGeometry();
    const newArr = new Float32Array(positions.flat());
    const newBufferAttribute = new BufferAttribute(newArr, 3);
    newGeometry.attributes.position = newBufferAttribute;
    setGeometry(newGeometry);
  }, [positions])

  const onClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    setSelection(e.index);
  }, []);

  return positions.length > 0 ? (
    <group visible={visible}>
      <perspectiveCamera
        ref={setCamera}
        fov={60}
        aspect={1}
        near={0.05}
        far={0.1}
        position={positions[selection]}
        rotation={eulers[selection]}
      />
      {showCamera && camera && <cameraHelper ref={cameraHelper} args={[camera]} name="trajectory_camera" />}
    <points onClick={onClick} onDoubleClick={centerOnDbClick} geometry={geometry}>
      {/* <bufferGeometry ref={setGeometry} attributes-position={posAttr} /> */}
      <pointsMaterial size={pointSize} color={vertexColors ? pointColor : defaultColor} />
    </points>
    {geometry && (
      <line_ geometry={geometry}>
        <lineBasicMaterial color={vertexColors ? lineColor : defaultColor}/>
      </line_>
    )}
    </group>
   ) : null;
});

export default CameraPose;
