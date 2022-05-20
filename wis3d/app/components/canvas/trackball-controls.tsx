import { forwardRef, memo, MutableRefObject, useEffect, useRef } from "react";
import { TrackballControls as TrackballControlsImpl } from "three/examples/jsm/controls/experimental/CameraControls";
import { Object3DNode, useFrame, useThree, extend, invalidate, RootState, ThreeEvent } from "@react-three/fiber";
import { Vector3 } from "three"
import { useMergedRefs } from "@fluentui/react-hooks";
import { useHotkeys } from "react-hotkeys-hook";

extend({ TrackballControls: TrackballControlsImpl });

type TrackballControlsProps = Object3DNode<TrackballControlsImpl, typeof TrackballControlsImpl>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      trackballControls: TrackballControlsProps;
    }
  }
}

var controlsRef: MutableRefObject<TrackballControlsImpl> = { current: undefined };

var firstIn = true;

export function centerOnDbClick(ev: ThreeEvent<MouseEvent>) {

  controlsRef.current?.target.copy(ev.point);

  var lookAtVector = new Vector3(0, 0, -1);
  lookAtVector.applyQuaternion(controlsRef.current?.object.quaternion).normalize();

  var distance = ev.point.distanceTo(controlsRef.current?.object.position);
  var newPos = ev.point.sub(lookAtVector.multiplyScalar(0.8 * distance));
  controlsRef.current?.object.position.copy(newPos);

  invalidate();
}

const selector = ({ gl, scene, camera, raycaster, invalidate }: RootState) => ({
  gl,
  scene,
  camera,
  raycaster,
  invalidate
});

export const TrackballControls = memo<TrackballControlsProps>(
  forwardRef(function TrackballControls(props, ref) {
    const { gl, scene, camera, raycaster, invalidate } = useThree(selector);
    controlsRef = useRef<TrackballControlsImpl>();
    const refs = useMergedRefs(ref, controlsRef);

    useHotkeys("c", event => {
      console.log("camera position: ", camera.position)
      console.log("camera rotation: ", camera.rotation.toArray());
    }, [])

    const onCameraChange = function() {
      if(firstIn) {
        const position = JSON.parse(localStorage.getItem("camera.position"));
        const rotation = JSON.parse(localStorage.getItem("camera.rotation"));
        const target = JSON.parse(localStorage.getItem("camera.target"));
        if (position != null && rotation != null) {
          const currentPosition = camera.position;
          camera.translateX(position.x - currentPosition.x);
          camera.translateY(position.y - currentPosition.y);
          camera.translateZ(position.z - currentPosition.z);
          const currentRotation = camera.rotation.toArray();
          camera.rotateX(rotation[0] - currentRotation[0]);
          camera.rotateY(rotation[1] - currentRotation[1]);
          camera.rotateZ(rotation[2] - currentRotation[2]);
          refs.current.target.copy(target)
        }
        else {
          localStorage.setItem("camera.position", JSON.stringify(camera.position));
          localStorage.setItem("camera.rotation", JSON.stringify(camera.rotation.toArray()));
          localStorage.setItem("camera.target", JSON.stringify(refs.current.target));
        }
      } else {
        localStorage.setItem("camera.position", JSON.stringify(camera.position));
        localStorage.setItem("camera.rotation", JSON.stringify(camera.rotation.toArray()));
        localStorage.setItem("camera.target", JSON.stringify(refs.current.target));
      }
      firstIn = false;
    }

    useEffect(() => {
      const controls = controlsRef.current;
      if (!controls) return;

      controlsRef.current = controls;
      controls.addEventListener("change", invalidate);
      return () => {
        controls.removeEventListener("change", invalidate);
      };
    }, [gl, camera, scene, raycaster, invalidate]);

    useFrame(() => {
      onCameraChange();
      controlsRef.current?.update()
    });

    return <trackballControls ref={refs} args={[camera, gl.domElement]} {...props} />;
  })
);
