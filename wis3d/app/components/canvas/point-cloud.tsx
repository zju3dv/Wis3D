import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import type { Material } from "three";
import { useLoader } from "@/utils/hooks";
import { centerOnDbClick } from "./trackball-controls";

interface IProps {
  url: string;
  color?: string;
  visible?: boolean;
  pointSize?: number;
  vertexColors?: boolean;
  opacity?: number;
}

export const PointCloud = memo<IProps>(function PointCloud(props) {
  const { url, color, visible = true, pointSize = 0.03, vertexColors, opacity } = props;
  const geometry = useLoader(PLYLoader, url);
  const material = useRef<Material>();
  const useVertexColors = useMemo(() => geometry?.hasAttribute("color") && vertexColors, [geometry, vertexColors]);

  useLayoutEffect(() => {
    if (material.current) material.current.needsUpdate = true;
  }, [useVertexColors]);

  return geometry ? (
    <points visible={visible} geometry={geometry} onDoubleClick={visible && centerOnDbClick}>
      <pointsMaterial
        ref={material}
        size={pointSize}
        vertexColors={useVertexColors}
        color={useVertexColors ? 0xffffff : color}
        transparent={true}
        opacity={opacity}
      />
    </points>
  ) : null;
});

export default PointCloud;
