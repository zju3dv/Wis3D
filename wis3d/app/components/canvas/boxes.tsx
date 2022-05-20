import { memo } from "react";
import { Box } from "./box";
import { useXHR } from "@/utils/hooks";

interface IProps {
  url: string;
  name?: string;
  color?: string;
  visible?: boolean;
  showAxes?: boolean;
  showLabel?: boolean;
  opacity?: number;
}

export const Boxes = memo<IProps>(function Boxes(props) {
  const { url, color, name, visible = true, showAxes, showLabel, opacity } = props;
  const boxes = useXHR(url, "GET", "json", []);

  return (
    <group visible={visible}>
      {boxes?.map((box, index) => (
        <Box key={index} name={name} color={color} showAxes={showAxes} showLabel={showLabel} opacity={opacity} {...box} />
      ))}
    </group>
  );
});

export default Boxes;
