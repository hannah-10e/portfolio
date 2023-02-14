import * as React from 'react';
import './TimelineItem.scss';

interface TimelineItemProps {
    label: string;
    description: string;
    icon: string;
}

const TimelineItem: React.FC<TimelineItemProps> = (props) => {

    return (
        <div className={'rsTimelineItem'}>

        </div>
    );
};
export default TimelineItem;