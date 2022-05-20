import { memo } from 'react';
import { useXHR } from "@/utils/hooks";
import { Color } from "three"
import { centerOnDbClick } from "./trackball-controls";

interface IProps {
    url: string;
    defaultColor?: string;
    visible?: boolean;
    sphereColors?: boolean;
}

export const Spheres = memo<IProps>(function Spheres(props) {
    const { url, defaultColor, visible = true, sphereColors} = props;
    const spheres = useXHR(url, "GET", "json", []);

    
    return (
      <group visible = {visible}>
        {spheres.map((sphere, index) => {
          const { center, radius, color } = sphere; 
          const userColor = color ? color.map(x => x/250) : undefined;
          return (
            <mesh position={center} key={index} onDoubleClick={centerOnDbClick}>
              <sphereBufferGeometry args={[radius, 30, 30]} />
              <meshBasicMaterial 
                color={sphereColors && userColor ? userColor : defaultColor}
                transparent={true}
                opacity={0.5} />
            </mesh>
          )
        })}
      </group>
    )
})

export default Spheres;