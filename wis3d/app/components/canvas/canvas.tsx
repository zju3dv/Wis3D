import { memo } from "react";
import { isObjectVisible } from "@/utils/misc";
import { mergeStyles } from "@fluentui/merge-styles";
import { Canvas as R3FCanvas, Props as CanvasProps } from "@react-three/fiber";
import { DirectionalLight } from "three";

const canvasProps: Partial<CanvasProps> = {
  frameloop: "demand",
  dpr: devicePixelRatio,
  gl: { powerPreference: "high-performance" },
  linear: false,
  raycaster: {
    filter: (items) => {
      const i = items.find((i) => isObjectVisible(i.object));
      return i ? [i] : [];
    },
    params: {
      Points: {
        threshold: 0.01,
      },
    },
  },
  camera: {
    fov: 60,
    near: 0.01,
    far: 1800,
    position: [0, 0, 15],
  },
  resize: {
    scroll: true,
    debounce: { scroll: 50, resize: 50 },
  },
  onCreated({ scene, camera }) {
    const headLight = new DirectionalLight(0xffffff, 0.5);
    headLight.position.set(0, -1, 0);
    scene.add(camera.add(headLight));
  },
};

export const Canvas = memo(function Canvas(props) {
  return (
    <R3FCanvas className={canvasWrapper} {...canvasProps}>
      {props.children}
    </R3FCanvas>
  );
});

const canvasWrapper = mergeStyles({
  flex: 1,
  "& canvas": {
    outline: "none",
  },
});

export default Canvas;
