import * as React from 'react';
import './Icon.scss';
import {useEffect, useState} from "react";

interface IconProps {
    iconName: string;
    color?: string;
    size?: number;
    className?: string;
    onClick?: (event: MouseEvent<HTMLSpanElement>) => void;
    cursorPointer?: boolean;
}

const Icon: React.FC<IconProps> = (props) => {
    const [iconName, setIconName] = useState<string>(props.iconName);
    useEffect(() => {
        setIconName(props.iconName);
    }, [props.iconName]);

    function handleStyles() {
        let styles: any = {};
        if (props.cursorPointer) {
            styles['cursor'] = 'pointer'
        }
        if (props.size) {
            styles['fontSize'] = props.size + 'px'
        }
        if (props.color) {
            styles['color'] = props.color
        }
        return styles
    }

    return (
        <span
            className={`myIcon ${iconName}${props.className ? ` ${props.className}` : ''}`}
            style={handleStyles()}
            onClick={props.onClick}
        />
    );

};
export default Icon;