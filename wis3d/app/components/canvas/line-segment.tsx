import { memo } from "react";
import { Line, Circle, Group, KonvaNodeEvents } from "react-konva/lib/ReactKonvaCore";
import "konva/lib/shapes/Line";
import "konva/lib/shapes/Circle";

interface IProps extends KonvaNodeEvents {
  points: number[];
  lineOpactiy?: number;
  pointOpacity?: number;
  strokeWidth: number;
  stroke: string;
  radius?: number;
  index: number;
  shadowBlur?: number;
  shadowForStrokeEnabled?: boolean;
}

export const LineSegment = memo<IProps>(function LineSegment(props) {
  const {
    points,
    lineOpactiy,
    pointOpacity,
    stroke,
    strokeWidth,
    radius = 1,
    shadowBlur,
    shadowForStrokeEnabled,
    ...rest
  } = props;

  return (
    <Group {...rest}>
      <Line
        shadowForStrokeEnabled={shadowForStrokeEnabled}
        points={points}
        stroke={stroke}
        strokeWidth={strokeWidth}
        shadowBlur={shadowBlur}
        opacity={lineOpactiy}
      />
      <Circle
        x={points[0]}
        y={points[1]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        radius={radius}
        shadowBlur={shadowBlur}
        opacity={pointOpacity}
        shadowForStrokeEnabled={shadowForStrokeEnabled}
      />
      <Circle
        x={points[2]}
        y={points[3]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        radius={radius}
        shadowBlur={shadowBlur}
        opacity={pointOpacity}
        shadowForStrokeEnabled={shadowForStrokeEnabled}
      />
    </Group>
  );
});
