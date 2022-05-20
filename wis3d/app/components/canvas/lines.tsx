import { memo, useMemo } from "react";
import { Object3DNode, extend, useThree, RootState } from "@react-three/fiber";
import { useXHR } from "@/utils/hooks";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { centerOnDbClick } from "./trackball-controls";

extend({ LineMaterial, LineGeometry, Line2 });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      line2: Object3DNode<Line2, typeof Line2>;
      lineGeometry: Object3DNode<LineGeometry, typeof LineGeometry>;
      lineMaterial: Object3DNode<LineMaterial, typeof LineMaterial>;
    }
  }
}

interface IProps {
  url: string;
  name?: string;
  defaultColor?: string;
  visible?: boolean;
  lineWidth?: number;
  vertexColors: boolean;
}

const sizeSelector = (state: RootState) => state.size;

export const Lines = memo<IProps>(function Lines(props) {
  const size = useThree(sizeSelector);
  const { url, defaultColor, name, visible = true, lineWidth, vertexColors } = props;
  const lines = useXHR(url, "GET", "json", []);
  const geoms = useMemo(
    () =>
      lines.map(({ start_point, end_point }) => {
        const geom = new LineGeometry();
        return geom.setPositions([...start_point, ...end_point]);
      }),
    [lines]
  );

  return (
    <group visible={visible}>
      {geoms.map((geom, index) => {
        const color = lines[index].color ? lines[index].color.map(x => x/250) : undefined;
        return (
          <line2 key={index} geometry={geom} onDoubleClick={centerOnDbClick}>
            <lineMaterial
              color={(vertexColors && color) || defaultColor}
              linewidth={lineWidth}
              resolution={[size.width, size.height] as any}
            />
          </line2>
        );
      })}
    </group>
  );
});

export default Lines;
